import React, { useState } from 'react';
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
import { MotiView } from 'moti';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';

// Categories and Providers
type Category = 'Mercados' | 'Ferreterias' | 'Farmacias';
const categories: Category[] = ['Mercados', 'Ferreterias', 'Farmacias'];
const providersByCategory: Record<Category, string[]> = {
    Mercados: ['Ofertas', 'Aprecio', 'Jumbo', 'Bravo'],
    Ferreterias: ['Ofertas', 'Ochoa', 'Max', 'Americana'],
    Farmacias: ['Ofertas', 'Gbc', 'LosHidalgos', 'Carol'],
};

// Provider logos
const providerLogos: Record<string, any> = {
    Aprecio: require('../../../assets/icons/providers/aprecio.jpg'),
    Jumbo: require('../../../assets/icons/providers/jumbo.jpg'),
    Bravo: require('../../../assets/icons/providers/bravo.png'),
    Ochoa: require('../../../assets/icons/providers/Ochoa.png'),
    Max: require('../../../assets/icons/providers/max.jpg'),
    Americana: require('../../../assets/icons/providers/americana.png'),
    Gbc: require('../../../assets/icons/providers/gbc.png'),
    LosHidalgos: require('../../../assets/icons/providers/los_hidalgos.png'),
    Carol: require('../../../assets/icons/providers/carol.png'),
};

// Sample product data
type Product = { id: string; name: string; price: string; imageUrl: string; category: Category; provider: string };
const allProducts: Product[] = [
    { id: '1', name: 'Apio', price: 'RD$39.00/L', imageUrl: 'https://picsum.photos/seed/apio/300/300', category: 'Mercados', provider: 'Aprecio' },
    { id: '2', name: 'Chuleta', price: 'RD$114.00/L', imageUrl: 'https://picsum.photos/seed/chuleta/300/300', category: 'Mercados', provider: 'Jumbo' },
    { id: '3', name: 'Manzanas', price: 'RD$55.00/L', imageUrl: 'https://picsum.photos/seed/manzana/300/300', category: 'Mercados', provider: 'Bravo' },
    { id: '4', name: 'Martillo', price: 'RD$250.00', imageUrl: 'https://picsum.photos/seed/martillo/300/300', category: 'Ferreterias', provider: 'Ochoa' },
    { id: '5', name: 'Taladro', price: 'RD$1200.00', imageUrl: 'https://picsum.photos/seed/taladro/300/300', category: 'Ferreterias', provider: 'Max' },
    { id: '6', name: 'Cemento', price: 'RD$300.00', imageUrl: 'https://picsum.photos/seed/cemento/300/300', category: 'Ferreterias', provider: 'Americana' },
    { id: '7', name: 'Ibuprofeno', price: 'RD$150.00', imageUrl: 'https://picsum.photos/seed/ibuprofeno/300/300', category: 'Farmacias', provider: 'Gbc' },
    { id: '8', name: 'Vitamina C', price: 'RD$200.00', imageUrl: 'https://picsum.photos/seed/vitaminaC/300/300', category: 'Farmacias', provider: 'LosHidalgos' },
    { id: '9', name: 'Jarabe', price: 'RD$180.00', imageUrl: 'https://picsum.photos/seed/jarabe/300/300', category: 'Farmacias', provider: 'Carol' },
];

// Notification data
type Notification = { id: string; title: string; desc: string; time: string; icon: string };
const notificationsData: Notification[] = [
    { id: 'n1', title: 'Ofertas y Promociones', desc: 'El arroz está a RD$50 menos.', time: 'Hace 4h', icon: 'information' },
    { id: 'n2', title: 'Recordatorio', desc: 'Revisa tu lista de compras.', time: 'Hace 1d', icon: 'cart-outline' },
    { id: 'n3', title: 'Actualización', desc: 'Leche bajó 15%.', time: 'Hace 12d', icon: 'pricetag-outline' },
];

// Product card component
function ProductCard({ item, width }: { item: Product; width: number }) {
    const logo = providerLogos[item.provider];
    return (
        <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            style={{ width, marginRight: 16 }}
        >
            <Pressable onPress={() => router.push(`/product/${item.id}`)} style={styles.card}>
                <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
                {logo && <Image source={logo} style={styles.cardLogo} />}
                <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardPrice}>{item.price}</Text>
                </View>
            </Pressable>
        </MotiView>
    );
}

// Main screen
export default function HomeScreenEnhanced() {
    const { width: screenWidth } = useWindowDimensions();
    const CARD_WIDTH = Math.round(screenWidth * 0.6);
    const tabWidth = screenWidth / categories.length;

    const [activeCategory, setActiveCategory] = useState<Category>(categories[0]);
    const [activeProvider, setActiveProvider] = useState<string>(providersByCategory[categories[0]][0]);
    const [showNotifications, setShowNotifications] = useState<boolean>(false);

    const filteredData = allProducts.filter(
        (p) => p.category === activeCategory && (activeProvider === 'Ofertas' || p.provider === activeProvider)
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#001D35" />
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Image source={require('../../../assets/icons/logo.png')} style={styles.logo} />
                    <Text style={styles.headerText}>To' Barato</Text>
                </View>
                <Pressable onPress={() => setShowNotifications(true)}>
                    <Icon name="notifications-outline" size={28} color="#FFF" />
                </Pressable>
            </View>

            {/* Notifications overlay */}
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
                            {notificationsData.map((n) => (
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

            {/* Category tabs */}
            <View style={styles.tabRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {categories.map((cat) => (
                        <Pressable
                            key={cat}
                            onPress={() => setActiveCategory(cat)}
                            style={[styles.tabItem, { width: tabWidth }, activeCategory === cat && styles.tabActive]}
                        >
                            <Text style={[styles.tabText, activeCategory === cat && styles.tabTextActive]}>{cat}</Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            {/* Provider buttons */}
            <View style={styles.providerRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {providersByCategory[activeCategory].map((prov) => (
                        <Pressable
                            key={prov}
                            onPress={() => setActiveProvider(prov)}
                            style={[styles.providerBtn, activeProvider === prov && styles.providerBtnActive]}
                        >
                            {prov !== 'Ofertas' && providerLogos[prov] && (
                                <Image source={providerLogos[prov]} style={styles.providerLogoSmall} />
                            )}
                            <Text style={[styles.providerText, activeProvider === prov && styles.providerTextActive]}>{prov}</Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            {/* Product carousel */}
            <FlatList
                data={filteredData}
                keyExtractor={(item) => item.id}
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
    overlayTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
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
    notifTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    notifDesc: { fontSize: 14, color: '#555' },
    notifTime: { fontSize: 12, color: '#999', marginTop: 4 },
    tabRow: { backgroundColor: '#F8F9FF', paddingVertical: 8 },
    tabItem: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
    tabActive: { borderBottomWidth: 3, borderBottomColor: '#F3732A' },
    tabText: { fontSize: 14, color: '#555' },
    tabTextActive: { color: '#F3732A', fontWeight: '700' },
    providerRow: { paddingVertical: 12, paddingLeft: 16 },
    providerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 20,
        marginRight: 12,
        elevation: 2,
    },
    providerBtnActive: { backgroundColor: '#F3732A', elevation: 4 },
    providerLogoSmall: { width: 20, height: 20, marginRight: 6 },
    providerText: { fontSize: 14, color: '#555' },
    providerTextActive: { color: '#FFF', fontWeight: '700' },
    card: { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', elevation: 3, position: 'relative' },
    cardImage: { width: '100%', height: undefined, aspectRatio: 1 },
    cardLogo: { position: 'absolute', bottom: 12, right: 12, width: 28, height: 28, borderRadius: 4 },
    cardBody: { padding: 12 },
    cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    cardPrice: { fontSize: 14, color: '#555' },
});
