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
    // …otras propiedades de GET /producto/{id}
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
    // Parámetros de navegación
    const params = useLocalSearchParams<{ id: string; idProveedor: string }>();
    const idLista = Number(params.id);
    const idProveedor = Number(params.idProveedor);

    // Estados
    const [loading, setLoading] = useState(true);
    const [productos, setProductos] = useState<Array<ProductoAPI & { PrecioActual: string; Cantidad: number }>>([]);
    const [loadingBranch, setLoadingBranch] = useState(false);
    const [branch, setBranch] = useState<SucursalCercana | null>(null);

    // 1) Carga los productos de la lista
    const fetchProductsInList = useCallback(async () => {
        try {
            const resp = await axios.get<ProductoEnLista[]>(
                `https://tobarato-api.alirizvi.dev/api/productosdelista/${idLista}`
            );
            const arr = resp.data;
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

    // 2) Consulta la sucursal más cercana incluyendo cantidades
    const fetchLocationAndBranch = useCallback(async () => {
        setLoadingBranch(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Sin permiso',
                    'Necesitamos permiso de ubicación para encontrar la sucursal más cercana.'
                );
                setLoadingBranch(false);
                return;
            }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
            const lat = loc.coords.latitude;
            const lng = loc.coords.longitude;

            // Preparamos los arrays de IDs y cantidades
            const ids_productos = productos.map((p) => p.IdProducto);
            const lista_cantidad = productos.map((p) => p.Cantidad);

            const body = {
                lat,
                lng,
                ids_productos,
                lista_cantidad,
            };

            const respSuc = await axios.post<SucursalCercana[]>(
                'https://tobarato-api.alirizvi.dev/api/sucursal-cercana',
                body
            );
            const allBranches = respSuc.data;

            const matched = allBranches.find((b) => b.IdProveedor === idProveedor);
            setBranch(matched || null);
        } catch (err) {
            console.error('[ListDetail] Error al buscar sucursal cercana:', err);
        } finally {
            setLoadingBranch(false);
        }
    }, [productos, idProveedor]);

    // 3) Cuando cambia la lista, recarga productos (y limpia datos viejos)
    useEffect(() => {
        setProductos([]);
        setBranch(null);
        setLoading(true);
        (async () => {
            await fetchProductsInList();
            setLoading(false);
        })();
    }, [idLista, fetchProductsInList]);

    // 4) Cuando ya tenga productos, pide la sucursal
    useEffect(() => {
        if (!loading) {
            if (productos.length > 0) {
                fetchLocationAndBranch();
            } else {
                setBranch(null);
                setLoadingBranch(false);
            }
        }
    }, [loading, productos, fetchLocationAndBranch]);

    // 5) Abre la app de mapas a la sucursal hallada
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
        url && Linking.openURL(url);
    };

    // Render
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
                <TouchableOpacity onPress={() => router.replace('../../tabs/lista')} style={{ padding: 8 }}>
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalle de Lista</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.content}>
                <FlatList
                    data={productos}
                    keyExtractor={(item) => item.IdProducto.toString()}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    renderItem={({ item }) => (
                        <View style={styles.productRow}>
                            {item.UrlImagen ? (
                                <Image source={{ uri: item.UrlImagen }} style={styles.productImage} resizeMode="cover" />
                            ) : (
                                <View style={[styles.productImage, { backgroundColor: '#eee' }]} />
                            )}
                            <View style={styles.productInfo}>
                                <Text style={styles.productName}>{item.Nombre}</Text>
                                <Text style={styles.productPrice}>RD${parseFloat(item.PrecioActual).toFixed(2)}</Text>
                                <Text style={styles.productQuantity}>Cantidad: {item.Cantidad}</Text>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>Esta lista no tiene productos.</Text>}
                />

                <TouchableOpacity
                    style={[styles.goButton, (!branch || loadingBranch) && styles.goButtonDisabled]}
                    onPress={openMap}
                    disabled={!branch || loadingBranch}
                >
                    {loadingBranch ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Text style={styles.goButtonText}>
                            {branch ? `Ir a sucursal: ${branch.NombreSucursal}` : 'Buscar sucursal...'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FF',
    },
    container: { flex: 1, backgroundColor: '#F8F9FF' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#001D35',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 16,
        paddingBottom: 12, paddingHorizontal: 16,
    },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '500' },

    content: { flex: 1, padding: 16 },
    productRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 12, elevation: 2,
    },
    productImage: { width: 50, height: 50, borderRadius: 8 },
    productInfo: { marginLeft: 12, flex: 1 },
    productName: { fontSize: 16, fontWeight: '600', color: '#101418' },
    productPrice: { fontSize: 14, color: '#33618D', marginTop: 4 },
    productQuantity: { fontSize: 12, color: '#555', marginTop: 2 },
    emptyText: { textAlign: 'center', marginTop: 24, color: '#555' },

    goButton: {
        backgroundColor: '#33618D', paddingVertical: 14, borderRadius: 8, alignItems: 'center',
        marginTop: 16, elevation: 3,
    },
    goButtonDisabled: { opacity: 0.6 },
    goButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
