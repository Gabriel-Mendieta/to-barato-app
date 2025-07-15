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
    Alert,
    Image,
    TouchableOpacity,
    Linking,
    ActionSheetIOS,
} from 'react-native';
import MapView, { Marker, Region, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

type TipoProveedor = {
    IdTipoProveedor: number;
    NombreTipoProveedor: string;
};

type Proveedor = {
    IdProveedor: number;
    Nombre: string;
    UrlLogo: string;
    IdTipoProveedor: number;
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
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    const [tipos, setTipos] = useState<TipoProveedor[]>([]);
    const [providers, setProviders] = useState<Proveedor[]>([]);
    const [branches, setBranches] = useState<Sucursal[]>([]);

    const [selectedTipo, setSelectedTipo] = useState<string>('all');
    const [selectedProvider, setSelectedProvider] = useState<string>('all');
    const [filteredBranches, setFilteredBranches] = useState<Sucursal[]>([]);
    const [markersLoading, setMarkersLoading] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<Sucursal | null>(null);

    // 1) Leer token
    useEffect(() => {
        SecureStore.getItemAsync('access_token')
            .then(setToken)
            .catch(console.warn);
    }, []);

    // 2) Pedir permiso / región inicial
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

    // 3) Fetch tipos, proveedores y sucursales
    useEffect(() => {
        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        axios
            .get<TipoProveedor[]>('https://tobarato-api.alirizvi.dev/api/tipoproveedor', { headers })
            .then(res => setTipos(res.data))
            .catch(err => console.warn('[Map] error fetching tipos', err));

        axios
            .get<Proveedor[]>('https://tobarato-api.alirizvi.dev/api/proveedor', { headers })
            .then(res => setProviders(res.data))
            .catch(err => console.error('[Map] error fetching proveedores', err));

        axios
            .get<Sucursal[]>('https://tobarato-api.alirizvi.dev/api/sucursal', { headers })
            .then(res => setBranches(res.data))
            .catch(err => console.error('[Map] error fetching sucursales', err));
    }, [token]);

    // 4) Filtrar sucursales según tipo y proveedor seleccionado
    useEffect(() => {
        setMarkersLoading(true);
        setSelectedBranch(null);

        const provIdsByTipo =
            selectedTipo === 'all'
                ? providers.map(p => p.IdProveedor)
                : providers.filter(p => p.IdTipoProveedor === Number(selectedTipo)).map(p => p.IdProveedor);

        const finalProvIds =
            selectedProvider === 'all'
                ? provIdsByTipo
                : provIdsByTipo.filter(id => id === Number(selectedProvider));

        setFilteredBranches(branches.filter(b => finalProvIds.includes(b.IdProveedor)));
        // luego de actualizar filtros, desactiva spinner
        setMarkersLoading(false);
    }, [selectedTipo, selectedProvider, branches, providers]);

    // 5) Abrir navegación
    const openNavigation = (lat: number, lng: number, label: string) => {
        const url = Platform.select({
            ios: `http://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(label)}`,
            android: `google.navigation:q=${lat},${lng}`,
        });
        if (url) Linking.openURL(url).catch(console.warn);
    };

    if (loading || region === null) {
        return (
            <SafeAreaView style={styles.containerCentered}>
                <ActivityIndicator size="large" color="#33618D" />
            </SafeAreaView>
        );
    }

    // Nombre resumido de sucursal
    const getBranchName = (b: Sucursal) => {
        const prov = providers.find(p => p.IdProveedor === b.IdProveedor);
        if (!prov) return b.NombreSucursal;
        const stripped = b.NombreSucursal.replace(new RegExp(`^\\s*${prov.Nombre}\\s*`, 'i'), '').trim();
        return stripped || b.NombreSucursal;
    };

    // Proveedores filtrados para segundo select
    const proveedoresFiltrados = providers.filter(
        p => selectedTipo === 'all' || p.IdTipoProveedor === Number(selectedTipo)
    );

    // iOS: ActionSheet selectors
    const showTipoSelector = () => {
        const options = ['Todos los tipos', ...tipos.map(t => t.NombreTipoProveedor), 'Cancelar'];
        ActionSheetIOS.showActionSheetWithOptions(
            { options, cancelButtonIndex: options.length - 1 },
            idx => {
                if (idx === options.length - 1) return;
                setSelectedTipo(idx === 0 ? 'all' : String(tipos[idx - 1].IdTipoProveedor));
                setSelectedProvider('all');
            }
        );
    };
    const showProviderSelector = () => {
        const labels = ['Todos los proveedores', ...proveedoresFiltrados.map(p => p.Nombre), 'Cancelar'];
        ActionSheetIOS.showActionSheetWithOptions(
            { options: labels, cancelButtonIndex: labels.length - 1 },
            idx => {
                if (idx === labels.length - 1) return;
                setSelectedProvider(idx === 0 ? 'all' : String(proveedoresFiltrados[idx - 1].IdProveedor));
            }
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#001D35" />

            {/* HEADER */}
            <View style={styles.header}>
                <Ionicons name="arrow-back" size={28} color="#fff" onPress={() => { }} />
                <Text style={styles.headerTitle}>Mapa de Sucursales</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* SELECTS */}
            {Platform.OS === 'ios' ? (
                <>
                    <TouchableOpacity style={styles.selectField} onPress={showTipoSelector}>
                        <Text style={styles.selectText}>
                            {selectedTipo === 'all'
                                ? 'Todos los tipos'
                                : tipos.find(t => String(t.IdTipoProveedor) === selectedTipo)?.NombreTipoProveedor}
                        </Text>
                    </TouchableOpacity>
                    {selectedTipo !== 'all' && (
                        <TouchableOpacity style={styles.selectField} onPress={showProviderSelector}>
                            <Text style={styles.selectText}>
                                {selectedProvider === 'all'
                                    ? 'Todos los proveedores'
                                    : providers.find(p => String(p.IdProveedor) === selectedProvider)?.Nombre}
                            </Text>
                        </TouchableOpacity>
                    )}
                </>
            ) : (
                <>
                    <View style={styles.pickerContainer}>
                        <Picker selectedValue={selectedTipo} onValueChange={setSelectedTipo} mode="dropdown">
                            <Picker.Item label="Todos los tipos" value="all" />
                            {tipos.map(t => (
                                <Picker.Item key={t.IdTipoProveedor} label={t.NombreTipoProveedor} value={String(t.IdTipoProveedor)} />
                            ))}
                        </Picker>
                    </View>
                    {selectedTipo !== 'all' && (
                        <View style={styles.pickerContainer}>
                            <Picker selectedValue={selectedProvider} onValueChange={setSelectedProvider} mode="dropdown">
                                <Picker.Item label="Todos los proveedores" value="all" />
                                {proveedoresFiltrados.map(p => (
                                    <Picker.Item key={p.IdProveedor} label={p.Nombre} value={String(p.IdProveedor)} />
                                ))}
                            </Picker>
                        </View>
                    )}
                </>
            )}

            {/* MAPA */}
            <View style={styles.mapWrapper}>
                <MapView
                    key={`${selectedTipo}-${selectedProvider}`}
                    style={styles.map}
                    initialRegion={region}
                    showsUserLocation
                    provider={PROVIDER_DEFAULT}
                    mapType={Platform.OS === 'android' ? 'none' : 'standard'}
                >
                    <UrlTile urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} flipY={false} />
                    {!markersLoading &&
                        filteredBranches.map(b => {
                            const lat = parseFloat(b.Latitud);
                            const lng = parseFloat(b.Longitud);
                            if (isNaN(lat) || isNaN(lng)) return null;
                            return <Marker key={b.IdSucursal} coordinate={{ latitude: lat, longitude: lng }} onPress={() => setSelectedBranch(b)} />;
                        })}
                </MapView>
                {markersLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#33618D" />
                    </View>
                )}
            </View>

            {/* TARJETA INFERIOR */}
            {selectedBranch && (() => {
                const prov = providers.find(p => p.IdProveedor === selectedBranch.IdProveedor)!;
                return (
                    <View style={styles.card}>
                        {prov.UrlLogo && <Image source={{ uri: prov.UrlLogo }} style={styles.providerLogo} resizeMode="contain" />}
                        <View style={styles.info}>
                            <Text style={styles.providerName}>{prov.Nombre}</Text>
                            <Text style={styles.branchName}>{getBranchName(selectedBranch)}</Text>
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
                );
            })()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FF' },
    containerCentered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FF' },
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

    selectField: {
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 8,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#F3732A',
        borderRadius: 8,
        backgroundColor: '#FFF',
    },
    selectText: {
        color: '#33618D',
        fontSize: 16,
    },

    pickerContainer: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3732A',
    },

    mapWrapper: { flex: 1 },
    map: { flex: 1 },

    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(248,249,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },

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
    providerLogo: { width: 50, height: 50, marginRight: 12, borderRadius: 8 },
    info: { flex: 1, justifyContent: 'center' },
    providerName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    branchName: { fontSize: 14, color: '#555' },

    button: {
        backgroundColor: '#F3732A',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
    },
    buttonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
