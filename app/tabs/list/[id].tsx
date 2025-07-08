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
    const params = useLocalSearchParams<{ id: string; idProveedor: string }>();
    const idLista = Number(params.id);
    const idProveedor = Number(params.idProveedor);

    const [loading, setLoading] = useState(true);
    const [productos, setProductos] = useState<
        Array<ProductoAPI & { PrecioActual: string; Cantidad: number }>
    >([]);
    const [loadingBranch, setLoadingBranch] = useState(false);
    const [branch, setBranch] = useState<SucursalCercana | null>(null);

    // --- EDICIÓN ---
    const [editMode, setEditMode] = useState(false);
    const [editedQty, setEditedQty] = useState<Record<number, number>>({});

    // 1) Carga productos de la lista
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
            // Iniciar quantidades editables
            setEditedQty(
                detalles.reduce((acc, p) => {
                    acc[p.IdProducto] = p.Cantidad;
                    return acc;
                }, {} as Record<number, number>)
            );
        } catch (err) {
            console.error('[ListDetail] Error al obtener productos de la lista:', err);
            Alert.alert(
                'Error',
                'No se pudieron cargar los productos de esta lista. Intenta nuevamente.'
            );
        }
    }, [idLista]);

    // 2) Buscar sucursal (igual que antes), pero incluyendo cantidades nunca cambia
    const fetchLocationAndBranch = useCallback(async () => {
        setLoadingBranch(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Sin permiso', 'Necesitamos permiso de ubicación para encontrar la sucursal.');
                setLoadingBranch(false);
                return;
            }
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
            });
            const lat = loc.coords.latitude;
            const lng = loc.coords.longitude;

            const body = {
                lat,
                lng,
                ids_productos: productos.map((p) => p.IdProducto),
                lista_cantidad: productos.map((p) => p.Cantidad),
            };

            const respSuc = await axios.post<SucursalCercana[]>(
                'https://tobarato-api.alirizvi.dev/api/sucursal-cercana',
                body
            );
            const allBranches = respSuc.data;
            const matched = allBranches.find((b) => b.IdProveedor === idProveedor) || null;
            setBranch(matched);
        } catch (err) {
            console.error('[ListDetail] Error al buscar sucursal cercana:', err);
        } finally {
            setLoadingBranch(false);
        }
    }, [productos, idProveedor]);

    // 3) Montaje inicial
    useEffect(() => {
        (async () => {
            setLoading(true);
            await fetchProductsInList();
            setLoading(false);
        })();
    }, [fetchProductsInList]);

    // 4) Cuando cambian productos cargados → buscar sucursal
    useEffect(() => {
        if (!loading && productos.length > 0) {
            fetchLocationAndBranch();
        }
    }, [loading, productos, fetchLocationAndBranch]);

    // 5) Navegar a mapa
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

    // --- CONTROLES DE CANTIDAD ---
    const increment = (id: number) => {
        setEditedQty((q) => ({ ...q, [id]: (q[id] || 0) + 1 }));
    };
    const decrement = (id: number) => {
        setEditedQty((q) => {
            const curr = q[id] || 0;
            if (curr <= 1) {
                // Si llega a 0, confirmamos eliminación
                Alert.alert(
                    'Eliminar producto',
                    '¿Deseas quitar este producto de la lista?',
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                            text: 'Quitar',
                            style: 'destructive',
                            onPress: () => {
                                setEditedQty((q2) => {
                                    const c = { ...q2 };
                                    delete c[id];
                                    return c;
                                });
                            },
                        },
                    ]
                );
                return q;
            }
            return { ...q, [id]: curr - 1 };
        });
    };

    // --- GUARDAR CAMBIOS ---
    const handleSave = async () => {
        try {
            // Para cada producto: PUT /listas/{idLista}/productos/{idProducto}
            for (const p of productos) {
                const newQty = editedQty[p.IdProducto] ?? 0;
                if (newQty !== p.Cantidad) {
                    await axios.put(
                        `https://tobarato-api.alirizvi.dev/api/listas/${idLista}/productos/${p.IdProducto}`,
                        {
                            Cantidad: newQty,
                            PrecioActual: p.PrecioActual, // opcional si cambias precio
                        }
                    );
                }
            }
            Alert.alert('Éxito', 'Cambios guardados.');
            setEditMode(false);
            // Recargar lista actualizada
            await fetchProductsInList();
        } catch (e) {
            console.error('[ListDetail] Error guardando cambios:', e);
            Alert.alert('Error', 'No se pudieron guardar los cambios.');
        }
    };

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
                <TouchableOpacity
                    onPress={() => setEditMode((e) => !e)}
                    style={{ padding: 8 }}
                >
                    <Ionicons
                        name={editMode ? 'checkmark-outline' : 'pencil-outline'}
                        size={24}
                        color="#FFF"
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <FlatList
                    data={productos}
                    keyExtractor={(item) => item.IdProducto.toString()}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    renderItem={({ item }) => {
                        const qty = editedQty[item.IdProducto] ?? 0;
                        return (
                            <View style={styles.productRow}>
                                {item.UrlImagen ? (
                                    <Image
                                        source={{ uri: item.UrlImagen }}
                                        style={styles.productImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View
                                        style={[styles.productImage, { backgroundColor: '#eee' }]}
                                    />
                                )}
                                <View style={styles.productInfo}>
                                    <Text style={styles.productName}>{item.Nombre}</Text>
                                    <Text style={styles.productPrice}>
                                        RD${parseFloat(item.PrecioActual).toFixed(2)}
                                    </Text>
                                </View>

                                {editMode ? (
                                    <View style={styles.qtyControls}>
                                        <TouchableOpacity onPress={() => decrement(item.IdProducto)}>
                                            <Ionicons
                                                name={qty === 1 ? 'trash-outline' : 'remove-circle-outline'}
                                                size={24}
                                                color={qty === 1 ? '#D1170F' : '#33618D'}
                                            />
                                        </TouchableOpacity>
                                        <Text style={styles.qtyText}>{qty}</Text>
                                        <TouchableOpacity onPress={() => increment(item.IdProducto)}>
                                            <Ionicons
                                                name="add-circle-outline"
                                                size={24}
                                                color="#33618D"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <Text style={styles.productQuantity}>Cantidad: {item.Cantidad}</Text>
                                )}
                            </View>
                        );
                    }}
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

            {/* FOOTER edición */}
            {editMode && (
                <View style={styles.footerEdit}>
                    <TouchableOpacity
                        style={[styles.footerBtn, { backgroundColor: '#D1170F' }]}
                        onPress={() => {
                            setEditMode(false);
                            // restaurar cantidades originales
                            setEditedQty(
                                productos.reduce((acc, p) => {
                                    acc[p.IdProducto] = p.Cantidad;
                                    return acc;
                                }, {} as Record<number, number>)
                            );
                        }}
                    >
                        <Text style={styles.footerBtnText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.footerBtn, { backgroundColor: '#F3732A' }]}
                        onPress={handleSave}
                    >
                        <Text style={styles.footerBtnText}>Guardar cambios</Text>
                    </TouchableOpacity>
                </View>
            )}
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
        backgroundColor: '#FFF', borderRadius: 12, padding: 12,
        marginBottom: 12, elevation: 2,
    },
    productImage: { width: 50, height: 50, borderRadius: 8 },
    productInfo: { flex: 1, marginLeft: 12 },
    productName: { fontSize: 16, fontWeight: '600', color: '#101418' },
    productPrice: { fontSize: 14, color: '#33618D', marginTop: 4 },
    productQuantity: { fontSize: 12, color: '#555' },

    qtyControls: { flexDirection: 'row', alignItems: 'center' },
    qtyText: { marginHorizontal: 8, fontSize: 16, fontWeight: '500' },

    emptyText: { textAlign: 'center', marginTop: 24, color: '#555' },

    goButton: {
        backgroundColor: '#33618D', paddingVertical: 14, borderRadius: 8,
        alignItems: 'center', marginTop: 16, elevation: 3,
    },
    goButtonDisabled: { opacity: 0.6 },
    goButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

    // Footer edición
    footerEdit: {
        flexDirection: 'row', position: 'absolute', bottom: 0,
        left: 0, right: 0, padding: 12, backgroundColor: '#FFF',
        justifyContent: 'space-around', borderTopWidth: 1, borderColor: '#E5E7EB',
    },
    footerBtn: {
        flex: 1, marginHorizontal: 8, paddingVertical: 14,
        borderRadius: 8, alignItems: 'center',
    },
    footerBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
