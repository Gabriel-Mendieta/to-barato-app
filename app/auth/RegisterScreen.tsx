// app/auth/RegisterScreen.tsx
import React, { useState, useEffect } from "react";
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

    // validaciones
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(email);
    const canSubmit =
        firstName.trim().length > 0 &&
        lastName.trim().length > 0 &&
        username.trim().length > 0 &&
        isEmailValid &&
        password.length >= 6;

    const handleRegister = () => {
        // aquí podrías guardar en estado global o params para luego OTP
        router.push({
            pathname: "/auth/Otp",
            params: {
                data: encodeURIComponent(
                    JSON.stringify({ firstName, lastName, username, email, password })
                ),
            },
        });
    };

    return (
        <SafeAreaView style={[
            styles.container,
            { backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#F8F9FF' }
        ]}>
            <ScrollView keyboardShouldPersistTaps="handled">
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={{ flex: 1 }}>
                        {/* Fondo con logo */}
                        <ImageBackground source={peso} resizeMode="stretch" style={globalStyles.pesosBacground}>
                            <View style={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: 'rgba(16, 55, 92, 0.61)'
                            }} />

                            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 40 }}>
                                <Image source={require('../../assets/icons/logo.png')} resizeMode="contain" style={{ width: 70, height: 105, marginRight: 10 }} />
                                <View>
                                    <Text style={{ marginBottom: -10, fontSize: 47, color: "#fff", fontFamily: "Lexend-Medium" }}>To'</Text>
                                    <Text style={{ fontSize: 47, color: "#fff", fontWeight: "bold", fontFamily: "Lexend-Medium" }}>Barato</Text>
                                </View>
                            </View>
                        </ImageBackground>

                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            keyboardVerticalOffset={80}
                        >
                            <MotiView
                                from={{ opacity: 0, translateY: 20 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                transition={{ type: 'timing', duration: 400 }}
                                style={styles.form}
                            >
                                <Text style={styles.title}>
                                    Completa tus datos
                                </Text>

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
                                    <Text style={styles.errorText}>
                                        Formato de correo inválido
                                    </Text>
                                )}

                                {/* Contraseña */}
                                <Text style={styles.label}>Contraseña</Text>
                                <View style={styles.passwordWrap}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder="Mínimo 6 caracteres"
                                        placeholderTextColor="#999"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!passwordVisible}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setPasswordVisible(v => !v)}
                                        style={styles.eyeBtn}
                                    >
                                        <Ionicons
                                            name={passwordVisible ? 'eye' : 'eye-off'}
                                            size={20}
                                            color="#001D35"
                                        />
                                    </TouchableOpacity>
                                </View>

                                {/* Botón Registrarse */}
                                <CustomButton
                                    color="primary"
                                    textFont="medium"
                                    onPress={handleRegister}
                                    disabled={!canSubmit}
                                >
                                    Registrarse
                                </CustomButton>
                                {/* Línea divisoria */}
                                <View style={{ alignItems: "center", marginBottom: 20, position: "relative" }}>
                                    <View style={{ position: "absolute", height: 1, backgroundColor: "#B5C1CC", left: 0, right: 0, top: 12 }} />
                                    <Text style={{ backgroundColor: "#F8F9FF", paddingHorizontal: 10, color: "#33618D", fontWeight: "bold" }}>o</Text>
                                </View>

                                {/* Google / Apple */}
                                <CustomButton color="white" textFont="medium" textColor="neutral" variant="withIcon" icon="logo-google" onPress={() => router.push('../tabs/home')}>
                                    Continuar con Google
                                </CustomButton>

                                <CustomButton color="white" textFont="medium" textColor="neutral" variant="withIcon" icon="logo-apple" onPress={() => router.push('../tabs/home')}>
                                    Continuar con Apple
                                </CustomButton>

                                {/* Link a Login */}
                                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10, marginBottom: 40 }}>
                                    <Text style={{ color: '#001D35' }}>Ya tengo una cuenta. </Text>
                                    <TouchableOpacity onPress={() => router.push('/auth/IniciarSesion')}>
                                        <Text style={{ color: '#7F5610', fontWeight: 'bold' }}>Iniciar Sesión</Text>
                                    </TouchableOpacity>
                                </View>
                            </MotiView>
                        </KeyboardAvoidingView>
                    </View>
                </TouchableWithoutFeedback>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    background: { height: 240, justifyContent: 'flex-end' },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(16,55,92,0.61)'
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 16,
    },
    logo: { width: 70, height: 105, marginRight: 10 },
    logoText: { fontSize: 47, color: '#fff', fontFamily: 'Lexend-Medium', marginBottom: -10 },
    logoTextBold: { fontSize: 47, color: '#fff', fontWeight: 'bold', fontFamily: 'Lexend-Medium' },
    form: { paddingHorizontal: 24, paddingTop: 16 },
    title: { fontSize: 30, textAlign: 'center', marginBottom: 24, color: '#101418', fontFamily: 'Lexend-Black' },
    label: { fontSize: 12, color: '#001D35', marginBottom: 6 },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#DBE1E7',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 16,
    },
    inputError: { borderColor: '#D1170F' },
    errorText: { color: '#D1170F', marginTop: -12, marginBottom: 12, fontSize: 12 },
    passwordWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#DBE1E7',
        borderRadius: 6,
        marginBottom: 24,
    },
    passwordInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
    eyeBtn: { paddingHorizontal: 12 },
});


