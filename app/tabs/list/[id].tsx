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

// Enum categorías
enum CategoriaLista {
    Supermercado = 'supermercado',
    Ferreteria = 'ferreteria',
    Farmacia = 'farmacia',
    Otro = 'otro',
}

type ProductoEnLista = { IdProducto: number; PrecioActual: string; Cantidad: number };
type ProductoAPI = { IdProducto: number; Nombre: string; UrlImagen: string };
type SucursalCercana = { NombreSucursal: string; Latitud: number | string; Longitud: number | string; IdProveedor: number; Precio: number; Distancia: number };
type Proveedor = { IdProveedor: number; Nombre: string; UrlLogo: string; IdTipoProveedor: number };
type TipoProveedor = { IdTipoProveedor: number; NombreTipoProveedor: string };

export default function ListDetailScreen() {
    const { id, idProveedor } = useLocalSearchParams<{ id: string; idProveedor: string }>();
    const idLista = Number(id);
    const proveedorId = Number(idProveedor);

    const [loading, setLoading] = useState(true);
    const [productos, setProductos] = useState<Array<ProductoAPI & { PrecioActual: string; Cantidad: number }>>([]);
    const [branch, setBranch] = useState<SucursalCercana | null>(null);
    const [loadingBranch, setLoadingBranch] = useState(false);
    const [categoria, setCategoria] = useState<CategoriaLista>(CategoriaLista.Otro);
    const [sending, setSending] = useState(false);

    // Determinar categoría real
    useEffect(() => {
        (async () => {
            try {
                const provRes = await axios.get<Proveedor>(
                    `https://tobarato-api.alirizvi.dev/api/proveedor/${proveedorId}`
                );
                const tipoId = provRes.data.IdTipoProveedor;
                const tiposRes = await axios.get<TipoProveedor[]>(
                    'https://tobarato-api.alirizvi.dev/api/tipoproveedor'
                );
                const tipoObj = tiposRes.data.find(t => t.IdTipoProveedor === tipoId);
                const nombre = tipoObj?.NombreTipoProveedor.toLowerCase() || '';
                if (nombre.includes('supermerc')) setCategoria(CategoriaLista.Supermercado);
                else if (nombre.includes('ferreter')) setCategoria(CategoriaLista.Ferreteria);
                else if (nombre.includes('farmac')) setCategoria(CategoriaLista.Farmacia);
            } catch {
                // fallback
            }
        })();
    }, [proveedorId]);

    // Cargar productos
    const fetchProducts = useCallback(async () => {
        try {
            const resp = await axios.get<ProductoEnLista[]>(
                `https://tobarato-api.alirizvi.dev/api/productosdelista/${idLista}`
            );
            const detalles = await Promise.all(
                resp.data.map(async pl => {
                    const prod = await axios.get<ProductoAPI>(
                        `https://tobarato-api.alirizvi.dev/api/producto/${pl.IdProducto}`
                    );
                    return { ...prod.data, PrecioActual: pl.PrecioActual, Cantidad: pl.Cantidad };
                })
            );
            setProductos(detalles);
        } catch {
            Alert.alert('Error', 'No se pudieron cargar los productos.');
        }
    }, [idLista]);

    // Cargar sucursal cercana
    const fetchBranch = useCallback(async () => {
        setLoadingBranch(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') throw new Error();
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
            const body = {
                lat: loc.coords.latitude,
                lng: loc.coords.longitude,
                ids_productos: productos.map(p => p.IdProducto),
                lista_cantidad: productos.map(p => p.Cantidad),
            };
            const resp = await axios.post<SucursalCercana[]>(
                'https://tobarato-api.alirizvi.dev/api/sucursal-cercana',
                body
            );
            setBranch(resp.data.find(b => b.IdProveedor === proveedorId) || null);
        } catch {
            // ignore
        } finally {
            setLoadingBranch(false);
        }
    }, [productos, proveedorId]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            await fetchProducts();
            setLoading(false);
        })();
    }, [fetchProducts]);

    useEffect(() => {
        if (!loading && productos.length) fetchBranch();
    }, [loading, productos, fetchBranch]);

    // Abrir mapa
    const openMap = () => {
        if (!branch) return Alert.alert('No disponible', 'No se encontró sucursal.');
        const lat = Number(branch.Latitud), lng = Number(branch.Longitud);
        const url = Platform.select({
            ios: `maps:0,0?q=${branch.NombreSucursal}@${lat},${lng}`,
            android: `google.navigation:q=${lat},${lng}`,
        });
        url && Linking.openURL(url);
    };

    // Editar lista
    const handleEdit = () => {
        const payload = productos.map(p => ({
            IdProducto: p.IdProducto,
            Nombre: p.Nombre,
            UrlImagen: p.UrlImagen,
            Cantidad: p.Cantidad,
        }));
        router.push({
            pathname: '../list/add',
            params: { tipo: categoria, edit: 'true', initial: encodeURIComponent(JSON.stringify(payload)) },
        });
    };

    // Navegar a IA result
    const navigateToIaResult = (msg: string) =>
        router.push({ pathname: '../list/iaResult', params: { reply: encodeURIComponent(msg) } });

    // Llamada IA con botón dinámico
    const handleIA = async () => {
        if (sending) return;
        setSending(true);
        const nombres = productos.map(p => p.Nombre).join(', ');
        let prompt = '';
        let label = '';
        switch (categoria) {
            case CategoriaLista.Supermercado:
                prompt = `Dame en pocas palabras una receta usando: ${nombres}.`;
                label = 'Buscar Receta';
                break;
            case CategoriaLista.Ferreteria:
                prompt = `Uso breve de cada herramienta: ${nombres}.`;
                label = 'Cómo Utilizar';
                break;
            case CategoriaLista.Farmacia:
                prompt = `Instrucciones cortas para: ${nombres}.`;
                label = 'Cómo Consumir';
                break;
            default:
                prompt = `Describe brevemente: ${nombres}.`;
                label = 'Analizar';
        }
        try {
            const res = await axios.post(
                'https://tobarato-api.alirizvi.dev/api/dashboard/analizar-pregunta',
                { pregunta: prompt }
            );
            navigateToIaResult(res.data.respuesta || 'Sin respuesta.');
        } catch {
            Alert.alert('Error', 'No se pudo obtener respuesta.');
        } finally {
            setSending(false);
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

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.replace('../../tabs/lista')} style={{ padding: 8 }}>
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalle de Lista</Text>
                <TouchableOpacity onPress={handleEdit} style={{ padding: 8 }}>
                    <Ionicons name="pencil-outline" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Productos */}
            <FlatList
                data={productos}
                keyExtractor={i => i.IdProducto.toString()}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() =>
                            router.push({
                                pathname: `../product/${item.IdProducto}`,
                                params: {
                                    data: encodeURIComponent(
                                        JSON.stringify({
                                            IdProducto: item.IdProducto,
                                            Nombre: item.Nombre,
                                            UrlImagen: item.UrlImagen,
                                            Precio: item.PrecioActual,
                                            Descripcion: '',
                                            Unidad: '',
                                            Categoria: '',
                                            ProveedorNombre: '',
                                            ProveedorLogo: '',
                                        })
                                    ),
                                },
                            })
                        }
                    >
                        <View style={styles.productRow}>
                            {item.UrlImagen ? (
                                <Image source={{ uri: item.UrlImagen }} style={styles.productImage} />
                            ) : (
                                <View style={[styles.productImage, { backgroundColor: '#eee' }]} />
                            )}
                            <View style={styles.productInfo}>
                                <Text style={styles.productName}>{item.Nombre}</Text>
                                <Text style={styles.productPrice}>
                                    RD${parseFloat(item.PrecioActual).toFixed(2)}
                                </Text>
                                <Text style={styles.productQuantity}>Cantidad: {item.Cantidad}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />

            {/* Botón IA dinámico */}
            <TouchableOpacity
                style={[styles.iaButton, sending && styles.disabledButton]}
                onPress={handleIA}
                disabled={sending}
            >
                <Text style={styles.iaButtonText}>
                    {sending
                        ? 'Enviando...'
                        : categoria === CategoriaLista.Supermercado
                            ? 'Buscar Receta'
                            : categoria === CategoriaLista.Ferreteria
                                ? 'Cómo Utilizar'
                                : categoria === CategoriaLista.Farmacia
                                    ? 'Cómo Consumir'
                                    : 'Analizar'}
                </Text>
            </TouchableOpacity>

            {/* Botón sucursal */}
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
    productRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        elevation: 2,
    },
    productImage: { width: 50, height: 50, borderRadius: 8 },
    productInfo: { flex: 1, marginLeft: 12 },
    productName: { fontSize: 16, fontWeight: '600', color: '#101418' },
    productPrice: { fontSize: 14, color: '#33618D', marginTop: 4 },
    productQuantity: { fontSize: 12, color: '#555' },
    iaButton: {
        backgroundColor: '#F3732A',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        margin: 16,
    },
    iaButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    goButton: {
        backgroundColor: '#33618D',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 24,
        elevation: 3,
    },
    goButtonDisabled: { opacity: 0.6 },
    goButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    disabledButton: { opacity: 0.6 },
});

// app/tabs/list/iaResult.tsx doesn't change
