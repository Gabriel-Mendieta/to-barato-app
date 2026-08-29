import React, { useCallback, useMemo, useState } from 'react';
import {
  Image,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  type BottomSheetModalMethods,
  BottomSheetView,
} from '@/src/shared/ui/BottomSheetCompat';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAddListItem } from '@/src/features/lists/hooks';
import {
  useProductCatalogByType,
  useProductCategories,
  useProductUnits,
} from '@/src/features/products/hooks';
import type { CategoryDTO, ProductDTO, UnitDTO } from '@/src/shared/api';
import { firstRouteParam, parseProductId } from '@/src/features/products/screenSelectors';
import { getUnitAbbrev } from '@/src/shared/products/meta';
import {
  Screen,
  FLOATING_TAB_BAR_CLEARANCE,
  Button,
  EmptyState,
  showToast,
  Skeleton,
  triggerHaptic,
} from '@/src/shared/ui';
import { colors, radii, spacing, typography } from '@/src/shared/theme';
import { useTranslation } from 'react-i18next';

const POPULAR = ['Manzana', 'Pollo Fresco', 'Arroz Premium', 'Leche', 'Aceite'] as const;

const CATEGORY_EMOJI: Record<string, string> = {
  frutas: '🍎',
  verduras: '🥕',
  hogar: '🔧',
  limpieza: '🧹',
  mascotas: '🐶',
  bebidas: '🧃',
  panad: '🥖',
  panadería: '🥖',
  panaderia: '🥖',
  farmacia: '💊',
  mercado: '🛒',
  despensa: '🛒',
  ofertas: '🔥',
  lácteos: '🥛',
  lacteos: '🥛',
  carnes: '🍗',
  snacks: '🍿',
};

function stripAccents(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function categoryEmoji(nombre: string): string {
  const key = stripAccents(nombre.toLowerCase());
  for (const [k, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (key.includes(k)) return emoji;
  }
  return '📦';
}

function categoryTint(nombre: string, index: number): string {
  const palette = [
    '#FFE3E1',
    '#E6E7EA',
    '#FFF1C8',
    '#DCF3E7',
    '#FFEACB',
    '#FFE3E1',
    '#E2F1FA',
    '#FFE8D9',
  ];
  return palette[index % palette.length];
}

export default function AddToListScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    tipo?: string | string[];
    listaId?: string | string[];
    nombre?: string | string[];
    idProveedor?: string | string[];
  }>();
  const tipoId = parseProductId(params.tipo);
  const listaId = parseProductId(params.listaId);
  const idProveedor = parseProductId(params.idProveedor);
  const listName = firstRouteParam(params.nombre) ?? 'Lista';

  const catalogQuery = useProductCatalogByType(tipoId);
  const categoriesQuery = useProductCategories();
  const unitsQuery = useProductUnits();
  const addItemMutation = useAddListItem();

  const allProducts = useMemo(() => catalogQuery.data ?? [], [catalogQuery.data]);
  const categorias = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const unitNames = useMemo(
    () =>
      Object.fromEntries(
        (unitsQuery.data ?? []).map((unit: UnitDTO) => [
          unit.IdUnidadMedida,
          unit.NombreUnidadMedida,
        ]),
      ) as Record<number, string>,
    [unitsQuery.data],
  );
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const [qtyModal, setQtyModal] = useState<ProductDTO | null>(null);
  const qtySheetRef = React.useRef<BottomSheetModalMethods>(null);
  const [qty, setQty] = useState(1);

  const unitLabel = useCallback(
    (p: ProductDTO) => {
      const id = p.IdUnidadMedida;
      if (id == null) return '';
      const full = unitNames[id];
      if (full) return full;
      const abbr = getUnitAbbrev(id).replace(/^\//, '');
      return abbr || '';
    },
    [unitNames],
  );

  useFocusEffect(
    useCallback(() => {
      // Al volver a enfocar solo se limpian filtros locales; React Query conserva
      // y actualiza los datos remotos sin efectos de sincronización adicionales.
      setQuery('');
      setCategoryId(null);
    }, []),
  );

  const filtered = useMemo(() => {
    let list = allProducts;
    if (categoryId != null) {
      list = list.filter((p) => p.IdCategoria === categoryId);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => p.Nombre.toLowerCase().includes(q));
    }
    return list;
  }, [allProducts, query, categoryId]);

  const showBrowse = !query.trim() && categoryId == null;

  const openQty = (p: ProductDTO) => {
    void triggerHaptic('selection');
    setQty(1);
    setQtyModal(p);
    requestAnimationFrame(() => qtySheetRef.current?.present());
  };

  const confirmAdd = () => {
    if (!qtyModal || listaId == null) {
      showToast('error', t('search.addFailed'), t('search.noActiveList'));
      return;
    }
    if (addItemMutation.isPending) return;

    // Sin fijar proveedor/precio aquí: el detalle de lista aplica precios
    // según el proveedor elegido. PrecioActual '0.00' = sin vínculo.
    addItemMutation.mutate(
      {
        IdLista: listaId,
        IdProducto: qtyModal.IdProducto,
        PrecioActual: '0.00',
        Cantidad: qty,
      },
      {
        onSuccess: () => {
          qtySheetRef.current?.dismiss();
          void triggerHaptic('success');
          showToast('success', t('search.productAdded'), `${qtyModal.Nombre} ×${qty}`);
        },
        onError: () => {
          void triggerHaptic('error');
          showToast('error', t('search.addFailed'), t('search.addTryAgain'));
        },
      },
    );
  };

  const goToList = () => {
    if (!listaId) {
      router.back();
      return;
    }
    router.replace({
      pathname: '/tabs/list/[id]',
      params: {
        id: String(listaId),
        idProveedor: String(idProveedor ?? ''),
        nombre: listName,
      },
    });
  };

  const browseCats = useMemo(() => {
    const preferred = [
      'Frutas',
      'Hogar',
      'Mascotas',
      'Bebidas',
      'Panadería',
      'Farmacia',
      'Despensa',
      'Ofertas',
    ];
    const byName = new Map(categorias.map((c) => [c.NombreCategoria.toLowerCase(), c]));
    const picked: CategoryDTO[] = [];
    for (const label of preferred) {
      const hit = byName.get(label.toLowerCase());
      if (hit) picked.push(hit);
    }
    for (const c of categorias) {
      if (picked.length >= 8) break;
      if (!picked.some((p) => p.IdCategoria === c.IdCategoria)) {
        picked.push(c);
      }
    }
    if (
      picked.length < 8 &&
      !picked.some((c) => c.NombreCategoria.toLowerCase().includes('oferta'))
    ) {
      picked.push({ IdCategoria: -1, NombreCategoria: 'Ofertas' });
    }
    return picked.slice(0, 8);
  }, [categorias]);

  const catalogPending = tipoId != null && catalogQuery.isPending;
  const isPending = catalogPending || categoriesQuery.isPending || unitsQuery.isPending;
  const isLoading = catalogQuery.isLoading || categoriesQuery.isLoading || unitsQuery.isLoading;
  const isError = catalogQuery.isError || categoriesQuery.isError || unitsQuery.isError;
  const retry = () => {
    if (tipoId != null) void catalogQuery.refetch();
    void categoriesQuery.refetch();
    void unitsQuery.refetch();
  };

  if (isPending && isLoading) {
    return (
      <Screen edges={['top']} gutters={false}>
        <View style={styles.loadingSkeletons}>
          {[0, 1, 2, 3, 4].map((item) => (
            <View key={item} style={styles.loadingRow}>
              <Skeleton width={52} height={52} borderRadius={12} />
              <View style={styles.loadingText}>
                <Skeleton width="75%" height={14} />
                <Skeleton width="40%" height={11} />
              </View>
            </View>
          ))}
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen edges={['top']}>
        <Text style={styles.errorText}>{t('search.productsFailed')}</Text>
        <Button tone="navy" onPress={retry}>
          {t('search.retry')}
        </Button>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} gutters={false} style={{ paddingBottom: 0 }}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t('shared.back')}
        >
          <Ionicons name="chevron-back" size={22} color={colors.navy} />
        </Pressable>
        <View style={styles.searchPill}>
          <Ionicons name="search" size={18} color={colors.navySoft} />
          <TextInput
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              if (t.trim()) setCategoryId(null);
            }}
            placeholder={t('home.searchPlaceholder')}
            testID="list-product-search"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query ? (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={8}
              accessibilityLabel={t('search.clearSearch')}
            >
              <Ionicons name="close" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {showBrowse ? (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: FLOATING_TAB_BAR_CLEARANCE + 72,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>{t('search.popular')}</Text>
          <View style={styles.chipWrap}>
            {POPULAR.map((p) => (
              <Pressable
                key={p}
                onPress={() => setQuery(p.split(' ')[0])}
                style={styles.popularChip}
              >
                <Text style={styles.flame}>🔥</Text>
                <Text style={styles.popularText}>{p}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>{t('search.categories')}</Text>
          <View style={styles.catGrid}>
            {browseCats.map((c, i) => (
              <Pressable
                key={c.IdCategoria}
                onPress={() => {
                  if (c.IdCategoria === -1) {
                    setQuery('Oferta');
                    return;
                  }
                  setCategoryId(c.IdCategoria);
                  setQuery('');
                }}
                style={styles.catCard}
              >
                <View
                  style={[styles.catIcon, { backgroundColor: categoryTint(c.NombreCategoria, i) }]}
                >
                  <Text style={styles.catEmoji}>{categoryEmoji(c.NombreCategoria)}</Text>
                </View>
                <Text style={styles.catLabel} numberOfLines={1}>
                  {c.NombreCategoria.length > 7
                    ? `${c.NombreCategoria.slice(0, 6)}.`
                    : c.NombreCategoria}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.IdProducto)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: FLOATING_TAB_BAR_CLEARANCE + 72,
            flexGrow: 1,
          }}
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              {categoryId != null ? (
                <Pressable onPress={() => setCategoryId(null)} style={styles.clearCat}>
                  <Ionicons name="close-circle" size={16} color={colors.muted} />
                  <Text style={styles.clearCatText}>
                    {categorias.find((c) => c.IdCategoria === categoryId)?.NombreCategoria ??
                      'Categoría'}
                  </Text>
                </Pressable>
              ) : null}
              <Text style={styles.resultsMeta}>
                {t(filtered.length === 1 ? 'search.results_one' : 'search.results_other', {
                  count: filtered.length,
                })}
                {query.trim() ? t('search.resultsFor', { query: query.trim().toUpperCase() }) : ''}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title={t('search.noResults')}
              description={t('search.noResultsBody')}
            />
          }
          renderItem={({ item }) => {
            const unit = unitLabel(item);
            return (
              <Pressable
                testID={`list-product-${item.IdProducto}`}
                onPress={() => openQty(item)}
                style={({ pressed }) => [styles.resultCard, pressed && { opacity: 0.92 }]}
              >
                {item.UrlImagen ? (
                  <Image source={{ uri: item.UrlImagen }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]}>
                    <Text style={{ fontSize: 22 }}>🛒</Text>
                  </View>
                )}
                <View style={styles.resultBody}>
                  <Text style={styles.resultName} numberOfLines={2}>
                    {item.Nombre}
                  </Text>
                  {unit ? <Text style={styles.unitText}>{unit}</Text> : null}
                </View>
                <Ionicons name="add-circle" size={28} color={colors.orange} />
              </Pressable>
            );
          }}
        />
      )}

      {listaId ? (
        <View style={styles.footerBar}>
          <Button tone="navy" onPress={goToList}>
            {t('search.listButton', { name: listName })}
          </Button>
        </View>
      ) : null}

      <BottomSheetModal
        ref={qtySheetRef}
        index={0}
        snapPoints={['42%']}
        enablePanDownToClose
        onDismiss={() => setQtyModal(null)}
        keyboardBehavior="interactive"
        backdropComponent={(props: Record<string, unknown>) => (
          <BottomSheetBackdrop {...props} pressBehavior="close" />
        )}
        backgroundStyle={{ backgroundColor: colors.card }}
      >
        <BottomSheetView style={styles.modalSheet}>
          <Text style={styles.modalTitle}>{t('search.quantity')}</Text>
          <Text style={styles.modalSub} numberOfLines={2}>
            {qtyModal?.Nombre}
            {qtyModal ? (
              unitLabel(qtyModal) ? (
                <Text style={styles.modalUnit}>{` · ${unitLabel(qtyModal)}`}</Text>
              ) : null
            ) : null}
          </Text>
          <View style={styles.stepper}>
            <Pressable
              testID="quantity-decrease"
              onPress={() => {
                void triggerHaptic('selection');
                setQty((q) => Math.max(1, q - 1));
              }}
              style={styles.stepBtn}
              accessibilityLabel={t('search.less')}
            >
              <Ionicons name="remove" size={22} color={colors.navy} />
            </Pressable>
            <Text style={styles.stepValue}>{qty}</Text>
            <Pressable
              testID="quantity-increase"
              onPress={() => {
                void triggerHaptic('selection');
                setQty((q) => q + 1);
              }}
              style={styles.stepBtn}
              accessibilityLabel={t('search.more')}
            >
              <Ionicons name="add" size={22} color={colors.navy} />
            </Pressable>
          </View>
          <Button
            tone="orange"
            onPress={confirmAdd}
            loading={addItemMutation.isPending}
            disabled={!listaId}
            testID="add-product-submit"
          >
            {t('search.addToList')}
          </Button>
          <Button tone="light" onPress={() => qtySheetRef.current?.dismiss()}>
            {t('search.cancel')}
          </Button>
        </BottomSheetView>
      </BottomSheetModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: 6,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.blueSoft,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderWidth: 1,
    borderColor: '#C5D8EE',
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.semibold,
    fontSize: 14,
    color: colors.navy,
    paddingVertical: 4,
  },
  sectionTitle: {
    fontFamily: typography.extrabold,
    fontSize: 13,
    color: colors.navy,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  popularChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  flame: { fontSize: 12 },
  popularText: {
    fontFamily: typography.bold,
    fontSize: 12,
    color: colors.ink,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  catCard: {
    width: '25%',
    padding: 5,
    alignItems: 'center',
  },
  catIcon: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 72,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 6,
  },
  catEmoji: { fontSize: 22 },
  catLabel: {
    fontFamily: typography.bold,
    fontSize: 10,
    color: colors.ink,
    textAlign: 'center',
  },
  resultsHeader: { paddingTop: 8, paddingBottom: 4, gap: 6 },
  clearCat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  clearCatText: {
    fontFamily: typography.semibold,
    fontSize: 12,
    color: colors.muted,
  },
  resultsMeta: {
    fontFamily: typography.bold,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.line,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(11,37,69,0.06)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
      default: {},
    }),
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F0F2F7',
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBody: { flex: 1, minWidth: 0 },
  resultName: {
    fontFamily: typography.extrabold,
    fontSize: 14,
    color: colors.ink,
  },
  unitText: {
    fontFamily: typography.semibold,
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: 8,
  },
  emptyTitle: {
    fontFamily: typography.extrabold,
    fontSize: 14,
    color: colors.navy,
    marginTop: 4,
  },
  emptyBody: {
    fontFamily: typography.medium,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 4,
  },
  footerBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: FLOATING_TAB_BAR_CLEARANCE,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,37,69,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    gap: 12,
    paddingBottom: 28,
  },
  modalTitle: {
    fontFamily: typography.extrabold,
    fontSize: 18,
    color: colors.navy,
  },
  modalSub: {
    fontFamily: typography.medium,
    fontSize: 13,
    color: colors.muted,
  },
  modalUnit: {
    fontFamily: typography.semibold,
    color: colors.navySoft,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 8,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontFamily: typography.extrabold,
    fontSize: 28,
    color: colors.navy,
    minWidth: 40,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: typography.medium,
    fontSize: 14,
    color: colors.red,
    marginVertical: 16,
    textAlign: 'center',
  },
  loadingSkeletons: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: 10,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
  },
  loadingText: { flex: 1, gap: 8 },
});
