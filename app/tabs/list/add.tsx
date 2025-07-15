// app/tabs/list/add.tsx

import React, { useState, useMemo, useCallback } from 'react';
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
    ActivityIndicator,
    Modal,
    ScrollView,
    TextInput,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { MotiView } from 'moti';
import axios from 'axios';

////////////////////////////////////////////////////////////////////////////////
// TIPOS
////////////////////////////////////////////////////////////////////////////////
type ProductoAPI = {
    IdProducto: number;
    Nombre: string;
    UrlImagen: string | null;
};

type OutgoingProduct = {
    IdProducto: number;
    Nombre: string;
    UrlImagen: string | null;
    Cantidad: number;
};

////////////////////////////////////////////////////////////////////////////////
// COMPONENTE
////////////////////////////////////////////////////////////////////////////////
export default function AddToListScreen() {
    // 1) Leer parámetro tipo
    const params = useLocalSearchParams<{ tipo?: string }>();
    const tipoId = params.tipo ? Number(params.tipo) : null;

    // 2) Estados
    const [allProducts, setAllProducts] = useState<ProductoAPI[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [errorProducts, setErrorProducts] = useState<string | null>(null);

    const [query, setQuery] = useState('');
    const [quantities, setQuantities] = useState<Record<number, number>>({});

    const [showModal, setShowModal] = useState(false);

    // 3) Función para (re) cargar productos según tipo
    const fetchProducts = useCallback(async () => {
        setLoadingProducts(true);
        setErrorProducts(null);
        setAllProducts([]);
        try {
            let productos: ProductoAPI[];
            if (tipoId) {
                const resp = await axios.get<ProductoAPI[]>(
                    `https://tobarato-api.alirizvi.dev/api/productotipoproveedor/${tipoId}`
                );
                console.log(tipoId)
                productos = resp.data;
            } else {
                const resp = await axios.get<ProductoAPI[]>(
                    'https://tobarato-api.alirizvi.dev/api/producto'
                );
                productos = resp.data;
            }
            setAllProducts(productos);
        } catch (err) {
            console.error('[AddToList] Error al cargar productos:', err);
            setErrorProducts('No se pudieron cargar los productos.');
        } finally {
            setLoadingProducts(false);
        }
    }, [tipoId]);

    // 4) Cada vez que el screen reciba foco (o cambie tipo), recargamos
    useFocusEffect(
        useCallback(() => {
            // limpiamos búsqueda y cantidades
            setQuery('');
            setQuantities({});
            fetchProducts();
            // no cleanup necesario
        }, [fetchProducts])
    );

    // 5) Filtrado
    const filtered = useMemo(() => {
        if (!query.trim()) return [];
        return allProducts.filter(p =>
            p.Nombre.toLowerCase().includes(query.toLowerCase())
        );
    }, [query, allProducts]);

    // 6) Controles de cantidad
    const increment = (id: number) => {
        setQuantities(q => ({ ...q, [id]: (q[id] || 0) + 1 }));
    };
    const decrement = (id: number) => {
        setQuantities(q => {
            const copy = { ...q };
            const current = copy[id] || 0;
            if (current <= 1) delete copy[id];
            else copy[id] = current - 1;
            return copy;
        });
    };

    const selectedCount = Object.keys(quantities).length;

    // 7) Render
    if (loadingProducts) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#33618D" />
                <Text style={{ marginTop: 8 }}>Cargando productos…</Text>
            </SafeAreaView>
        );
    }
    if (errorProducts) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <Text style={{ color: 'red' }}>{errorProducts}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#001D35" />

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.push('../../../tabs/list/type-selection')}
                >
                    <Icon name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Buscar Productos</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* SEARCH */}
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

            {/* NO RESULTS */}
            {filtered.length === 0 && query.trim().length > 0 && (
                <View style={styles.noResults}>
                    <Text>No se encontraron productos</Text>
                </View>
            )}

            {/* LISTA */}
            <FlatList
                data={filtered}
                keyExtractor={item => item.IdProducto.toString()}
                contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
                renderItem={({ item }) => {
                    const qty = quantities[item.IdProducto] || 0;
                    return (
                        <MotiView
                            from={{ opacity: 0, translateY: 20 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'timing', duration: 300 }}
                            style={styles.card}
                        >
                            <View style={styles.productRow}>
                                <Image
                                    source={{ uri: item.UrlImagen || '' }}
                                    style={styles.image}
                                    resizeMode="cover"
                                />
                                <Text style={styles.name}>{item.Nombre}</Text>
                                <View style={styles.qtyControls}>
                                    {qty > 0 && (
                                        <TouchableOpacity onPress={() => decrement(item.IdProducto)}>
                                            <Icon
                                                name={
                                                    qty === 1 ? 'trash-outline' : 'remove-circle-outline'
                                                }
                                                size={24}
                                                color={qty === 1 ? '#D1170F' : '#33618D'}
                                            />
                                        </TouchableOpacity>
                                    )}
                                    {qty > 0 && <Text style={styles.qtyText}>{qty}</Text>}
                                    <TouchableOpacity onPress={() => increment(item.IdProducto)}>
                                        <Icon name="add-circle-outline" size={24} color="#33618D" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </MotiView>
                    );
                }}
            />

            {/* BOTÓN Ver Productos */}
            {selectedCount > 0 && (
                <TouchableOpacity
                    style={styles.viewBtn}
                    onPress={() => setShowModal(true)}
                >
                    <Text style={styles.viewText}>Ver Productos ({selectedCount})</Text>
                </TouchableOpacity>
            )}

            {/* BOTÓN Continuar */}
            <TouchableOpacity
                style={[styles.continueBtn, !selectedCount && styles.btnDisabled]}
                disabled={!selectedCount}
                onPress={() => {
                    const outgoing: OutgoingProduct[] = allProducts
                        .filter(p => quantities[p.IdProducto] > 0)
                        .map(p => ({
                            IdProducto: p.IdProducto,
                            Nombre: p.Nombre,
                            UrlImagen: p.UrlImagen,
                            Cantidad: quantities[p.IdProducto],
                        }));
                    router.push({
                        pathname: './providers',
                        params: {
                            items: encodeURIComponent(JSON.stringify(outgoing)),
                        },
                    });
                }}
            >
                <Text style={styles.continueText}>
                    Continuar{selectedCount ? ` (${selectedCount})` : ''}
                </Text>
            </TouchableOpacity>

            {/* MODAL Ver Productos */}
            <Modal
                visible={showModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Productos seleccionados</Text>
                        <ScrollView>
                            {allProducts
                                .filter(p => quantities[p.IdProducto] > 0)
                                .map(p => {
                                    const qty = quantities[p.IdProducto];
                                    return (
                                        <View key={p.IdProducto} style={styles.modalRow}>
                                            <Image
                                                source={{ uri: p.UrlImagen || '' }}
                                                style={styles.modalImage}
                                            />
                                            <Text numberOfLines={1} style={styles.modalName}>
                                                {p.Nombre}
                                            </Text>
                                            <View style={styles.qtyControls}>
                                                <TouchableOpacity onPress={() => decrement(p.IdProducto)}>
                                                    <Icon
                                                        name={
                                                            qty === 1
                                                                ? 'trash-outline'
                                                                : 'remove-circle-outline'
                                                        }
                                                        size={24}
                                                        color={qty === 1 ? '#D1170F' : '#33618D'}
                                                    />
                                                </TouchableOpacity>
                                                <Text style={styles.qtyText}>{qty}</Text>
                                                <TouchableOpacity onPress={() => increment(p.IdProducto)}>
                                                    <Icon name="add-circle-outline" size={24} color="#33618D" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    );
                                })}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.modalCloseBtn}
                            onPress={() => setShowModal(false)}
                        >
                            <Text style={styles.modalCloseText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

////////////////////////////////////////////////////////////////////////////////
// ESTILOS (sin cambios)
////////////////////////////////////////////////////////////////////////////////
const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#F8F9FF',
    },
    container: { flex: 1, backgroundColor: '#F8F9FF' },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#001D35',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 16,
        paddingBottom: 12, paddingHorizontal: 16,
    },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '500' },

    searchWrap: {
        flexDirection: 'row', backgroundColor: '#E5E7EB',
        marginHorizontal: 16, marginTop: 16, marginBottom: 8,
        borderRadius: 8, paddingHorizontal: 12, alignItems: 'center',
    },
    searchInput: { flex: 1, height: 40, fontSize: 16 },

    noResults: { alignItems: 'center', paddingVertical: 20 },

    card: { marginBottom: 12 },
    productRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF', borderRadius: 12, padding: 12, elevation: 2,
    },
    image: { width: 56, height: 56, borderRadius: 8, marginRight: 12 },
    name: { flex: 1, fontSize: 16, fontWeight: '500' },

    qtyControls: {
        flexDirection: 'row', alignItems: 'center',
    },
    qtyText: {
        marginHorizontal: 8, fontSize: 16, fontWeight: '500',
    },

    viewBtn: {
        position: 'absolute', bottom: 80, left: 16, right: 16,
        backgroundColor: '#F3732A', padding: 14, borderRadius: 8,
        alignItems: 'center',
    },
    viewText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

    continueBtn: {
        position: 'absolute', bottom: 16, left: 16, right: 16,
        backgroundColor: '#33618D', padding: 16, borderRadius: 8,
        alignItems: 'center',
    },
    continueText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

    btnDisabled: { opacity: 0.6 },

    // Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        maxHeight: '60%', backgroundColor: '#FFF',
        borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 16,
    },
    modalTitle: {
        fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center',
    },
    modalRow: {
        flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    },
    modalImage: {
        width: 48, height: 48, borderRadius: 8, backgroundColor: '#eee',
        marginRight: 8,
    },
    modalName: { flex: 1, fontSize: 14, fontWeight: '500' },
    modalCloseBtn: {
        marginTop: 12, backgroundColor: '#001D35',
        borderRadius: 8, padding: 12, alignItems: 'center',
    },
    modalCloseText: { color: '#FFF', fontWeight: '600' },
});
