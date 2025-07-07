// app/tabs/list/index.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StatusBar,
    Platform,
    useWindowDimensions,
    ActivityIndicator,
    StyleSheet,
    RefreshControl,
    ScrollView,
    Alert,
    Image,
    Linking,
} from 'react-native';
import { MotiView } from 'moti';
import { router } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';

type Lista = {
    IdUsuario: number;
    IdProveedor: number;
    Nombre: string;
    PrecioTotal: string;
    IdLista: number;
    FechaCreacion: string;
};

type ProveedorInfo = {
    IdProveedor: number;
    Nombre: string;
    UrlLogo: string;
};

type RutaSucursal = {
    IdSucursal: number;
    NombreSucursal: string;
    Latitud: number;
    Longitud: number;
    IdProveedor: number;
    Distancia: number;
};

export default function ShoppingListScreen() {
    const { height } = useWindowDimensions();

    const [listas, setListas] = useState<Lista[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [itemCounts, setItemCounts] = useState<Record<number, number>>({});
    const [proveedoresMap, setProveedoresMap] = useState<Record<number, ProveedorInfo>>({});
    const [selectedLists, setSelectedLists] = useState<Set<number>>(new Set());

    // --- 1) Fetch listas del usuario ---
    const fetchUserLists = useCallback(async () => {
        try {
            setLoading(true);
            const token = await SecureStore.getItemAsync('access_token');
            const userIdStr = await SecureStore.getItemAsync('user_id');
            if (!token || !userIdStr) {
                router.replace('/auth/IniciarSesion');
                return;
            }
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            const resp = await axios.get<Lista[]>('https://tobarato-api.alirizvi.dev/api/lista');
            const userId = Number(userIdStr);
            const propias = resp.data.filter((l) => l.IdUsuario === userId);
            setListas(propias);

            const counts: Record<number, number> = {};
            await Promise.all(
                propias.map(async (l) => {
                    try {
                        const r = await axios.get<any[]>(
                            `https://tobarato-api.alirizvi.dev/api/productosdelista/${l.IdLista}`
                        );
                        counts[l.IdLista] = r.data.length;
                    } catch {
                        counts[l.IdLista] = 0;
                    }
                })
            );
            setItemCounts(counts);

            const uniqueProv = Array.from(new Set(propias.map((l) => l.IdProveedor)));
            const provMap: Record<number, ProveedorInfo> = {};
            await Promise.all(
                uniqueProv.map(async (pid) => {
                    try {
                        const r = await axios.get<ProveedorInfo>(
                            `https://tobarato-api.alirizvi.dev/api/proveedor/${pid}`
                        );
                        provMap[pid] = r.data;
                    } catch {
                        /* ignore */
                    }
                })
            );
            setProveedoresMap(provMap);
        } catch (error) {
            console.error(error);
            await SecureStore.deleteItemAsync('access_token');
            await SecureStore.deleteItemAsync('refresh_token');
            await SecureStore.deleteItemAsync('user_id');
            delete axios.defaults.headers.common['Authorization'];
            router.replace('/auth/IniciarSesion');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchUserLists();
    }, [fetchUserLists]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchUserLists();
    }, [fetchUserLists]);

    // --- 2) Selección por LongPress ---
    const isSelecting = selectedLists.size > 0;
    const toggleSelection = (id: number) => {
        setSelectedLists((prev) => {
            const copy = new Set(prev);
            if (copy.has(id)) copy.delete(id);
            else copy.add(id);
            return copy;
        });
    };

    // --- 3) Generar ruta ---
    const handleGenerateRoute = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Sin permiso', 'Necesitamos tu ubicación para generar la ruta.');
                return;
            }
            const pos = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
            });
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            const provIds = listas
                .filter((l) => selectedLists.has(l.IdLista))
                .map((l) => l.IdProveedor);

            const resp = await axios.post<RutaSucursal[]>(
                'https://tobarato-api.alirizvi.dev/api/ruta-multiples-listas',
                { lat, lng, ids_proveedores: provIds }
            );
            const rutas = resp.data;
            if (!rutas.length) {
                Alert.alert('Ruta', 'No se encontraron sucursales para esa selección.');
                return;
            }

            const origin = `${lat},${lng}`;
            const coords = rutas.map((r) => `${r.Latitud},${r.Longitud}`);
            if (Platform.OS === 'ios') {
                const daddr = coords.map((c) => `&daddr=${c}`).join('');
                Linking.openURL(`http://maps.apple.com/?saddr=${origin}${daddr}`);
            } else {
                const destination = coords[coords.length - 1];
                const waypoints = coords.slice(0, -1).join('|');
                const url =
                    `https://www.google.com/maps/dir/?api=1&origin=${origin}` +
                    `&destination=${destination}` +
                    (waypoints ? `&waypoints=${waypoints}` : '') +
                    `&travelmode=driving`;
                Linking.openURL(url);
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'No se pudo generar la ruta. Intenta nuevamente.');
        }
    };

    // --- 4) Renderizado ---
    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#33618D" />
            </SafeAreaView>
        );
    }

    const FloatingAddButton = (
        <TouchableOpacity
            onPress={() => router.push('../../tabs/list/type-selection')}
            style={[styles.floatingButton, styles.floatingButtonShadow]}
            activeOpacity={0.8}
        >
            <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
    );

    // Si no hay listas
    if (!listas.length) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#001D35" />
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Lista de Compras</Text>
                </View>
                <ScrollView
                    style={{ flex: 1, backgroundColor: '#F8F9FF' }}
                    contentContainerStyle={[styles.noListsContainer, { minHeight: height }]}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    <Text style={styles.noListsText}>Aún no ha creado una lista.</Text>
                </ScrollView>
                {FloatingAddButton}
            </SafeAreaView>
        );
    }

    // Con listas
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#001D35" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Lista de Compras</Text>
            </View>

            {/* FlatList de listas */}
            <FlatList
                data={listas}
                keyExtractor={(l) => l.IdLista.toString()}
                renderItem={({ item, index }) => {
                    const count = itemCounts[item.IdLista] || 0;
                    const provInfo = proveedoresMap[item.IdProveedor];
                    const selected = selectedLists.has(item.IdLista);

                    return (
                        <MotiView
                            from={{ opacity: 0, translateY: 20 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ delay: index * 100, type: 'timing', duration: 400 }}
                            style={styles.listItemContainer}
                        >
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={[styles.listItemButton, selected && styles.listItemActive]}
                                onPress={() => {
                                    if (isSelecting) toggleSelection(item.IdLista);
                                    else
                                        router.push({
                                            pathname: `../tabs/list/${item.IdLista}`,
                                            params: { idProveedor: String(item.IdProveedor) },
                                        });
                                }}
                                onLongPress={() => toggleSelection(item.IdLista)}
                            >
                                {provInfo ? (
                                    <Image
                                        source={{ uri: provInfo.UrlLogo }}
                                        style={styles.proveedorLogo}
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <Ionicons
                                        name="storefront-outline"
                                        size={28}
                                        color="#33618D"
                                        style={{ marginHorizontal: 12 }}
                                    />
                                )}
                                <View style={styles.listItemTextContainer}>
                                    <Text style={styles.listItemTitle}>{item.Nombre}</Text>
                                    <Text style={styles.listItemSubtitle}>
                                        {count} artículo{count === 1 ? '' : 's'}
                                    </Text>
                                    <Text style={styles.listItemPrice}>
                                        RD${parseFloat(item.PrecioTotal).toFixed(2)}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() =>
                                        Alert.alert('Eliminar lista', '¿Seguro deseas eliminar esta lista?', [
                                            { text: 'Cancelar', style: 'cancel' },
                                            {
                                                text: 'Eliminar',
                                                style: 'destructive',
                                                onPress: async () => {
                                                    try {
                                                        await axios.delete(
                                                            `https://tobarato-api.alirizvi.dev/api/lista/${item.IdLista}`
                                                        );
                                                        fetchUserLists();
                                                    } catch {
                                                        Alert.alert('Error', 'No se pudo eliminar.');
                                                    }
                                                },
                                            },
                                        ])
                                    }
                                    style={styles.iconButton}
                                >
                                    <MaterialCommunityIcons name="delete" size={24} color="red" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        </MotiView>
                    );
                }}
                contentContainerStyle={{ paddingTop: 16, paddingBottom: height * 0.2 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />

            {/* Botón “Generar Ruta” */}
            {isSelecting && (
                <TouchableOpacity
                    style={[styles.routeBtn, selectedLists.size === 0 && styles.btnDisabled]}
                    disabled={selectedLists.size === 0}
                    onPress={handleGenerateRoute}
                >
                    <Text style={styles.routeBtnText}>
                        Generar Ruta ({selectedLists.size})
                    </Text>
                </TouchableOpacity>
            )}

            {/* + Siempre visible */}
            {FloatingAddButton}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FF' },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: '#001D35',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 38,
        paddingBottom: 12,
    },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '500' },

    noListsContainer: { justifyContent: 'center', alignItems: 'center' },
    noListsText: { fontSize: 16, color: '#555' },

    listItemContainer: { marginHorizontal: 16, marginBottom: 16 },
    listItemButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 12,
        elevation: 2,
    },
    listItemActive: { borderColor: '#F3732A', borderWidth: 2 },
    proveedorLogo: { width: 40, height: 40, borderRadius: 8, marginHorizontal: 12 },
    listItemTextContainer: { flex: 1 },
    listItemTitle: { fontSize: 16, fontWeight: '600', color: '#101418' },
    listItemSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 4 },
    listItemPrice: { fontSize: 14, color: '#333', marginTop: 2, fontWeight: '500' },

    iconButton: { paddingHorizontal: 8 },

    routeBtn: {
        position: 'absolute',
        bottom: 88,
        left: 16,
        right: 16,
        backgroundColor: '#F3732A',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    routeBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    btnDisabled: { opacity: 0.6 },

    floatingButton: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: '#F3732A',
        borderRadius: 28,
        padding: 16,
    },
    floatingButtonShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
});
