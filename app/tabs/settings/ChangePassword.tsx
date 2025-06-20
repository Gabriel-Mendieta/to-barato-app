// Archivo: app/settings/ChangePassword.tsx

import React, { useState, useEffect } from "react";
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StatusBar,
    Platform,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

export default function ChangePasswordScreen() {
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Campos de formulario
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Para almacenar el IdUsuario desde SecureStore
    const [userId, setUserId] = useState<number | null>(null);

    useEffect(() => {
        (async () => {
            try {
                // Leer token y user_id de SecureStore
                const token = await SecureStore.getItemAsync("access_token");
                const idStr = await SecureStore.getItemAsync("user_id");
                if (!token || !idStr) {
                    // Si falta, redirigir a login
                    await SecureStore.deleteItemAsync("access_token");
                    await SecureStore.deleteItemAsync("refresh_token");
                    await SecureStore.deleteItemAsync("user_id");
                    delete axios.defaults.headers.common["Authorization"];
                    router.replace("/auth/IniciarSesion");
                    return;
                }
                // Fijar header de autorización
                axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
                // Convertir Id a número
                setUserId(Number(idStr));
            } catch (err) {
                console.warn("[ChangePassword] Error leyendo SecureStore:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleSave = async () => {
        // Validaciones básicas
        if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
            Alert.alert("Campos incompletos", "Por favor, completa todos los campos.");
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "La nueva contraseña y su confirmación no coinciden.");
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert("Contraseña débil", "La nueva contraseña debe tener al menos 6 caracteres.");
            return;
        }
        if (!userId) {
            Alert.alert("Error interno", "No se pudo determinar tu usuario. Vuelve a iniciar sesión.");
            return;
        }

        setSubmitting(true);
        try {
            // Preparar payload
            const payload = {
                IdUsuario: userId,
                Clave: currentPassword,
                ClaveNueva: newPassword,
            };
            // Enviar PUT a /change-password
            const res = await axios.put<{ message: string }>(
                "https://tobarato-api.alirizvi.dev/api/change-password",
                payload
            );
            // Si todo sale bien, mostrar mensaje y regresar
            Alert.alert("¡Éxito!", "Contraseña cambiada correctamente.", [
                { text: "OK", onPress: () => router.back() },
            ]);
        } catch (err: any) {
            console.error("[ChangePassword] Error al cambiar contraseña:", err);
            if (err.response && err.response.data) {
                const data = err.response.data;
                // Si el backend devuelve algún mensaje en data, lo mostramos
                if (typeof data.message === "string") {
                    Alert.alert("Error", data.message);
                } else {
                    Alert.alert("Error", "No se pudo cambiar la contraseña. Intenta nuevamente.");
                }
            } else {
                Alert.alert("Error", "No se pudo cambiar la contraseña. Intenta nuevamente.");
            }
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

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#001D35" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ flex: 1 }}
            >
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.push('../../tabs/perfil')} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Cambiar Contraseña</Text>
                    <View style={{ width: 28 }} />
                </View>

                {/* FORMULARIO */}
                <View style={styles.formContainer}>
                    {/* Contraseña actual */}
                    <Text style={styles.label}>Contraseña actual</Text>
                    <TextInput
                        style={styles.input}                   // -> mismo estilo que Editar Perfil
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        placeholder="Ingresa tu contraseña actual"
                        secureTextEntry
                        autoCapitalize="none"
                        placeholderTextColor="#888"
                    />

                    {/* Nueva contraseña */}
                    <Text style={styles.label}>Nueva contraseña</Text>
                    <TextInput
                        style={styles.input}                   // -> mismo estilo que Editar Perfil
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="Ingresa la nueva contraseña"
                        secureTextEntry
                        autoCapitalize="none"
                        placeholderTextColor="#888"
                    />

                    {/* Confirmar nueva contraseña */}
                    <Text style={styles.label}>Confirmar nueva contraseña</Text>
                    <TextInput
                        style={styles.input}                   // -> mismo estilo que Editar Perfil
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Vuelve a escribir la nueva contraseña"
                        secureTextEntry
                        autoCapitalize="none"
                        placeholderTextColor="#888"
                    />
                </View>

                {/* BOTÓN GUARDAR */}
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
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F8F9FF",
    },

    container: {
        flex: 1,
        backgroundColor: "#F8F9FF",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#001D35",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 16,
        paddingBottom: 12,
        paddingHorizontal: 16,
        justifyContent: "space-between",
    },
    backButton: {
        width: 28,
    },
    headerTitle: {
        color: "#FFF",
        fontSize: 20,
        fontWeight: "500",
    },

    formContainer: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "500",
        color: "#101418",
        marginBottom: 4,
        marginTop: 12,
    },
    input: {
        backgroundColor: "#F3F4F6",     // Color de fondo gris claro
        borderRadius: 8,                // Bordes redondeados iguales a Editar Perfil
        paddingHorizontal: 12,          // Padding horizontal igual
        paddingVertical: 10,            // Padding vertical igual
        fontSize: 16,                   // Tamaño de fuente igual
        color: "#101418",               // Mismo color de texto
    },

    saveButton: {
        marginTop: 32,
        marginHorizontal: 32,
        backgroundColor: "#33618D",
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: "center",
        elevation: 3,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
