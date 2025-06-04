// app/home/index.tsx

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
    Precio: string;        // precio normal (string)
    PrecioOferta?: string; // precio oferta (string, opcional)
};

type Categoria = {
    IdCategoria: number;
    NombreCategoria: string;
};

type UnidadMedida = {
    IdUnidadMedida: number;
    NombreUnidadMedida: string;
};

// --- COMPONENTE PRINCIPAL ---
export default function HomeScreenDynamic() {
    const { width: screenWidth } = useWindowDimensions();
    // Cada tarjeta ocupará aproximadamente el 60% del ancho de pantalla:
    const CARD_WIDTH = Math.round(screenWidth * 0.6);

    // 1) TIPOS DE PROVEEDOR
    const [tipos, setTipos] = useState<TipoProveedor[]>([]);
    const [activeTipo, setActiveTipo] = useState<number | null>(null);

    // 2) PROVEEDORES
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [activeProveedor, setActiveProveedor] = useState<number | null>(null);

    // 3) RELACIÓN PRODUCTO-PROVEEDOR
    const [rels, setRels] = useState<RelProductoProveedor[]>([]);

    // 4) PRODUCTOS “COMPLETOS” (incluye Precio y PrecioOferta ya mezclados)
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loadingProductos, setLoadingProductos] = useState<boolean>(true);

    // 5) CATEGORÍAS
    const [categorias, setCategorias] = useState<Categoria[]>([]);

    // 6) UNIDADES DE MEDIDA
    const [unidadesMap, setUnidadesMap] = useState<Record<number, string>>({});

    // Estado local para notificaciones (estático)
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationsData = [
        {
            id: 'n1',
            title: 'Ofertas y Promociones',
            desc: 'El arroz está a RD$50 menos.',
            time: 'Hace 4h',
            icon: 'information',
        },
        {
            id: 'n2',
            title: 'Recordatorio',
            desc: 'Revisa tu lista de compras.',
            time: 'Hace 1d',
            icon: 'cart-outline',
        },
        {
            id: 'n3',
            title: 'Actualización',
            desc: 'Leche bajó 15%.',
            time: 'Hace 12d',
            icon: 'pricetag-outline',
        },
    ];

    // --- 1) Cargo TIPOS DE PROVEEDOR al montar ---
    useEffect(() => {
        axios
            .get<TipoProveedor[]>('https://tobarato-api.alirizvi.dev/api/tipoproveedor')
            .then(({ data }) => {
                setTipos(data);
                if (data.length) setActiveTipo(data[0].IdTipoProveedor);
            })
            .catch((err) => {
                console.error('Error cargando tipos de proveedor:', err);
            });
    }, []);

    // --- 2) Cuando cambia activeTipo, cargo PROVEEDORES correspondientes ---
    useEffect(() => {
        if (activeTipo == null) return;

        axios
            .get<Proveedor[]>('https://tobarato-api.alirizvi.dev/api/proveedor')
            .then(({ data }) => {
                const filtrados = data.filter((p) => p.IdTipoProveedor === activeTipo);
                setProveedores(filtrados);
                if (filtrados.length) setActiveProveedor(filtrados[0].IdProveedor);
            })
            .catch((err) => {
                console.error('Error cargando proveedores:', err);
            });
    }, [activeTipo]);

    // --- 3) Cargo todas las RELACIONES producto-proveedor ---
    //     (servirá para filtrar por proveedor activo y luego traer cada producto)
    useEffect(() => {
        axios
            .get<RelProductoProveedor[]>('https://tobarato-api.alirizvi.dev/api/productoproveedor')
            .then(({ data }) => {
                setRels(data);
            })
            .catch((err) => {
                console.error('Error cargando relaciones producto-proveedor:', err);
            });
    }, []);

    // --- 4) Cuando cambia activeProveedor O rels, recargo PRODUCTOS “completos” ---
    useEffect(() => {
        if (activeProveedor == null) {
            setProductos([]);
            setLoadingProductos(false);
            return;
        }
        setLoadingProductos(true);

        // Filtramos solo las relaciones de este proveedor:
        const relsDelProveedor = rels.filter((r) => r.IdProveedor === activeProveedor);

        // Para cada relación, hacemos un GET de producto/{id} y luego inyectamos Precio/PrecioOferta:
        const fetches = relsDelProveedor.map((r) => {
            return axios
                .get<Producto>(`https://tobarato-api.alirizvi.dev/api/producto/${r.IdProducto}`)
                .then((res) => {
                    const prod = res.data;
                    prod.Precio = r.Precio;
                    prod.PrecioOferta = r.PrecioOferta;
                    return prod;
                });
        });

        Promise.all(fetches)
            .then((fullProducts) => {
                setProductos(fullProducts);
            })
            .catch((err) => {
                console.error('Error cargando detalles de productos:', err);
            })
            .finally(() => {
                setLoadingProductos(false);
            });
    }, [activeProveedor, rels]);

    // --- 5) Cargo CATEGORÍAS (para agrupar en carruseles) ---
    useEffect(() => {
        axios
            .get<Categoria[]>('https://tobarato-api.alirizvi.dev/api/categoria')
            .then(({ data }) => {
                setCategorias(data);
            })
            .catch((err) => {
                console.error('Error cargando categorías:', err);
            });
    }, []);

    // --- 6) Cargo UNIDADES DE MEDIDA (para mostrar abreviación o nombre) ---
    useEffect(() => {
        axios
            .get<UnidadMedida[]>('https://tobarato-api.alirizvi.dev/api/unidadmedida')
            .then(({ data }) => {
                // Construimos un mapa { IdUnidadMedida: NombreUnidadMedida }
                const map: Record<number, string> = {};
                data.forEach((u) => {
                    map[u.IdUnidadMedida] = u.NombreUnidadMedida;
                });
                setUnidadesMap(map);
            })
            .catch((err) => {
                console.error('Error cargando unidades de medida:', err);
            });
    }, []);

    // --- 7) Para obtener rápidamente el logo del proveedor activo ---
    const proveedorActivoObj = useMemo(() => {
        return proveedores.find((p) => p.IdProveedor === activeProveedor) || null;
    }, [activeProveedor, proveedores]);

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
                            {notificationsData.map((n) => (
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
                        <Pressable
                            style={styles.overlayClose}
                            onPress={() => setShowNotifications(false)}
                        >
                            <Text style={styles.overlayCloseText}>Cerrar</Text>
                        </Pressable>
                    </MotiView>
                </MotiView>
            )}

            {/* PESTAÑAS DE TIPOS DE PROVEEDOR */}
            <View style={styles.tabRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {tipos.map((t) => (
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
                    {proveedores.map((p) => (
                        <Pressable
                            key={p.IdProveedor}
                            onPress={() => setActiveProveedor(p.IdProveedor)}
                            style={[
                                styles.providerBtn,
                                activeProveedor === p.IdProveedor && styles.providerBtnActive,
                            ]}
                        >
                            <Image
                                source={{ uri: p.UrlLogo }}
                                style={styles.providerLogo}
                            />
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            {/* SI AÚN ESTAMOS CARGANDO PRODUCTOS, MOSTRAMOS SPINNER */}
            {loadingProductos ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#33618D" />
                </View>
            ) : (
                /* SCROLL PRINCIPAL: Distintos carruseles por categoría */
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    {categorias.map((cat) => {
                        // Filtramos los productos que pertenezcan a esta categoría:
                        const productosPorCategoria = productos.filter(
                            (p) => p.IdCategoria === cat.IdCategoria
                        );
                        if (productosPorCategoria.length === 0) return null;

                        return (
                            <View key={cat.IdCategoria} style={styles.categorySection}>
                                <Text style={styles.categoryTitle}>
                                    {cat.NombreCategoria}
                                </Text>
                                <FlatList
                                    data={productosPorCategoria}
                                    keyExtractor={(p) => p.IdProducto.toString()}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{
                                        paddingVertical: 12,
                                        paddingLeft: 16,
                                    }}
                                    snapToInterval={CARD_WIDTH + 16}
                                    decelerationRate="fast"
                                    renderItem={({ item }) => (
                                        <ProductCard
                                            item={item}
                                            width={CARD_WIDTH}
                                            unidad={unidadesMap[item.IdUnidadMedida]}
                                            proveedorLogo={proveedorActivoObj?.UrlLogo || null}
                                        />
                                    )}
                                />
                            </View>
                        );
                    })}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

// --- CARD DE PRODUCTO (con moneda, unidad y logo proveedor) ---
function ProductCard({
    item,
    width,
    unidad,
    proveedorLogo,
}: {
    item: Producto;
    width: number;
    unidad?: string;
    proveedorLogo: string | null;
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
                {/* IMAGEN PRINCIPAL */}
                <Image source={{ uri: item.UrlImagen }} style={styles.cardImage} />

                {/* CUERPO: Nombre, Precio y Unidad */}
                <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{item.Nombre}</Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.cardPrice}>
                            RD${item.PrecioOferta ?? item.Precio}
                        </Text>
                        {unidad ? (
                            <Text style={styles.cardUnit}>  {unidad}</Text>
                        ) : null}
                    </View>
                </View>

                {/* LOGO DEL PROVEEDOR en esquina inferior derecha */}
                {proveedorLogo && (
                    <Image
                        source={{ uri: proveedorLogo }}
                        style={styles.providerLogoOnCard}
                    />
                )}
            </Pressable>
        </MotiView>
    );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FF' },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

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
    logo: { width: 32, height: 48, marginRight: 8, resizeMode: 'contain' },
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

    // --- SECCIÓN DE CATEGORÍA ---
    categorySection: {
        marginBottom: 24,
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#101418',
        marginLeft: 16,
        marginBottom: 8,
    },

    // --- CARD DE PRODUCTO ---
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 3,
    },
    cardImage: {
        width: '100%',
        aspectRatio: 1,
    },
    cardBody: {
        padding: 12,
        paddingBottom: 32, // dejamos espacio para el logo del proveedor
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
        color: '#101418',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    cardPrice: {
        fontSize: 16,
        color: '#33618D',
        fontWeight: '700',
    },
    cardUnit: {
        fontSize: 12,
        color: '#555',
        marginLeft: 4,
    },
    providerLogoOnCard: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 40,
        height: 16,
        resizeMode: 'contain',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 4,
    },
});
