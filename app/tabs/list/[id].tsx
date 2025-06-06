// app/tabs/list/[id].tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    Image,
    FlatList,
    TouchableOpacity,
    StatusBar,
    Platform,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import * as Location from 'expo-location';

type ProductoEnLista = {
    IdProducto: number;
    PrecioActual: string;
    Cantidad: number;
};

type ProductoAPI = {
    IdProducto: number;
    Nombre: string;
    UrlImagen: string;
    // …otras propiedades que entrega GET /producto/{id}
};

type SucursalCercana = {
    NombreSucursal: string;
    Latitud: number | string;
    Longitud: number | string;
    IdProveedor: number;
    Precio: number;
    Distancia: number;
};

export default function ListDetailScreen() {
    // 1) Leemos los parámetros:
    //    - "id" desde la URL dinámica → IdLista
    //    - "idProveedor" porque lo enviamos al navegar desde index.tsx
    const params = useLocalSearchParams<{ id: string; idProveedor: string }>();
    const idLista = Number(params.id);
    const idProveedor = Number(params.idProveedor);

    // --- ESTADOS ---
    const [loading, setLoading] = useState<boolean>(true);
    const [productos, setProductos] = useState<
        Array<ProductoAPI & { PrecioActual: string; Cantidad: number }>
    >([]);
    const [loadingBranch, setLoadingBranch] = useState<boolean>(false);
    const [branch, setBranch] = useState<SucursalCercana | null>(null);

    // --- 2) Función para obtener productos de la lista ---
    //     GET /productosdelista/{idLista} → [ { IdProducto, PrecioActual, Cantidad }, … ]
    //     Luego, para cada IdProducto hacemos GET /producto/{IdProducto} para traer nombre e imagen.
    const fetchProductsInList = useCallback(async () => {
        try {
            const resp = await axios.get<ProductoEnLista[]>(
                `https://tobarato-api.alirizvi.dev/api/productosdelista/${idLista}`
            );
            const arr: ProductoEnLista[] = resp.data;

            // Para cada entrada, solicitamos GET /producto/{IdProducto}
            const detalles = await Promise.all(
                arr.map(async (pl) => {
                    const r2 = await axios.get<ProductoAPI>(
                        `https://tobarato-api.alirizvi.dev/api/producto/${pl.IdProducto}`
                    );
                    return {
                        ...r2.data,
                        PrecioActual: pl.PrecioActual,
                        Cantidad: pl.Cantidad,
                    };
                })
            );

            setProductos(detalles);
        } catch (err) {
            console.error('[ListDetail] Error al obtener productos de la lista:', err);
            Alert.alert(
                'Error',
                'No se pudieron cargar los productos de esta lista. Intenta nuevamente.'
            );
        }
    }, [idLista]);

    // --- 3) Función para pedir ubicación y buscar la sucursal del proveedor ---
    //     POST /sucursal-cercana { lat, lng, ids_productos: [...] }
    //     Luego filtramos por IdProveedor.
    const fetchLocationAndBranch = useCallback(async () => {
        setLoadingBranch(true);
        try {
            // 3.1) Pedir permiso y coords
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Sin permiso',
                    'Necesitamos permiso de ubicación para encontrar la sucursal más cercana.'
                );
                setLoadingBranch(false);
                return;
            }
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
            });
            const lat = loc.coords.latitude;
            const lng = loc.coords.longitude;

            // 3.2) Construir array de IdProducto
            const idsArr = productos.map((p) => p.IdProducto);

            // 3.3) POST /sucursal-cercana
            const body = { lat, lng, ids_productos: idsArr };
            const respSuc = await axios.post<SucursalCercana[]>(
                'https://tobarato-api.alirizvi.dev/api/sucursal-cercana',
                body
            );
            const allBranches = respSuc.data;

            // 3.4) Filtrar la sucursal cuyo IdProveedor coincida
            const matched = allBranches.find((b) => b.IdProveedor === idProveedor);
            if (matched) {
                setBranch(matched);
            } else {
                setBranch(null);
            }
        } catch (err) {
            console.error('[ListDetail] Error al buscar sucursal cercana:', err);
        } finally {
            setLoadingBranch(false);
        }
    }, [productos, idProveedor]);

    // --- 4) Efecto: cuando cambie `idLista`, recargamos TODO (productos + sucursal) ---
    useEffect(() => {
        // Antes de cargar, despejamos estados para no mostrar datos viejos:
        setProductos([]);
        setBranch(null);
        setLoading(true);

        (async () => {
            // 4.1) Cargar productos de esta lista:
            await fetchProductsInList();
            setLoading(false);
        })();
        // NOTA: No llamamos a fetchLocationAndBranch inmediatamente aquí, porque primero
        //       queremos asegurarnos de que `productos` ya esté poblado.
    }, [idLista, fetchProductsInList]);

    // --- 5) Efecto: cuando termine de cargar productos (loading===false y hay productos),
    //           pedimos ubicación y buscamos sucursal.
    useEffect(() => {
        if (!loading && productos.length > 0) {
            fetchLocationAndBranch();
        }
        // Si la lista quedó vacía (no productos), también hacemos fetchLocationAndBranch
        if (!loading && productos.length === 0) {
            setBranch(null);
            setLoadingBranch(false);
        }
    }, [loading, productos, fetchLocationAndBranch]);

    // --- 6) Abrir la app de mapas apuntando a la sucursal encontrada ---
    const openMap = () => {
        if (!branch) {
            Alert.alert('No disponible', 'No se encontró sucursal para este proveedor.');
            return;
        }
        const lat = Number(branch.Latitud);
        const lng = Number(branch.Longitud);
        const label = branch.NombreSucursal;
        const url = Platform.select({
            ios: `maps:0,0?q=${encodeURIComponent(label)}@${lat},${lng}`,
            android: `google.navigation:q=${lat},${lng}`,
        });
        if (url) {
            Linking.openURL(url);
        }
    };

    // --- 7) Renderizado ---
    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#33618D" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#001D35" />

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.replace('../../tabs/lista')}
                    style={{ padding: 8 }}
                >
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalle de Lista</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.content}>
                {/* FlatList de productos */}
                <FlatList
                    data={productos}
                    keyExtractor={(item) => item.IdProducto.toString()}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    renderItem={({ item }) => (
                        <View style={styles.productRow}>
                            {item.UrlImagen ? (
                                <Image
                                    source={{ uri: item.UrlImagen }}
                                    style={styles.productImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={[styles.productImage, { backgroundColor: '#eee' }]} />
                            )}
                            <View style={styles.productInfo}>
                                <Text style={styles.productName}>{item.Nombre}</Text>
                                <Text style={styles.productPrice}>
                                    RD${parseFloat(item.PrecioActual).toFixed(2)}
                                </Text>
                                <Text style={styles.productQuantity}>
                                    Cantidad: {item.Cantidad}
                                </Text>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>Esta lista no tiene productos.</Text>
                    }
                />

                {/* Botón “Ir a sucursal” */}
                <TouchableOpacity
                    style={[
                        styles.goButton,
                        (!branch || loadingBranch) && styles.goButtonDisabled,
                    ]}
                    onPress={openMap}
                    disabled={!branch || loadingBranch}
                >
                    {loadingBranch ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Text style={styles.goButtonText}>
                            {branch
                                ? `Ir a sucursal: ${branch.NombreSucursal}`
                                : 'Buscar sucursal...'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FF',
    },
    container: {
        flex: 1,
        backgroundColor: '#F8F9FF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#001D35',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 16,
        paddingBottom: 12,
        paddingHorizontal: 16,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '500',
    },

    content: {
        flex: 1,
        padding: 16,
    },
    productRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        elevation: 2,
    },
    productImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: '#ddd',
    },
    productInfo: {
        marginLeft: 12,
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#101418',
    },
    productPrice: {
        fontSize: 14,
        color: '#33618D',
        marginTop: 4,
    },
    productQuantity: {
        fontSize: 12,
        color: '#555',
        marginTop: 2,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 24,
        color: '#555',
    },

    goButton: {
        backgroundColor: '#33618D',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
        elevation: 3,
    },
    goButtonDisabled: {
        opacity: 0.6,
    },
    goButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
