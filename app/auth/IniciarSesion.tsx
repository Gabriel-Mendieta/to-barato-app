import React, { useState, useEffect } from "react";
import {
    SafeAreaView,
    View,
    ScrollView,
    ImageBackground,
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    useColorScheme,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    TouchableWithoutFeedback,
    Pressable,
} from "react-native";
import { router } from "expo-router";
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import CustomButton from "@/components/shared/CustomButton";
import peso from '../../assets/images/peso_dominicano.jpg';
import { globalStyles } from "@/styles/global-styles";

export default function IniciarSesion() {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const colorScheme = useColorScheme();

    useEffect(() => {
        verificarBiometria();
    }, []);

    const verificarBiometria = async () => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const registrado = await LocalAuthentication.isEnrolledAsync();

        if (compatible && registrado) {
            const resultado = await LocalAuthentication.authenticateAsync({
                promptMessage: "Iniciar sesión con biometría",
                fallbackLabel: "Usar contraseña",
            });

            if (resultado.success) {
                router.push("/tabs/home");
            } else {
                Alert.alert("Autenticación fallida", "Puedes usar tu contraseña.");
            }
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colorScheme === "dark" ? "#0a0a0a" : "#F8F9FF" }}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
                >
                    <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
                        {/* Fondo superior con logo */}
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

                        <MotiView from={{ opacity: 0, translateY: 25 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 500 }}>
                            <Text style={{ color: "#101418", fontSize: 30, textAlign: "center", marginBottom: 15, marginHorizontal: 43, fontFamily: "Lexend-Black" }}>
                                Ayuda a tu bolsillo con nosotros!
                            </Text>

                            {/* Email */}
                            <Text style={{ color: "#001D35", fontSize: 12, fontWeight: "bold", marginBottom: 4, marginLeft: 30 }}>Correo electrónico o teléfono</Text>
                            <TextInput
                                placeholder="mario.luciano@gmail.com"
                                value={email}
                                onChangeText={setEmail}
                                style={{
                                    color: "#101418",
                                    fontSize: 16,
                                    marginBottom: 6,
                                    marginHorizontal: 31,
                                    backgroundColor: "#F8F9FF",
                                    borderColor: "#DBE1E7",
                                    borderRadius: 5,
                                    borderWidth: 1,
                                    paddingVertical: 7,
                                    paddingLeft: 9,
                                    paddingRight: 18,
                                    fontFamily: "Lexend-Light"
                                }}
                            />
                            <Text style={{ color: "#7D747E", fontSize: 14, marginBottom: 23, marginLeft: 30, fontFamily: "Lexend-Medium" }}>
                                Ingrese su correo o teléfono
                            </Text>

                            {/* Contraseña */}
                            <Text style={{ color: "#001D35", fontSize: 12, fontWeight: "bold", marginBottom: 4, marginLeft: 30 }}>Contraseña</Text>
                            <View style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 30, borderColor: "#DBE1E7", borderWidth: 1, borderRadius: 5, paddingHorizontal: 10, backgroundColor: "#F8F9FF" }}>
                                <TextInput
                                    placeholder="************"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!passwordVisible}
                                    style={{ flex: 1, fontSize: 16, color: "#101418", paddingVertical: 8, fontFamily: "Lexend-Light" }}
                                />
                                <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                                    <Ionicons name={passwordVisible ? "eye" : "eye-off"} size={24} color="#001D35" />
                                </TouchableOpacity>
                            </View>
                            <Text style={{ color: "#7D747E", fontSize: 14, marginBottom: 20, marginLeft: 30, fontFamily: "Lexend-Medium" }}>
                                Ingrese su contraseña
                            </Text>

                            {/* Botón login */}
                            <CustomButton color="primary" textFont="medium" onPress={() => router.push('/tabs/home')}>
                                Iniciar Sesión
                            </CustomButton>

                            {/* Línea divisoria */}
                            <View style={{ alignItems: "center", marginBottom: 20, marginHorizontal: 31, position: "relative" }}>
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

                            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 40 }}>
                                <Text style={{ fontFamily: 'Lexend-Light', color: '#001D35' }}>¿No tienes una cuenta?</Text>
                                <TouchableOpacity onPress={() => router.push('/auth/RegisterScreen')}>
                                    <Text style={{ color: '#7F5610', fontWeight: 'bold', paddingLeft: 5 }}>Registrate</Text>
                                </TouchableOpacity>
                            </View>
                        </MotiView>
                    </ScrollView>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
}