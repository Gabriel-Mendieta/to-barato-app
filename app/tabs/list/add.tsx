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
    { id: '2', name: 'Chuleta de Cerdo', price: '114.00', unit: 'RD$/L', imageUrl: 'data:image/jpeg;base64,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', provider: 'Jumbo' },
    { id: '3', name: 'Manzana Roja', price: '59.95', unit: 'RD$/lb', imageUrl: 'data:image/jpeg;base64,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 ', provider: 'Carrefour' },
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
