import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { router, useSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { MotiView } from 'moti';

// Datos de ejemplo (luego vendrán del backend)
type Product = {
    id: string;
    name: string;
    price: string;
    unit: string;
    imageUrl: string;
    provider: string;
};

const ALL_PRODUCTS: Product[] = [
    { id: '1', name: 'Apio', price: '39.00', unit: 'RD$/L', imageUrl: 'https://picsum.photos/seed/apio/200', provider: 'Aprecio' },
    { id: '2', name: 'Chuleta de Cerdo', price: '114.00', unit: 'RD$/L', imageUrl: 'https://picsum.photos/seed/chuleta/200', provider: 'Jumbo' },
    { id: '3', name: 'Manzana Roja', price: '59.95', unit: 'RD$/lb', imageUrl: 'https://picsum.photos/seed/manzana/200', provider: 'Carrefour' },
    // ... más productos
];

// Mapeo de logos
const PROVIDER_LOGOS: Record<string, any> = {
    Aprecio: require('../../assets/icons/providers/aprecio.jpg'),
    Jumbo: require('../../assets/icons/providers/jumbo.jpg'),
    Carrefour: require('../../assets/icons/providers/carrefour.png'),
    // ...
};

export default function AddToListScreen() {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<Record<string, Product>>({});

    // Filtrado memorizado
    const filtered = useMemo(() => {
        return ALL_PRODUCTS.filter(p =>
            p.name.toLowerCase().includes(query.toLowerCase())
        );
    }, [query]);

    // Añade o quita producto
    const toggleSelect = (prod: Product) => {
        setSelected(s => {
            const copy = { ...s };
            if (copy[prod.id]) delete copy[prod.id];
            else copy[prod.id] = prod;
            return copy;
        });
    };

    // Finalizar lista -> backend / navegación
    const finish = () => {
        const items = Object.values(selected);
        console.log('Items a guardar:', items);
        // TODO: llamar API para guardar lista
        router.replace('/tabs/list');
    };

    // Generar receta -> navegación a pantalla de receta
    const generateRecipe = () => {
        const items = Object.values(selected);
        router.push({ pathname: '/tabs/list/recipe', params: { items: JSON.stringify(items) } });
    };

    const renderItem = ({ item }: { item: Product }) => {
        const isSel = !!selected[item.id];
        return (
            <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 300 }}
                style={styles.card}
            >
                <Image source={{ uri: item.imageUrl }} style={styles.image} />
                <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.price}>
                        {PROVIDER_LOGOS[item.provider] && (
                            <Image source={PROVIDER_LOGOS[item.provider]} style={styles.logoSmall} />
                        )}{' '}
                        {item.price} {item.unit}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => toggleSelect(item)}>
                    <Icon
                        name={isSel ? 'checkmark-circle' : 'add-circle-outline'}
                        size={28}
                        color={isSel ? '#49AF2F' : '#33618D'}
                    />
                </TouchableOpacity>
            </MotiView>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#001D35" />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Icon name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Buscar Productos</Text>
                <View style={{ width: 28 }} />{/* placeholder para simetría */}
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

            {/* Listado */}
            <FlatList
                data={filtered}
                keyExtractor={i => i.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            />

            {/* Footer fijo */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.btn} onPress={finish} disabled={!Object.keys(selected).length}>
                    <Text style={styles.btnText}>Finalizar Lista</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, { backgroundColor: '#EDCA04' }]} onPress={generateRecipe} disabled={!Object.keys(selected).length}>
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
        backgroundColor: '#001D35',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 16,
        paddingBottom: 12,
        paddingHorizontal: 16,
        justifyContent: 'space-between',
    },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '500' },
    searchWrap: {
        flexDirection: 'row',
        backgroundColor: '#E5E7EB',
        margin: 16,
        borderRadius: 8,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    searchInput: { flex: 1, height: 40, fontSize: 16 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        elevation: 2,
    },
    image: { width: 56, height: 56, borderRadius: 8, marginRight: 12 },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    price: { fontSize: 14, color: '#555', flexDirection: 'row', alignItems: 'center' },
    logoSmall: { width: 16, height: 16, marginRight: 4 },
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
    btnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    btnTextDark: { color: '#001D35', fontSize: 16, fontWeight: '600' },
});
