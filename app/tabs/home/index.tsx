// app/home/index.tsx

import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    Image,
    FlatList,
    StatusBar,
    Platform,
    useWindowDimensions,
    Pressable,
    ScrollView,
    StyleSheet,
} from 'react-native';
import axios from 'axios';
import { MotiView } from 'moti';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { Ionicons } from '@expo/vector-icons';

// --- TIPOS DE DATOS ---
type TipoProveedor = {
    IdTipoProveedor: number;
    NombreTipoProveedor: string;
};

type Proveedor = {
    IdProveedor: number;
    Nombre: string;
    UrlLogo: string;
    IdTipoProveedor: number;
};

type RelProductoProveedor = {
    IdProducto: number;
    IdProveedor: number;
    Precio: string;
    PrecioOferta?: string;
};

type Producto = {
    IdProducto: number;
    Nombre: string;
    UrlImagen: string;
    IdCategoria: number;
    IdUnidadMedida: number;
    Descripcion?: string;
    Precio: string;
    PrecioOferta?: string;
};

// --- COMPONENTE PRINCIPAL ---
export default function HomeScreenDynamic() {
    const { width: screenWidth } = useWindowDimensions();
    const CARD_WIDTH = Math.round(screenWidth * 0.6);

    // 1) TiposProveedor
    const [tipos, setTipos] = useState<TipoProveedor[]>([]);
    const [activeTipo, setActiveTipo] = useState<number | null>(null);

    // 2) Proveedores
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [activeProveedor, setActiveProveedor] = useState<number | null>(null);

    // 3) Productos
    const [productos, setProductos] = useState<Producto[]>([]);

    // Notificaciones (estático)
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationsData = [
        { id: 'n1', title: 'Ofertas y Promociones', desc: 'El arroz está a RD$50 menos.', time: 'Hace 4h', icon: 'information' },
        { id: 'n2', title: 'Recordatorio', desc: 'Revisa tu lista de compras.', time: 'Hace 1d', icon: 'cart-outline' },
        { id: 'n3', title: 'Actualización', desc: 'Leche bajó 15%.', time: 'Hace 12d', icon: 'pricetag-outline' },
    ];

    // --- 1) Cargo TiposProveedor al montar ---
    useEffect(() => {
        const start = Date.now();
        axios
            .get<TipoProveedor[]>('https://tobarato-api.alirizvi.dev/api/tipoproveedor')
            .then(({ data }) => {
                console.log('[timing] tipoproveedor:', Date.now() - start, 'ms');
                setTipos(data);
                if (data.length) setActiveTipo(data[0].IdTipoProveedor);
            })
            .catch(err => {
                console.error(err);
                console.log('[timing] tipoproveedor ERROR after', Date.now() - start, 'ms');
            });
    }, []);

    // --- 2) Cuando cambia el tipo, cargo Proveedores relativos ---
    useEffect(() => {
        if (activeTipo == null) return;
        const start = Date.now();
        axios
            .get<Proveedor[]>('https://tobarato-api.alirizvi.dev/api/proveedor')
            .then(({ data }) => {
                console.log('[timing] proveedor list:', Date.now() - start, 'ms');
                const filtrados = data.filter(p => p.IdTipoProveedor === activeTipo);
                setProveedores(filtrados);
                if (filtrados.length) setActiveProveedor(filtrados[0].IdProveedor);
            })
            .catch(err => {
                console.error(err);
                console.log('[timing] proveedor list ERROR after', Date.now() - start, 'ms');
            });
    }, [activeTipo]);

    // --- 3) Cuando cambia el proveedor, cargo Productos de ese proveedor ---
    useEffect(() => {
        if (activeProveedor == null) return;
        const startRels = Date.now();
        axios
            .get<RelProductoProveedor[]>('https://tobarato-api.alirizvi.dev/api/productoproveedor')
            .then(({ data }) => {
                console.log('[timing] productoproveedor:', Date.now() - startRels, 'ms');
                const rels = data.filter(r => r.IdProveedor === activeProveedor);
                const fetches = rels.map(r => {
                    const startProd = Date.now();
                    return axios
                        .get<Producto>(`https://tobarato-api.alirizvi.dev/api/producto/${r.IdProducto}`)
                        .then(res => {
                            console.log(
                                `[timing] producto/${r.IdProducto}:`,
                                Date.now() - startProd,
                                'ms'
                            );
                            return {
                                ...res.data,
                                Precio: r.Precio,
                                PrecioOferta: r.PrecioOferta,
                            } as Producto;
                        })
                        .catch(err => {
                            console.error(err);
                            console.log(
                                `[timing] producto/${r.IdProducto} ERROR after`,
                                Date.now() - startProd,
                                'ms'
                            );
                            throw err;
                        });
                });
                return Promise.all(fetches);
            })
            .then(fulls => {
                setProductos(fulls);
            })
            .catch(console.error);
    }, [activeProveedor]);

    // --- RENDER ---
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#001D35" />

            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Image
                        source={require('../../../assets/icons/logo.png')}
                        style={styles.logo}
                    />
                    <Text style={styles.headerText}>To' Barato</Text>
                </View>
                <Pressable onPress={() => setShowNotifications(true)}>
                    <Icon name="notifications-outline" size={28} color="#FFF" />
                </Pressable>
            </View>

            {/* OVERLAY DE NOTIFICACIONES */}
            {showNotifications && (
                <MotiView
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={styles.overlay}
                >
                    <MotiView
                        from={{ translateY: -400 }}
                        animate={{ translateY: 0 }}
                        exit={{ translateY: -400 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        style={styles.overlayBox}
                    >
                        <Text style={styles.overlayTitle}>Notificaciones</Text>
                        <ScrollView>
                            {notificationsData.map(n => (
                                <View key={n.id} style={styles.notifCard}>
                                    <Ionicons name={n.icon} size={24} color="#EDCA04" />
                                    <View style={styles.notifTextWrap}>
                                        <Text style={styles.notifTitle}>{n.title}</Text>
                                        <Text style={styles.notifDesc}>{n.desc}</Text>
                                        <Text style={styles.notifTime}>{n.time}</Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                        <Pressable style={styles.overlayClose} onPress={() => setShowNotifications(false)}>
                            <Text style={styles.overlayCloseText}>Cerrar</Text>
                        </Pressable>
                    </MotiView>
                </MotiView>
            )}

            {/* PESTAÑAS DE TIPOS */}
            <View style={styles.tabRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {tipos.map(t => (
                        <Pressable
                            key={t.IdTipoProveedor}
                            onPress={() => setActiveTipo(t.IdTipoProveedor)}
                            style={[
                                styles.tabItem,
                                { width: screenWidth / (tipos.length || 1) },
                                activeTipo === t.IdTipoProveedor && styles.tabActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTipo === t.IdTipoProveedor && styles.tabTextActive,
                                ]}
                            >
                                {t.NombreTipoProveedor}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            {/* BOTONES DE PROVEEDORES (solo logo) */}
            <View style={styles.providerRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {proveedores.map(p => (
                        <Pressable
                            key={p.IdProveedor}
                            onPress={() => setActiveProveedor(p.IdProveedor)}
                            style={[
                                styles.providerBtn,
                                activeProveedor === p.IdProveedor && styles.providerBtnActive,
                            ]}
                        >
                            <Image source={{ uri: p.UrlLogo }} style={styles.providerLogo} />
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            {/* CARDS DE PRODUCTOS */}
            <FlatList
                data={productos}
                keyExtractor={p => p.IdProducto.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 12, paddingLeft: 16 }}
                snapToInterval={CARD_WIDTH + 16}
                decelerationRate="fast"
                renderItem={({ item }) => <ProductCard item={item} width={CARD_WIDTH} />}
            />
        </SafeAreaView>
    );
}

// --- CARD DE PRODUCTO ---
function ProductCard({
    item,
    width,
}: {
    item: Producto;
    width: number;
}) {
    return (
        <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            style={{ width, marginRight: 16 }}
        >
            <Pressable
                onPress={() => router.push(`/product/${item.IdProducto}`)}
                style={styles.card}
            >
                <Image source={{ uri: item.UrlImagen }} style={styles.cardImage} />
                <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{item.Nombre}</Text>
                    <Text style={styles.cardPrice}>
                        {item.PrecioOferta ?? item.Precio}
                    </Text>
                </View>
            </Pressable>
        </MotiView>
    );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#001D35',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 16,
        paddingBottom: 12,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    logo: { width: 32, height: 48, marginRight: 8 },
    headerText: { color: '#FFF', fontSize: 20, fontWeight: '700' },

    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    overlayBox: {
        width: '85%',
        maxHeight: '70%',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
    },
    overlayTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    overlayClose: {
        marginTop: 12,
        alignSelf: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#001D35',
        borderRadius: 8,
    },
    overlayCloseText: { color: '#FFF', fontWeight: '600' },
    notifCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        alignItems: 'center',
        elevation: 2,
    },
    notifTextWrap: { marginLeft: 8, flex: 1 },
    notifTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    notifDesc: { fontSize: 14, color: '#555' },
    notifTime: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },

    tabRow: { backgroundColor: '#F8F9FF', paddingVertical: 8 },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    tabActive: { borderBottomWidth: 3, borderBottomColor: '#F3732A' },
    tabText: { fontSize: 14, color: '#555' },
    tabTextActive: { color: '#F3732A', fontWeight: '700' },

    providerRow: { paddingVertical: 12, paddingLeft: 16 },
    providerBtn: {
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        borderRadius: 15,
        padding: 8,
    },
    providerBtnActive: {
        borderWidth: 3,
        borderColor: 'rgba(243,115,42,0.6)',
        backgroundColor: '#FFF',
        borderRadius: 15,
    },
    providerLogo: {
        width: 60,
        height: 20,
        resizeMode: 'contain',
    },

    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 3,
    },
    cardImage: { width: '100%', aspectRatio: 1 },
    cardBody: { padding: 12 },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    cardPrice: { fontSize: 14, color: '#555' },
});
