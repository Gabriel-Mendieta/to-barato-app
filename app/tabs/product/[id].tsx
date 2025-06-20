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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

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

export default function ProductDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id: string; data?: string }>();
    const productoId = Number(params.id);
    const raw = params.data ?? '';

    const [info, setInfo] = useState<PassedInfo | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Parseamos SOLO la info pasada desde Home
    useEffect(() => {
        console.log('🟢 [ProductDetail] params:', params);
        if (!raw) {
            setError('No hay datos del producto.');
            return;
        }
        try {
            console.log('📦 [ProductDetail] intentando parsear raw...');
            const json = decodeURIComponent(raw);
            const parsed: PassedInfo = JSON.parse(json);
            console.log('✅ [ProductDetail] parse success:', parsed);
            setInfo(parsed);
        } catch (e: any) {
            console.error('❌ [ProductDetail] error parseando raw:', e);
            setError('Error al leer datos del producto.');
        }
    }, [raw]);

    if (error) {
        return (
            <SafeAreaView style={styles.center}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => router.back()}
                >
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
                <Text style={styles.sectionText}>
                    {info.Descripcion || 'Sin descripción.'}
                </Text>

                <Text style={styles.sectionTitle}>Categoría</Text>
                <Text style={styles.sectionText}>{info.Categoria}</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FF' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#D1170F', marginBottom: 12, textAlign: 'center' },
    retryButton: {
        backgroundColor: '#33618D',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: { color: '#FFF', fontWeight: '600' },
    scroll: { padding: 16 },
    image: {
        width: '100%',
        height: 250,
        borderRadius: 12,
        marginBottom: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#101418',
        marginBottom: 8,
    },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    price: { fontSize: 18, fontWeight: '700', color: '#33618D' },
    unit: { fontSize: 14, color: '#555', marginLeft: 4 },
    logo: {
        width: 24,
        height: 12,
        resizeMode: 'contain',
        marginRight: 8,
    },
    provName: { fontSize: 14, color: '#555' },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#101418',
        marginTop: 16,
    },
    sectionText: { fontSize: 14, color: '#555', marginTop: 4 },
});
