import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, endpoints } from '@/src/shared/api';
import { getUnitAbbrev } from '@/src/shared/products/meta';
import {
  Screen,
  FLOATING_TAB_BAR_CLEARANCE,
  Button,
} from '@/src/shared/ui';
import {
  colors,
  radii,
  spacing,
  typography,
} from '@/src/shared/theme';

type ProductoAPI = {
  IdProducto: number;
  Nombre: string;
  UrlImagen: string | null;
  IdCategoria?: number;
  IdUnidadMedida?: number;
};

type CategoriaAPI = {
  IdCategoria: number;
  NombreCategoria: string;
};

type UnidadMedida = {
  IdUnidadMedida: number;
  NombreUnidadMedida: string;
};

const POPULAR = [
  'Manzana',
  'Pollo Fresco',
  'Arroz Premium',
  'Leche',
  'Aceite',
] as const;

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
  const params = useLocalSearchParams<{
    tipo?: string;
    listaId?: string;
    nombre?: string;
    idProveedor?: string;
  }>();
  const tipoId = params.tipo ? Number(params.tipo) : null;
  const listaId = params.listaId ? Number(params.listaId) : null;
  const idProveedor = params.idProveedor ? Number(params.idProveedor) : null;
  const listName = params.nombre ?? 'Lista';

  const [allProducts, setAllProducts] = useState<ProductoAPI[]>([]);
  const [categorias, setCategorias] = useState<CategoriaAPI[]>([]);
  const [unitNames, setUnitNames] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const [qtyModal, setQtyModal] = useState<ProductoAPI | null>(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  const unitLabel = useCallback(
    (p: ProductoAPI) => {
      const id = p.IdUnidadMedida;
      if (id == null) return '';
      const full = unitNames[id];
      if (full) return full;
      const abbr = getUnitAbbrev(id).replace(/^\//, '');
      return abbr || '';
    },
    [unitNames]
  );

  const fetchBase = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodResp, catResp, unitResp] = await Promise.all([
        tipoId
          ? api.get<ProductoAPI[]>(endpoints.productoTipoProveedor(tipoId))
          : api.get<ProductoAPI[]>(endpoints.producto),
        api.get<CategoriaAPI[]>(endpoints.categoria),
        api.get<UnidadMedida[]>(endpoints.unidadmedida),
      ]);
      setAllProducts(Array.isArray(prodResp.data) ? prodResp.data : []);
      setCategorias(Array.isArray(catResp.data) ? catResp.data : []);
      const units = Array.isArray(unitResp.data) ? unitResp.data : [];
      setUnitNames(
        Object.fromEntries(
          units.map((u) => [u.IdUnidadMedida, u.NombreUnidadMedida])
        )
      );
    } catch {
      setError('No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
    }
  }, [tipoId]);

  useFocusEffect(
    useCallback(() => {
      setQuery('');
      setCategoryId(null);
      fetchBase();
    }, [fetchBase])
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

  const openQty = (p: ProductoAPI) => {
    setQty(1);
    setQtyModal(p);
  };

  const confirmAdd = async () => {
    if (!qtyModal || !listaId) {
      Alert.alert('Error', 'No hay una lista activa para agregar.');
      return;
    }
    setAdding(true);
    try {
      // Sin fijar proveedor/precio aquí: el detalle de lista aplica precios
      // según el proveedor elegido. PrecioActual '0.00' = sin vínculo.
      await api.post(endpoints.listaProducto, {
        IdLista: listaId,
        IdProducto: qtyModal.IdProducto,
        PrecioActual: '0.00',
        Cantidad: qty,
      });
      setQtyModal(null);
      Alert.alert('Agregado', `${qtyModal.Nombre} ×${qty} en la lista.`);
    } catch {
      Alert.alert('Error', 'No se pudo agregar el producto.');
    } finally {
      setAdding(false);
    }
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
    const byName = new Map(
      categorias.map((c) => [c.NombreCategoria.toLowerCase(), c])
    );
    const picked: CategoriaAPI[] = [];
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

  if (loading) {
    return (
      <Screen edges={['top']} gutters={false}>
        <ActivityIndicator
          size="large"
          color={colors.navy}
          style={{ marginTop: 48 }}
        />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen edges={['top']}>
        <Text style={styles.errorText}>{error}</Text>
        <Button tone="navy" onPress={fetchBase}>
          Reintentar
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
          accessibilityLabel="Volver"
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
            placeholder="Busca un producto"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query ? (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={8}
              accessibilityLabel="Limpiar búsqueda"
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
          <Text style={styles.sectionTitle}>Búsquedas populares</Text>
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

          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>
            Categorías
          </Text>
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
                  style={[
                    styles.catIcon,
                    { backgroundColor: categoryTint(c.NombreCategoria, i) },
                  ]}
                >
                  <Text style={styles.catEmoji}>
                    {categoryEmoji(c.NombreCategoria)}
                  </Text>
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
                <Pressable
                  onPress={() => setCategoryId(null)}
                  style={styles.clearCat}
                >
                  <Ionicons name="close-circle" size={16} color={colors.muted} />
                  <Text style={styles.clearCatText}>
                    {categorias.find((c) => c.IdCategoria === categoryId)
                      ?.NombreCategoria ?? 'Categoría'}
                  </Text>
                </Pressable>
              ) : null}
              <Text style={styles.resultsMeta}>
                {filtered.length} RESULTADO
                {filtered.length === 1 ? '' : 'S'}
                {query.trim()
                  ? ` PARA '${query.trim().toUpperCase()}'`
                  : ''}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 38 }}>🔍</Text>
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptyBody}>
                Prueba con otra palabra o explora categorías.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const unit = unitLabel(item);
            return (
              <Pressable
                onPress={() => openQty(item)}
                style={({ pressed }) => [
                  styles.resultCard,
                  pressed && { opacity: 0.92 },
                ]}
              >
                {item.UrlImagen ? (
                  <Image
                    source={{ uri: item.UrlImagen }}
                    style={styles.thumb}
                  />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]}>
                    <Text style={{ fontSize: 22 }}>🛒</Text>
                  </View>
                )}
                <View style={styles.resultBody}>
                  <Text style={styles.resultName} numberOfLines={2}>
                    {item.Nombre}
                  </Text>
                  {unit ? (
                    <Text style={styles.unitText}>{unit}</Text>
                  ) : null}
                </View>
                <Ionicons
                  name="add-circle"
                  size={28}
                  color={colors.orange}
                />
              </Pressable>
            );
          }}
        />
      )}

      {listaId ? (
        <View style={styles.footerBar}>
          <Button tone="navy" onPress={goToList}>
            {`Ver lista · ${listName}`}
          </Button>
        </View>
      ) : null}

      <Modal
        visible={!!qtyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setQtyModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setQtyModal(null)}
          />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Cantidad</Text>
            <Text style={styles.modalSub} numberOfLines={2}>
              {qtyModal?.Nombre}
              {qtyModal ? (
                unitLabel(qtyModal) ? (
                  <Text style={styles.modalUnit}>
                    {` · ${unitLabel(qtyModal)}`}
                  </Text>
                ) : null
              ) : null}
            </Text>
            <View style={styles.stepper}>
              <Pressable
                onPress={() => setQty((q) => Math.max(1, q - 1))}
                style={styles.stepBtn}
                accessibilityLabel="Menos"
              >
                <Ionicons name="remove" size={22} color={colors.navy} />
              </Pressable>
              <Text style={styles.stepValue}>{qty}</Text>
              <Pressable
                onPress={() => setQty((q) => q + 1)}
                style={styles.stepBtn}
                accessibilityLabel="Más"
              >
                <Ionicons name="add" size={22} color={colors.navy} />
              </Pressable>
            </View>
            <Button
              tone="orange"
              onPress={confirmAdd}
              loading={adding}
              disabled={!listaId}
            >
              Agregar a la lista
            </Button>
            <Button tone="light" onPress={() => setQtyModal(null)}>
              Cancelar
            </Button>
          </View>
        </View>
      </Modal>
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
    borderColor: '#EEF0F5',
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
});
