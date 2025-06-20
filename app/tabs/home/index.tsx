import React, { useState, useEffect, useMemo } from 'react';
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
    ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { MotiView } from 'moti';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { Ionicons } from '@expo/vector-icons';

type TipoProveedor = { IdTipoProveedor: number; NombreTipoProveedor: string };
type Proveedor = {
    IdProveedor: number;
    Nombre: string;
    UrlLogo: string;
    IdTipoProveedor: number;
};
type ProductoProveedorResponse = {
    IdProducto: number;
    IdProveedor: number;
    Precio: string;
    PrecioOferta?: string | null;
    DescripcionOferta?: string | null;
    FechaOferta?: string;
    FechaPrecio?: string;
    Producto: {
        IdCategoria: number;
        IdUnidadMedida: number;
        Nombre: string;
        UrlImagen: string | null;
        Descripcion: string;
    };
};
type Producto = {
    IdProducto: number;
    Nombre: string;
    UrlImagen: string | null;
    IdCategoria: number;
    IdUnidadMedida: number;
    Descripcion?: string;
    Precio: string;
    PrecioOferta?: string;
};
type Categoria = { IdCategoria: number; NombreCategoria: string };
type UnidadMedida = { IdUnidadMedida: number; NombreUnidadMedida: string };

export default function HomeScreenDynamic() {
    const { width: screenWidth } = useWindowDimensions();
    const CARD_WIDTH = Math.round(screenWidth * 0.6);

    const [tipos, setTipos] = useState<TipoProveedor[]>([]);
    const [activeTipo, setActiveTipo] = useState<number | null>(null);

    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [activeProveedor, setActiveProveedor] = useState<number | null>(null);

    const [productos, setProductos] = useState<Producto[]>([]);
    const [loadingProductos, setLoadingProductos] = useState(true);

    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [unidadesMap, setUnidadesMap] = useState<Record<number, string>>({});

    const [showNotifications, setShowNotifications] = useState(false);
    const notificationsData = [
        { id: 'n1', title: 'Ofertas y Promociones', desc: 'El arroz está a RD$50 menos.', time: 'Hace 4h', icon: 'information' },
        { id: 'n2', title: 'Recordatorio', desc: 'Revisa tu lista de compras.', time: 'Hace 1d', icon: 'cart-outline' },
        { id: 'n3', title: 'Actualización', desc: 'Leche bajó 15%.', time: 'Hace 12d', icon: 'pricetag-outline' },
    ];

    // 1) Cargar tipos
    useEffect(() => {
        axios.get<TipoProveedor[]>('https://tobarato-api.alirizvi.dev/api/tipoproveedor')
            .then(({ data }) => {
                setTipos(data);
                if (data.length) setActiveTipo(data[0].IdTipoProveedor);
            })
            .catch(console.error);
    }, []);

    // 2) Cargar proveedores al cambiar tipo
    useEffect(() => {
        if (activeTipo == null) return;
        axios.get<Proveedor[]>('https://tobarato-api.alirizvi.dev/api/proveedor')
            .then(({ data }) => {
                const filt = data.filter(p => p.IdTipoProveedor === activeTipo);
                setProveedores(filt);
                if (filt.length) setActiveProveedor(filt[0].IdProveedor);
            })
            .catch(console.error);
    }, [activeTipo]);

    // 3) Cargar productos al cambiar proveedor
    useEffect(() => {
        if (activeProveedor == null) {
            setProductos([]);
            setLoadingProductos(false);
            return;
        }
        setLoadingProductos(true);
        axios.get<ProductoProveedorResponse[]>(
            `https://tobarato-api.alirizvi.dev/api/precios-productos/proveedor/${activeProveedor}`
        )
            .then(({ data }) => {
                const mapped: Producto[] = data.map(item => ({
                    IdProducto: item.IdProducto,
                    Nombre: item.Producto.Nombre,
                    UrlImagen: item.Producto.UrlImagen,
                    IdCategoria: item.Producto.IdCategoria,
                    IdUnidadMedida: item.Producto.IdUnidadMedida,
                    Descripcion: item.Producto.Descripcion,
                    Precio: item.Precio,
                    PrecioOferta: item.PrecioOferta ?? undefined,
                }));
                setProductos(mapped);
            })
            .catch(console.error)
            .finally(() => setLoadingProductos(false));
    }, [activeProveedor]);

    // 4) Cargar categorías
    useEffect(() => {
        axios.get<Categoria[]>('https://tobarato-api.alirizvi.dev/api/categoria')
            .then(({ data }) => setCategorias(data))
            .catch(console.error);
    }, []);

    // 5) Cargar unidades
    useEffect(() => {
        axios.get<UnidadMedida[]>('https://tobarato-api.alirizvi.dev/api/unidadmedida')
            .then(({ data }) => {
                const m: Record<number, string> = {};
                data.forEach(u => m[u.IdUnidadMedida] = u.NombreUnidadMedida);
                setUnidadesMap(m);
            })
            .catch(console.error);
    }, []);

    // proveedor activo objeto
    const proveedorActivoObj = useMemo(
        () => proveedores.find(p => p.IdProveedor === activeProveedor) || null,
        [activeProveedor, proveedores]
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#001D35" />

            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Image source={require('../../../assets/icons/logo.png')} style={styles.logo} />
                    <Text style={styles.headerText}>To' Barato</Text>
                </View>
                <Pressable onPress={() => setShowNotifications(true)}>
                    <Icon name="notifications-outline" size={28} color="#FFF" />
                </Pressable>
            </View>

            {/* NOTIFICATIONS OVERLAY */}
            {showNotifications && (
                <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.overlay}>
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
                                    <Ionicons name={n.icon as any} size={24} color="#EDCA04" />
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

            {/* TABS TIPOS */}
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
                            <Text style={[styles.tabText, activeTipo === t.IdTipoProveedor && styles.tabTextActive]}>
                                {t.NombreTipoProveedor}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            {/* PROVEEDORES LOGOS */}
            <View style={styles.providerRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {proveedores.map(p => (
                        <Pressable
                            key={p.IdProveedor}
                            onPress={() => setActiveProveedor(p.IdProveedor)}
                            style={[styles.providerBtn, activeProveedor === p.IdProveedor && styles.providerBtnActive]}
                        >
                            <Image source={{ uri: p.UrlLogo }} style={styles.providerLogo} />
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            {/* PRODUCTOS */}
            {loadingProductos ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#33618D" />
                </View>
            ) : (
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    {categorias.map(cat => {
                        const productosPorCategoria = productos.filter(p => p.IdCategoria === cat.IdCategoria);
                        if (!productosPorCategoria.length) return null;
                        return (
                            <View key={cat.IdCategoria} style={styles.categorySection}>
                                <Text style={styles.categoryTitle}>{cat.NombreCategoria}</Text>
                                <FlatList
                                    data={productosPorCategoria}
                                    keyExtractor={p => p.IdProducto.toString()}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ paddingVertical: 12, paddingLeft: 16 }}
                                    snapToInterval={CARD_WIDTH + 16}
                                    decelerationRate="fast"
                                    renderItem={({ item }) => {
                                        // Datos para pasar a detalle:
                                        const dto = {
                                            IdProducto: item.IdProducto,
                                            Nombre: item.Nombre,
                                            UrlImagen: item.UrlImagen,
                                            Precio: item.Precio,
                                            PrecioOferta: item.PrecioOferta,
                                            Descripcion: item.Descripcion,
                                            Unidad: unidadesMap[item.IdUnidadMedida] || '—',
                                            Categoria: cat.NombreCategoria,
                                            ProveedorNombre: proveedorActivoObj?.Nombre,
                                            ProveedorLogo: proveedorActivoObj?.UrlLogo,
                                        };
                                        return (
                                            <MotiView
                                                from={{ opacity: 0, translateY: 20 }}
                                                animate={{ opacity: 1, translateY: 0 }}
                                                transition={{ type: 'timing', duration: 400 }}
                                                style={{ width: CARD_WIDTH, marginRight: 16 }}
                                            >
                                                <Pressable
                                                    style={styles.card}
                                                    onPress={() =>
                                                        router.push({
                                                            pathname: `../tabs/product/${item.IdProducto}`,
                                                            params: {
                                                                data: encodeURIComponent(JSON.stringify({
                                                                    IdProducto: item.IdProducto,
                                                                    Nombre: item.Nombre,
                                                                    UrlImagen: item.UrlImagen,
                                                                    Precio: item.Precio,
                                                                    Descripcion: item.Descripcion,
                                                                    Unidad: dto.Unidad,
                                                                    Categoria: dto.Categoria,
                                                                    ProveedorNombre: proveedorActivoObj?.Nombre,
                                                                    ProveedorLogo: proveedorActivoObj?.UrlLogo,
                                                                })),
                                                            },
                                                        })
                                                    }
                                                >
                                                    <Image source={{ uri: item.UrlImagen ?? undefined }} style={styles.cardImage} />
                                                    <View style={styles.cardBody}>
                                                        <Text style={styles.cardTitle}>{item.Nombre}</Text>
                                                        <View style={styles.priceRow}>
                                                            <Text style={styles.cardPrice}>
                                                                RD${item.PrecioOferta ?? item.Precio}
                                                            </Text>
                                                            <Text style={styles.cardUnit}> {dto.Unidad}</Text>
                                                        </View>
                                                    </View>
                                                    {dto.ProveedorLogo && (
                                                        <Image source={{ uri: dto.ProveedorLogo }} style={styles.providerLogoOnCard} />
                                                    )}
                                                </Pressable>
                                            </MotiView>
                                        );
                                    }}
                                />
                            </View>
                        );
                    })}
                </ScrollView>
            )
            }
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FF' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#001D35',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 16,
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    logo: { width: 32, height: 48, marginRight: 8, resizeMode: 'contain' },
    headerText: { color: '#FFF', fontSize: 20, fontWeight: '700' },

    overlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center',
        alignItems: 'center', zIndex: 100,
    },
    overlayBox: {
        width: '85%', maxHeight: '70%', backgroundColor: '#FFF',
        borderRadius: 12, padding: 20,
    },
    overlayTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
    overlayClose: {
        marginTop: 12, alignSelf: 'center', paddingVertical: 8,
        paddingHorizontal: 16, backgroundColor: '#001D35', borderRadius: 8,
    },
    overlayCloseText: { color: '#FFF', fontWeight: '600' },
    notifCard: {
        flexDirection: 'row', backgroundColor: '#FFF', padding: 12,
        borderRadius: 8, marginBottom: 12, alignItems: 'center', elevation: 2,
    },
    notifTextWrap: { marginLeft: 8, flex: 1 },
    notifTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    notifDesc: { fontSize: 14, color: '#555' },
    notifTime: { fontSize: 12, color: '#999', marginTop: 4 },

    tabRow: { backgroundColor: '#F8F9FF', paddingVertical: 8 },
    tabItem: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
    tabActive: { borderBottomWidth: 3, borderBottomColor: '#F3732A' },
    tabText: { fontSize: 14, color: '#555' },
    tabTextActive: { color: '#F3732A', fontWeight: '700' },

    providerRow: { paddingVertical: 12, paddingLeft: 16 },
    providerBtn: { marginRight: 12, backgroundColor: '#FFF', borderRadius: 15, padding: 8 },
    providerBtnActive: { borderWidth: 3, borderColor: 'rgba(243,115,42,0.6)', borderRadius: 15 },
    providerLogo: { width: 60, height: 20, resizeMode: 'contain' },

    categorySection: { marginBottom: 24 },
    categoryTitle: { fontSize: 18, fontWeight: '700', color: '#101418', marginLeft: 16, marginBottom: 8 },

    card: { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', elevation: 3 },
    cardImage: { width: '100%', aspectRatio: 1 },
    cardBody: { padding: 12, paddingBottom: 32 },
    cardTitle: { fontSize: 16, fontWeight: '600', color: '#101418', marginBottom: 4 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline' },
    cardPrice: { fontSize: 16, color: '#33618D', fontWeight: '700' },
    cardUnit: { fontSize: 12, color: '#555', marginLeft: 4 },
    providerLogoOnCard: {
        position: 'absolute', bottom: 8, right: 8,
        width: 40, height: 16, resizeMode: 'contain',
        backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 4,
    },
});
