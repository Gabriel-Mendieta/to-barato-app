// app/tabs/list/type-selection.tsx

import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    StatusBar,
    Platform,
} from 'react-native';
import axios from 'axios';
import { router } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';

type TipoProveedor = {
    IdTipoProveedor: number;
    NombreTipoProveedor: string;
};

export default function TipoProveedorSelection() {
    const [tipos, setTipos] = useState<TipoProveedor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios
            .get<TipoProveedor[]>('https://tobarato-api.alirizvi.dev/api/tipoproveedor')
            .then(({ data }) => setTipos(data))
            .catch(err => {
                console.error('[TipoSelection]', err);
            })
            .finally(() => setLoading(false));
    }, []);

    // Mapea cada id a un icono representativo
    const getIconName = (id: number) => {
        switch (id) {
            case 1:
                return 'cart-outline';        // Supermercado
            case 2:
                return 'medkit-outline';      // Farmacia
            case 3:
                return 'basket-outline';      // Mercado
            default:
                return 'business-outline';    // Otros
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color="#33618D" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar
                barStyle="light-content"
                backgroundColor="#001D35"
            />
            <Text style={styles.title}>Selecciona un tipo de proveedor</Text>
            <FlatList
                data={tipos}
                keyExtractor={t => t.IdTipoProveedor.toString()}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.item}
                        onPress={() =>
                            router.push({
                                pathname: './add',
                                params: { tipo: String(item.IdTipoProveedor) },
                            })
                        }
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name={getIconName(item.IdTipoProveedor)}
                            size={48}
                            color="#33618D"
                            style={styles.itemIcon}
                        />
                        <Text style={styles.itemText}>
                            {item.NombreTipoProveedor}
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FF' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#33618D',
        marginVertical: 16,
        textAlign: 'center',
    },

    item: {
        backgroundColor: '#FFF',
        height: 120,
        borderRadius: 12,
        marginBottom: 16,
        elevation: 3,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    itemIcon: {
        marginBottom: 8,
    },
    itemText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#101418',
        textAlign: 'center',
    },
});
