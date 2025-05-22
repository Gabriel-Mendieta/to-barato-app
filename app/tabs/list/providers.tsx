// app/tabs/list/providers.tsx
import React, { useState, useMemo } from 'react';
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
    Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';

// Logos estáticos por proveedor
const PROVIDER_LOGOS: Record<string, any> = {
    Aprecio: require('../../../assets/icons/providers/aprecio.jpg'),
    Jumbo: require('../../../assets/icons/providers/jumbo.jpg'),
    Bravo: require('../../../assets/icons/providers/bravo.png'),
};

type IncomingProduct = {
    id: string;
    name: string;
    imageUrl: string;
    prices: Record<string, number>;
};

export default function SelectProviderScreen() {
    // 1) Recupera y decodifica el array de productos
    const params = useLocalSearchParams<{ items?: string }>();
    const raw = params.items ?? '[]';
    const products: IncomingProduct[] = JSON.parse(decodeURIComponent(raw));

    // 2) Suma total de precios por proveedor
    const sums = useMemo(() => {
        const acc: Record<string, number> = {};
        products.forEach((p) =>
            Object.entries(p.prices).forEach(([prov, price]) => {
                acc[prov] = (acc[prov] || 0) + price;
            })
        );
        return acc;
    }, [products]);

    // 3) Ordena de más barato a más caro y toma top-3
    const topProviders = useMemo(() => {
        return Object.entries(sums)
            .map(([provider, total]) => ({ provider, total }))
            .sort((a, b) => a.total - b.total)
            .slice(0, 3);
    }, [sums]);

    const [selectedProv, setSelectedProv] = useState<string | null>(null);

    // 4) Abrir mapa según proveedor
    const openNavigation = (prov: string) => {
        const coords: Record<string, [number, number]> = {
            Aprecio: [18.4861, -69.9312],
            Jumbo: [18.5000, -69.9500],
            Bravo: [18.4750, -69.8900],
        };
        const [lat, lng] = coords[prov];
        const label = prov;
        const url = Platform.select({
            ios: `maps:0,0?q=${label}@${lat},${lng}`,
            android: `google.navigation:q=${lat},${lng}`,
        });
        Linking.openURL(url!);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#001D35" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('../../tabs/list/add')}>
                    <Icon name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Elige Proveedor</Text>
                <View style={{ width: 28 }} />
            </View>

            <FlatList
                data={topProviders}
                keyExtractor={(item) => item.provider}
                contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
                renderItem={({ item }) => {
                    const isActive = item.provider === selectedProv;
                    return (
                        <TouchableOpacity
                            style={[styles.card, isActive && styles.cardActive]}
                            onPress={() => setSelectedProv(item.provider)}
                        >
                            <Image
                                source={PROVIDER_LOGOS[item.provider]}
                                style={styles.logo}
                            />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.provName}>{item.provider}</Text>
                                <Text style={styles.provTotal}>
                                    Total: RD${item.total.toFixed(2)}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                }}
            />

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.btn, !selectedProv && styles.btnDisabled]}
                    onPress={() => selectedProv && openNavigation(selectedProv)}
                    disabled={!selectedProv}
                >
                    <Text style={styles.btnText}>Ir al más cercano</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.btnRecipe, !selectedProv && styles.btnDisabled]}
                    onPress={() => {/* TODO: guardar lista en backend */ }}
                    disabled={!selectedProv}
                >
                    <Text style={styles.btnTextDark}>Guardar Lista</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.btnRecipe, !selectedProv && styles.btnDisabled]}
                    onPress={() => {/* TODO: generar receta */ }}
                    disabled={!selectedProv}
                >
                    <Text style={styles.btnTextDark}>Generar Receta</Text>
                </TouchableOpacity>
            </View>
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
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 16,
        paddingBottom: 12,
        paddingHorizontal: 16,
    },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '500' },

    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        elevation: 2,
    },
    cardActive: { borderColor: '#F3732A', borderWidth: 2 },

    logo: { width: 48, height: 48, borderRadius: 8 },
    provName: { fontSize: 18, fontWeight: '600' },
    provTotal: { fontSize: 16, color: '#555', marginTop: 4 },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderColor: '#E5E7EB',
    },

    btn: {
        flex: 1,
        backgroundColor: '#33618D',
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    btnRecipe: {
        flex: 1,
        backgroundColor: '#EDCA04',
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    btnDisabled: { opacity: 0.6 },

    btnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    btnTextDark: { color: '#001D35', fontSize: 16, fontWeight: '600' },
});
