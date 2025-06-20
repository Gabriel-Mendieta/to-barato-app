// app/settings/EditProfile.tsx

import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Platform,
    StyleSheet,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { MotiView } from 'moti';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';

type UsuarioResponse = {
    IdTipoUsuario: number;
    NombreUsuario: string;
    Correo: string;
    Telefono: string;
    Clave: string;
    Nombres: string;
    Apellidos: string;
    Estado: boolean;
    UrlPerfil: string;
    FechaNacimiento: string;
    IdUsuario: number;
    FechaCreacion: string;
};

export default function EditProfileScreen() {
    const [userData, setUserData] = useState<UsuarioResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [localImageUri, setLocalImageUri] = useState<string | null>(null);

    const [nombreUsuario, setNombreUsuario] = useState('');
    const [correo, setCorreo] = useState('');
    const [telefono, setTelefono] = useState('');
    const [nombres, setNombres] = useState('');
    const [apellidos, setApellidos] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const token = await SecureStore.getItemAsync('access_token');
                const userId = await SecureStore.getItemAsync('user_id');
                if (!token || !userId) {
                    await SecureStore.deleteItemAsync('access_token');
                    await SecureStore.deleteItemAsync('refresh_token');
                    await SecureStore.deleteItemAsync('user_id');
                    delete axios.defaults.headers.common['Authorization'];
                    router.replace('/auth/IniciarSesion');
                    return;
                }

                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const res = await axios.get<UsuarioResponse>(
                    `https://tobarato-api.alirizvi.dev/api/usuario/${userId}`
                );
                setUserData(res.data);

                setNombreUsuario(res.data.NombreUsuario);
                setCorreo(res.data.Correo);
                setTelefono(res.data.Telefono);
                setNombres(res.data.Nombres);
                setApellidos(res.data.Apellidos);
            } catch (err: any) {
                console.error('[EditProfile] load error', err);
                await SecureStore.deleteItemAsync('access_token');
                await SecureStore.deleteItemAsync('refresh_token');
                await SecureStore.deleteItemAsync('user_id');
                delete axios.defaults.headers.common['Authorization'];
                Alert.alert('Sesión expirada', 'Por favor inicia sesión de nuevo.', [
                    { text: 'Ok', onPress: () => router.replace('/auth/IniciarSesion') },
                ]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Necesitamos permiso para acceder a fotos.');
            return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: true,
        });
        if (!res.canceled) {
            setLocalImageUri(res.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!userData) return;
        setSubmitting(true);

        try {
            const userId = userData.IdUsuario;
            const payload: any = {};

            if (nombreUsuario.trim() !== userData.NombreUsuario) payload.NombreUsuario = nombreUsuario.trim();
            // correo es solo lectura
            if (telefono.trim() !== userData.Telefono) payload.Telefono = telefono.trim();
            if (nombres.trim() !== userData.Nombres) payload.Nombres = nombres.trim();
            if (apellidos.trim() !== userData.Apellidos) payload.Apellidos = apellidos.trim();

            if (localImageUri) {
                payload.UrlPerfil = localImageUri;
            }

            if (Object.keys(payload).length === 0) {
                Alert.alert('Sin cambios', 'No hubo modificaciones para guardar.');
                setSubmitting(false);
                return;
            }

            const resPut = await axios.put<UsuarioResponse>(
                `https://tobarato-api.alirizvi.dev/api/usuario/${userId}`,
                payload
            );
            setUserData(resPut.data);
            setLocalImageUri(null);
            Alert.alert('¡Éxito!', 'Tu perfil fue actualizado correctamente.');
            router.back();
        } catch (err: any) {
            console.error('[EditProfile] save error', err);
            Alert.alert('Error', 'No se pudo actualizar tu perfil. Intenta nuevamente.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#33618D" />
            </SafeAreaView>
        );
    }
    if (!userData) return null;

    const fullName = `${userData.Nombres} ${userData.Apellidos}`;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#001D35" />
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('../../tabs/perfil')} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Editar Perfil</Text>
                <View style={{ width: 28 }} />
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400 }}
                    style={styles.profileHeader}
                >
                    <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
                        <Image
                            source={{
                                uri: localImageUri ?? userData.UrlPerfil,
                            }}
                            style={styles.avatar}
                        />
                        <View style={styles.editIcon}>
                            <MaterialIcons name="edit" size={20} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.name}>{fullName}</Text>
                </MotiView>

                <View style={styles.form}>
                    <Text style={styles.label}>Nombre de usuario</Text>
                    <TextInput
                        style={styles.input}
                        value={nombreUsuario}
                        onChangeText={setNombreUsuario}
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Correo electrónico</Text>
                    <TextInput
                        style={[styles.input, styles.readOnly]}
                        value={correo}
                        editable={false}
                        selectTextOnFocus={false}
                    />

                    <Text style={styles.label}>Teléfono</Text>
                    <TextInput
                        style={styles.input}
                        value={telefono}
                        onChangeText={setTelefono}
                        keyboardType="phone-pad"
                    />

                    <Text style={styles.label}>Nombres</Text>
                    <TextInput style={styles.input} value={nombres} onChangeText={setNombres} />

                    <Text style={styles.label}>Apellidos</Text>
                    <TextInput style={styles.input} value={apellidos} onChangeText={setApellidos} />
                </View>

                <TouchableOpacity
                    style={[styles.saveBtn, submitting && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Text style={styles.saveText}>Guardar cambios</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#001D35",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 16,
        paddingBottom: 12,
        paddingHorizontal: 16,
        justifyContent: "space-between",
    },
    headerTitle: {
        color: "#FFF",
        fontSize: 20,
        fontWeight: "500",
    },
    backButton: {
        width: 28,
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#F8F9FF',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: 40 },
    profileHeader: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#FFF' },
    title: { fontSize: 24, fontWeight: '700', color: '#101418', marginBottom: 12 },
    avatarContainer: { position: 'relative', marginBottom: 12 },
    avatar: { width: 112, height: 112, borderRadius: 56, backgroundColor: '#EEE' },
    editIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#33618D',
        borderRadius: 12,
        padding: 4,
    },
    name: { fontSize: 20, fontWeight: '600', color: '#101418' },
    form: {
        marginTop: 12,
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        borderRadius: 8,
        padding: 16,
        elevation: 2,
    },
    label: { fontSize: 14, fontWeight: '500', color: '#101418', marginTop: 12 },
    input: {
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#101418',
    },
    readOnly: { backgroundColor: '#ECECEC' },
    saveBtn: {
        marginTop: 24,
        marginHorizontal: 32,
        backgroundColor: '#33618D',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        elevation: 3,
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
