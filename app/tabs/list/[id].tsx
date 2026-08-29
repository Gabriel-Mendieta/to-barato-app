import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import {
  getUserId,
  type ListItemDTO,
  type NearbyBranchesRequest,
  type ProductDTO,
  type ProductPriceDTO,
} from '@/src/shared/api';
import {
  useListItems,
  useRemoveListItem,
  useUpdateListItem,
  useUpdateListProvider,
  useLists,
} from '@/src/features/lists/hooks';
import { useListProductQueries } from '@/src/features/products/hooks';
import {
  useProviders,
  useProvider,
  useProviderTypes,
  useNearbyBranches,
} from '@/src/features/providers/hooks';
import { useAnalyzeQuestion } from '@/src/features/recipes/hooks';
import { firstRouteParam } from '@/src/features/products/screenSelectors';
import { getUnitAbbrev } from '@/src/shared/products/meta';
import {
  Screen,
  Button,
  EmptyState,
  Skeleton,
  showToast,
  triggerHaptic,
  FLOATING_TAB_BAR_CLEARANCE,
} from '@/src/shared/ui';
import { colors, getProviderBrand, radii, spacing, typography } from '@/src/shared/theme';
import { useTranslation } from 'react-i18next';

enum CategoriaLista {
  Supermercado = 'supermercado',
  Ferreteria = 'ferreteria',
  Farmacia = 'farmacia',
  Otro = 'otro',
}

type ListItemRow = ListItemDTO & {
  product?: ProductDTO;
  prices: ProductPriceDTO[];
  Nombre: string;
  UrlImagen?: string | null;
  wasPrice?: number | null;
  unit?: string;
};

type Branch = {
  NombreSucursal: string;
  Latitud: number | string;
  Longitud: number | string;
  IdProveedor: number;
  Precio: number | string;
  Distancia: number | string;
};

type ProviderOption = {
  IdProveedor: number;
  Nombre: string;
  total: number;
  covered: number;
};

function discountPct(current: number, was: number) {
  if (!was || was <= current) return null;
  return Math.round(((was - current) / was) * 100);
}

function effectivePrice(row: ProductPriceDTO | undefined): number | null {
  if (!row) return null;
  const v = Number(row.PrecioOferta ?? row.Precio);
  return Number.isFinite(v) ? v : null;
}

function QuantityEditor({
  quantity,
  disabled,
  onCommit,
  decreaseLabel,
  increaseLabel,
  quantityLabel,
}: {
  quantity: number;
  disabled: boolean;
  onCommit: (value: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
  quantityLabel: string;
}) {
  const [draft, setDraft] = useState(String(quantity));

  const commit = () => {
    const value = Number(draft);
    if (!Number.isInteger(value) || value < 1) {
      setDraft(String(quantity));
      return;
    }
    onCommit(value);
  };

  return (
    <View style={styles.qtyMini}>
      <Pressable
        onPress={() => onCommit(quantity - 1)}
        hitSlop={8}
        disabled={disabled || quantity <= 1}
        style={styles.qtyMiniBtn}
        accessibilityLabel={decreaseLabel}
      >
        <Ionicons
          name="remove"
          size={14}
          color={disabled || quantity <= 1 ? colors.tabInactive : colors.navy}
        />
      </Pressable>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onBlur={commit}
        onSubmitEditing={commit}
        editable={!disabled}
        keyboardType="number-pad"
        selectTextOnFocus
        maxLength={4}
        style={styles.qtyInput}
        accessibilityLabel={quantityLabel}
      />
      <Pressable
        onPress={() => onCommit(quantity + 1)}
        hitSlop={8}
        disabled={disabled}
        style={styles.qtyMiniBtn}
        accessibilityLabel={increaseLabel}
      >
        <Ionicons name="add" size={14} color={disabled ? colors.tabInactive : colors.navy} />
      </Pressable>
    </View>
  );
}

export default function ListDetailScreen() {
  const { t } = useTranslation();
  const {
    id,
    idProveedor,
    nombre: nombreParam,
  } = useLocalSearchParams<{
    id: string | string[];
    idProveedor?: string | string[];
    nombre?: string | string[];
  }>();
  const idLista = Number(firstRouteParam(id));
  const proveedorIdParam = Number(firstRouteParam(idProveedor)) || 0;

  const [providerOverride, setProviderOverride] = useState<number | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [pendingOperations, setPendingOperations] = useState<Set<number>>(new Set());
  const [sending, setSending] = useState(false);
  const pendingOperationsRef = useRef(new Set<number>());
  const swipeRefs = useRef<Record<number, Swipeable | null>>({});

  const sessionUserQuery = useQuery({
    queryKey: ['session', 'user-id'],
    queryFn: getUserId,
    staleTime: Infinity,
  });
  const sessionUserId = sessionUserQuery.data ?? null;
  const listsQuery = useLists(sessionUserId);
  const itemsQuery = useListItems(Number.isInteger(idLista) && idLista > 0 ? idLista : null);
  const productQueries = useListProductQueries(itemsQuery.data);
  const providersQuery = useProviders();
  const listMeta = useMemo(
    () => listsQuery.data?.find((list) => list.IdLista === idLista),
    [listsQuery.data, idLista],
  );
  const metadataProviderId = listMeta?.IdProveedor ?? proveedorIdParam;
  const resolvedProveedorId = providerOverride ?? metadataProviderId;
  const providerQuery = useProvider(resolvedProveedorId || null);
  const providerTypesQuery = useProviderTypes();
  const updateProviderMutation = useUpdateListProvider(sessionUserId);
  const updateItemMutation = useUpdateListItem(sessionUserId);
  const removeItemMutation = useRemoveListItem(sessionUserId);
  const analyzeQuestionMutation = useAnalyzeQuestion();
  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);
  const providers = useMemo(() => providersQuery.data ?? [], [providersQuery.data]);
  const listName = listMeta?.Nombre ?? firstRouteParam(nombreParam) ?? 'Lista';
  const tipoId =
    providerQuery.data?.IdTipoProveedor ??
    providers.find((provider) => provider.IdProveedor === resolvedProveedorId)?.IdTipoProveedor ??
    null;
  const categoria = useMemo(() => {
    const name =
      providerTypesQuery.data?.find((type) => type.IdTipoProveedor === tipoId)
        ?.NombreTipoProveedor ?? '';
    const lower = name.toLowerCase();
    if (lower.includes('supermerc')) return CategoriaLista.Supermercado;
    if (lower.includes('ferreter')) return CategoriaLista.Ferreteria;
    if (lower.includes('farmac')) return CategoriaLista.Farmacia;
    return CategoriaLista.Otro;
  }, [providerTypesQuery.data, tipoId]);
  const visibleProviders = useMemo(() => {
    const sameType = tipoId
      ? providers.filter((provider) => provider.IdTipoProveedor === tipoId)
      : providers;
    return sameType.length ? sameType : providers;
  }, [providers, tipoId]);
  const productos = useMemo<ListItemRow[]>(
    () =>
      items.map((item) => {
        const product = productQueries.details[item.IdProducto];
        const prices = productQueries.prices[item.IdProducto] ?? [];
        const match = prices.find((price) => price.IdProveedor === resolvedProveedorId);
        const currentPrice = effectivePrice(match);
        const basePrice = match ? Number(match.Precio) : null;
        const unitId = product?.IdUnidadMedida;
        return {
          ...item,
          product,
          prices,
          Nombre: product?.Nombre ?? `Producto ${item.IdProducto}`,
          UrlImagen: product?.UrlImagen,
          PrecioActual: currentPrice != null ? currentPrice.toFixed(2) : item.PrecioActual,
          wasPrice:
            basePrice != null && currentPrice != null && basePrice > currentPrice
              ? basePrice
              : null,
          unit: unitId != null ? getUnitAbbrev(unitId).replace(/^\//, '') : '',
        };
      }),
    [items, productQueries.details, productQueries.prices, resolvedProveedorId],
  );
  const nearbyPayload = useMemo<NearbyBranchesRequest | null>(
    () =>
      location && productos.length && resolvedProveedorId > 0
        ? {
            lat: location.lat,
            lng: location.lng,
            ids_productos: productos.map((product) => product.IdProducto),
            lista_cantidad: productos.map((product) => product.Cantidad),
          }
        : null,
    [location, productos, resolvedProveedorId],
  );
  const nearbyQuery = useNearbyBranches(nearbyPayload);
  const branch = useMemo<Branch | null>(
    () =>
      nearbyQuery.data?.find((candidate) => candidate.IdProveedor === resolvedProveedorId) ?? null,
    [nearbyQuery.data, resolvedProveedorId],
  );
  const loadingBranch = nearbyQuery.isPending;
  const loading =
    sessionUserQuery.isPending ||
    (sessionUserId != null && listsQuery.isPending) ||
    itemsQuery.isPending ||
    providersQuery.isPending ||
    (items.length > 0 && productQueries.isPending);

  // La ubicación se solicita únicamente cuando ya hay lista y proveedor válidos.
  useEffect(() => {
    if (!items.length || resolvedProveedorId <= 0 || location) return;
    let active = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          showToast('error', t('lists.noPermission'), t('lists.routePermissionBody'));
          return;
        }
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        if (active) {
          setLocation({ lat: current.coords.latitude, lng: current.coords.longitude });
        }
      } catch {
        if (active) setLocation(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [items.length, resolvedProveedorId, location, t]);

  const providerOptions: ProviderOption[] = useMemo(() => {
    if (!productos.length || !providers.length) {
      return providers.map((p) => ({
        IdProveedor: p.IdProveedor,
        Nombre: p.Nombre,
        total: 0,
        covered: 0,
      }));
    }
    return visibleProviders
      .map((p) => {
        let total = 0;
        let covered = 0;
        for (const item of productos) {
          const rows = productQueries.prices[item.IdProducto] ?? [];
          const match = rows.find((r) => r.IdProveedor === p.IdProveedor);
          const price = effectivePrice(match);
          if (price != null) {
            total += price * item.Cantidad;
            covered += 1;
          }
        }
        return {
          IdProveedor: p.IdProveedor,
          Nombre: p.Nombre,
          total: Math.round(total * 100) / 100,
          covered,
        };
      })
      .filter((o) => o.covered > 0 || o.IdProveedor === resolvedProveedorId)
      .sort((a, b) => a.total - b.total);
  }, [productos, providers, visibleProviders, productQueries.prices, resolvedProveedorId]);

  const cheapestTotal = providerOptions[0]?.total ?? 0;
  const selectedOption = providerOptions.find((o) => o.IdProveedor === resolvedProveedorId);
  const selectedProviderName =
    visibleProviders.find((p) => p.IdProveedor === resolvedProveedorId)?.Nombre ??
    providers.find((p) => p.IdProveedor === resolvedProveedorId)?.Nombre ??
    null;

  const beginOperation = (productId: number) => {
    if (pendingOperationsRef.current.size > 0) return false;
    pendingOperationsRef.current.add(productId);
    setPendingOperations(new Set(pendingOperationsRef.current));
    return true;
  };

  const endOperation = (productId: number) => {
    pendingOperationsRef.current.delete(productId);
    setPendingOperations(new Set(pendingOperationsRef.current));
  };

  const selectProvider = (nextId: number) => {
    if (
      nextId === resolvedProveedorId ||
      updateProviderMutation.isPending ||
      pendingOperations.size > 0 ||
      !idLista
    )
      return;
    void triggerHaptic('selection');
    setProviderOverride(nextId);
    updateProviderMutation.mutate(
      { listId: idLista, providerId: nextId },
      {
        onError: () => {
          setProviderOverride(null);
          void triggerHaptic('error');
          showToast('error', t('lists.providerUpdateFailed'), t('lists.tryAgain'));
        },
        onSettled: () => setProviderOverride(null),
      },
    );
  };

  const totals = useMemo(() => {
    const total = productos.reduce((s, p) => s + Number(p.PrecioActual) * p.Cantidad, 0);
    const was = productos.reduce((s, p) => {
      const unit = p.wasPrice ?? Number(p.PrecioActual);
      return s + unit * p.Cantidad;
    }, 0);
    const vsCheapest =
      selectedOption && cheapestTotal > 0 ? Math.max(0, selectedOption.total - cheapestTotal) : 0;
    return {
      total,
      savings: Math.max(0, was - total),
      vsCheapest,
    };
  }, [productos, selectedOption, cheapestTotal]);

  const openMap = () => {
    if (!branch) {
      showToast('error', t('lists.routeUnavailable'), t('lists.routeUnavailableBody'));
      return;
    }
    const lat = Number(branch.Latitud);
    const lng = Number(branch.Longitud);
    const url = Platform.select({
      ios: `maps:0,0?q=${branch.NombreSucursal}@${lat},${lng}`,
      android: `google.navigation:q=${lat},${lng}`,
    });
    if (url) Linking.openURL(url);
  };

  const goAddProducts = () => {
    router.push({
      pathname: '/tabs/list/add',
      params: {
        listaId: String(idLista),
        tipo: String(tipoId ?? ''),
        nombre: listName,
        idProveedor: String(resolvedProveedorId || ''),
      },
    });
  };

  const persistQty = (item: ListItemRow, nextQty: number) => {
    if (!Number.isInteger(nextQty) || nextQty < 1) {
      showToast('error', t('lists.quantityInvalid'), t('lists.quantityInvalidBody'));
      return;
    }
    if (updateProviderMutation.isPending || !beginOperation(item.IdProducto)) return;
    void triggerHaptic('selection');
    updateItemMutation.mutate(
      {
        listId: idLista,
        productId: item.IdProducto,
        payload: { Cantidad: nextQty },
      },
      {
        onError: () => {
          void triggerHaptic('error');
          showToast('error', t('lists.quantityUpdateFailed'), t('lists.tryAgain'));
        },
        onSettled: () => endOperation(item.IdProducto),
      },
    );
  };

  const removeProduct = (item: ListItemRow) => {
    swipeRefs.current[item.IdProducto]?.close();
    if (updateProviderMutation.isPending || !beginOperation(item.IdProducto)) return;
    removeItemMutation.mutate(
      { listId: idLista, productId: item.IdProducto },
      {
        onSuccess: () => showToast('success', t('lists.productRemoved')),
        onError: () => {
          void triggerHaptic('error');
          showToast('error', t('lists.removeFailed'), t('lists.tryAgain'));
        },
        onSettled: () => endOperation(item.IdProducto),
      },
    );
  };

  const toggleCheck = (idProducto: number) => {
    void triggerHaptic('selection');
    setCheckedIds((previous) => {
      const next = new Set(previous);
      if (next.has(idProducto)) next.delete(idProducto);
      else next.add(idProducto);
      return next;
    });
  };

  const navigateToIaResult = (msg: string) =>
    router.push({
      pathname: '/tabs/list/iaResult',
      params: { reply: encodeURIComponent(msg) },
    });

  const handleIA = async () => {
    if (sending || !productos.length) return;
    setSending(true);
    const nombres = productos.map((p) => p.Nombre).join(', ');
    let prompt = '';
    switch (categoria) {
      case CategoriaLista.Supermercado:
        prompt = `Dame en pocas palabras una receta usando: ${nombres}.`;
        break;
      case CategoriaLista.Ferreteria:
        prompt = `Uso breve de cada herramienta: ${nombres}.`;
        break;
      case CategoriaLista.Farmacia:
        prompt = `Instrucciones cortas para: ${nombres}.`;
        break;
      default:
        prompt = `Describe brevemente: ${nombres}.`;
    }
    try {
      const res = await analyzeQuestionMutation.mutateAsync(prompt);
      navigateToIaResult(res.respuesta || 'Sin respuesta.');
    } catch {
      void triggerHaptic('error');
      showToast('error', t('lists.aiFailed'), t('lists.tryAgain'));
    } finally {
      setSending(false);
    }
  };

  const renderRightActions = (item: ListItemRow) => (
    <View style={styles.swipeUnderlay}>
      <Text style={styles.swipeLabel}>{t('lists.delete')}</Text>
      <Pressable
        onPress={() => removeProduct(item)}
        disabled={pendingOperations.has(item.IdProducto) || updateProviderMutation.isPending}
        style={styles.swipeTrash}
        accessibilityLabel={`${t('lists.delete')} ${item.Nombre}`}
      >
        <Ionicons name="trash-outline" size={20} color={colors.red} />
      </Pressable>
    </View>
  );

  if (itemsQuery.isError) {
    return (
      <Screen edges={['top']}>
        <Text style={styles.errorText}>{t('search.productsFailed')}</Text>
        <Button tone="navy" onPress={() => void itemsQuery.refetch()}>
          {t('search.retry')}
        </Button>
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen edges={['top']} gutters={false}>
        <View style={styles.loadingSkeletons}>
          <Skeleton width="55%" height={22} />
          {[0, 1, 2, 3].map((item) => (
            <View key={item} style={styles.loadingRow}>
              <Skeleton width={26} height={26} borderRadius={8} />
              <Skeleton width={48} height={48} borderRadius={12} />
              <View style={styles.loadingText}>
                <Skeleton width="80%" height={14} />
                <Skeleton width="45%" height={11} />
              </View>
              <Skeleton width={52} height={16} />
            </View>
          ))}
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} gutters={false} style={{ paddingBottom: 0 }}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.replace('/tabs/lista')}
          style={styles.iconBtn}
          accessibilityLabel={t('shared.back')}
        >
          <Ionicons name="chevron-back" size={22} color={colors.navy} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {listName}
        </Text>
        <Pressable
          onPress={goAddProducts}
          style={styles.addBtn}
          accessibilityLabel={t('search.addToList')}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </Pressable>
      </View>

      {providerOptions.length > 0 ? (
        <View style={styles.providerSection}>
          <Text style={styles.providerLabel}>{t('lists.listProvider')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.providerScroll}
          >
            {providerOptions.map((opt) => {
              const active = opt.IdProveedor === resolvedProveedorId;
              const brand = getProviderBrand(opt.IdProveedor);
              const isBest =
                opt.total === cheapestTotal && providerOptions.length > 1 && productos.length > 0;
              return (
                <Pressable
                  key={opt.IdProveedor}
                  onPress={() => selectProvider(opt.IdProveedor)}
                  disabled={updateProviderMutation.isPending || pendingOperations.size > 0}
                  style={[
                    styles.providerChip,
                    active && {
                      borderColor: brand.color,
                      backgroundColor: brand.bg,
                    },
                  ]}
                >
                  <Text
                    style={[styles.providerName, active && { color: brand.color }]}
                    numberOfLines={1}
                  >
                    {opt.Nombre}
                  </Text>
                  {productos.length > 0 ? (
                    <Text style={[styles.providerTotal, active && { color: brand.color }]}>
                      RD$ {opt.total.toFixed(2)}
                    </Text>
                  ) : null}
                  {isBest ? <Text style={styles.bestBadge}>{t('lists.bestPrice')}</Text> : null}
                </Pressable>
              );
            })}
          </ScrollView>
          {totals.vsCheapest > 0.01 ? (
            <Text style={styles.switchHint}>
              {t('lists.switchAndSave', { amount: totals.vsCheapest.toFixed(2) })}
            </Text>
          ) : null}
        </View>
      ) : null}

      <FlatList
        data={productos}
        keyExtractor={(i) => String(i.IdProducto)}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: FLOATING_TAB_BAR_CLEARANCE + 140,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <EmptyState
            icon="cart-outline"
            title={t('lists.empty')}
            description={t('lists.emptyBody')}
            actionLabel={t('search.addToList')}
            onAction={goAddProducts}
          />
        }
        ListFooterComponent={
          productos.length > 0 ? (
            <View style={styles.actionRow}>
              <Pressable
                onPress={handleIA}
                disabled={sending}
                style={[styles.actionReceta, sending && { opacity: 0.6 }]}
              >
                <Ionicons name="restaurant-outline" size={18} color="#7A4B0E" />
                <Text style={styles.actionRecetaText}>
                  {sending ? t('lists.generating') : t('lists.generateRecipe')}
                </Text>
              </Pressable>
              <Pressable
                onPress={openMap}
                disabled={!branch || loadingBranch}
                style={[styles.actionRuta, (!branch || loadingBranch) && { opacity: 0.6 }]}
              >
                <Ionicons name="git-branch-outline" size={18} color="#19426E" />
                <Text style={styles.actionRutaText}>{t('lists.viewRoute')}</Text>
              </Pressable>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const price = Number(item.PrecioActual);
          const pct = item.wasPrice != null ? discountPct(price, item.wasPrice) : null;
          const brand = getProviderBrand(resolvedProveedorId || 1);

          return (
            <Animated.View
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(160)}
              layout={LinearTransition.duration(180)}
            >
              <Swipeable
                ref={(ref) => {
                  swipeRefs.current[item.IdProducto] = ref;
                }}
                renderRightActions={() => renderRightActions(item)}
                overshootRight={false}
                friction={2}
              >
                <View style={styles.card}>
                  <Pressable
                    onPress={() => toggleCheck(item.IdProducto)}
                    style={[styles.checkbox, checkedIds.has(item.IdProducto) && styles.checkboxOn]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: checkedIds.has(item.IdProducto) }}
                  >
                    {checkedIds.has(item.IdProducto) ? (
                      <Ionicons name="checkmark" size={16} color={colors.white} />
                    ) : null}
                  </Pressable>

                  {item.UrlImagen ? (
                    <Image source={{ uri: item.UrlImagen }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, { backgroundColor: '#eee' }]} />
                  )}

                  <View style={styles.cardBody}>
                    <Text
                      style={[
                        styles.itemName,
                        checkedIds.has(item.IdProducto) && styles.itemNameChecked,
                      ]}
                      numberOfLines={1}
                    >
                      {item.Nombre}
                    </Text>
                    <View style={styles.metaRow}>
                      {selectedProviderName ? (
                        <View style={[styles.storePill, { backgroundColor: brand.bg }]}>
                          <Text style={[styles.storePillText, { color: brand.color }]}>
                            {selectedProviderName}
                          </Text>
                        </View>
                      ) : null}
                      {item.unit ? <Text style={styles.unitMini}>{item.unit}</Text> : null}
                      <Animated.View
                        key={`${item.IdProducto}-${item.Cantidad}`}
                        layout={LinearTransition.duration(160)}
                      >
                        <QuantityEditor
                          quantity={item.Cantidad}
                          disabled={
                            pendingOperations.has(item.IdProducto) ||
                            updateProviderMutation.isPending
                          }
                          onCommit={(quantity) => persistQty(item, quantity)}
                          decreaseLabel={t('search.less')}
                          increaseLabel={t('search.more')}
                          quantityLabel={t('search.quantity')}
                        />
                      </Animated.View>
                    </View>
                  </View>

                  <View style={styles.priceBlock}>
                    <Text style={styles.priceNow}>
                      {price > 0 ? `RD$ ${price.toFixed(2)}` : '—'}
                    </Text>
                    {item.wasPrice != null && item.wasPrice > price ? (
                      <Text style={styles.priceWas}>RD$ {item.wasPrice.toFixed(2)}</Text>
                    ) : null}
                    {pct != null ? (
                      <View style={styles.discPill}>
                        <Text style={styles.discText}>- {pct} %</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Swipeable>
            </Animated.View>
          );
        }}
      />

      {productos.length > 0 ? (
        <View style={styles.summaryBar}>
          <View>
            <Text style={styles.summaryLabel}>Total estimado</Text>
            <Text style={styles.summaryTotal}>RD$ {totals.total.toFixed(2)}</Text>
            {totals.savings > 0 ? (
              <Text style={styles.summarySave}>Ahorras RD$ {totals.savings.toFixed(2)}</Text>
            ) : null}
          </View>
          <Pressable onPress={openMap} style={styles.buyBtn}>
            <Text style={styles.buyText}>Comprar</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.white} />
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: 10,
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(242,160,61,0.35)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typography.extrabold,
    fontSize: 18,
    color: colors.navy,
  },
  providerSection: {
    paddingBottom: 8,
  },
  providerLabel: {
    fontFamily: typography.bold,
    fontSize: 11,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingHorizontal: spacing.lg,
    marginBottom: 8,
  },
  providerScroll: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  providerChip: {
    minWidth: 108,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  providerName: {
    fontFamily: typography.extrabold,
    fontSize: 13,
    color: colors.ink,
  },
  providerTotal: {
    fontFamily: typography.bold,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  bestBadge: {
    fontFamily: typography.bold,
    fontSize: 9,
    color: '#0E7A4B',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  switchHint: {
    fontFamily: typography.semibold,
    fontSize: 12,
    color: colors.orangeDeep,
    paddingHorizontal: spacing.lg,
    marginTop: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#C8CDD9',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxOn: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  cardBody: { flex: 1, minWidth: 0 },
  itemName: {
    fontFamily: typography.extrabold,
    fontSize: 14,
    color: colors.ink,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  storePill: {
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  storePillText: {
    fontFamily: typography.bold,
    fontSize: 10,
  },
  unitMini: {
    fontFamily: typography.semibold,
    fontSize: 11,
    color: colors.muted,
  },
  qtyMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F2F4F8',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  qtyMiniBtn: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyLabel: {
    fontFamily: typography.bold,
    fontSize: 11,
    color: colors.muted,
    minWidth: 22,
    textAlign: 'center',
  },
  qtyInput: {
    fontFamily: typography.bold,
    fontSize: 11,
    color: colors.muted,
    minWidth: 28,
    paddingVertical: 0,
    paddingHorizontal: 2,
    textAlign: 'center',
  },
  priceBlock: { alignItems: 'flex-end', gap: 2 },
  priceNow: {
    fontFamily: typography.extrabold,
    fontSize: 14,
    color: colors.navySoft,
  },
  priceWas: {
    fontFamily: typography.medium,
    fontSize: 11,
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
  discPill: {
    backgroundColor: colors.greenSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  discText: {
    fontFamily: typography.bold,
    fontSize: 10,
    color: '#0E7A4B',
  },
  swipeUnderlay: {
    flex: 1,
    backgroundColor: '#E5564E',
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    gap: 10,
  },
  swipeLabel: {
    fontFamily: typography.extrabold,
    fontSize: 13,
    color: colors.white,
  },
  swipeTrash: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  actionReceta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF4E0',
    borderWidth: 1,
    borderColor: '#FFD49A',
    borderRadius: 14,
    paddingVertical: 12,
  },
  actionRecetaText: {
    fontFamily: typography.extrabold,
    fontSize: 13,
    color: '#7A4B0E',
  },
  actionRuta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E3EDFA',
    borderWidth: 1,
    borderColor: '#B6CCEA',
    borderRadius: 14,
    paddingVertical: 12,
  },
  actionRutaText: {
    fontFamily: typography.extrabold,
    fontSize: 13,
    color: '#19426E',
  },
  summaryBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: FLOATING_TAB_BAR_CLEARANCE,
    backgroundColor: colors.navy,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(11,37,69,0.35)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 18,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  summaryLabel: {
    fontFamily: typography.bold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryTotal: {
    fontFamily: typography.extrabold,
    fontSize: 18,
    color: colors.white,
  },
  summarySave: {
    fontFamily: typography.bold,
    fontSize: 11,
    color: '#7BD9AB',
    marginTop: 2,
  },
  buyBtn: {
    backgroundColor: colors.orange,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  buyText: {
    fontFamily: typography.extrabold,
    fontSize: 13,
    color: colors.white,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: typography.extrabold,
    fontSize: 16,
    color: colors.navy,
  },
  emptyBody: {
    fontFamily: typography.medium,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 6,
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
  errorText: {
    fontFamily: typography.medium,
    fontSize: 14,
    color: colors.red,
    marginVertical: 16,
    textAlign: 'center',
  },
});
