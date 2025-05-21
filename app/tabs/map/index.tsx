import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
    Platform,
    StatusBar,
} from 'react-native';
import MapView, { Marker, Callout, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

// Ejemplo de proveedores con coords
const PROVIDERS = [
    {
        id: 'aprecio',
        name: 'Aprecio',
        address: 'Av. Winston Churchill, Santo Domingo',
        latitude: 18.4861,
        longitude: -69.9312,
    },
    {
        id: 'jumbo',
        name: 'Jumbo',
        address: 'Av. John F. Kennedy, Santo Domingo',
        latitude: 18.5000,
        longitude: -69.9500,
    },
    {
        id: 'bravo',
        name: 'Bravo',
        address: 'Av. Tiradentes, Santo Domingo',
        latitude: 18.4750,
        longitude: -69.8900,
    },
];

export default function MapScreen() {
    const [region, setRegion] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            // 1. Pedir permiso
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.warn('Permiso de ubicación denegado');
                setLoading(false);
                return;
            }

            // 2. Obtener ubicación
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
            setRegion({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });
            setLoading(false);
        })();
    }, []);

    if (loading || !region) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#33618D" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header igual al Home */}
            <StatusBar barStyle="light-content" backgroundColor="#001D35" />
            <View style={styles.header}>
                <Ionicons name="arrow-back" size={28} color="#fff" onPress={() => {/* router.back() */ }} />
                <Text style={styles.headerTitle}>Mapa de Proveedores</Text>
                <View style={{ width: 28 }} />
            </View>

            <MapView
                style={styles.map}
                region={region}
                showsUserLocation
                showsMyLocationButton={false}
            >
                {/* Tile layer de OpenStreetMap */}
                <UrlTile
                    urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maximumZ={19}
                    tileSize={256}
                />

                {/* Marcadores de proveedores */}
                {PROVIDERS.map((prov) => (
                    <Marker
                        key={prov.id}
                        coordinate={{
                            latitude: prov.latitude,
                            longitude: prov.longitude,
                        }}
                    >
                        <Ionicons name="location-sharp" size={32} color="#F3732A" />
                        <Callout tooltip>
                            <View style={styles.callout}>
                                <Text style={styles.calloutTitle}>{prov.name}</Text>
                                <Text style={styles.calloutSubtitle}>{prov.address}</Text>
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>
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
    map: { flex: 1 },
    callout: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 8,
        width: 160,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    calloutTitle: { fontWeight: '600', marginBottom: 4 },
    calloutSubtitle: { color: '#555', fontSize: 12 },
});
