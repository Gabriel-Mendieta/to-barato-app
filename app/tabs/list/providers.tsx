// app/tabs/list/providers.tsx

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StatusBar,
  Platform,
  StyleSheet,
  Linking,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  type BottomSheetModalMethods,
  BottomSheetTextInput,
  BottomSheetView,
} from '@/src/shared/ui/BottomSheetCompat';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons as Icon } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors, radii, spacing, typography } from '@/src/shared/theme';
import { EmptyState, Skeleton, showToast, triggerHaptic } from '@/src/shared/ui';
import { useTranslation } from 'react-i18next';
import { useAddListItem, useCreateList } from '@/src/features/lists/hooks';
import { useProductsByProvider } from '@/src/features/products/hooks';
import { useNearbyBranches, useProviderTypes, useProviders } from '@/src/features/providers/hooks';
import {
  acquireSingleFlight,
  parseIncomingProducts,
  type ProviderSelectionProduct,
} from '@/src/features/providers/screenSelectors';
import { getUserId, type NearbyBranchDTO, type ProviderDTO } from '@/src/shared/api';

export default function SelectProviderScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ items?: string | string[] }>();
  const products = useMemo<ProviderSelectionProduct[]>(
    () => parseIncomingProducts(params.items),
    [params.items],
  );

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [selectedSucursal, setSelectedSucursal] = useState<NearbyBranchDTO | null>(null);

  const [listaName, setListaName] = useState('');
  const [createdListId, setCreatedListId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [isSavingLocally, setIsSavingLocally] = useState(false);
  const nameSheetRef = useRef<BottomSheetModalMethods>(null);
  const saveInFlightRef = useRef(false);

  const fetchLocation = useCallback(async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast(
          'error',
          t('providers.locationPermission'),
          t('providers.locationPermissionBody'),
        );
        setLoadingLocation(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch {
      showToast(
        'error',
        t('providers.locationUnavailable'),
        t('providers.locationUnavailableBody'),
      );
    } finally {
      setLoadingLocation(false);
    }
  }, [t]);

  const nearbyPayload = useMemo(() => {
    if (!location || products.length === 0) return null;
    return {
      lat: location.latitude,
      lng: location.longitude,
      ids_productos: products.map((product) => product.IdProducto),
      lista_cantidad: products.map((product) => product.Cantidad),
    };
  }, [location, products]);
  const nearbyQuery = useNearbyBranches(nearbyPayload);
  const providersQuery = useProviders();
  const providerTypesQuery = useProviderTypes();
  const selectedProviderId = selectedSucursal?.IdProveedor ?? null;
  const providerProductsQuery = useProductsByProvider(selectedProviderId);
  const createListMutation = useCreateList();
  const addListItemMutation = useAddListItem();

  const sucursales = nearbyQuery.data ?? [];
  const proveedoresMap = useMemo(
    () =>
      Object.fromEntries(
        (providersQuery.data ?? []).map((provider) => [provider.IdProveedor, provider]),
      ) as Record<number, ProviderDTO>,
    [providersQuery.data],
  );
  const providerTypesMap = useMemo(
    () =>
      Object.fromEntries(
        (providerTypesQuery.data ?? []).map((type) => [
          type.IdTipoProveedor,
          type.NombreTipoProveedor,
        ]),
      ) as Record<number, string>,
    [providerTypesQuery.data],
  );
  const pricesMap = useMemo(
    () =>
      Object.fromEntries(
        (providerProductsQuery.data ?? []).map((product) => [
          product.IdProducto,
          Number(product.PrecioOferta ?? product.Precio),
        ]),
      ) as Record<number, number>,
    [providerProductsQuery.data],
  );
  const isSaving = isSavingLocally || createListMutation.isPending || addListItemMutation.isPending;

  useFocusEffect(
    useCallback(() => {
      // Este efecto solo solicita ubicación al enfocar la pantalla y limpia
      // la selección local; las respuestas remotas las gestiona React Query.
      setLocation(null);
      setSelectedSucursal(null);
      setListaName('');
      setCreatedListId(null);
      setSaveError(false);
      void fetchLocation();
    }, [fetchLocation]),
  );

  // 7) Navegación nativa
  const openNavigation = (lat: number, lng: number, label: string) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(label)}@${lat},${lng}`,
      android: `google.navigation:q=${lat},${lng}`,
    });
    url && Linking.openURL(url);
  };

  const handleGuardarLista = async () => {
    if (!selectedSucursal) return;
    const branchTotal = Number(selectedSucursal.Precio);
    if (!Number.isFinite(branchTotal) || branchTotal <= 0) {
      setSaveError(true);
      showToast('error', t('providers.saveFailed'), t('search.retry'));
      return;
    }
    if (providerProductsQuery.isPending) {
      showToast('info', t('providers.searchingBranches'));
      return;
    }
    if (providerProductsQuery.isError) {
      setSaveError(true);
      showToast('error', t('providers.saveFailed'), t('search.retry'));
      return;
    }

    const provInfo = proveedoresMap[selectedSucursal.IdProveedor];
    if (!provInfo) {
      showToast(
        'error',
        t('providers.providerUnavailable'),
        t('providers.providerUnavailableBody'),
      );
      return;
    }

    if (!acquireSingleFlight(saveInFlightRef)) return;
    setIsSavingLocally(true);
    setSaveError(false);
    const listName = listaName.trim();
    let createdListIdForAttempt: number | null = createdListId;
    try {
      const stored = await getUserId();
      const userId = stored ? Number(stored) : NaN;
      if (!Number.isInteger(userId) || userId <= 0) {
        showToast('error', t('providers.saveSession'), t('providers.saveSessionBody'));
        return;
      }

      let nuevaListaId = createdListIdForAttempt;
      if (nuevaListaId == null) {
        const payloadLista = {
          IdUsuario: userId,
          IdProveedor: selectedSucursal.IdProveedor,
          Nombre: listName,
          PrecioTotal: branchTotal.toFixed(2),
        };
        const lista = await createListMutation.mutateAsync(payloadLista);
        nuevaListaId = Number(lista.IdLista);
        if (!Number.isInteger(nuevaListaId) || nuevaListaId <= 0) {
          throw new Error('No devolvió IdLista');
        }
        createdListIdForAttempt = nuevaListaId;
        setCreatedListId(nuevaListaId);
      }

      for (const prod of products) {
        const precioActual = pricesMap[prod.IdProducto];
        if (!Number.isFinite(precioActual) || precioActual <= 0) {
          throw new Error(`Precio inválido para ${prod.IdProducto}`);
        }

        await addListItemMutation.mutateAsync({
          IdLista: nuevaListaId,
          IdProducto: prod.IdProducto,
          PrecioActual: precioActual.toFixed(2),
          Cantidad: prod.Cantidad,
        });
      }

      nameSheetRef.current?.dismiss();
      router.replace('../../tabs/lista');
    } catch (error) {
      setSaveError(true);
      void triggerHaptic('error');
      showToast(
        'error',
        createdListIdForAttempt ? t('providers.partialSaveFailed') : t('providers.saveFailed'),
        createdListIdForAttempt ? t('providers.partialSaveFailedBody') : t('search.retry'),
      );
      console.warn('[Providers] Error guardando lista', error);
    } finally {
      saveInFlightRef.current = false;
      setIsSavingLocally(false);
    }
  };

  const retryNearby = () => {
    if (nearbyPayload) void nearbyQuery.refetch();
    else void fetchLocation();
  };

  const branchError = nearbyQuery.isError;
  if (loadingLocation || (nearbyPayload != null && nearbyQuery.isPending)) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingList}>
          {[0, 1, 2].map((item) => (
            <View key={item} style={styles.loadingCard}>
              <Skeleton width={100} height={50} borderRadius={10} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton width="70%" height={16} />
                <Skeleton width="48%" height={12} />
              </View>
            </View>
          ))}
          <Text style={{ marginTop: 8 }}>{t('providers.searchingBranches')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (branchError) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <EmptyState
          icon="cloud-offline-outline"
          title={t('providers.branchesFailed')}
          description={t('search.retry')}
          actionLabel={t('search.retry')}
          onAction={retryNearby}
        />
      </SafeAreaView>
    );
  }

  if (sucursales.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <EmptyState
          icon="location-outline"
          title={t('providers.nearbyBranches')}
          description={
            products.length === 0
              ? t('providers.invalidProductsBody')
              : t('providers.nearbyBranchesBody')
          }
          actionLabel={t('search.retry')}
          onAction={retryNearby}
        />
      </SafeAreaView>
    );
  }

  // 9) Renderizado
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('../../tabs/list/add')}>
          <Icon name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('providers.chooseBranch')}</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* LISTA DE SUCURSALES */}
      <FlatList
        data={sucursales}
        keyExtractor={(i) => i.IdSucursal.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        renderItem={({ item }) => {
          const prov = proveedoresMap[item.IdProveedor];
          const active = selectedSucursal?.IdSucursal === item.IdSucursal;
          const providerType = prov?.IdTipoProveedor
            ? providerTypesMap[prov.IdTipoProveedor]
            : undefined;
          return (
            <TouchableOpacity
              style={[styles.card, active && styles.cardActive]}
              onPress={() => {
                void triggerHaptic('selection');
                setSelectedSucursal(item);
                setSaveError(false);
                setCreatedListId(null);
              }}
              accessibilityRole="button"
              accessibilityLabel={prov?.Nombre ?? t('providers.provider')}
            >
              {prov?.UrlLogo ? (
                <Image source={{ uri: prov.UrlLogo }} style={styles.logo} resizeMode="contain" />
              ) : (
                <View style={[styles.logo, { backgroundColor: '#eee' }]} />
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.provName}>
                  {prov?.Nombre || t('providers.providerUnavailable')}
                </Text>
                {providerType ? <Text style={styles.providerType}>{providerType}</Text> : null}
                <Text style={styles.sucursalName}>{item.NombreSucursal}</Text>
                <Text style={styles.provTotal}>
                  {t('providers.total')}: RD${Number(item.Precio).toFixed(2)}
                </Text>
                <Text style={styles.distancia}>
                  {t('providers.distance', { distance: Number(item.Distancia).toFixed(2) })}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* FOOTER */}
      <View style={styles.footer}>
        {saveError ? (
          <Text testID="providers-save-error" style={styles.saveError}>
            {createdListId ? t('providers.partialSaveFailedBody') : t('providers.saveFailed')}
          </Text>
        ) : null}
        <TouchableOpacity
          style={[styles.btn, !selectedSucursal && styles.btnDisabled]}
          onPress={() => {
            if (!selectedSucursal) return;
            openNavigation(
              Number(selectedSucursal.Latitud),
              Number(selectedSucursal.Longitud),
              proveedoresMap[selectedSucursal.IdProveedor]?.Nombre || '',
            );
          }}
          disabled={!selectedSucursal || isSaving}
        >
          <Text style={styles.btnText}>{t('providers.nearest')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnRecipe, (!selectedSucursal || isSaving) && styles.btnDisabled]}
          onPress={() => {
            void triggerHaptic('selection');
            requestAnimationFrame(() => nameSheetRef.current?.present());
          }}
          disabled={!selectedSucursal || isSaving}
        >
          <Text style={styles.btnTextDark}>
            {isSaving ? t('providers.saving') : t('providers.saveList')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODAL PARA NOMBRE DE LISTA */}
      <BottomSheetModal
        ref={nameSheetRef}
        index={0}
        snapPoints={['36%']}
        enablePanDownToClose
        onDismiss={() => undefined}
        keyboardBehavior="interactive"
        backdropComponent={(props: Record<string, unknown>) => (
          <BottomSheetBackdrop {...props} pressBehavior="close" />
        )}
        backgroundStyle={{ backgroundColor: colors.card }}
      >
        <BottomSheetView style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{t('providers.listName')}</Text>
          <BottomSheetTextInput
            value={listaName}
            onChangeText={setListaName}
            placeholder={t('providers.listNamePlaceholder')}
            placeholderTextColor={colors.muted}
            style={styles.modalInput}
            autoFocus
            editable={!isSaving}
          />
          <View style={styles.modalButtonsRow}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#DDD' }]}
              onPress={() => nameSheetRef.current?.dismiss()}
              disabled={isSaving}
            >
              <Text style={[styles.modalButtonText, { color: '#333' }]}>{t('shared.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: colors.navy },
                (listaName.trim().length === 0 || isSaving) && styles.btnDisabled,
              ]}
              onPress={() => {
                if (!listaName.trim()) {
                  void triggerHaptic('error');
                  showToast('error', t('providers.requiredName'), t('providers.requiredNameBody'));
                  return;
                }
                if (isSaving) return;
                void triggerHaptic('success');
                handleGuardarLista();
              }}
              disabled={listaName.trim().length === 0 || isSaving}
            >
              <Text style={[styles.modalButtonText, { color: '#FFF' }]}>
                {isSaving ? t('providers.saving') : t('providers.save')}
              </Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

////////////////////////////////////////////////////////////////////////////////
// ESTILOS
////////////////////////////////////////////////////////////////////////////////
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  loadingList: {
    width: '100%',
    padding: spacing.lg,
    gap: spacing.md,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.navy,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerTitle: { color: colors.white, fontSize: 20, fontFamily: typography.medium },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
  },
  cardActive: { borderColor: colors.orange, borderWidth: 2 },

  logo: { width: 100, height: 50 },
  provName: { fontSize: 18, fontWeight: '600' },
  providerType: { fontSize: 12, color: '#777', marginTop: 2 },
  sucursalName: { fontSize: 14, color: '#555', marginTop: 2 },
  provTotal: { fontSize: 16, color: '#555', marginTop: 4 },
  distancia: { fontSize: 12, color: '#999', marginTop: 2 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  saveError: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: '100%',
    paddingBottom: 6,
    color: '#B42318',
    fontSize: 12,
    textAlign: 'center',
  },

  btn: {
    flex: 1,
    backgroundColor: colors.navy,
    paddingVertical: spacing.md,
    borderRadius: radii.sm,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  btnRecipe: {
    flex: 1,
    backgroundColor: colors.orange,
    paddingVertical: spacing.md,
    borderRadius: radii.sm,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },

  btnText: { color: colors.white, fontSize: 16, fontFamily: typography.semibold },
  btnTextDark: { color: colors.white, fontSize: 16, fontFamily: typography.semibold },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginLeft: 12,
  },
  modalButtonText: { fontSize: 16, fontWeight: '600' },
});
