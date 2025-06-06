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
} from 'react-native';
import { MotiView } from 'moti';
import { router } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Lista = {
    IdUsuario: number;
    IdProveedor: number;
    Nombre: string;
    PrecioTotal: string;
    IdLista: number;
    FechaCreacion: string;
};

type ProveedorInfo = {
    IdTipoProveedor: number;
    Nombre: string;
    UrlLogo: string;
    UrlPaginaWeb: string;
    EnvioDomicilio: boolean;
    IdProveedor: number;
    FechaCreacion: string;
};

export default function ShoppingListScreen() {
    const { height } = useWindowDimensions();
    const [listas, setListas] = useState<Lista[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    // itemCounts[IdLista] = número de productos que tiene esa lista
    const [itemCounts, setItemCounts] = useState<Record<number, number>>({});

    // proveedoresMap[IdProveedor] = datos completos del proveedor (logo, nombre, etc.)
    const [proveedoresMap, setProveedoresMap] = useState<Record<number, ProveedorInfo>>({});

    /**
     * fetchUserLists:
     *   1) Lee token y user_id desde SecureStore
     *   2) Pide GET /lista
     *   3) Filtra solo las listas del usuario actual
     *   4) Para cada lista obtenida, llama a /Productosdelista/{IdLista} y guarda la cantidad
     *   5) Lee los proveedores de cada lista: GET /proveedor/{IdProveedor}, los guarda en proveedoresMap
     */
    const fetchUserLists = useCallback(async () => {
        try {
            const token = await SecureStore.getItemAsync('access_token');
            const userIdStr = await SecureStore.getItemAsync('user_id');

            if (!token || !userIdStr) {
                // Si falta token o user_id, redirigimos a login
                router.replace('/auth/IniciarSesion');
                return;
            }

            // Fijamos el header de autorización para todas las peticiones axios
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // ==============================
            // 1) GET /lista
            // ==============================
            const resp = await axios.get<Lista[]>('https://tobarato-api.alirizvi.dev/api/lista');
            const todasLasListas = resp.data;

            // 2) Filtrar solo las listas que pertenecen a este usuario
            const userIdNum = parseInt(userIdStr, 10);
            const propias = todasLasListas.filter((l) => l.IdUsuario === userIdNum);
            setListas(propias);

            // ==============================
            // 3) Para cada lista, obtener la cantidad de productos
            //    vía GET /productosdelista/{IdLista}
            // ==============================
            const counts: Record<number, number> = {};
            await Promise.all(
                propias.map(async (lista) => {
                    try {
                        const respProd = await axios.get<
                            Array<{ IdLista: number; IdProducto: number }>
                        >(`https://tobarato-api.alirizvi.dev/api/productosdelista/${lista.IdLista}`);
                        counts[lista.IdLista] = respProd.data.length;
                    } catch (err) {
                        console.warn(
                            `[ShoppingList] No se pudo obtener productos de lista ${lista.IdLista}:`,
                            err
                        );
                        counts[lista.IdLista] = 0;
                    }
                })
            );
            setItemCounts(counts);

            // ==============================
            // 4) Para cada lista, obtener datos del proveedor:
            //    GET /proveedor/{IdProveedor}
            // ==============================
            // Construimos un array de IdProveedor únicos (para no pedir dos veces el mismo)
            const uniqueProveedorIds = Array.from(new Set(propias.map((l) => l.IdProveedor)));

            // Para cada proveedor pendiente en uniqueProveedorIds, solicitamos su info
            const provMapCopy: Record<number, ProveedorInfo> = {};
            await Promise.all(
                uniqueProveedorIds.map(async (provId) => {
                    try {
                        const respProv = await axios.get<ProveedorInfo>(
                            `https://tobarato-api.alirizvi.dev/api/proveedor/${provId}`
                        );
                        provMapCopy[provId] = respProv.data;
                    } catch (err) {
                        console.warn(`[ShoppingList] No se pudo obtener proveedor ${provId}:`, err);
                    }
                })
            );
            setProveedoresMap(provMapCopy);
        } catch (error) {
            console.error('[ShoppingList] Error al obtener listas:', error);
            // En caso de error (token expirado, etc.) borramos credenciales y llevamos a login
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

    // 1) Al montar, ejecuta fetchUserLists
    useEffect(() => {
        fetchUserLists();
    }, [fetchUserLists]);

    // 2) Pull‐to‐refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchUserLists();
    }, [fetchUserLists]);

    // 3) Handler para eliminar una lista dada su id
    const handleDeleteList = async (listaId: number) => {
        Alert.alert('Eliminar lista', '¿Estás seguro de que deseas eliminar esta lista?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                    try {
                        // DELETE /lista/{id}
                        await axios.delete(`https://tobarato-api.alirizvi.dev/api/lista/${listaId}`);
                        // Una vez eliminado, volvemos a recargar las listas
                        fetchUserLists();
                    } catch (error) {
                        console.error('[ShoppingList] Error al eliminar lista:', error);
                        Alert.alert('Error', 'No se pudo eliminar la lista. Intenta nuevamente.');
                    }
                },
            },
        ]);
    };

    // 4) Componente para cada fila de FlatList
    function ListItem({
        lista,
        index,
        count,
    }: {
        lista: Lista;
        index: number;
        count: number;
    }) {
        // Obtenemos datos del proveedor para esta lista (puede ser undefined si aún no llegó)
        const provInfo = proveedoresMap[lista.IdProveedor];

        return (
            <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: index * 100, type: 'timing', duration: 400 }}
                style={styles.listItemContainer}
            >
                <TouchableOpacity
                    onPress={() => {
                        // Navegar al detalle de la lista
                        router.push({
                            pathname: `../tabs/list/${lista.IdLista}`,
                            params: { idProveedor: String(lista.IdProveedor) },
                        });

                    }}
                    activeOpacity={0.8}
                    style={styles.listItemButton}
                >
                    {/* Si tenemos provInfo, mostramos su logo; si no, mostramos el ícono genérico */}
                    {provInfo ? (
                        <Image
                            source={{ uri: provInfo.UrlLogo }}
                            style={styles.proveedorLogo}
                            resizeMode="contain"
                        />
                    ) : (
                        <Ionicons name="storefront-outline" size={28} color="#33618D" style={{ marginRight: 12 }} />
                    )}

                    <View style={styles.listItemTextContainer}>
                        <Text style={styles.listItemTitle}>{lista.Nombre}</Text>
                        <Text style={styles.listItemSubtitle}>
                            {count} artículo{count === 1 ? '' : 's'}
                        </Text>
                        <Text style={styles.listItemPrice}>
                            RD${parseFloat(lista.PrecioTotal).toFixed(2)}
                        </Text>
                    </View>

                    {/* Botón de “tres puntos” que despliega la opción Eliminar */}
                    <TouchableOpacity
                        onPress={() => handleDeleteList(lista.IdLista)}
                        style={styles.listItemDotButton}
                    >
                        <MaterialCommunityIcons name="delete" size={24} color="red" />
                    </TouchableOpacity>
                </TouchableOpacity>
            </MotiView>
        );
    }

    // 5) Mostrar spinner inicial mientras loading = true y no estamos refrescando
    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#33618D" />
            </SafeAreaView>
        );
    }

    // 6) Si no hay listas, mostrar mensaje con pull‐to‐refresh
    if (!listas.length) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#001D35" />

                {/* Header */}
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

                {/* Botón flotante para crear nueva lista */}
                <TouchableOpacity
                    onPress={() => router.push('../../tabs/list/add')}
                    style={[styles.floatingButton, styles.floatingButtonShadow]}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // 7) Si hay listas, renderizamos el FlatList con pull‐to‐refresh habilitado
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#001D35" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Lista de Compras</Text>
                {/* <TouchableOpacity
                    onPress={() => router.push('../../tabs/list/add')}
                    style={styles.addButtonHeader}
                >
                    <Ionicons name="add-circle-outline" size={34} color="#FFFFFF" />
                </TouchableOpacity> */}
            </View>

            <FlatList
                data={listas}
                renderItem={({ item, index }) => (
                    <ListItem
                        lista={item}
                        index={index}
                        count={itemCounts[item.IdLista] || 0}
                    />
                )}
                keyExtractor={(item) => item.IdLista.toString()}
                contentContainerStyle={{
                    paddingTop: 16,
                    paddingBottom: height * 0.15,
                }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />

            {/* Botón flotante para crear nueva lista */}
            <TouchableOpacity
                onPress={() => router.push('../../tabs/list/add')}
                style={[styles.floatingButton, styles.floatingButtonShadow]}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#001D35',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 38,
        paddingBottom: 12,
        paddingHorizontal: 16,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '500',
        bottom: 12,
    },
    addButtonHeader: {
        position: 'absolute',
        right: 16,
        padding: 4,
        marginTop: 4,
    },
    noListsContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    noListsText: {
        fontSize: 16,
        color: '#555',
    },
    listItemContainer: {
        marginHorizontal: 16,
        marginBottom: 16,
    },
    listItemButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
        elevation: 4,
    },
    listItemTextContainer: {
        flex: 1,
        marginLeft: 16,
    },
    listItemTitle: {
        fontSize: 18,
        fontWeight: '500',
        color: '#101418',
    },
    listItemSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    listItemPrice: {
        fontSize: 14,
        color: '#333',
        marginTop: 2,
        fontWeight: '500',
    },
    listItemDotButton: {
        padding: 8,
        borderRadius: 20,
    },
    proveedorLogo: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginRight: 12,
    },
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
