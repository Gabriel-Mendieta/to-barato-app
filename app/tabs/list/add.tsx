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
    { id: '1', name: 'Apio', price: '39.00', unit: 'RD$/L', imageUrl: 'data:image/jpeg;base64,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', provider: 'Aprecio' },
    { id: '2', name: 'Chuleta de Cerdo', price: '114.00', unit: 'RD$/L', imageUrl: 'https://picsum.photos/seed/chuleta/200', provider: 'Jumbo' },
    { id: '3', name: 'Manzana Roja', price: '59.95', unit: 'RD$/lb', imageUrl: 'https://picsum.photos/seed/manzana/200', provider: 'Carrefour' },
    // ... más productos
];

// Mapeo de logos
const PROVIDER_LOGOS: Record<string, any> = {
    Aprecio: require('../../../assets/icons/providers/aprecio.jpg'),
    Jumbo: require('../../../assets/icons/providers/jumbo.jpg'),
    Carrefour: require('../../../assets/icons/providers/bravo.png'),
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
                <TouchableOpacity onPress={() => router.push('../tabs/lista')}>
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
