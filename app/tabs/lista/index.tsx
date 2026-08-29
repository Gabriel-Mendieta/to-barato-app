import { api, endpoints, clearSession } from '@/src/shared/api';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  Alert,
  Linking,
  Share,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetModalMethods,
} from '@/src/shared/ui/BottomSheetCompat';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import {
  Screen,
  Stagger,
  Chip,
  FadeInUp,
  FLOATING_TAB_BAR_CLEARANCE,
  CreateListModal,
  type CreateListPayload,
  EmptyState,
  Skeleton,
  showToast,
  triggerHaptic,
} from '@/src/shared/ui';
import { colors, radii, spacing, typography } from '@/src/shared/theme';
import { useTranslation } from 'react-i18next';

type Lista = {
  IdUsuario: number;
  IdProveedor: number;
  Nombre: string;
  PrecioTotal: string;
  IdLista: number;
  FechaCreacion: string;
};

type ProveedorInfo = {
  IdProveedor: number;
  Nombre: string;
  UrlLogo: string;
  IdTipoProveedor?: number;
};

type TipoProveedor = {
  IdTipoProveedor: number;
  NombreTipoProveedor: string;
};

type UnidadMedida = {
  IdUnidadMedida: number;
  NombreUnidadMedida: string;
};

type RutaSucursal = {
  IdSucursal: number;
  NombreSucursal: string;
  Latitud: number;
  Longitud: number;
  IdProveedor: number;
  Distancia: number;
};

type ProductoEnLista = {
  IdProducto: number;
  PrecioActual: string;
  Cantidad: number;
};

type ProductoAPI = {
  IdProducto: number;
  Nombre: string;
  UrlImagen: string;
  IdUnidadMedida: number;
};

type ListVisual = { bg: string; emoji: string };

const VISUAL_BY_PROVIDER: Record<number, ListVisual> = {
  1: { bg: '#E2F1FA', emoji: '🛒' }, // Nacional
  2: { bg: '#DCF3E5', emoji: '🛒' }, // Jumbo
  3: { bg: '#FFE3E0', emoji: '🛒' }, // La Sirena
  4: { bg: '#E3EDFA', emoji: '🔧' }, // Ferretería
  5: { bg: '#FFE3E1', emoji: '💊' }, // Farmacia
  6: { bg: '#F1E7FA', emoji: '🛒' }, // Bravo
  7: { bg: '#DCE5F7', emoji: '🛒' }, // PriceSmart
  8: { bg: '#FFE3E1', emoji: '🛒' },
};

const VISUAL_FALLBACK: ListVisual[] = [
  { bg: '#FFE8D9', emoji: '🍎' },
  { bg: '#E3EDFA', emoji: '🔧' },
  { bg: '#F1E7FA', emoji: '🐶' },
  { bg: '#DCF3E7', emoji: '🧃' },
  { bg: '#FFF1C8', emoji: '🥖' },
  { bg: '#FFE3E1', emoji: '💊' },
];

function listVisual(lista: Lista, index: number): ListVisual {
  return VISUAL_BY_PROVIDER[lista.IdProveedor] ?? VISUAL_FALLBACK[index % VISUAL_FALLBACK.length];
}

/** Offline stub for “comprados” until the API exposes checked items. */
function estimateDone(idLista: number, items: number) {
  if (items <= 0) return 0;
  const seed = (idLista * 7) % 10;
  if (seed < 4) return 0;
  return Math.min(items, Math.max(1, Math.floor((items * seed) / 12)));
}

function formatMoney(value: number) {
  const whole = Math.floor(value);
  const cents = Math.round((value - whole) * 100);
  return {
    whole: whole.toLocaleString('es-DO'),
    cents: cents.toString().padStart(2, '0'),
  };
}

export default function ShoppingListScreen() {
  const { t } = useTranslation();
  const [listas, setListas] = useState<Lista[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [itemCounts, setItemCounts] = useState<Record<number, number>>({});
  const [selectedLists, setSelectedLists] = useState<Set<number>>(new Set());
  const [notifOpen, setNotifOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [menuList, setMenuList] = useState<Lista | null>(null);
  const menuSheetRef = React.useRef<BottomSheetModalMethods>(null);

  const fetchUserLists = useCallback(async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('access_token');
      const userIdStr = await SecureStore.getItemAsync('user_id');
      if (!token || !userIdStr) {
        router.replace('/auth/IniciarSesion');
        return;
      }

      const resp = await api.get<Lista[]>(endpoints.lista);
      const userId = Number(userIdStr);
      const propias = resp.data.filter((l) => l.IdUsuario === userId);
      setListas(propias);

      const counts: Record<number, number> = {};
      await Promise.all(
        propias.map(async (l) => {
          try {
            const r = await api.get<unknown[]>(endpoints.productosDeLista(l.IdLista));
            counts[l.IdLista] = r.data.length;
          } catch {
            counts[l.IdLista] = 0;
          }
        }),
      );
      setItemCounts(counts);
    } catch {
      await clearSession();
      router.replace('/auth/IniciarSesion');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUserLists();
  }, [fetchUserLists]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserLists();
  }, [fetchUserLists]);

  const isSelecting = selectedLists.size > 0;
  const toggleSelection = (id: number) => {
    setSelectedLists((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const budgetTotal = useMemo(
    () => listas.reduce((sum, l) => sum + (parseFloat(l.PrecioTotal) || 0), 0),
    [listas],
  );
  const totalItems = useMemo(
    () => Object.values(itemCounts).reduce((a, b) => a + b, 0),
    [itemCounts],
  );
  const totalDone = useMemo(
    () => listas.reduce((sum, l) => sum + estimateDone(l.IdLista, itemCounts[l.IdLista] || 0), 0),
    [listas, itemCounts],
  );
  const budgetPct = totalItems ? Math.round((totalDone / totalItems) * 100) : 0;
  // Design stub (~20.8% of sample budget) until real savings exist.
  const savings = Math.round(budgetTotal * 0.208 * 100) / 100;
  const money = formatMoney(budgetTotal);
  const savingsMoney = formatMoney(savings);

  const handleGenerateRoute = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('error', t('lists.noPermission'), t('lists.routePermissionBody'));
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      const provIds = listas.filter((l) => selectedLists.has(l.IdLista)).map((l) => l.IdProveedor);

      const resp = await api.post<RutaSucursal[]>(endpoints.rutaMultiplesListas, {
        lat,
        lng,
        ids_proveedores: provIds,
      });
      const rutas = resp.data;

      if (!rutas.length) {
        showToast('info', t('lists.route'), t('lists.noBranches'));
        return;
      }

      const origin = `${lat},${lng}`;
      const coords = rutas.map((r) => `${r.Latitud},${r.Longitud}`);

      if (Platform.OS === 'ios') {
        const daddr = coords.map((c) => `&daddr=${c}`).join('');
        Linking.openURL(`http://maps.apple.com/?saddr=${origin}${daddr}`);
      } else {
        const destination = coords[coords.length - 1];
        const waypoints = coords.slice(0, -1).join('|');
        const url =
          `https://www.google.com/maps/dir/?api=1&origin=${origin}` +
          `&destination=${destination}` +
          (waypoints ? `&waypoints=${waypoints}` : '') +
          `&travelmode=driving`;
        Linking.openURL(url);
      }
    } catch {
      showToast('error', t('lists.routeFailed'), t('lists.tryAgain'));
    }
  };

  const shareList = async (lista: Lista) => {
    try {
      const respProd = await api.get<ProductoEnLista[]>(endpoints.productosDeLista(lista.IdLista));
      const prodsEnLista = respProd.data;

      const detalles = await Promise.all(
        prodsEnLista.map(async (pl) => {
          const r = await api.get<ProductoAPI>(endpoints.productoById(pl.IdProducto));
          return {
            ...pl,
            Nombre: r.data.Nombre,
            IdUnidadMedida: r.data.IdUnidadMedida,
          };
        }),
      );

      const rUnidades = await api.get<UnidadMedida[]>(endpoints.unidadmedida);
      const unidadesMap = Object.fromEntries(
        rUnidades.data.map((u) => [u.IdUnidadMedida, u.NombreUnidadMedida]),
      );

      const rProv = await api.get<ProveedorInfo & { IdTipoProveedor: number }>(
        endpoints.proveedorById(lista.IdProveedor),
      );
      const prov = rProv.data;
      const rTipos = await api.get<TipoProveedor[]>(endpoints.tipoproveedor);
      const tipo = rTipos.data.find((t) => t.IdTipoProveedor === prov.IdTipoProveedor);

      let sucursalNombre = 'N/A';
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        const body = {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          ids_productos: detalles.map((d) => d.IdProducto),
          lista_cantidad: detalles.map((d) => d.Cantidad),
        };
        const rSuc = await api.post<RutaSucursal[]>(endpoints.sucursalCercana, body);
        const found = rSuc.data.find((b) => b.IdProveedor === lista.IdProveedor);
        if (found) sucursalNombre = found.NombreSucursal;
      }

      let message = `Tipo Proveedor: ${tipo?.NombreTipoProveedor ?? '–'}\n`;
      message += `Nombre del Proveedor: ${prov.Nombre}\n`;
      message += `Nombre Sucursal: ${sucursalNombre}\n\n`;
      message += `Productos:\n`;
      detalles.forEach((d) => {
        const unidad = unidadesMap[d.IdUnidadMedida] ?? '';
        message += `• ${d.Nombre} x${d.Cantidad} ${unidad} RD$${parseFloat(d.PrecioActual).toFixed(
          2,
        )}\n`;
      });
      message += `\nPrecio total: RD$${parseFloat(lista.PrecioTotal).toFixed(2)}`;

      await Share.share({ message });
    } catch {
      showToast('error', t('lists.shareFailed'), t('lists.tryAgain'));
    }
  };

  const confirmDelete = (lista: Lista) => {
    void triggerHaptic('warning');
    Alert.alert(t('lists.deleteList'), t('lists.deleteConfirmation'), [
      { text: t('lists.cancel'), style: 'cancel' },
      {
        text: t('lists.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(endpoints.listaById(lista.IdLista));
            void triggerHaptic('success');
            showToast('success', t('lists.listDeleted'));
            fetchUserLists();
          } catch {
            void triggerHaptic('error');
            showToast('error', t('lists.deleteFailed'), t('lists.tryAgain'));
          }
        },
      },
    ]);
  };

  const openMenu = (lista: Lista) => {
    void triggerHaptic('selection');
    setMenuList(lista);
    requestAnimationFrame(() => menuSheetRef.current?.present());
  };

  const openList = (item: Lista) => {
    if (isSelecting) {
      toggleSelection(item.IdLista);
      return;
    }
    router.push({
      pathname: '/tabs/list/[id]',
      params: {
        id: String(item.IdLista),
        idProveedor: String(item.IdProveedor),
        nombre: item.Nombre,
      },
    });
  };

  const goCreate = () => setCreateOpen(true);

  const onConfirmCreate = async ({ tipo, nombre }: CreateListPayload) => {
    try {
      const userIdStr = await SecureStore.getItemAsync('user_id');
      const userId = userIdStr ? Number(userIdStr) : null;
      if (!userId) {
        showToast('error', t('lists.sessionExpired'), t('lists.sessionExpiredBody'));
        return;
      }

      const { data: proveedores } = await api.get<ProveedorInfo[]>(endpoints.proveedor);
      const match = (proveedores ?? []).find((p) => p.IdTipoProveedor === tipo.IdTipoProveedor);
      const idProveedor = match?.IdProveedor ?? proveedores?.[0]?.IdProveedor;
      if (!idProveedor) {
        showToast('error', t('lists.noProviders'), t('lists.noProvidersBody'));
        return;
      }

      const { data: lista } = await api.post<{ IdLista: number }>(endpoints.lista, {
        IdUsuario: userId,
        IdProveedor: idProveedor,
        Nombre: nombre.trim(),
        PrecioTotal: '0.00',
      });
      const listaId = lista?.IdLista;
      if (!listaId) throw new Error('Sin IdLista');

      setCreateOpen(false);
      void triggerHaptic('success');
      router.push({
        pathname: '/tabs/list/add',
        params: {
          listaId: String(listaId),
          tipo: String(tipo.IdTipoProveedor),
          nombre: nombre.trim(),
          idProveedor: String(idProveedor),
        },
      });
    } catch {
      void triggerHaptic('error');
      showToast('error', t('lists.createFailed'), t('lists.tryAgain'));
    }
  };

  const goHome = () => router.navigate('/tabs/home');

  if (loading && !refreshing) {
    return (
      <Screen edges={['top']} style={{ paddingBottom: 0 }}>
        <View style={styles.loadingSkeletons}>
          {[0, 1, 2, 3].map((item) => (
            <View key={item} style={styles.loadingRow}>
              <Skeleton width={48} height={48} borderRadius={15} />
              <View style={styles.loadingText}>
                <Skeleton width="70%" height={15} />
                <Skeleton width="45%" height={11} />
              </View>
            </View>
          ))}
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} style={{ paddingBottom: 0 }} gutters={false}>
      <FlatList
        data={listas}
        keyExtractor={(l) => l.IdLista.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{
          paddingBottom: FLOATING_TAB_BAR_CLEARANCE + (isSelecting ? 56 : 0),
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <Stagger step={55} delay={20}>
            <View style={styles.topBar}>
              <Pressable
                onPress={goHome}
                style={styles.headerBtn}
                accessibilityRole="button"
                accessibilityLabel={t('shared.back')}
                hitSlop={8}
              >
                <Ionicons name="chevron-back" size={22} color={colors.navy} />
              </Pressable>
              <Text style={styles.title} numberOfLines={1}>
                {t('lists.title')}
              </Text>
              <Pressable
                onPress={() => setNotifOpen((v) => !v)}
                style={styles.headerBtn}
                accessibilityRole="button"
                accessibilityLabel={t('lists.notifications')}
                hitSlop={8}
              >
                <Ionicons name="notifications-outline" size={20} color={colors.navy} />
              </Pressable>
            </View>

            {notifOpen ? (
              <View style={styles.notifSheet}>
                <Text style={styles.notifTitle}>{t('lists.notifications')}</Text>
                <Text style={styles.notifBody}>{t('lists.notificationsUnavailable')}</Text>
              </View>
            ) : null}

            <View style={styles.budgetPad}>
              <View style={styles.budgetCard}>
                <View style={styles.budgetRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.budgetLabel}>{t('lists.estimatedBudget')}</Text>
                    <Text style={styles.budgetValue}>
                      RD$ <Text style={styles.budgetMono}>{money.whole}</Text>
                      <Text style={styles.budgetCents}>.{money.cents}</Text>
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.budgetSideLabel}>{t('lists.savings')}</Text>
                    <Text style={styles.budgetSideValue}>
                      RD$ {savingsMoney.whole}.{savingsMoney.cents}
                    </Text>
                  </View>
                </View>
                <View style={styles.progressRow}>
                  <View style={styles.progressTrack}>
                    <View
                      style={[styles.progressFill, { width: `${Math.min(100, budgetPct)}%` }]}
                    />
                  </View>
                  <Text style={styles.progressMeta}>
                    {totalDone}/{totalItems}
                  </Text>
                </View>
              </View>
            </View>

            {isSelecting ? (
              <Text style={styles.selectHint}>
                {selectedLists.size === 1
                  ? t('lists.selectionHint', { count: selectedLists.size })
                  : t('lists.selectionHintPlural', { count: selectedLists.size })}
              </Text>
            ) : null}
          </Stagger>
        }
        ListEmptyComponent={
          <EmptyState
            icon="cart-outline"
            title={t('lists.noLists')}
            description={t('lists.noListsBody')}
            actionLabel={t('lists.newList')}
            onAction={goCreate}
          />
        }
        renderItem={({ item, index }) => {
          const count = itemCounts[item.IdLista] || 0;
          const done = estimateDone(item.IdLista, count);
          const pct = count ? Math.round((done / count) * 100) : 0;
          const visual = listVisual(item, index);
          const selected = selectedLists.has(item.IdLista);

          return (
            <FadeInUp index={index + 2} step={55} delay={40} style={styles.cardWrap}>
              <Pressable
                onPress={() => openList(item)}
                onLongPress={() => toggleSelection(item.IdLista)}
                delayLongPress={350}
                style={({ pressed }) => [
                  styles.card,
                  selected && styles.cardSelected,
                  pressed && { opacity: 0.94 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={item.Nombre}
              >
                <View style={[styles.catIcon, { backgroundColor: visual.bg }]}>
                  <Text style={styles.catEmoji}>{visual.emoji}</Text>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.Nombre}
                    </Text>
                    <Pressable
                      onPress={() => openMenu(item)}
                      hitSlop={12}
                      accessibilityLabel={t('lists.listOptions')}
                      style={styles.moreBtn}
                    >
                      <Ionicons name="ellipsis-horizontal" size={18} color={colors.tabInactive} />
                    </Pressable>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                      {t(count === 1 ? 'lists.articles_one' : 'lists.articles_other', { count })}
                    </Text>
                    {done > 0 ? (
                      <Chip tone="green" size="sm" style={styles.doneChip}>
                        {t('lists.purchased', { count: done })}
                      </Chip>
                    ) : null}
                  </View>

                  <View style={styles.cardProgressTrack}>
                    <View style={[styles.cardProgressFill, { width: `${Math.min(100, pct)}%` }]} />
                  </View>
                </View>
              </Pressable>
            </FadeInUp>
          );
        }}
        ListFooterComponent={
          listas.length > 0 ? (
            <Pressable
              onPress={goCreate}
              style={[styles.dashedCreate, { marginHorizontal: spacing.lg }]}
              accessibilityRole="button"
            >
              <Ionicons name="add" size={18} color={colors.muted} />
              <Text style={styles.dashedCreateText}>{t('lists.newList')}</Text>
            </Pressable>
          ) : null
        }
      />

      {isSelecting ? (
        <View style={styles.routeBar}>
          <Pressable
            style={styles.routeBtn}
            onPress={handleGenerateRoute}
            accessibilityRole="button"
          >
            <Ionicons name="navigate" size={18} color={colors.white} />
            <Text style={styles.routeBtnText}>
              {t('lists.generateRoute', { count: selectedLists.size })}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedLists(new Set())}
            style={styles.routeCancel}
            accessibilityRole="button"
          >
            <Text style={styles.routeCancelText}>{t('lists.cancel')}</Text>
          </Pressable>
        </View>
      ) : null}

      <CreateListModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onConfirm={onConfirmCreate}
      />

      <BottomSheetModal
        ref={menuSheetRef}
        index={0}
        snapPoints={['34%']}
        enablePanDownToClose
        onDismiss={() => setMenuList(null)}
        backdropComponent={(props: Record<string, unknown>) => (
          <BottomSheetBackdrop {...props} pressBehavior="close" />
        )}
        backgroundStyle={{ backgroundColor: colors.card }}
      >
        <BottomSheetView style={styles.menuSheet}>
          <Text style={styles.menuTitle} numberOfLines={1}>
            {menuList?.Nombre ?? t('lists.listOptions')}
          </Text>
          <Pressable
            style={styles.menuButton}
            onPress={() => {
              const selected = menuList;
              menuSheetRef.current?.dismiss();
              if (selected) void shareList(selected);
            }}
          >
            <Ionicons name="share-outline" size={20} color={colors.navy} />
            <Text style={styles.menuButtonText}>{t('lists.share')}</Text>
          </Pressable>
          <Pressable
            style={styles.menuButton}
            onPress={() => {
              const selected = menuList;
              menuSheetRef.current?.dismiss();
              if (selected) toggleSelection(selected.IdLista);
            }}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.navy} />
            <Text style={styles.menuButtonText}>{t('lists.selectForRoute')}</Text>
          </Pressable>
          <Pressable
            style={styles.menuButton}
            onPress={() => {
              const selected = menuList;
              menuSheetRef.current?.dismiss();
              if (selected) confirmDelete(selected);
            }}
          >
            <Ionicons name="trash-outline" size={20} color={colors.red} />
            <Text style={[styles.menuButtonText, { color: colors.red }]}>{t('lists.delete')}</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
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
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.navy,
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typography.extrabold,
    fontSize: 20,
    color: colors.navy,
    letterSpacing: -0.2,
  },

  notifSheet: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  notifTitle: {
    fontFamily: typography.extrabold,
    fontSize: 15,
    color: colors.navy,
    marginBottom: 4,
  },
  notifBody: {
    fontFamily: typography.medium,
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
  },

  budgetPad: {
    paddingHorizontal: spacing.lg,
    paddingTop: 4,
    paddingBottom: 8,
  },
  budgetCard: {
    backgroundColor: '#FFF4E0',
    borderWidth: 1,
    borderColor: '#FFD49A',
    borderRadius: 18,
    padding: 14,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  budgetLabel: {
    fontSize: 11,
    fontFamily: typography.extrabold,
    color: '#A35A0E',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  budgetValue: {
    fontSize: 26,
    fontFamily: typography.extrabold,
    color: colors.navy,
    marginTop: 2,
    letterSpacing: -0.4,
  },
  budgetMono: { fontFamily: typography.extrabold },
  budgetCents: {
    fontSize: 18,
    fontFamily: typography.medium,
    opacity: 0.8,
  },
  budgetSideLabel: {
    fontSize: 11,
    fontFamily: typography.bold,
    color: '#7A4B0E',
  },
  budgetSideValue: {
    fontSize: 17,
    fontFamily: typography.extrabold,
    color: colors.green,
    letterSpacing: -0.2,
  },
  progressRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.orange,
    borderRadius: radii.pill,
  },
  progressMeta: {
    fontSize: 11,
    fontFamily: typography.extrabold,
    color: '#7A4B0E',
    minWidth: 30,
    textAlign: 'right',
  },

  selectHint: {
    fontFamily: typography.medium,
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },

  cardWrap: {
    marginBottom: 10,
    paddingHorizontal: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.navy,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardSelected: {
    borderColor: colors.orange,
    borderWidth: 2,
    backgroundColor: colors.orangeSoft,
  },
  catIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catEmoji: { fontSize: 26, lineHeight: 30 },
  cardBody: { flex: 1, minWidth: 0 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: typography.extrabold,
    color: colors.navy,
    letterSpacing: -0.15,
  },
  moreBtn: { padding: 4 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    fontFamily: typography.semibold,
    color: colors.muted,
  },
  doneChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cardProgressTrack: {
    marginTop: 8,
    height: 5,
    backgroundColor: '#EEF1F6',
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  cardProgressFill: {
    height: '100%',
    backgroundColor: colors.orange,
    borderRadius: radii.pill,
  },

  dashedCreate: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C8CDD9',
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  dashedCreateText: {
    fontFamily: typography.bold,
    fontSize: 13,
    color: colors.muted,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: typography.extrabold,
    fontSize: 18,
    color: colors.navy,
    marginBottom: 6,
  },
  emptyBody: {
    fontFamily: typography.medium,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },

  routeBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: FLOATING_TAB_BAR_CLEARANCE,
    gap: 8,
  },
  routeBtn: {
    backgroundColor: colors.orange,
    borderRadius: radii.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  routeBtnText: {
    color: colors.white,
    fontFamily: typography.bold,
    fontSize: 15,
  },
  routeCancel: { alignItems: 'center', paddingVertical: 4 },
  routeCancelText: {
    fontFamily: typography.semibold,
    fontSize: 13,
    color: colors.muted,
  },
  loadingSkeletons: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: 10,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  loadingText: { flex: 1, gap: 8 },
  menuSheet: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: 4,
  },
  menuTitle: {
    fontFamily: typography.extrabold,
    color: colors.navy,
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 12,
  },
  menuButtonText: {
    fontFamily: typography.semibold,
    color: colors.ink,
    fontSize: 14,
  },
});
