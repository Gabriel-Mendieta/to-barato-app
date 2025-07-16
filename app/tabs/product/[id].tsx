// app/product/[id].tsx
import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    Image,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';

type PassedInfo = {
    IdProducto: number;
    Nombre: string;
    UrlImagen: string | null;
    Precio: string;
    Descripcion: string;
    Unidad: string;
    Categoria: string;
    ProveedorNombre: string;
    ProveedorLogo: string;
};

type PrecioProveedor = {
    IdProveedor: number;
    NombreProveedor: string;
    UrlImagenProveedor: string;
    Precio: string;
    PrecioOferta?: string | null;
};

export default function ProductDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id: string; data?: string }>();
    const productoId = Number(params.id);
    const raw = params.data ?? '';

    const [info, setInfo] = useState<PassedInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [prices, setPrices] = useState<PrecioProveedor[]>([]);
    const [loadingPrices, setLoadingPrices] = useState(true);

    // Parse info from navigation
    useEffect(() => {
        if (!raw) {
            setError('No hay datos del producto.');
            return;
        }
        try {
            const json = decodeURIComponent(raw);
            setInfo(JSON.parse(json));
        } catch {
            setError('Error al leer datos del producto.');
        }
    }, [raw]);

    // Fetch providers and their prices
    useEffect(() => {
        const fetchPrices = async () => {
            try {
                setLoadingPrices(true);
                const resp = await axios.get<PrecioProveedor[]>(
                    `https://tobarato-api.alirizvi.dev/api/precios-productos/${productoId}`
                );
                setPrices(resp.data);
            } catch {
                // silent
            } finally {
                setLoadingPrices(false);
            }
        };
        fetchPrices();
    }, [productoId]);

    if (error) {
        return (
            <SafeAreaView style={styles.center}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
                    <Text style={styles.retryButtonText}>Volver</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    if (!info) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color="#33618D" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                {info.UrlImagen ? (
                    <Image source={{ uri: info.UrlImagen }} style={styles.image} />
                ) : null}

                <Text style={styles.title}>{info.Nombre}</Text>

                <View style={styles.row}>
                    <Text style={styles.price}>RD${info.Precio}</Text>
                    {info.Unidad ? <Text style={styles.unit}> {info.Unidad}</Text> : null}
                </View>

                <View style={styles.row}>
                    <Image source={{ uri: info.ProveedorLogo }} style={styles.logo} />
                    <Text style={styles.provName}>{info.ProveedorNombre}</Text>
                </View>

                <Text style={styles.sectionTitle}>Descripción</Text>
                <Text style={styles.sectionText}>{info.Descripcion || 'Sin descripción.'}</Text>

                <Text style={styles.sectionTitle}>Categoría</Text>
                <Text style={styles.sectionText}>{info.Categoria}</Text>

                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Precios por Proveedor</Text>
                {loadingPrices ? (
                    <ActivityIndicator size="small" color="#33618D" />
                ) : (
                    <FlatList
                        data={prices}
                        keyExtractor={item => item.IdProveedor.toString()}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingVertical: 12 }}
                        renderItem={({ item }) => (
                            <View style={styles.card}>
                                <Image source={{ uri: item.UrlImagenProveedor }} style={styles.cardLogo} />
                                <Text style={styles.cardProv}>{item.NombreProveedor}</Text>
                                <Text style={styles.cardPrice}>
                                    RD${item.PrecioOferta ?? item.Precio}
                                </Text>
                            </View>
                        )}
                    />
                )}

                {/* Botón Agregar a nueva lista */}
                <TouchableOpacity
                    style={styles.newListBtn}
                    onPress={() => {
                        const outgoing = [{
                            IdProducto: info!.IdProducto,
                            Nombre: info!.Nombre,
                            UrlImagen: info!.UrlImagen,
                            Cantidad: 1,
                        }];
                        router.push({
                            pathname: '../list/add',
                            params: {
                                tipo: info!.Categoria.toLowerCase(),
                                edit: 'false',
                                initial: encodeURIComponent(JSON.stringify(outgoing)),
                            },
                        });
                    }}
                >
                    <Text style={styles.newListBtnText}>Agregar a nueva lista</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FF' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#D1170F', marginBottom: 12, textAlign: 'center' },
    retryButton: {
        backgroundColor: '#33618D', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8,
    },
    retryButtonText: { color: '#FFF', fontWeight: '600' },
    scroll: { padding: 16 },
    image: {
        width: '100%', height: 250, borderRadius: 12, marginBottom: 12,
    },
    title: {
        fontSize: 20, fontWeight: '600', color: '#101418', marginBottom: 8,
    },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    price: { fontSize: 18, fontWeight: '700', color: '#33618D' },
    unit: { fontSize: 14, color: '#555', marginLeft: 4 },
    logo: { width: 24, height: 12, resizeMode: 'contain', marginRight: 8 },
    provName: { fontSize: 14, color: '#555' },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#101418', marginTop: 16 },
    sectionText: { fontSize: 14, color: '#555', marginTop: 4 },
    card: {
        width: 120, marginRight: 12, backgroundColor: '#FFF', borderRadius: 12, padding: 12,
        alignItems: 'center', elevation: 2,
    },
    cardLogo: { width: 60, height: 30, resizeMode: 'contain', marginBottom: 8 },
    cardProv: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
    cardPrice: { fontSize: 16, fontWeight: '700', color: '#33618D' },
    // New button styles
    newListBtn: {
        backgroundColor: '#F3732A',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 16,
    },
    newListBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
