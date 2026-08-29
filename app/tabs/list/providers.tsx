// app/tabs/list/providers.tsx

import { api, endpoints } from '@/src/shared/api';
import React, { useState, useEffect, useCallback } from 'react';
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
import * as SecureStore from 'expo-secure-store';
import { colors, radii, spacing, typography } from '@/src/shared/theme';
import { EmptyState, Skeleton, showToast, triggerHaptic } from '@/src/shared/ui';

////////////////////////////////////////////////////////////////////////////////
// TIPOS
////////////////////////////////////////////////////////////////////////////////

// Ahora IncomingProduct incluye la cantidad seleccionada por el usuario
type IncomingProduct = {
  IdProducto: number;
  Nombre: string;
  UrlImagen: string;
  Cantidad: number;
};

type SucursalCercana = {
  NombreSucursal: string;
  Latitud: number | string;
  Longitud: number | string;
  IdProveedor: number;
  Precio: number;
  Distancia: number;
};

type ProveedorInfo = {
  IdProveedor: number;
  Nombre: string;
  UrlLogo: string;
};

type ProductoProveedorResponse = {
  IdProducto: number;
  IdProveedor: number;
  Precio: string;
  PrecioOferta?: string;
};

export default function SelectProviderScreen() {
  // 1) Deserializamos los productos + cantidades que vienen en params.items
  const params = useLocalSearchParams<{ items?: string }>();
  const raw = params.items ?? '[]';
  let products: IncomingProduct[] = [];
  try {
    products = JSON.parse(decodeURIComponent(raw));
  } catch {
    products = [];
  }

  // 2) Estados
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [sucursales, setSucursales] = useState<SucursalCercana[]>([]);
  const [loadingSucursales, setLoadingSucursales] = useState(false);

  const [proveedoresMap, setProveedoresMap] = useState<Record<number, ProveedorInfo>>({});
  const [selectedSucursal, setSelectedSucursal] = useState<SucursalCercana | null>(null);

  const [listaName, setListaName] = useState('');
  const nameSheetRef = React.useRef<BottomSheetModalMethods>(null);

  // 3) Función para pedir ubicación
  const fetchLocation = useCallback(async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('error', 'Sin permiso', 'Necesitamos tu ubicación para buscar sucursales.');
        setLoadingLocation(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch {
      showToast('error', 'Ubicación no disponible', 'No pudimos obtener tu ubicación.');
    } finally {
      setLoadingLocation(false);
    }
  }, []);

  // 4) Cuando location cambia, llamamos a sucursal-cercana
  useEffect(() => {
    if (!location) return;
    const load = async () => {
      setLoadingSucursales(true);
      try {
        // Preparamos los arrays de IDs y cantidades
        const ids_productos = products.map((p) => p.IdProducto);
        const lista_cantidad = products.map((p) => p.Cantidad);

        const body = {
          lat: location.latitude,
          lng: location.longitude,
          ids_productos,
          lista_cantidad,
        };

        console.log('[Providers] POST /sucursal-cercana body:', body);
        const resp = await api.post<SucursalCercana[]>(endpoints.sucursalCercana, body);
        setSucursales(resp.data);
      } catch {
        showToast('error', 'No se pudieron cargar sucursales', 'Intenta nuevamente.');
      } finally {
        setLoadingSucursales(false);
      }
    };
    load();
  }, [location]);

  // 5) Cuando llegan sucursales, cargamos info de cada proveedor
  useEffect(() => {
    sucursales.forEach((s) => {
      const id = s.IdProveedor;
      if (!proveedoresMap[id]) {
        api
          .get<ProveedorInfo>(endpoints.proveedorById(id))
          .then(({ data }) => setProveedoresMap((m) => ({ ...m, [id]: data })))
          .catch(() => undefined);
      }
    });
  }, [sucursales]);

  // 6) Cada vez que la pantalla recibe foco, reiniciamos todo
  useFocusEffect(
    useCallback(() => {
      setLocation(null);
      setSucursales([]);
      setProveedoresMap({});
      setSelectedSucursal(null);
      setListaName('');
      setLoadingSucursales(false);
      fetchLocation();
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

  // 8) Guardar lista + productos
  const handleGuardarLista = async () => {
    if (!selectedSucursal) return;
    const provInfo = proveedoresMap[selectedSucursal.IdProveedor];
    if (!provInfo) {
      showToast('error', 'Proveedor no disponible', 'Espera un momento e inténtalo de nuevo.');
      return;
    }

    // obtenemos userId
    const stored = await SecureStore.getItemAsync('user_id');
    const userId = stored ? Number(stored) : null;
    if (!userId) {
      showToast('error', 'Sesión expirada', 'Inicia sesión de nuevo.');
      return;
    }

    try {
      // 8.1) Creación de la lista
      const payloadLista = {
        IdUsuario: userId,
        IdProveedor: selectedSucursal.IdProveedor,
        Nombre: listaName.trim(),
        PrecioTotal: selectedSucursal.Precio,
      };
      console.log('[Providers] POST /lista:', payloadLista);
      const respLista = await api.post(endpoints.lista, payloadLista);
      const nuevaListaId = respLista.data.IdLista;
      if (!nuevaListaId) throw new Error('No devolvió IdLista');

      // 8.2) Para cada producto, creamos listaproducto usando la cantidad
      for (const prod of products) {
        // obtenemos precio actual
        const rPrecio = await api.get<ProductoProveedorResponse>(
          endpoints.productoProveedor(prod.IdProducto, selectedSucursal.IdProveedor),
        );
        const precioActual = Number(rPrecio.data.Precio);
        if (precioActual <= 0) {
          throw new Error(`Precio inválido para ${prod.IdProducto}`);
        }
        const payloadLP = {
          IdLista: nuevaListaId,
          IdProducto: prod.IdProducto,
          PrecioActual: precioActual,
          Cantidad: prod.Cantidad,
        };
        console.log('[Providers] POST /listaproducto:', payloadLP);
        await api.post(endpoints.listaProducto, payloadLP);
      }

      router.replace('../../tabs/lista');
    } catch {
      showToast('error', 'No se pudo guardar', 'Intenta nuevamente.');
    }
  };

  // 9) Renderizado
  if (loadingLocation || loadingSucursales) {
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
          <Text style={{ marginTop: 8 }}>Buscando sucursales…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (sucursales.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <EmptyState
          icon="location-outline"
          title="Sin sucursales cercanas"
          description="No encontramos proveedores para estos productos."
          actionLabel="Reintentar"
          onAction={fetchLocation}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('../../tabs/list/add')}>
          <Icon name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Elige Sucursal</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* LISTA DE SUCURSALES */}
      <FlatList
        data={sucursales}
        keyExtractor={(i) => i.IdProveedor.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        renderItem={({ item }) => {
          const prov = proveedoresMap[item.IdProveedor];
          const active = selectedSucursal?.IdProveedor === item.IdProveedor;
          return (
            <TouchableOpacity
              style={[styles.card, active && styles.cardActive]}
              onPress={() => {
                void triggerHaptic('selection');
                setSelectedSucursal(item);
              }}
            >
              {prov ? (
                <Image source={{ uri: prov.UrlLogo }} style={styles.logo} resizeMode="contain" />
              ) : (
                <View style={[styles.logo, { backgroundColor: '#eee' }]} />
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.provName}>{prov?.Nombre || 'Cargando…'}</Text>
                <Text style={styles.sucursalName}>{item.NombreSucursal}</Text>
                <Text style={styles.provTotal}>Total: RD${item.Precio.toFixed(2)}</Text>
                <Text style={styles.distancia}>{item.Distancia.toFixed(2)} km</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* FOOTER */}
      <View style={styles.footer}>
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
          disabled={!selectedSucursal}
        >
          <Text style={styles.btnText}>Ir al más cercano</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnRecipe, !selectedSucursal && styles.btnDisabled]}
          onPress={() => {
            void triggerHaptic('selection');
            requestAnimationFrame(() => nameSheetRef.current?.present());
          }}
          disabled={!selectedSucursal}
        >
          <Text style={styles.btnTextDark}>Guardar Lista</Text>
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
          <Text style={styles.modalTitle}>Nombre de tu lista</Text>
          <BottomSheetTextInput
            value={listaName}
            onChangeText={setListaName}
            placeholder="Ej. 'Compras semanales'"
            placeholderTextColor={colors.muted}
            style={styles.modalInput}
            autoFocus
          />
          <View style={styles.modalButtonsRow}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#DDD' }]}
              onPress={() => nameSheetRef.current?.dismiss()}
            >
              <Text style={[styles.modalButtonText, { color: '#333' }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: colors.navy },
                listaName.trim().length === 0 && styles.btnDisabled,
              ]}
              onPress={() => {
                if (!listaName.trim()) {
                  void triggerHaptic('error');
                  showToast('error', 'Nombre requerido', 'Escribe un nombre para la lista.');
                  return;
                }
                void triggerHaptic('success');
                nameSheetRef.current?.dismiss();
                handleGuardarLista();
              }}
              disabled={listaName.trim().length === 0}
            >
              <Text style={[styles.modalButtonText, { color: '#FFF' }]}>Guardar</Text>
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
