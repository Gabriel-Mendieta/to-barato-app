// app/auth/RegisterScreen.tsx

import React, { useState } from "react";
import {
    SafeAreaView,
    View,
    ScrollView,
    ImageBackground,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    TouchableWithoutFeedback,
    useColorScheme,
    Image,
    StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { MotiView } from "moti";
import axios from "axios";
import CustomButton from "@/components/shared/CustomButton";
import peso from '../../assets/images/peso_dominicano.jpg';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from "@/styles/global-styles";

export default function RegisterScreen() {
    const colorScheme = useColorScheme();

    // campos
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);

    // loading + error OTP
    const [sendingOtp, setSendingOtp] = useState(false);
    const [otpError, setOtpError] = useState("");

    // validaciones
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(email);

    // mínimo 6, al menos 1 mayúscula, 1 número y 1 caracter especial
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
    const isPasswordValid = passwordRegex.test(password);

    const canSubmit =
        firstName.trim().length > 0 &&
        lastName.trim().length > 0 &&
        username.trim().length > 0 &&
        isEmailValid &&
        isPasswordValid;

    const handleRegister = async () => {
        if (!canSubmit) return;
        setOtpError("");
        setSendingOtp(true);

        try {
            await axios.post(
                `https://tobarato-api.alirizvi.dev/api/solicitar-otp?email=${encodeURIComponent(email)}`
            );
            router.push({
                pathname: "/auth/Otp",
                params: {
                    data: encodeURIComponent(
                        JSON.stringify({ firstName, lastName, username, email, password })
                    ),
                },
            });
        } catch (err) {
            console.error(err);
            setOtpError("No se pudo enviar el OTP. Por favor, inténtalo de nuevo.");
        } finally {
            setSendingOtp(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: "#F8F9FF" }]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 80}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={{ flex: 1 }}>
                            {/* Fondo con logo */}
                            <ImageBackground
                                source={peso}
                                resizeMode="stretch"
                                style={globalStyles.pesosBacground}
                            >
                                <View style={styles.overlay} />

                                <View style={styles.logoRow}>
                                    <Image
                                        source={require("../../assets/icons/logo.png")}
                                        resizeMode="contain"
                                        style={styles.logo}
                                    />
                                    <View>
                                        <Text style={styles.logoText}>To'</Text>
                                        <Text style={styles.logoTextBold}>Barato</Text>
                                    </View>
                                </View>
                            </ImageBackground>

                            <MotiView
                                from={{ opacity: 0, translateY: 20 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                transition={{ type: "timing", duration: 400 }}
                                style={styles.form}
                            >
                                <Text style={styles.title}>Completa tus datos</Text>

                                {/* Nombre */}
                                <Text style={styles.label}>Nombre</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ingresa tu nombre"
                                    placeholderTextColor="#999"
                                    value={firstName}
                                    onChangeText={setFirstName}
                                />

                                {/* Apellidos */}
                                <Text style={styles.label}>Apellidos</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ingresa tus apellidos"
                                    placeholderTextColor="#999"
                                    value={lastName}
                                    onChangeText={setLastName}
                                />

                                {/* Nombre de usuario */}
                                <Text style={styles.label}>Nombre de usuario</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="ej. pedro_el_mejor"
                                    placeholderTextColor="#999"
                                    value={username}
                                    onChangeText={setUsername}
                                    autoCapitalize="none"
                                />

                                {/* Correo */}
                                <Text style={styles.label}>Correo electrónico</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        !isEmailValid && email.length > 0 && styles.inputError,
                                    ]}
                                    placeholder="ej. correo@ejemplo.com"
                                    placeholderTextColor="#999"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                                {(!isEmailValid && email.length > 0) && (
                                    <Text style={styles.errorText}>Formato de correo inválido</Text>
                                )}

                                {/* Contraseña */}
                                <Text style={styles.label}>Contraseña</Text>
                                <View
                                    style={[
                                        styles.passwordWrap,
                                        !isPasswordValid && password.length > 0 && styles.inputError,
                                    ]}
                                >
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder="Mínimo 6 caracteres"
                                        placeholderTextColor="#999"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!passwordVisible}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity
                                        onPress={() => setPasswordVisible((v) => !v)}
                                        style={styles.eyeBtn}
                                    >
                                        <Ionicons
                                            name={passwordVisible ? "eye" : "eye-off"}
                                            size={20}
                                            color="#001D35"
                                        />
                                    </TouchableOpacity>
                                </View>
                                {password.length > 0 && !isPasswordValid && (
                                    <Text style={styles.errorText}>
                                        La contraseña debe tener al menos 6 caracteres,
                                        incluir una mayúscula, un número y un carácter especial.
                                    </Text>
                                )}

                                {/* Error OTP */}
                                {otpError.length > 0 && (
                                    <Text style={styles.errorText}>{otpError}</Text>
                                )}

                                {/* Botón Registrarse */}
                                <CustomButton
                                    color="primary"
                                    textFont="medium"
                                    onPress={handleRegister}
                                    disabled={!canSubmit || sendingOtp}
                                >
                                    {sendingOtp ? "Enviando OTP..." : "Registrarse"}
                                </CustomButton>

                                {/* Línea divisoria */}
                                <View style={styles.orLine}>
                                    <View style={styles.orSeparator} />
                                    <Text style={styles.orText}>o</Text>
                                </View>

                                {/* Link a Login */}
                                <View style={styles.loginLink}>
                                    <Text style={{ color: "#001D35" }}>Ya tengo una cuenta. </Text>
                                    <TouchableOpacity
                                        onPress={() => router.push("/auth/IniciarSesion")}
                                    >
                                        <Text
                                            style={{ color: "#7F5610", fontWeight: "bold" }}
                                        >
                                            Iniciar Sesión
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </MotiView>
                        </View>
                    </TouchableWithoutFeedback>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(16,55,92,0.61)",
    },
    logoRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 16,
    },
    logo: { width: 70, height: 105, marginRight: 10 },
    logoText: {
        fontSize: 47,
        color: "#fff",
        fontFamily: "Lexend-Medium",
        marginBottom: -10,
    },
    logoTextBold: {
        fontSize: 47,
        color: "#fff",
        fontWeight: "bold",
        fontFamily: "Lexend-Medium",
    },
    form: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
    title: {
        fontSize: 30,
        textAlign: "center",
        marginBottom: 24,
        color: "#101418",
        fontFamily: "Lexend-Black",
    },
    label: { fontSize: 12, color: "#001D35", marginBottom: 6 },
    input: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#DBE1E7",
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 16,
    },
    inputError: { borderColor: "#D1170F" },
    errorText: {
        color: "#D1170F",
        marginTop: -12,
        marginBottom: 12,
        fontSize: 12,
    },
    passwordWrap: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#DBE1E7",
        borderRadius: 6,
        marginBottom: 8,
    },
    passwordInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
    eyeBtn: { paddingHorizontal: 12 },
    orLine: {
        alignItems: "center",
        marginBottom: 20,
        position: "relative",
    },
    orSeparator: {
        position: "absolute",
        height: 1,
        backgroundColor: "#B5C1CC",
        left: 0,
        right: 0,
        top: 12,
    },
    orText: {
        backgroundColor: "#F8F9FF",
        paddingHorizontal: 10,
        color: "#33618D",
        fontWeight: "bold",
    },
    loginLink: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 10,
        marginBottom: 40,
    },
});
