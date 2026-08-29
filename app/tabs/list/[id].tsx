import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  FlatList,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import * as Location from 'expo-location';
import { api, endpoints } from '@/src/shared/api';
import { getUnitAbbrev } from '@/src/shared/products/meta';
import {
  Screen,
  EmptyState,
  Skeleton,
  showToast,
  triggerHaptic,
  FLOATING_TAB_BAR_CLEARANCE,
} from '@/src/shared/ui';
import { colors, getProviderBrand, radii, spacing, typography } from '@/src/shared/theme';

enum CategoriaLista {
  Supermercado = 'supermercado',
  Ferreteria = 'ferreteria',
  Farmacia = 'farmacia',
  Otro = 'otro',
}

type ProductoEnLista = {
  IdProducto: number;
  PrecioActual: string;
  Cantidad: number;
};

type ProductoAPI = {
  IdProducto: number;
  Nombre: string;
  UrlImagen: string;
  IdUnidadMedida?: number;
};

type PrecioRow = {
  IdProveedor: number;
  NombreProveedor: string;
  Precio: string;
  PrecioOferta?: string | null;
};

type ListItem = ProductoAPI & {
  PrecioActual: string;
  Cantidad: number;
  checked: boolean;
  wasPrice?: number | null;
  unit?: string;
};

type SucursalCercana = {
  NombreSucursal: string;
  Latitud: number | string;
  Longitud: number | string;
  IdProveedor: number;
  Precio: number;
  Distancia: number;
};

type Proveedor = {
  IdProveedor: number;
  Nombre: string;
  UrlLogo: string;
  IdTipoProveedor: number;
};

type TipoProveedor = {
  IdTipoProveedor: number;
  NombreTipoProveedor: string;
};

type ListaMeta = {
  IdLista: number;
  Nombre: string;
  IdProveedor: number;
  PrecioTotal: string;
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

function effectivePrice(row: PrecioRow | undefined): number | null {
  if (!row) return null;
  const v = Number(row.PrecioOferta ?? row.Precio);
  return Number.isFinite(v) ? v : null;
}

export default function ListDetailScreen() {
  const {
    id,
    idProveedor,
    nombre: nombreParam,
  } = useLocalSearchParams<{
    id: string;
    idProveedor?: string;
    nombre?: string;
  }>();
  const idLista = Number(id);
  const proveedorIdParam = Number(idProveedor) || 0;

  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState<ListItem[]>([]);
  const [listName, setListName] = useState(nombreParam ?? 'Lista');
  const [resolvedProveedorId, setResolvedProveedorId] = useState(proveedorIdParam);
  const [tipoId, setTipoId] = useState<number | null>(null);
  const [providers, setProviders] = useState<Proveedor[]>([]);
  const [priceByProduct, setPriceByProduct] = useState<Record<number, PrecioRow[]>>({});
  const [categoria, setCategoria] = useState<CategoriaLista>(CategoriaLista.Otro);
  const [branch, setBranch] = useState<SucursalCercana | null>(null);
  const [loadingBranch, setLoadingBranch] = useState(false);
  const [sending, setSending] = useState(false);
  const [switchingProv, setSwitchingProv] = useState(false);
  const swipeRefs = useRef<Record<number, Swipeable | null>>({});

  const applyProviderPrices = useCallback(
    (items: ListItem[], proveedorId: number, matrix: Record<number, PrecioRow[]>): ListItem[] => {
      if (!proveedorId) return items;
      return items.map((item) => {
        const rows = matrix[item.IdProducto] ?? [];
        const match = rows.find((r) => r.IdProveedor === proveedorId);
        const price = effectivePrice(match);
        const base = match ? Number(match.Precio) : null;
        const nextPrice = price != null ? price.toFixed(2) : item.PrecioActual;
        const was = base != null && price != null && base > price ? base : null;
        return {
          ...item,
          PrecioActual: nextPrice,
          wasPrice: was,
        };
      });
    },
    [],
  );

  const fetchProducts = useCallback(
    async (proveedorId: number) => {
      try {
        const resp = await api.get<ProductoEnLista[]>(endpoints.productosDeLista(idLista));
        const rows = Array.isArray(resp.data) ? resp.data : [];

        const matrix: Record<number, PrecioRow[]> = {};
        await Promise.all(
          rows.map(async (pl) => {
            try {
              const precios = await api.get<PrecioRow[]>(endpoints.preciosProductos(pl.IdProducto));
              matrix[pl.IdProducto] = Array.isArray(precios.data) ? precios.data : [];
            } catch {
              matrix[pl.IdProducto] = [];
            }
          }),
        );
        setPriceByProduct(matrix);

        const detalles = await Promise.all(
          rows.map(async (pl) => {
            const prod = await api.get<ProductoAPI>(endpoints.productoById(pl.IdProducto));
            const unitId = prod.data.IdUnidadMedida;
            const unit = unitId != null ? getUnitAbbrev(unitId).replace(/^\//, '') : '';
            return {
              ...prod.data,
              PrecioActual: pl.PrecioActual,
              Cantidad: pl.Cantidad,
              checked: false,
              wasPrice: null as number | null,
              unit,
            } as ListItem;
          }),
        );

        const priced = applyProviderPrices(detalles, proveedorId, matrix);
        setProductos(priced);
      } catch {
        showToast('error', 'No se pudieron cargar productos', 'Intenta nuevamente.');
      }
    },
    [idLista, applyProviderPrices],
  );

  const hydrateMeta = useCallback(async () => {
    try {
      const [{ data: listas }, { data: allProveedores }] = await Promise.all([
        api.get<ListaMeta[]>(endpoints.lista),
        api.get<Proveedor[]>(endpoints.proveedor),
      ]);
      const meta = (listas ?? []).find((l) => l.IdLista === idLista);
      if (meta) {
        setListName(meta.Nombre);
      }
      const pid = proveedorIdParam || meta?.IdProveedor || 0;
      setResolvedProveedorId(pid);

      let tId: number | null = null;
      if (pid) {
        const provRes = await api.get<Proveedor>(endpoints.proveedorById(pid));
        tId = provRes.data.IdTipoProveedor;
        setTipoId(tId);
        const tiposRes = await api.get<TipoProveedor[]>(endpoints.tipoproveedor);
        const tipoObj = tiposRes.data.find((t) => t.IdTipoProveedor === tId);
        const nombre = tipoObj?.NombreTipoProveedor.toLowerCase() || '';
        if (nombre.includes('supermerc')) setCategoria(CategoriaLista.Supermercado);
        else if (nombre.includes('ferreter')) setCategoria(CategoriaLista.Ferreteria);
        else if (nombre.includes('farmac')) setCategoria(CategoriaLista.Farmacia);
      }

      const list = Array.isArray(allProveedores) ? allProveedores : [];
      const sameTipo = tId ? list.filter((p) => p.IdTipoProveedor === tId) : list;
      setProviders(sameTipo.length ? sameTipo : list);
      return pid;
    } catch {
      return proveedorIdParam;
    }
  }, [idLista, proveedorIdParam]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        const pid = await hydrateMeta();
        if (!active) return;
        await fetchProducts(pid || 0);
        if (active) setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [fetchProducts, hydrateMeta]),
  );

  const providerOptions: ProviderOption[] = useMemo(() => {
    if (!productos.length || !providers.length) {
      return providers.map((p) => ({
        IdProveedor: p.IdProveedor,
        Nombre: p.Nombre,
        total: 0,
        covered: 0,
      }));
    }
    return providers
      .map((p) => {
        let total = 0;
        let covered = 0;
        for (const item of productos) {
          const rows = priceByProduct[item.IdProducto] ?? [];
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
  }, [productos, providers, priceByProduct, resolvedProveedorId]);

  const cheapestTotal = providerOptions[0]?.total ?? 0;
  const selectedOption = providerOptions.find((o) => o.IdProveedor === resolvedProveedorId);
  const selectedProviderName =
    providers.find((p) => p.IdProveedor === resolvedProveedorId)?.Nombre ?? null;

  const selectProvider = async (nextId: number) => {
    if (nextId === resolvedProveedorId || switchingProv) return;
    void triggerHaptic('selection');
    setSwitchingProv(true);
    try {
      setResolvedProveedorId(nextId);
      const priced = applyProviderPrices(productos, nextId, priceByProduct);
      setProductos(priced);

      // Persist list provider + item prices (mock / if backend supports it)
      try {
        await api.put(endpoints.listaById(idLista), {
          IdProveedor: nextId,
        });
      } catch {
        // Live API may lack PUT lista/:id
      }

      await Promise.all(
        priced.map(async (item) => {
          try {
            await api.put(endpoints.listaProductoItem(idLista, item.IdProducto), {
              PrecioActual: item.PrecioActual,
            });
          } catch {
            // ignore per-item persist failures
          }
        }),
      );
    } finally {
      setSwitchingProv(false);
    }
  };

  const fetchBranch = useCallback(async () => {
    if (!productos.length || !resolvedProveedorId) return;
    setLoadingBranch(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error('no location');
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      const body = {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        ids_productos: productos.map((p) => p.IdProducto),
        lista_cantidad: productos.map((p) => p.Cantidad),
      };
      const resp = await api.post<SucursalCercana[]>(endpoints.sucursalCercana, body);
      setBranch(resp.data.find((b) => b.IdProveedor === resolvedProveedorId) || null);
    } catch {
      setBranch(null);
    } finally {
      setLoadingBranch(false);
    }
  }, [productos, resolvedProveedorId]);

  useEffect(() => {
    if (!loading && productos.length) fetchBranch();
  }, [loading, productos, fetchBranch]);

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
      showToast('error', 'Ruta no disponible', 'No se encontró sucursal.');
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

  const persistQty = async (item: ListItem, nextQty: number) => {
    const clamped = Math.max(1, nextQty);
    setProductos((prev) =>
      prev.map((p) => (p.IdProducto === item.IdProducto ? { ...p, Cantidad: clamped } : p)),
    );
    void triggerHaptic('selection');
    try {
      await api.put(endpoints.listaProductoItem(idLista, item.IdProducto), {
        Cantidad: clamped,
      });
    } catch {
      try {
        await api.post(endpoints.listaProducto, {
          IdLista: idLista,
          IdProducto: item.IdProducto,
          PrecioActual: item.PrecioActual,
          Cantidad: clamped,
        });
      } catch {
        // The local state remains usable when the API cannot persist the change.
      }
    }
  };

  const removeProduct = async (item: ListItem) => {
    swipeRefs.current[item.IdProducto]?.close();
    setProductos((prev) => prev.filter((p) => p.IdProducto !== item.IdProducto));
    try {
      await api.delete(endpoints.listaProductoItem(idLista, item.IdProducto));
    } catch {
      showToast('info', 'Producto quitado', 'El backend podría no soportar borrado aún.');
    }
  };

  const toggleCheck = (idProducto: number) => {
    void triggerHaptic('selection');
    setProductos((prev) =>
      prev.map((p) => (p.IdProducto === idProducto ? { ...p, checked: !p.checked } : p)),
    );
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
      const res = await api.post<{ respuesta?: string }>(endpoints.analizarPregunta, {
        pregunta: prompt,
      });
      navigateToIaResult(res.data.respuesta || 'Sin respuesta.');
    } catch {
      void triggerHaptic('error');
      showToast('error', 'No se pudo obtener respuesta', 'Intenta nuevamente.');
    } finally {
      setSending(false);
    }
  };

  const renderRightActions = (item: ListItem) => (
    <View style={styles.swipeUnderlay}>
      <Text style={styles.swipeLabel}>Eliminar</Text>
      <Pressable
        onPress={() => removeProduct(item)}
        style={styles.swipeTrash}
        accessibilityLabel={`Eliminar ${item.Nombre}`}
      >
        <Ionicons name="trash-outline" size={20} color={colors.red} />
      </Pressable>
    </View>
  );

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
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={22} color={colors.navy} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {listName}
        </Text>
        <Pressable
          onPress={goAddProducts}
          style={styles.addBtn}
          accessibilityLabel="Agregar productos"
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </Pressable>
      </View>

      {providerOptions.length > 0 ? (
        <View style={styles.providerSection}>
          <Text style={styles.providerLabel}>Proveedor de la lista</Text>
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
                  disabled={switchingProv}
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
                  {isBest ? <Text style={styles.bestBadge}>Mejor precio</Text> : null}
                </Pressable>
              );
            })}
          </ScrollView>
          {totals.vsCheapest > 0.01 ? (
            <Text style={styles.switchHint}>
              Cambia de proveedor y ahorra RD$ {totals.vsCheapest.toFixed(2)}
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
            title="Lista vacía"
            description="Agrega productos con el botón + naranja."
            actionLabel="Agregar productos"
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
                  {sending ? 'Generando…' : 'Generar receta'}
                </Text>
              </Pressable>
              <Pressable
                onPress={openMap}
                disabled={!branch || loadingBranch}
                style={[styles.actionRuta, (!branch || loadingBranch) && { opacity: 0.6 }]}
              >
                <Ionicons name="git-branch-outline" size={18} color="#19426E" />
                <Text style={styles.actionRutaText}>Ver ruta</Text>
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
                    style={[styles.checkbox, item.checked && styles.checkboxOn]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: item.checked }}
                  >
                    {item.checked ? (
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
                      style={[styles.itemName, item.checked && styles.itemNameChecked]}
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
                      <Animated.View layout={LinearTransition.duration(160)} style={styles.qtyMini}>
                        <Pressable
                          onPress={() => persistQty(item, item.Cantidad - 1)}
                          hitSlop={8}
                          disabled={item.Cantidad <= 1}
                          style={styles.qtyMiniBtn}
                        >
                          <Ionicons
                            name="remove"
                            size={14}
                            color={item.Cantidad <= 1 ? colors.tabInactive : colors.navy}
                          />
                        </Pressable>
                        <Text style={styles.qtyLabel}>×{item.Cantidad}</Text>
                        <Pressable
                          onPress={() => persistQty(item, item.Cantidad + 1)}
                          hitSlop={8}
                          style={styles.qtyMiniBtn}
                        >
                          <Ionicons name="add" size={14} color={colors.navy} />
                        </Pressable>
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
});
