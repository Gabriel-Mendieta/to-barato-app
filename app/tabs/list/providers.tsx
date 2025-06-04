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

/**
 * Ahora `IncomingProduct` refleja exactamente lo que devuelve tu GET /producto.
 */
type IncomingProduct = {
    IdProducto: number;
    Nombre: string;
    UrlImagen: string;
    // (puedes agregar aquí otras propiedades que devuelva /producto, si las necesitas)
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

/**
 * Tipo para deserializar la respuesta de:
 *    GET /productos/{idProducto}/proveedores/{idProveedor}
 */
type ProductoProveedorResponse = {
    IdProducto: number;
    IdProveedor: number;
    Precio: string; // viene como cadena en el ejemplo
    PrecioOferta?: string; // (opcional)
    // ... otros campos que devuelva ese endpoint si los necesitas
};

export default function SelectProviderScreen() {
    // 1) Recuperamos los productos seleccionados (JSON) desde params
    const params = useLocalSearchParams<{ items?: string }>();
    const raw = params.items ?? '[]';
    let products: IncomingProduct[] = [];
    try {
        // Antes venían objetos con IdProducto, Nombre, UrlImagen, etc.
        products = JSON.parse(decodeURIComponent(raw));
    } catch {
        products = [];
    }

    // 2) Estados principales
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [loadingLocation, setLoadingLocation] = useState<boolean>(true);

    const [sucursalesCercanas, setSucursalesCercanas] = useState<SucursalCercana[]>([]);
    const [loadingSucursales, setLoadingSucursales] = useState<boolean>(false);

    const [proveedoresMap, setProveedoresMap] = useState<Record<number, ProveedorInfo>>({});
    const [selectedSucursal, setSelectedSucursal] = useState<SucursalCercana | null>(null);

    const [showNameModal, setShowNameModal] = useState<boolean>(false);
    const [listaName, setListaName] = useState<string>('');

    /**
     * Extraemos la lógica de “pedir permiso + obtener ubicación” a una función
     * para poder invocarla tanto al montar como cada vez que la pantalla reciba foco.
     */
    const fetchLocationAndSucursales = useCallback(async () => {
        //  A) Pedir permiso
        setLoadingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Sin permiso', 'La ubicación es necesaria para buscar sucursales.');
                setLoadingLocation(false);
                return;
            }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
            setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
            setLoadingLocation(false);
        } catch (err) {
            console.error('[Providers] Error pidiendo ubicación:', err);
            Alert.alert('Error', 'No se pudo obtener la ubicación.');
            setLoadingLocation(false);
        }
    }, []);

    /**
     * 3) Cada vez que “location” cambie (y no sea nula), invocamos POST /sucursal-cercana.
     */
    useEffect(() => {
        if (!location) return;

        const loadSucursales = async () => {
            setLoadingSucursales(true);
            try {
                console.log(
                    '[Providers] Productos recibidos en params:',
                    JSON.stringify(products, null, 2)
                );

                const ids_arr = products
                    .map((p) => {
                        const n = Number(p.IdProducto);
                        return isNaN(n) ? null : n;
                    })
                    .filter((x): x is number => x !== null);

                const body = {
                    lat: location.latitude,
                    lng: location.longitude,
                    ids_productos: ids_arr,
                };

                console.log(
                    '[Providers] Request a /sucursal-cercana → body =',
                    JSON.stringify(body, null, 2)
                );

                const resp = await axios.post<SucursalCercana[]>(
                    'https://tobarato-api.alirizvi.dev/api/sucursal-cercana',
                    body
                );
                setSucursalesCercanas(resp.data);
            } catch (error: any) {
                console.error('[Providers] Error al cargar sucursales cercanas:', error);
                if (error.response && error.response.data) {
                    console.log(
                        '[Providers] Detalle del 422:',
                        JSON.stringify(error.response.data, null, 2)
                    );
                }
                Alert.alert('Error', 'No se pudieron obtener las sucursales cercanas.');
            } finally {
                setLoadingSucursales(false);
            }
        };

        loadSucursales();
    }, [location]);

    /**
     * 4) Cada vez que “sucursalesCercanas” cambie, pedimos GET /proveedor/{IdProveedor}.
     */
    useEffect(() => {
        sucursalesCercanas.forEach(async (suc) => {
            const idP = suc.IdProveedor;
            if (!proveedoresMap[idP]) {
                try {
                    const respProv = await axios.get<ProveedorInfo>(
                        `https://tobarato-api.alirizvi.dev/api/proveedor/${idP}`
                    );
                    setProveedoresMap((prev) => ({
                        ...prev,
                        [idP]: respProv.data,
                    }));
                } catch (err) {
                    console.warn(`[Providers] No se pudo cargar proveedor ${idP}:`, err);
                }
            }
        });
    }, [sucursalesCercanas]);

    /**
     * 5) useFocusEffect: se dispara cada vez que la pantalla recibe foco.
     *    Aquí reiniciamos *todo* el estado relevante y relanzamos la obtención de la ubicación.
     */
    useFocusEffect(
        useCallback(() => {
            // Limpiar estados anteriores
            setLocation(null);
            setSucursalesCercanas([]);
            setProveedoresMap({});
            setSelectedSucursal(null);
            setListaName('');
            // Reiniciar banderas de carga
            setLoadingLocation(true);
            setLoadingSucursales(false);

            // Volver a solicitar ubicación (lo que disparará, a su vez, la carga de sucursales)
            fetchLocationAndSucursales();

            // Nota: no devolvemos cleanup porque queremos que el estado permanezca limpio
            //       hasta que la pantalla pierda foco de nuevo.
            return () => { };
        }, [fetchLocationAndSucursales])
    );

    /**
     * 6) Función para abrir la ruta en mapas nativo
     */
    const openNavigation = (lat: number, lng: number, label: string) => {
        const url = Platform.select({
            ios: `maps:0,0?q=${encodeURIComponent(label)}@${lat},${lng}`,
            android: `google.navigation:q=${lat},${lng}`,
        });
        if (url) Linking.openURL(url);
    };

    /**
     * 7) Guardar lista + listaproducto en el backend
     */
    const handleGuardarLista = async () => {
        if (!selectedSucursal) return;

        // 7.1) Verificamos que el proveedor esté cargado
        const provInfo = proveedoresMap[selectedSucursal.IdProveedor];
        if (!provInfo) {
            Alert.alert('Error', 'Aún no se cargó la información del proveedor.');
            return;
        }

        // 7.2) Leemos el userId desde SecureStore
        let userId: number | null = null;
        try {
            const storedId = await SecureStore.getItemAsync('user_id');
            if (storedId) userId = Number(storedId);
        } catch (e) {
            console.warn('[Providers] No se pudo leer user_id de SecureStore', e);
        }
        if (!userId) {
            Alert.alert('Error', 'No se encontró tu Id de usuario. Vuelve a iniciar sesión.');
            return;
        }

        try {
            // 7.3) POST /lista
            const payloadLista = {
                IdUsuario: userId,
                IdProveedor: selectedSucursal.IdProveedor,
                Nombre: listaName.trim(),
                PrecioTotal: selectedSucursal.Precio,
            };

            console.log('[Providers] POST /lista → payload =', JSON.stringify(payloadLista, null, 2));
            const respLista = await axios.post(
                'https://tobarato-api.alirizvi.dev/api/lista',
                payloadLista
            );

            // Espero que el backend responda con { IdLista: X, ... }
            const nuevaListaId = respLista.data.IdLista;
            console.log('[Providers] POST /lista respuesta → IdLista =', nuevaListaId);
            if (!nuevaListaId) {
                throw new Error('El servidor no devolvió IdLista');
            }

            // 7.4) POST /listaproducto por cada producto
            console.log(
                '[Providers] Voy a crear listaproducto para estos productos:',
                JSON.stringify(products, null, 2)
            );

            for (const prod of products) {
                console.log('Procesando producto:', prod);

                // 7.4.1) Obtenemos el precio real del producto para este proveedor
                let precioActual: number = 0;
                try {
                    const respPrecio = await axios.get<ProductoProveedorResponse>(
                        `https://tobarato-api.alirizvi.dev/api/productos/${prod.IdProducto}/proveedores/${selectedSucursal.IdProveedor}`
                    );
                    // La respuesta trae `Precio` como string; convertimos a número
                    precioActual = Number(respPrecio.data.Precio);
                } catch (errPrecio: any) {
                    console.warn(
                        `[Providers] No se pudo obtener precio para producto ${prod.IdProducto} en proveedor ${selectedSucursal.IdProveedor}:`,
                        errPrecio
                    );
                    // Si falla el GET de precio, lo dejamos en 0 y luego detectamos que es inválido
                }

                console.log('Precio obtenido:', precioActual);

                if (precioActual <= 0) {
                    // El backend exige precio > 0
                    Alert.alert(
                        'Error',
                        `No se encontró un precio válido para "${prod.Nombre}" en este proveedor.`
                    );
                    throw new Error(`Precio inválido para producto ${prod.IdProducto}`);
                }

                const payloadLP = {
                    IdLista: nuevaListaId,
                    IdProducto: prod.IdProducto,
                    PrecioActual: precioActual,
                    Cantidad: 1,
                };
                console.log('[Providers] POST /listaproducto → payload =', JSON.stringify(payloadLP, null, 2));

                await axios.post('https://tobarato-api.alirizvi.dev/api/listaproducto', payloadLP);
            }

            // 7.5) Al terminar, regresamos a “Mis Listas”
            router.replace('../../tabs/lista');
        } catch (error: any) {
            console.error('[Providers] Error guardando lista:', error);
            if (error.response && error.response.data) {
                console.log(
                    '[Providers] Detalle del error en guardar lista:',
                    JSON.stringify(error.response.data, null, 2)
                );
            }
            // Si fue un “precio inválido” que lanzamos nosotros, no re-Alertamos genérico
            if (!(error instanceof Error && error.message.startsWith('Precio inválido'))) {
                Alert.alert('Error', 'No se pudo guardar la lista. Intenta nuevamente.');
            }
        }
    };

    /**
     * 8) Render
     */
    if (loadingLocation || loadingSucursales) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#33618D" />
                <Text style={{ marginTop: 8 }}>Buscando sucursales…</Text>
            </SafeAreaView>
        );
    }

    if (sucursalesCercanas.length === 0) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <Text>No se encontraron sucursales cercanas.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#001D35" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('../../tabs/list/add')}>
                    <Icon name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Elige Proveedor / Sucursal</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* Listado de sucursales recibidas */}
            <FlatList
                data={sucursalesCercanas}
                keyExtractor={(item) => item.IdProveedor.toString()}
                contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
                renderItem={({ item }) => {
                    const provInfo = proveedoresMap[item.IdProveedor];
                    const isActive = selectedSucursal?.IdProveedor === item.IdProveedor;
                    return (
                        <TouchableOpacity
                            style={[styles.card, isActive && styles.cardActive]}
                            onPress={() => setSelectedSucursal(item)}
                        >
                            {provInfo ? (
                                // Ponemos resizeMode="contain" para que el logo se vea completo
                                <Image
                                    source={{ uri: provInfo.UrlLogo }}
                                    style={styles.logo}
                                    resizeMode="contain"
                                />
                            ) : (
                                <View style={[styles.logo, { backgroundColor: '#eee' }]} />
                            )}
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.provName}>{provInfo?.Nombre || 'Cargando…'}</Text>
                                <Text style={styles.sucursalName}>{item.NombreSucursal}</Text>
                                <Text style={styles.provTotal}>Total: RD${item.Precio.toFixed(2)}</Text>
                                <Text style={styles.distancia}>{item.Distancia.toFixed(2)} km</Text>
                            </View>
                        </TouchableOpacity>
                    );
                }}
            />

            {/* Footer con botones */}
            <View style={styles.footer}>
                {/* “Ir al más cercano” */}
                <TouchableOpacity
                    style={[styles.btn, !selectedSucursal && styles.btnDisabled]}
                    onPress={() => {
                        if (!selectedSucursal) return;
                        const lat = Number(selectedSucursal.Latitud);
                        const lng = Number(selectedSucursal.Longitud);
                        const label = proveedoresMap[selectedSucursal.IdProveedor]?.Nombre || '';
                        openNavigation(lat, lng, label);
                    }}
                    disabled={!selectedSucursal}
                >
                    <Text style={styles.btnText}>Ir al más cercano</Text>
                </TouchableOpacity>

                {/* “Guardar Lista” */}
                <TouchableOpacity
                    style={[styles.btnRecipe, !selectedSucursal && styles.btnDisabled]}
                    onPress={() => {
                        if (!selectedSucursal) return;
                        setListaName(''); // Limpiamos el campo si hubiese algo
                        setShowNameModal(true); // Mostramos el modal
                    }}
                    disabled={!selectedSucursal}
                >
                    <Text style={styles.btnTextDark}>Guardar Lista</Text>
                </TouchableOpacity>
            </View>

            {/* —— Modal para ingresar el nombre de la lista —— */}
            <Modal
                visible={showNameModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowNameModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Nombre de tu lista</Text>
                        <Text style={styles.modalSubtitle}>
                            Escribe un nombre para esta lista de compras:
                        </Text>
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
                                <Text style={[styles.modalButtonText, { color: '#333' }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    { backgroundColor: '#33618D' },
                                    listaName.trim().length === 0 && styles.btnDisabled,
                                ]}
                                onPress={() => {
                                    if (listaName.trim().length === 0) {
                                        Alert.alert('Error', 'El nombre no puede estar vacío.');
                                        return;
                                    }
                                    setShowNameModal(false);
                                    handleGuardarLista();
                                }}
                                disabled={listaName.trim().length === 0}
                            >
                                <Text style={[styles.modalButtonText, { color: '#FFF' }]}>Guardar</Text>
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
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FF',
    },
    container: { flex: 1, backgroundColor: '#F8F9FF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#001D35',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 16,
        paddingBottom: 12,
        paddingHorizontal: 16,
    },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '500' },

    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        elevation: 2,
    },
    cardActive: { borderColor: '#F3732A', borderWidth: 2 },

    /**
     * Ajustamos el contenedor del logo a 100×50
     * y en la etiqueta <Image /> usamos resizeMode="contain"
     * para que se vea completo y en proporción.
     */
    logo: {
        width: 100,
        height: 50,
    },
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
        backgroundColor: '#33618D',
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    btnRecipe: {
        flex: 1,
        backgroundColor: '#EDCA04',
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    btnDisabled: { opacity: 0.6 },

    btnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    btnTextDark: { color: '#001D35', fontSize: 16, fontWeight: '600' },

    /* ——— Estilos del Modal ——— */
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
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 6,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#555',
        marginBottom: 12,
    },
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
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
