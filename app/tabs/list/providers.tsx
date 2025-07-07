// app/tabs/list/providers.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    StatusBar,
    Platform,
    StyleSheet,
    Linking,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

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

    const [showNameModal, setShowNameModal] = useState(false);
    const [listaName, setListaName] = useState('');

    // 3) Función para pedir ubicación
    const fetchLocation = useCallback(async () => {
        setLoadingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Sin permiso', 'Necesitamos tu ubicación para buscar sucursales.');
                setLoadingLocation(false);
                return;
            }
            const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        } catch (err) {
            console.error('[Providers] Ubicación:', err);
            Alert.alert('Error', 'No pudimos obtener la ubicación.');
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
                const ids_productos = products.map(p => p.IdProducto);
                const lista_cantidad = products.map(p => p.Cantidad);

                const body = {
                    lat: location.latitude,
                    lng: location.longitude,
                    ids_productos,
                    lista_cantidad,
                };

                console.log('[Providers] POST /sucursal-cercana body:', body);
                const resp = await axios.post<SucursalCercana[]>(
                    'https://tobarato-api.alirizvi.dev/api/sucursal-cercana',
                    body
                );
                setSucursales(resp.data);
            } catch (err: any) {
                console.error('[Providers] sucursal-cercana:', err);
                Alert.alert('Error', 'No pudimos cargar las sucursales.');
            } finally {
                setLoadingSucursales(false);
            }
        };
        load();
    }, [location]);

    // 5) Cuando llegan sucursales, cargamos info de cada proveedor
    useEffect(() => {
        sucursales.forEach(s => {
            const id = s.IdProveedor;
            if (!proveedoresMap[id]) {
                axios
                    .get<ProveedorInfo>(`https://tobarato-api.alirizvi.dev/api/proveedor/${id}`)
                    .then(({ data }) =>
                        setProveedoresMap(m => ({ ...m, [id]: data }))
                    )
                    .catch(e => console.warn(`[Providers] proveedor ${id}:`, e));
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
        }, [fetchLocation])
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
            Alert.alert('Error', 'Proveedor no cargado aún.');
            return;
        }

        // obtenemos userId
        const stored = await SecureStore.getItemAsync('user_id');
        const userId = stored ? Number(stored) : null;
        if (!userId) {
            Alert.alert('Error', 'Inicia sesión de nuevo.');
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
            const respLista = await axios.post(
                'https://tobarato-api.alirizvi.dev/api/lista',
                payloadLista
            );
            const nuevaListaId = respLista.data.IdLista;
            if (!nuevaListaId) throw new Error('No devolvió IdLista');

            // 8.2) Para cada producto, creamos listaproducto usando la cantidad
            for (const prod of products) {
                // obtenemos precio actual
                const rPrecio = await axios.get<ProductoProveedorResponse>(
                    `https://tobarato-api.alirizvi.dev/api/productos/${prod.IdProducto}/proveedores/${selectedSucursal.IdProveedor}`
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
                await axios.post(
                    'https://tobarato-api.alirizvi.dev/api/listaproducto',
                    payloadLP
                );
            }

            router.replace('../../tabs/lista');
        } catch (err: any) {
            console.error('[Providers] guardando lista:', err);
            Alert.alert('Error', 'No se pudo guardar la lista.');
        }
    };

    // 9) Renderizado
    if (loadingLocation || loadingSucursales) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#33618D" />
                <Text style={{ marginTop: 8 }}>Buscando sucursales…</Text>
            </SafeAreaView>
        );
    }

    if (sucursales.length === 0) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <Text>No se encontraron sucursales cercanas.</Text>
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
                keyExtractor={i => i.IdProveedor.toString()}
                contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
                renderItem={({ item }) => {
                    const prov = proveedoresMap[item.IdProveedor];
                    const active = selectedSucursal?.IdProveedor === item.IdProveedor;
                    return (
                        <TouchableOpacity
                            style={[styles.card, active && styles.cardActive]}
                            onPress={() => setSelectedSucursal(item)}
                        >
                            {prov ? (
                                <Image
                                    source={{ uri: prov.UrlLogo }}
                                    style={styles.logo}
                                    resizeMode="contain"
                                />
                            ) : (
                                <View style={[styles.logo, { backgroundColor: '#eee' }]} />
                            )}
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.provName}>{prov?.Nombre || 'Cargando…'}</Text>
                                <Text style={styles.sucursalName}>{item.NombreSucursal}</Text>
                                <Text style={styles.provTotal}>
                                    Total: RD${item.Precio.toFixed(2)}
                                </Text>
                                <Text style={styles.distancia}>
                                    {item.Distancia.toFixed(2)} km
                                </Text>
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
                            proveedoresMap[selectedSucursal.IdProveedor]?.Nombre || ''
                        );
                    }}
                    disabled={!selectedSucursal}
                >
                    <Text style={styles.btnText}>Ir al más cercano</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.btnRecipe, !selectedSucursal && styles.btnDisabled]}
                    onPress={() => setShowNameModal(true)}
                    disabled={!selectedSucursal}
                >
                    <Text style={styles.btnTextDark}>Guardar Lista</Text>
                </TouchableOpacity>
            </View>

            {/* MODAL PARA NOMBRE DE LISTA */}
            <Modal
                visible={showNameModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowNameModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Nombre de tu lista</Text>
                        <TextInput
                            value={listaName}
                            onChangeText={setListaName}
                            placeholder="Ej. 'Compras semanales'"
                            style={styles.modalInput}
                            autoFocus
                        />
                        <View style={styles.modalButtonsRow}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: '#DDD' }]}
                                onPress={() => setShowNameModal(false)}
                            >
                                <Text style={[styles.modalButtonText, { color: '#333' }]}>
                                    Cancelar
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    { backgroundColor: '#33618D' },
                                    listaName.trim().length === 0 && styles.btnDisabled,
                                ]}
                                onPress={() => {
                                    if (!listaName.trim()) {
                                        Alert.alert('Error', 'El nombre no puede quedar vacío.');
                                        return;
                                    }
                                    setShowNameModal(false);
                                    handleGuardarLista();
                                }}
                                disabled={listaName.trim().length === 0}
                            >
                                <Text style={[styles.modalButtonText, { color: '#FFF' }]}>
                                    Guardar
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

////////////////////////////////////////////////////////////////////////////////
// ESTILOS
////////////////////////////////////////////////////////////////////////////////
const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FF'
    },
    container: { flex: 1, backgroundColor: '#F8F9FF' },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#001D35',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 16,
        paddingBottom: 12, paddingHorizontal: 16,
    },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '500' },

    card: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 12, elevation: 2,
    },
    cardActive: { borderColor: '#F3732A', borderWidth: 2 },

    logo: { width: 100, height: 50 },
    provName: { fontSize: 18, fontWeight: '600' },
    sucursalName: { fontSize: 14, color: '#555', marginTop: 2 },
    provTotal: { fontSize: 16, color: '#555', marginTop: 4 },
    distancia: { fontSize: 12, color: '#999', marginTop: 2 },

    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff', padding: 16, flexDirection: 'row', justifyContent: 'space-between',
        borderTopWidth: 1, borderColor: '#E5E7EB',
    },

    btn: {
        flex: 1, backgroundColor: '#33618D', paddingVertical: 12,
        borderRadius: 8, marginHorizontal: 4, alignItems: 'center',
    },
    btnRecipe: {
        flex: 1, backgroundColor: '#F3732A', paddingVertical: 12,
        borderRadius: 8, marginHorizontal: 4, alignItems: 'center',
    },
    btnDisabled: { opacity: 0.6 },

    btnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    btnTextDark: { color: '#FFF', fontSize: 16, fontWeight: '600' },

    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center', alignItems: 'center',
    },
    modalContainer: {
        width: '85%', backgroundColor: '#FFF',
        borderRadius: 12, padding: 20, elevation: 5,
    },
    modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
    modalInput: {
        borderWidth: 1, borderColor: '#CCC',
        borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
        fontSize: 16, marginBottom: 16,
    },
    modalButtonsRow: {
        flexDirection: 'row', justifyContent: 'flex-end',
    },
    modalButton: {
        paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: 6, marginLeft: 12,
    },
    modalButtonText: { fontSize: 16, fontWeight: '600' },
});
