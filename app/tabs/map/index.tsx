// app/map.tsx

import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
    Platform,
    StatusBar,
    TouchableOpacity,
    Linking,
    Alert,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

type Proveedor = {
    IdProveedor: number;
    Nombre: string;
};

type Sucursal = {
    IdSucursal: number;
    NombreSucursal: string;
    latitud: string;
    longitud: string;
    IdProveedor: number;
};

export default function MapScreen() {
    const [region, setRegion] = useState<Region | null>(null);
    const [loading, setLoading] = useState(true);

    const [token, setToken] = useState<string | null>(null);
    const [providers, setProviders] = useState<Proveedor[]>([]);
    const [branches, setBranches] = useState<Sucursal[]>([]);

    const [selectedProv, setSelectedProv] = useState<number | 'all'>('all');
    const [selectedBranch, setSelectedBranch] = useState<Sucursal | null>(null);

    // --- 1) Leer token de SecureStore (si tu API lo requiere) ---
    useEffect(() => {
        SecureStore.getItemAsync('access_token')
            .then(t => {
                console.log('[Map] token cargado →', t);
                setToken(t);
            })
            .catch(err => {
                console.warn('[Map] no pude leer token', err);
            });
    }, []);

    // --- 2) Permiso de ubicación + región inicial ---
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Sin permiso', 'No podemos obtener tu ubicación');
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

    // --- 3) Fetch de proveedores y sucursales ---
    useEffect(() => {
        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        axios
            .get<Proveedor[]>('https://tobarato-api.alirizvi.dev/api/proveedor', { headers })
            .then(res => {
                console.log('[Map] proveedores', res.data);
                setProviders(res.data);
            })
            .catch(err => console.error('[Map] error fetching proveedores', err));

        axios
            .get<Sucursal[]>('https://tobarato-api.alirizvi.dev/api/sucursal', { headers })
            .then(res => {
                console.log('[Map] sucursales raw', res.data);
                setBranches(res.data);
            })
            .catch(err => console.error('[Map] error fetching sucursales', err));
    }, [token]);

    // helper para abrir la app de mapas
    const openNavigation = (lat: number, lng: number, label: string) => {
        const url = Platform.select({
            ios: `maps:0,0?q=${label}@${lat},${lng}`,
            android: `google.navigation:q=${lat},${lng}`,
        });
        if (url) Linking.openURL(url);
    };

    // mientras carga región o token...
    if (loading || !region) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#33618D" />
            </SafeAreaView>
        );
    }

    // filtramos sucursales según dropdown
    const visibleBranches =
        selectedProv === 'all'
            ? branches
            : branches.filter(b => b.IdProveedor === selectedProv);

    console.log('[Map] visibleBranches:', visibleBranches);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#001D35" />

            {/* HEADER */}
            <View style={styles.header}>
                <Ionicons
                    name="arrow-back"
                    size={28}
                    color="#fff"
                    onPress={() => {/* router.back() */ }}
                />
                <Text style={styles.headerTitle}>Mapa de Sucursales</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* PICKER DE PROVEEDORES */}
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedProv}
                    onValueChange={v => {
                        setSelectedProv(v);
                        setSelectedBranch(null);
                    }}
                >
                    <Picker.Item label="Todos" value="all" />
                    {providers.map(p => (
                        <Picker.Item
                            key={p.IdProveedor}
                            label={p.Nombre}
                            value={p.IdProveedor}
                        />
                    ))}
                </Picker>
            </View>

            {/* MAPA */}
            <MapView
                style={styles.map}
                initialRegion={region}  // ahora solo al iniciar
                showsUserLocation
            >
                {visibleBranches.map(b => {
                    const lat = parseFloat(b.latitud);
                    const lng = parseFloat(b.longitud);
                    if (isNaN(lat) || isNaN(lng)) {
                        console.warn('[Map] lat/lng inválida para', b);
                        return null;
                    }
                    return (
                        <Marker
                            key={b.IdSucursal}
                            coordinate={{ latitude: lat, longitude: lng }}
                            onPress={() => setSelectedBranch(b)}
                        />
                    );
                })}
            </MapView>

            {/* TARJETA INFERIOR */}
            {selectedBranch && (
                <View style={styles.card}>
                    <View style={styles.info}>
                        <Text style={styles.name}>{selectedBranch.NombreSucursal}</Text>
                        <Text style={styles.address}>
                            Lat: {selectedBranch.latitud}, Lng: {selectedBranch.longitud}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() =>
                            openNavigation(
                                parseFloat(selectedBranch.latitud),
                                parseFloat(selectedBranch.longitud),
                                selectedBranch.NombreSucursal
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
    pickerContainer: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        borderRadius: 8,
        marginVertical: 8,
        overflow: 'hidden',
    },
    map: { flex: 1 },
    card: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        backgroundColor: '#FFF',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        elevation: 6,
    },
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
