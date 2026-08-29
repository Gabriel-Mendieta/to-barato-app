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
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetModalMethods,
} from '@/src/shared/ui/BottomSheetCompat';
import * as Location from 'expo-location';
import { getAccessToken, getUserId, type ListDTO } from '@/src/shared/api';
import { items as getListItems, route as generateListsRoute } from '@/src/features/lists/api';
import {
  useCreateList,
  useDeleteList,
  useListItemCounts,
  useLists,
} from '@/src/features/lists/hooks';
import { calculateListProgress, calculateListSummary } from '@/src/features/lists/screenSelectors';
import { detail as getProduct, units as getUnits } from '@/src/features/products/api';
import {
  byId as getProvider,
  types as getProviderTypes,
  nearby,
} from '@/src/features/providers/api';
import { useProviders } from '@/src/features/providers/hooks';
import { ShoppingListCard } from '@/src/features/lists/ShoppingListCard';
import {
  Screen,
  Stagger,
  CreateListButton,
  FadeInUp,
  FLOATING_TAB_BAR_CLEARANCE,
  CreateListModal,
  type CreateListPayload,
  EmptyState,
  Skeleton,
  showToast,
  triggerHaptic,
} from '@/src/shared/ui';
import { radii, spacing, typography, useThemeColors } from '@/src/shared/theme';
import { useTranslation } from 'react-i18next';

function formatMoney(value: number) {
  const whole = Math.floor(value);
  const cents = Math.round((value - whole) * 100);
  return {
    whole: whole.toLocaleString('es-DO'),
    cents: cents.toString().padStart(2, '0'),
  };
}

function parseUserId(value: string | null): number | null {
  if (!value?.trim()) return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export default function ShoppingListScreen() {
  const { t } = useTranslation();
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLists, setSelectedLists] = useState<Set<number>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [menuList, setMenuList] = useState<ListDTO | null>(null);
  const menuSheetRef = React.useRef<BottomSheetModalMethods>(null);

  const sessionQuery = useQuery({
    queryKey: ['session', 'user-id'],
    queryFn: async () => {
      const [token, storedUserId] = await Promise.all([getAccessToken(), getUserId()]);
      return token && parseUserId(storedUserId) ? parseUserId(storedUserId) : null;
    },
    staleTime: Infinity,
  });
  const userId = sessionQuery.data ?? null;
  const listsQuery = useLists(userId);
  const providersQuery = useProviders();
  const listas = useMemo(() => listsQuery.data ?? [], [listsQuery.data]);
  const refetchLists = listsQuery.refetch;
  const listIds = useMemo(() => listas.map((lista) => lista.IdLista), [listas]);
  const itemQueries = useListItemCounts(listIds);
  const itemCounts = useMemo(
    () =>
      Object.fromEntries(
        listIds.map((listId, index) => [listId, itemQueries[index]?.data?.length ?? 0]),
      ) as Record<number, number>,
    [itemQueries, listIds],
  );
  const createListMutation = useCreateList();
  const deleteListMutation = useDeleteList(userId);

  useEffect(() => {
    if (!sessionQuery.isSuccess && !sessionQuery.isError) return;
    if (!userId) router.replace('/auth/IniciarSesion');
  }, [sessionQuery.isError, sessionQuery.isSuccess, userId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchLists();
      await Promise.all(itemQueries.map((query) => query.refetch()));
    } finally {
      setRefreshing(false);
    }
  }, [itemQueries, refetchLists]);

  const loading =
    sessionQuery.isPending ||
    (userId != null && listsQuery.isPending) ||
    itemQueries.some((query) => query.isPending);
  const listError = listsQuery.isError || itemQueries.some((query) => query.isError);
  const retryLists = useCallback(() => {
    void Promise.all([refetchLists(), ...itemQueries.map((query) => query.refetch())]);
  }, [itemQueries, refetchLists]);

  const isSelecting = selectedLists.size > 0;
  const toggleSelection = (id: number) => {
    setSelectedLists((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const summary = useMemo(() => calculateListSummary(listas, itemCounts), [itemCounts, listas]);
  const { budgetTotal, totalItems, totalDone, budgetPct, savings } = summary;
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

      const rutas = await generateListsRoute(provIds);

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

  const shareList = async (lista: ListDTO) => {
    try {
      const prodsEnLista = await getListItems(lista.IdLista);

      const detalles = await Promise.all(
        prodsEnLista.map(async (pl) => {
          const product = await getProduct(pl.IdProducto);
          return {
            ...pl,
            Nombre: product.Nombre,
            IdUnidadMedida: product.IdUnidadMedida,
          };
        }),
      );

      const unidadesMap = Object.fromEntries(
        (await getUnits()).map((u) => [u.IdUnidadMedida, u.NombreUnidadMedida]),
      );

      const prov = await getProvider(lista.IdProveedor);
      const tipo = (await getProviderTypes()).find(
        (t) => t.IdTipoProveedor === prov.IdTipoProveedor,
      );

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
        const found = (await nearby(body)).find((b) => b.IdProveedor === lista.IdProveedor);
        if (found) sucursalNombre = found.NombreSucursal;
      }

      let message = `Tipo Proveedor: ${tipo?.NombreTipoProveedor ?? '–'}\n`;
      message += `Nombre del Proveedor: ${prov.Nombre}\n`;
      message += `Nombre Sucursal: ${sucursalNombre}\n\n`;
      message += `Productos:\n`;
      detalles.forEach((d) => {
        const unidad = d.IdUnidadMedida != null ? (unidadesMap[d.IdUnidadMedida] ?? '') : '';
        message += `• ${d.Nombre} x${d.Cantidad} ${unidad} RD$${Number(d.PrecioActual).toFixed(2)}\n`;
      });
      message += `\nPrecio total: RD$${Number(lista.PrecioTotal).toFixed(2)}`;

      await Share.share({ message });
    } catch {
      showToast('error', t('lists.shareFailed'), t('lists.tryAgain'));
    }
  };

  const confirmDelete = (lista: ListDTO) => {
    void triggerHaptic('warning');
    Alert.alert(t('lists.deleteList'), t('lists.deleteConfirmation'), [
      { text: t('lists.cancel'), style: 'cancel' },
      {
        text: t('lists.delete'),
        style: 'destructive',
        onPress: () => {
          if (deleteListMutation.isPending) return;
          deleteListMutation.mutate(lista.IdLista, {
            onSuccess: () => {
              setSelectedLists((previous) => {
                if (!previous.has(lista.IdLista)) return previous;
                const next = new Set(previous);
                next.delete(lista.IdLista);
                return next;
              });
              void triggerHaptic('success');
              showToast('success', t('lists.listDeleted'));
            },
            onError: () => {
              void triggerHaptic('error');
              showToast('error', t('lists.deleteFailed'), t('lists.tryAgain'));
            },
          });
        },
      },
    ]);
  };

  const openMenu = (lista: ListDTO) => {
    void triggerHaptic('selection');
    setMenuList(lista);
    requestAnimationFrame(() => menuSheetRef.current?.present());
  };

  const openList = (item: ListDTO) => {
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
  const createDisabled = createListMutation.isPending;
  const showUpcomingNotification = () => {
    showToast('info', t('auth.login.comingSoon'), t('lists.notificationsUnavailable'));
  };

  const onConfirmCreate = async ({ tipo, nombre }: CreateListPayload) => {
    if (createListMutation.isPending) return;
    if (!userId) {
      showToast('error', t('lists.sessionExpired'), t('lists.sessionExpiredBody'));
      return;
    }

    try {
      const proveedores = providersQuery.data ?? (await providersQuery.refetch()).data ?? [];
      const match = proveedores.find((p) => p.IdTipoProveedor === tipo.IdTipoProveedor);
      const idProveedor = match?.IdProveedor ?? proveedores[0]?.IdProveedor;
      if (!idProveedor) {
        showToast('error', t('lists.noProviders'), t('lists.noProvidersBody'));
        return;
      }

      const trimmedName = nombre.trim();
      const lista = await createListMutation.mutateAsync({
        IdUsuario: userId,
        IdProveedor: idProveedor,
        Nombre: trimmedName,
        PrecioTotal: '0.00',
      });
      const listaId = Number(lista.IdLista);
      if (!Number.isInteger(listaId) || listaId <= 0) {
        throw new Error('Sin IdLista');
      }

      setCreateOpen(false);
      void triggerHaptic('success');
      router.push({
        pathname: '/tabs/list/add',
        params: {
          listaId: String(listaId),
          tipo: String(tipo.IdTipoProveedor),
          nombre: trimmedName,
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
        <View style={styles.loadingSkeletons} testID="lists-loading-state">
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

  if (listError) {
    return (
      <Screen edges={['top']}>
        <View testID="lists-error-state">
          <EmptyState
            icon="cloud-offline-outline"
            title={t('search.productsFailed')}
            description={t('lists.tryAgain')}
            actionLabel={t('shared.retry')}
            onAction={retryLists}
          />
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
          width: '100%',
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
                <Ionicons name="chevron-back" size={22} color={themeColors.navy} />
              </Pressable>
              <Text style={styles.title} numberOfLines={1}>
                {t('lists.title')}
              </Text>
              <Pressable
                onPress={showUpcomingNotification}
                style={styles.headerBtn}
                accessibilityRole="button"
                accessibilityLabel={t('lists.notifications')}
                hitSlop={8}
              >
                <Ionicons name="notifications-outline" size={20} color={themeColors.navy} />
              </Pressable>
            </View>

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
          <View testID="lists-empty-state">
            <EmptyState
              icon="cart-outline"
              title={t('lists.noLists')}
              description={t('lists.noListsBody')}
              actionLabel={t('lists.newList')}
              onAction={goCreate}
            />
          </View>
        }
        renderItem={({ item, index }) => {
          const count = itemCounts[item.IdLista] || 0;
          const progress = calculateListProgress(item.IdLista, count);
          const selected = selectedLists.has(item.IdLista);

          return (
            <FadeInUp index={index + 2} step={55} delay={40} style={styles.cardWrap}>
              <ShoppingListCard
                item={item}
                index={index}
                count={count}
                selected={selected}
                articleLabel={t(count === 1 ? 'lists.articles_one' : 'lists.articles_other', {
                  count,
                })}
                purchasedLabel={
                  progress.done > 0 ? t('lists.purchased', { count: progress.done }) : null
                }
                listOptionsLabel={t('lists.listOptions')}
                onPress={() => openList(item)}
                onLongPress={() => toggleSelection(item.IdLista)}
                onMenu={() => openMenu(item)}
              />
            </FadeInUp>
          );
        }}
        ListFooterComponent={
          listas.length > 0 ? (
            <View style={styles.listFooter}>
              <CreateListButton
                label={t('lists.newList')}
                onPress={goCreate}
                disabled={createDisabled}
              />
            </View>
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
            <Ionicons name="navigate" size={18} color={themeColors.white} />
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
        backgroundStyle={{ backgroundColor: themeColors.card }}
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
            <Ionicons name="share-outline" size={20} color={themeColors.navy} />
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
            <Ionicons name="checkmark-circle-outline" size={20} color={themeColors.navy} />
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
            <Ionicons name="trash-outline" size={20} color={themeColors.red} />
            <Text style={[styles.menuButtonText, { color: themeColors.red }]}>
              {t('lists.delete')}
            </Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    </Screen>
  );
}

function createStyles(themeColors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: 10,
      gap: 8,
    },
    headerBtn: {
      width: 50,
      height: 50,
      borderRadius: 16,
      backgroundColor: themeColors.card,
      borderWidth: 1,
      borderColor: themeColors.line,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: themeColors.navy,
          shadowOpacity: 0.05,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
        },
        android: { elevation: 1 },
        default: {},
      }),
    },
    title: {
      flex: 1,
      textAlign: 'center',
      fontFamily: typography.extrabold,
      fontSize: 20,
      color: themeColors.navy,
      letterSpacing: -0.2,
    },

    notifSheet: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      backgroundColor: themeColors.card,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: themeColors.line,
      padding: 14,
    },
    notifTitle: {
      fontFamily: typography.extrabold,
      fontSize: 15,
      color: themeColors.navy,
      marginBottom: 4,
    },
    notifBody: {
      fontFamily: typography.medium,
      fontSize: 12,
      color: themeColors.muted,
      lineHeight: 18,
    },

    budgetPad: {
      paddingHorizontal: spacing.lg,
      paddingTop: 4,
      paddingBottom: 8,
    },
    budgetCard: {
      backgroundColor: themeColors.orangeSoft,
      borderWidth: 1,
      borderColor: themeColors.orange,
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
      color: themeColors.orangeDeep,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    budgetValue: {
      fontSize: 26,
      fontFamily: typography.extrabold,
      color: themeColors.navy,
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
      color: themeColors.orangeDeep,
    },
    budgetSideValue: {
      fontSize: 17,
      fontFamily: typography.extrabold,
      color: themeColors.green,
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
      backgroundColor: themeColors.card,
      borderRadius: radii.pill,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: themeColors.orange,
      borderRadius: radii.pill,
    },
    progressMeta: {
      fontSize: 11,
      fontFamily: typography.extrabold,
      color: themeColors.orangeDeep,
      minWidth: 30,
      textAlign: 'right',
    },

    selectHint: {
      fontFamily: typography.medium,
      fontSize: 12,
      color: themeColors.muted,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.lg,
    },

    cardWrap: {
      width: '100%',
      alignSelf: 'stretch',
      marginBottom: 14,
      paddingHorizontal: spacing.lg,
      ...Platform.select({
        web: { boxSizing: 'border-box' },
        default: {},
      }),
    },
    listFooter: {
      width: '100%',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      ...Platform.select({
        web: { boxSizing: 'border-box' },
        default: {},
      }),
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
      backgroundColor: themeColors.blueSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    emptyTitle: {
      fontFamily: typography.extrabold,
      fontSize: 18,
      color: themeColors.navy,
      marginBottom: 6,
    },
    emptyBody: {
      fontFamily: typography.medium,
      fontSize: 13,
      color: themeColors.muted,
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
      backgroundColor: themeColors.orange,
      borderRadius: radii.lg,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    routeBtnText: {
      color: themeColors.white,
      fontFamily: typography.bold,
      fontSize: 15,
    },
    routeCancel: { alignItems: 'center', paddingVertical: 4 },
    routeCancelText: {
      fontFamily: typography.semibold,
      fontSize: 13,
      color: themeColors.muted,
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
      backgroundColor: themeColors.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: themeColors.line,
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
      color: themeColors.navy,
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
      color: themeColors.ink,
      fontSize: 14,
    },
  });
}
