import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
    Platform,
    StatusBar,
    Image,
    TouchableOpacity,
    Linking,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

// Datos de proveedores con coords e imagen
const PROVIDERS = [
    {
        id: 'aprecio',
        name: 'Aprecio',
        address: 'Av. Winston Churchill, SD',
        latitude: 18.4861,
        longitude: -69.9312,
        logo: require('../../../assets/icons/providers/aprecio.jpg'),
    },
    {
        id: 'jumbo',
        name: 'Jumbo',
        address: 'Av. John F. Kennedy, SD',
        latitude: 18.5,
        longitude: -69.95,
        logo: require('../../../assets/icons/providers/jumbo.jpg'),
    },
    {
        id: 'bravo',
        name: 'Bravo',
        address: 'Av. Tiradentes, SD',
        latitude: 18.475,
        longitude: -69.89,
        logo: require('../../../assets/icons/providers/bravo.png'),
    },
];

export default function MapScreen() {
    const [region, setRegion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedProv, setSelectedProv] = useState<typeof PROVIDERS[0] | null>(null);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.warn('Permiso de ubicación denegado');
                setLoading(false);
                return;
            }
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

    const openNavigation = (lat: number, lng: number, name: string) => {
        const url = Platform.select({
            ios: `maps:0,0?q=${name}@${lat},${lng}`,
            android: `google.navigation:q=${lat},${lng}`,
        });
        Linking.openURL(url!);
    };

    if (loading || !region) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#33618D" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#001D35" />
            <View style={styles.header}>
                <Ionicons
                    name="arrow-back"
                    size={28}
                    color="#fff"
                    onPress={() => {/* router.back() */ }}
                />
                <Text style={styles.headerTitle}>Mapa de Proveedores</Text>
                <View style={{ width: 28 }} />
            </View>

            <MapView style={styles.map} region={region} showsUserLocation>
                {PROVIDERS.map((prov) => (
                    <Marker
                        key={prov.id}
                        coordinate={{ latitude: prov.latitude, longitude: prov.longitude }}
                        onPress={() => setSelectedProv(prov)}
                    />
                ))}
            </MapView>

            {selectedProv && (
                <View style={styles.card}>
                    <Image source={selectedProv.logo} style={styles.logo} />
                    <View style={styles.info}>
                        <Text style={styles.name}>{selectedProv.name}</Text>
                        <Text style={styles.address}>{selectedProv.address}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() =>
                            openNavigation(
                                selectedProv.latitude,
                                selectedProv.longitude,
                                selectedProv.name
                            )
                        }
                    >
                        <Text style={styles.buttonText}>Ir</Text>
                    </TouchableOpacity>
                </View>
            )}
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
    card: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        elevation: 6,
    },
    logo: { width: 48, height: 48, borderRadius: 8, marginRight: 12 },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    address: { fontSize: 14, color: '#555' },
    button: {
        backgroundColor: '#F3732A',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
    },
    buttonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
