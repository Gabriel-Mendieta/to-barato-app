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
    Image,
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
    UrlLogo: string;
};

type Sucursal = {
    IdSucursal: number;
    NombreSucursal: string;
    Latitud: string;
    Longitud: string;
    IdProveedor: number;
};

export default function MapScreen() {
    const [region, setRegion] = useState<Region | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const [token, setToken] = useState<string | null>(null);
    const [providers, setProviders] = useState<Proveedor[]>([]);
    const [branches, setBranches] = useState<Sucursal[]>([]);

    // 'all' o el IdProveedor convertido a string
    const [selectedProv, setSelectedProv] = useState<string>('all');
    const [selectedBranch, setSelectedBranch] = useState<Sucursal | null>(null);

    // Lista filtrada de sucursales
    const [filteredBranches, setFilteredBranches] = useState<Sucursal[]>([]);

    // 1) Leer token (si el API lo requiere)
    useEffect(() => {
        SecureStore.getItemAsync('access_token')
            .then((t) => {
                console.log('[Map] token cargado →', t);
                setToken(t);
            })
            .catch((err) => {
                console.warn('[Map] no pude leer token', err);
            });
    }, []);

    // 2) Pedir permiso de ubicación + región inicial
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Sin permiso', 'No podemos obtener tu ubicación');
                setLoading(false);
                return;
            }
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
            });
            setRegion({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });
            setLoading(false);
        })();
    }, []);

    // 3) Fetch de proveedores y sucursales
    useEffect(() => {
        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        axios
            .get<Proveedor[]>('https://tobarato-api.alirizvi.dev/api/proveedor', {
                headers,
            })
            .then((res) => {
                console.log('[Map] proveedores', res.data);
                setProviders(res.data);
            })
            .catch((err) =>
                console.error('[Map] error fetching proveedores', err)
            );

        axios
            .get<Sucursal[]>('https://tobarato-api.alirizvi.dev/api/sucursal', {
                headers,
            })
            .then((res) => {
                console.log('[Map] sucursales raw', res.data);
                setBranches(res.data);
            })
            .catch((err) =>
                console.error('[Map] error fetching sucursales', err)
            );
    }, [token]);

    // 4) Cada vez que cambien selectedProv o branches, recalculamos filteredBranches
    useEffect(() => {
        if (selectedProv === 'all') {
            setFilteredBranches(branches);
        } else {
            const idNum = parseInt(selectedProv, 10);
            setFilteredBranches(branches.filter((b) => b.IdProveedor === idNum));
        }
        // Limpiamos tarjeta inferior cuando cambiamos proveedor
        setSelectedBranch(null);
    }, [selectedProv, branches]);

    // Helper para abrir app de mapas según plataforma
    const openNavigation = (lat: number, lng: number, label: string) => {
        const url = Platform.select({
            ios: `http://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(
                label
            )}`,
            android: `google.navigation:q=${lat},${lng}`,
        });
        if (url) {
            Linking.openURL(url).catch((err) =>
                console.warn('No se pudo abrir la app de mapas:', err)
            );
        }
    };

    // Si todavía no tenemos región o estamos en loading
    if (loading || region === null) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#33618D" />
            </SafeAreaView>
        );
    }

    // Buscar proveedor de la sucursal seleccionada
    const providerOfBranch = selectedBranch
        ? providers.find((p) => p.IdProveedor === selectedBranch.IdProveedor)
        : null;

    // Generar la parte “residual” del nombre de la sucursal,
    // es decir, remover el prefijo que coincide con el nombre del proveedor.
    const getBranchDisplayName = (): string => {
        if (!selectedBranch || !providerOfBranch) return '';
        const fullBranchName = selectedBranch.NombreSucursal;
        const provName = providerOfBranch.Nombre;

        // Si el nombre de la sucursal comienza con el nombre del proveedor,
        // lo removemos (ignorando mayúsculas/minúsculas) y recortamos espacios sobrantes.
        const regex = new RegExp(`^\\s*${provName}\\s*`, 'i');
        const stripped = fullBranchName.replace(regex, '').trim();
        return stripped.length > 0 ? stripped : fullBranchName;
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#001D35" />

            {/* HEADER */}
            <View style={styles.header}>
                <Ionicons
                    name="arrow-back"
                    size={28}
                    color="#fff"
                    onPress={() => {
                        /* router.back() */
                    }}
                />
                <Text style={styles.headerTitle}>Mapa de Sucursales</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* PICKER DE PROVEEDORES */}
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedProv}
                    onValueChange={(v) => {
                        setSelectedProv(v);
                    }}
                    mode="dropdown" // en iOS: "dropdown" o "dialog"
                >
                    <Picker.Item label="Todos" value="all" />
                    {providers.map((p) => (
                        <Picker.Item
                            key={p.IdProveedor}
                            label={p.Nombre}
                            value={p.IdProveedor.toString()}
                        />
                    ))}
                </Picker>
            </View>

            {/* MAPA */}
            {/*
        Agregamos key={selectedProv} para que iOS “remonte” el MapView
        cada vez que cambie el proveedor, así los markers se actualizan al instante.
      */}
            <MapView
                key={selectedProv}
                style={styles.map}
                initialRegion={region}
                showsUserLocation
            >
                {filteredBranches.map((b) => {
                    const lat = parseFloat(b.Latitud);
                    const lng = parseFloat(b.Longitud);
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
            {selectedBranch && providerOfBranch && (
                <View style={styles.card}>
                    {/* 1) Logo del proveedor */}
                    {providerOfBranch.UrlLogo ? (
                        <Image
                            source={{ uri: providerOfBranch.UrlLogo }}
                            style={styles.providerLogo}
                            resizeMode="contain"
                        />
                    ) : null}

                    <View style={styles.info}>
                        {/* 2) Nombre del proveedor */}
                        <Text style={styles.providerName}>
                            {providerOfBranch.Nombre}
                        </Text>
                        {/* 3) Nombre “residual” de la sucursal */}
                        <Text style={styles.branchName}>
                            {getBranchDisplayName()}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() =>
                            openNavigation(
                                parseFloat(selectedBranch.Latitud),
                                parseFloat(selectedBranch.Longitud),
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
        paddingTop:
            Platform.OS === 'android' ? StatusBar.currentHeight : 16,
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
        alignItems: 'center', // para que el logo y los textos queden alineados verticalmente
        padding: 12,
        elevation: 6,
    },
    providerLogo: {
        width: 50,
        height: 50,
        marginRight: 12,
        borderRadius: 8,
    },
    info: {
        flex: 1,
        justifyContent: 'center',
    },
    providerName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    branchName: {
        fontSize: 14,
        color: '#555',
    },

    button: {
        backgroundColor: '#F3732A',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
    },
    buttonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
