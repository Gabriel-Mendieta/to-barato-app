// Archivo: app/settings/EditProfile.tsx

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
import * as FileSystem from 'expo-file-system';

// ——————————————————————————————————————————————
// TIPADO de la respuesta GET /usuario/{id} y PUT /usuario/{id}
// ——————————————————————————————————————————————
type UsuarioResponse = {
    IdTipoUsuario: number;
    NombreUsuario: string;
    Correo: string;
    Telefono: string;
    Clave: string;
    Nombres: string;
    Apellidos: string;
    Estado: boolean;
    UrlPerfil: string; // URL o base64
    FechaNacimiento: string;
    IdUsuario: number;
    FechaCreacion: string;
};

// ——————————————————————————————————————————————
// COMPONENTE principal: EditProfile
// ——————————————————————————————————————————————

export default function EditProfileScreen() {
    const [userData, setUserData] = useState<UsuarioResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [showImageLoader, setShowImageLoader] = useState<boolean>(false);

    // ESTADOS LOCALES para edición
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [correo, setCorreo] = useState('');
    const [telefono, setTelefono] = useState('');
    const [nombres, setNombres] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [localImageUri, setLocalImageUri] = useState<string | null>(null);

    // —————————————————————————
    // 1) Al montar, cargo datos del usuario
    // —————————————————————————
    useEffect(() => {
        (async () => {
            try {
                // 1.1) Leer token y user_id de SecureStore
                const token = await SecureStore.getItemAsync('access_token');
                const userId = await SecureStore.getItemAsync('user_id');
                if (!token || !userId) {
                    // Si falta algo → redirigir a login
                    await SecureStore.deleteItemAsync('access_token');
                    await SecureStore.deleteItemAsync('refresh_token');
                    await SecureStore.deleteItemAsync('user_id');
                    delete axios.defaults.headers.common['Authorization'];
                    router.replace('/auth/IniciarSesion');
                    return;
                }

                // 1.2) Fijamos el header
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                // 1.3) Petición GET /usuario/{userId}
                const res = await axios.get<UsuarioResponse>(
                    `https://tobarato-api.alirizvi.dev/api/usuario/${userId}`
                );
                setUserData(res.data);

                // 1.4) Inicializamos los estados de los inputs con la información recibida
                setNombreUsuario(res.data.NombreUsuario || '');
                setCorreo(res.data.Correo || '');
                setTelefono(res.data.Telefono || '');
                setNombres(res.data.Nombres || '');
                setApellidos(res.data.Apellidos || '');
                setLocalImageUri(null);
            } catch (err: any) {
                console.error('[EditProfile] Error al obtener datos de usuario:', err);
                // Si 401/403, limpiamos credenciales y mandamos a Login
                await SecureStore.deleteItemAsync('access_token');
                await SecureStore.deleteItemAsync('refresh_token');
                await SecureStore.deleteItemAsync('user_id');
                delete axios.defaults.headers.common['Authorization'];

                Alert.alert(
                    'Sesión expirada',
                    'Tu sesión ha expirado. Inicia sesión nuevamente.',
                    [{ text: 'Ok', onPress: () => router.replace('/auth/IniciarSesion') }]
                );
                return;
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // —————————————————————————
    // 2) Función para seleccionar imagen con ImagePicker
    // —————————————————————————
    const pickImage = async () => {
        try {
            // Pedimos permiso de la galería
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Necesitamos permiso para acceder a tus fotos.');
                return;
            }

            // Abrimos selector
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.7,
                base64: false,
            });

            if (!result.cancelled) {
                // Guardamos la URI local
                setLocalImageUri(result.uri);
            }
        } catch (err) {
            console.warn('[EditProfile] Error al abrir ImagePicker:', err);
        }
    };

    // —————————————————————————
    // 3) Función para “subir” la imagen y devolver un string (URL o base64)
    //    Convertiremos la imagen seleccionada a base64 y la enviaremos en UrlPerfil.
    // —————————————————————————
    const convertImageToBase64 = async (uri: string): Promise<string> => {
        try {
            setShowImageLoader(true);
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            const extension = uri.split('.').pop()?.toLowerCase();
            const mime =
                extension === 'png'
                    ? 'image/png'
                    : extension === 'jpg' || extension === 'jpeg'
                        ? 'image/jpeg'
                        : 'image/jpeg';
            return `data:${mime};base64,${base64}`;
        } catch (err) {
            console.warn('[EditProfile] Error al convertir imagen a base64:', err);
            return uri; // fallback: devolvemos la URI original
        } finally {
            setShowImageLoader(false);
        }
    };

    // —————————————————————————
    // 4) Función que se dispara al presionar “Guardar”
    //    Hacemos PUT /usuario/{idUsuario} con sólo los campos modificados,
    //    y con la imagen seleccionada (si la hubo) convertida a base64.
    // —————————————————————————
    const handleSave = async () => {
        if (!userData) return;

        setSubmitting(true);

        try {
            const userId = userData.IdUsuario;
            const payload: any = {};

            // Sólo agregamos a payload los campos que el usuario modificó
            if (nombreUsuario.trim() !== userData.NombreUsuario) {
                payload.NombreUsuario = nombreUsuario.trim();
            }
            // El correo NO es editable por el usuario (queda fuera)
            // if (correo.trim() !== userData.Correo) {
            //   payload.Correo = correo.trim();
            // }
            if (telefono.trim() !== userData.Telefono) {
                payload.Telefono = telefono.trim();
            }
            if (nombres.trim() !== userData.Nombres) {
                payload.Nombres = nombres.trim();
            }
            if (apellidos.trim() !== userData.Apellidos) {
                payload.Apellidos = apellidos.trim();
            }

            // Si seleccionó nueva imagen (localImageUri), la convertimos a base64
            if (localImageUri) {
                const base64img = await convertImageToBase64(localImageUri);
                payload.UrlPerfil = base64img;
            }

            // Si no hay nada para actualizar, salimos
            if (Object.keys(payload).length === 0) {
                Alert.alert('Sin cambios', 'No hubo modificaciones para guardar.');
                setSubmitting(false);
                return;
            }

            // 4.1) Hacemos PUT /usuario/{idUsuario}
            const resPut = await axios.put<UsuarioResponse>(
                `https://tobarato-api.alirizvi.dev/api/usuario/${userId}`,
                payload
            );

            // 4.2) Actualizamos el estado local con los datos devueltos por el backend
            setUserData(resPut.data);
            setLocalImageUri(null);

            Alert.alert('¡Éxito!', 'Tu perfil fue actualizado correctamente.');

            // Volvemos a la pantalla de perfil
            router.back();
        } catch (err: any) {
            console.error('[EditProfile] Error al guardar perfil:', err);
            if (err.response && err.response.data) {
                console.log('[EditProfile] Detalle del error:', err.response.data);
            }
            Alert.alert('Error', 'No se pudo actualizar tu perfil. Intenta nuevamente.');
        } finally {
            setSubmitting(false);
        }
    };

    // —————————————————————————
    // 5) Renderizado
    // —————————————————————————
    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#33618D" />
            </SafeAreaView>
        );
    }

    if (!userData) {
        // Si por alguna razón no hay datos (ya se redirigió al login), devolvemos null
        return null;
    }

    const fullName = `${userData.Nombres} ${userData.Apellidos}`;

    return (
        <SafeAreaView style={styles.safeAreaAndroid}>
            <StatusBar barStyle="light-content" backgroundColor="#001D35" />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* ====== CABECERA ====== */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400 }}
                    style={styles.profileHeader}
                >
                    <Text style={styles.title}>Editar Perfil</Text>

                    {/* Avatar (actual o placeholder) */}
                    <TouchableOpacity
                        style={styles.avatarContainer}
                        onPress={pickImage}
                        disabled={showImageLoader}
                    >
                        {showImageLoader ? (
                            <ActivityIndicator size="small" color="#33618D" />
                        ) : localImageUri || userData.UrlPerfil ? (
                            <Image
                                source={{
                                    uri: localImageUri ? localImageUri : userData.UrlPerfil,
                                }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <Ionicons name="person" size={48} color="#AAA" />
                            </View>
                        )}
                        <View style={styles.editIconOverlay}>
                            <MaterialIcons name="edit" size={20} color="#FFF" />
                        </View>
                    </TouchableOpacity>

                    <Text style={styles.name}>{fullName}</Text>
                </MotiView>

                {/* ====== CAMPOS DE EDICIÓN ====== */}
                <View style={styles.formContainer}>
                    {/* Nombre de usuario */}
                    <Text style={styles.label}>Nombre de usuario</Text>
                    <TextInput
                        style={styles.input}
                        value={nombreUsuario}
                        onChangeText={setNombreUsuario}
                        placeholder="Ingresa tu nombre de usuario"
                        autoCapitalize="none"
                    />

                    {/* Correo (SOLO LECTURA) */}
                    <Text style={styles.label}>Correo electrónico</Text>
                    <TextInput
                        style={[styles.input, styles.readOnlyInput]}
                        value={correo}
                        editable={false}
                        selectTextOnFocus={false}
                        placeholder="ejemplo@dominio.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    {/* Teléfono */}
                    <Text style={styles.label}>Teléfono</Text>
                    <TextInput
                        style={styles.input}
                        value={telefono}
                        onChangeText={setTelefono}
                        placeholder="8091234567"
                        keyboardType="phone-pad"
                    />

                    {/* Nombres */}
                    <Text style={styles.label}>Nombres</Text>
                    <TextInput
                        style={styles.input}
                        value={nombres}
                        onChangeText={setNombres}
                        placeholder="Tus nombres"
                    />

                    {/* Apellidos */}
                    <Text style={styles.label}>Apellidos</Text>
                    <TextInput
                        style={styles.input}
                        value={apellidos}
                        onChangeText={setApellidos}
                        placeholder="Tus apellidos"
                    />
                </View>

                {/* ====== BOTÓN “Guardar” ====== */}
                <TouchableOpacity
                    style={[styles.saveButton, submitting && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Text style={styles.saveButtonText}>Guardar cambios</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

// ——————————————————————————————————————————————
// ESTILOS
// ——————————————————————————————————————————————
const styles = StyleSheet.create({
    safeAreaAndroid: {
        flex: 1,
        backgroundColor: '#F8F9FF',
        // En Android, empujamos todo hacia abajo para no quedar bajo la barra de estado
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    scrollContent: {
        paddingBottom: 40,
    },

    profileHeader: {
        alignItems: 'center',
        paddingVertical: 24,
        backgroundColor: '#FFF',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#101418',
        marginBottom: 12,
    },

    avatarContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 112,
        height: 112,
        borderRadius: 56,
        borderWidth: 2,
        borderColor: '#DDD',
        backgroundColor: '#EEE',
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIconOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#33618D',
        borderRadius: 12,
        padding: 4,
    },
    name: {
        fontSize: 20,
        fontWeight: '600',
        color: '#101418',
    },

    // ===================================================================
    // FORMULARIO DE EDICIÓN
    // ===================================================================
    formContainer: {
        marginTop: 12,
        paddingHorizontal: 16,
        backgroundColor: '#FFF',
        paddingVertical: 16,
        borderRadius: 8,
        marginHorizontal: 16,
        elevation: 2,
    },

    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#101418',
        marginBottom: 4,
        marginTop: 12,
    },
    input: {
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#101418',
    },

    // Estilo opcional para indicar que es sólo lectura
    readOnlyInput: {
        backgroundColor: '#ECECEC',
    },

    saveButton: {
        marginTop: 24,
        marginHorizontal: 32,
        backgroundColor: '#33618D',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        elevation: 3,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
