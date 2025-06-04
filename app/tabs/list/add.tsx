// app/tabs/list/add.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    FlatList,
    Image,
    TouchableOpacity,
    StatusBar,
    Platform,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { MotiView } from 'moti';
import axios from 'axios';

////////////////////////////////////////////////////////////////////////////////
// Este tipo coincide con lo que devuelve GET /producto
////////////////////////////////////////////////////////////////////////////////
type ProductoAPI = {
    IdProducto: number;
    Nombre: string;
    UrlImagen: string;
    // …otras propiedades que devuelva /producto, si existen
};

////////////////////////////////////////////////////////////////////////////////
// Este será el formato que “providers.tsx” espera recibir:
// { IdProducto, Nombre, UrlImagen }
////////////////////////////////////////////////////////////////////////////////
type OutgoingProduct = {
    IdProducto: number;
    Nombre: string;
    UrlImagen: string;
};

export default function AddToListScreen() {
    ////////////////////////////////////////////////////////////////////////////
    // 1) Estado para la lista completa de productos (GET /producto)
    ////////////////////////////////////////////////////////////////////////////
    const [allProducts, setAllProducts] = useState<ProductoAPI[]>([]);
    const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
    const [errorProducts, setErrorProducts] = useState<string | null>(null);

    ////////////////////////////////////////////////////////////////////////////
    // 2) Estados de búsqueda + selección
    ////////////////////////////////////////////////////////////////////////////
    const [query, setQuery] = useState<string>('');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    ////////////////////////////////////////////////////////////////////////////
    // 3) useEffect para cargar todos los productos al montar
    ////////////////////////////////////////////////////////////////////////////
    useEffect(() => {
        (async () => {
            try {
                const resp = await axios.get<ProductoAPI[]>(
                    'https://tobarato-api.alirizvi.dev/api/producto'
                );
                setAllProducts(resp.data);
            } catch (err) {
                console.error('[AddToList] Error al cargar productos:', err);
                setErrorProducts('No se pudieron cargar los productos');
            } finally {
                setLoadingProducts(false);
            }
        })();
    }, []);

    ////////////////////////////////////////////////////////////////////////////
    // 4) useFocusEffect: cada vez que esta pantalla reciba foco, reiniciamos
    //    el query y la selección para que empiece “en blanco”.
    ////////////////////////////////////////////////////////////////////////////
    useFocusEffect(
        useCallback(() => {
            // Limpiar búsqueda y selección
            setQuery('');
            setSelectedIds(new Set());
            // (Opcional) Si quieres desplazar la FlatList al tope, podrías usar un ref aquí.
            // Al devolver null, no hacemos limpieza al perder foco.
            return () => { };
        }, [])
    );

    ////////////////////////////////////////////////////////////////////////////
    // 5) Función toggle para agregar/quitar Id de producto
    ////////////////////////////////////////////////////////////////////////////
    const toggle = (id: number) => {
        setSelectedIds((prev) => {
            const copy = new Set(prev);
            if (copy.has(id)) copy.delete(id);
            else copy.add(id);
            return copy;
        });
    };

    ////////////////////////////////////////////////////////////////////////////
    // 6) Filtrado en tiempo real: solo mostramos productos si el query no está vacío
    ////////////////////////////////////////////////////////////////////////////
    const filtered = useMemo(() => {
        if (query.trim().length === 0) {
            return [];
        }
        return allProducts.filter((p) =>
            p.Nombre.toLowerCase().includes(query.toLowerCase())
        );
    }, [query, allProducts]);

    ////////////////////////////////////////////////////////////////////////////
    // 7) Array de productos completos que fueron seleccionados
    ////////////////////////////////////////////////////////////////////////////
    const selectedProducts = useMemo(
        () => allProducts.filter((p) => selectedIds.has(p.IdProducto)),
        [selectedIds, allProducts]
    );
    const count = selectedProducts.length;

    ////////////////////////////////////////////////////////////////////////////
    // 8) Si estamos cargando productos, mostramos spinner
    ////////////////////////////////////////////////////////////////////////////
    if (loadingProducts) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#33618D" />
                <Text style={{ marginTop: 8 }}>Cargando productos…</Text>
            </SafeAreaView>
        );
    }

    ////////////////////////////////////////////////////////////////////////////
    // 9) Si hubo error al cargar productos, mostrar mensaje de error
    ////////////////////////////////////////////////////////////////////////////
    if (errorProducts) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <Text style={{ color: 'red' }}>{errorProducts}</Text>
            </SafeAreaView>
        );
    }

    ////////////////////////////////////////////////////////////////////////////
    // 10) Render de la pantalla
    ////////////////////////////////////////////////////////////////////////////
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#001D35" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Icon name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Buscar Productos</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchWrap}>
                <Icon name="search" size={20} color="#555" style={{ marginRight: 8 }} />
                <TextInput
                    placeholder="Buscar producto..."
                    value={query}
                    onChangeText={setQuery}
                    style={styles.searchInput}
                    autoCapitalize="none"
                    clearButtonMode="while-editing"
                />
            </View>

            {/* Si no hay coincidencias y el usuario ya escribió algo */}
            {filtered.length === 0 && query.trim().length > 0 && (
                <View style={styles.noResults}>
                    <Text>No se encontraron productos</Text>
                </View>
            )}

            {/* Lista de productos filtrados */}
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.IdProducto.toString()}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                renderItem={({ item }) => {
                    const sel = selectedIds.has(item.IdProducto);
                    return (
                        <MotiView
                            from={{ opacity: 0, translateY: 20 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'timing', duration: 300 }}
                            style={styles.card}
                        >
                            <TouchableOpacity
                                style={[styles.productRow, sel && styles.productRowActive]}
                                onPress={() => toggle(item.IdProducto)}
                                activeOpacity={0.8}
                            >
                                <Image
                                    source={{ uri: item.UrlImagen }}
                                    style={styles.image}
                                    resizeMode="cover"
                                />
                                <Text style={styles.name}>{item.Nombre}</Text>
                                {sel && <Text style={styles.check}>✓</Text>}
                            </TouchableOpacity>
                        </MotiView>
                    );
                }}
            />

            {/* Botón “Continuar” */}
            <TouchableOpacity
                style={[styles.continueBtn, !count && styles.btnDisabled]}
                disabled={!count}
                onPress={() => {
                    // Convertimos cada ProductoAPI a la forma que espera providers.tsx
                    const outgoing: OutgoingProduct[] = selectedProducts.map((p) => ({
                        IdProducto: p.IdProducto,
                        Nombre: p.Nombre,
                        UrlImagen: p.UrlImagen,
                    }));

                    router.push({
                        pathname: '../list/providers',
                        params: {
                            items: encodeURIComponent(JSON.stringify(outgoing)),
                        },
                    });
                }}
            >
                <Text style={styles.continueText}>
                    Continuar{count > 0 ? ` (${count})` : ''}
                </Text>
            </TouchableOpacity>
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
    searchWrap: {
        flexDirection: 'row',
        backgroundColor: '#E5E7EB',
        marginHorizontal: 16,
        marginTop: 22,
        marginBottom: 8,
        borderRadius: 8,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    searchInput: { flex: 1, height: 40, fontSize: 16 },
    noResults: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    card: { marginBottom: 12 },
    productRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 12,
        elevation: 2,
    },
    productRowActive: { borderColor: '#33618D', borderWidth: 2 },
    image: { width: 56, height: 56, borderRadius: 8, marginRight: 12 },
    name: { flex: 1, fontSize: 16, fontWeight: '500' },
    check: { fontSize: 20, color: '#33618D', fontWeight: '600' },
    continueBtn: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        backgroundColor: '#33618D',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    continueText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    btnDisabled: { opacity: 0.6 },
});
