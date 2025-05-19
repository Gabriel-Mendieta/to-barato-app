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
    Image
} from "react-native";
import { router } from "expo-router";
import { MotiView } from "moti";
import CustomButton from "@/components/shared/CustomButton";
import peso from '../../assets/images/peso_dominicano.jpg';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from "@/styles/global-styles";


export default function RegisterScreen() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const colorScheme = useColorScheme();

    const handleRegister = () => {
        // TODO: llamar a la API de registro y navegar a OTP
        router.push('/auth/Otp');
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#F8F9FF' }}>
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

                        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={80}>
                            <MotiView
                                from={{ opacity: 0, translateY: 20 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                transition={{ type: 'timing', duration: 400 }}
                                style={{ paddingHorizontal: 30, paddingTop: 20 }}
                            >
                                <Text style={{ color: "#101418", fontSize: 30, textAlign: "center", marginBottom: 15, marginHorizontal: 43, fontFamily: "Lexend-Black" }}>
                                    Ayuda a tu bolsillo con nosotros!
                                </Text>

                                {/* Nombre */}
                                <Text style={{ fontSize: 12, color: '#001D35', marginBottom: 4 }}>Nombre</Text>
                                <TextInput
                                    placeholder="Ingresa tu nombre"
                                    placeholderTextColor="#999"
                                    value={name}
                                    onChangeText={setName}
                                    style={{
                                        borderWidth: 1,
                                        borderColor: '#DBE1E7',
                                        borderRadius: 6,
                                        padding: 10,
                                        marginBottom: 16,
                                        backgroundColor: '#fff',
                                    }}
                                />

                                {/* Correo */}
                                <Text style={{ fontSize: 12, color: '#001D35', marginBottom: 4 }}>Correo electrónico o teléfono</Text>
                                <TextInput
                                    placeholder="Ingresa tu correo o teléfono"
                                    placeholderTextColor="#999"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    style={{
                                        borderWidth: 1,
                                        borderColor: '#DBE1E7',
                                        borderRadius: 6,
                                        padding: 10,
                                        marginBottom: 16,
                                        backgroundColor: '#fff',
                                    }}
                                />

                                {/* Contraseña */}
                                <Text style={{ fontSize: 12, color: '#001D35', marginBottom: 4 }}>Contraseña</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#DBE1E7', borderRadius: 6, backgroundColor: '#fff', marginBottom: 20 }}>
                                    <TextInput
                                        placeholder="Ingresa tu contraseña"
                                        placeholderTextColor="#999"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!passwordVisible}
                                        style={{ flex: 1, padding: 10 }}
                                    />
                                    <TouchableOpacity onPress={() => setPasswordVisible(v => !v)} style={{ paddingHorizontal: 10 }}>
                                        <Ionicons name={passwordVisible ? 'eye' : 'eye-off'} size={20} color="#001D35" />
                                    </TouchableOpacity>
                                </View>

                                {/* Botón Registrarse */}
                                <CustomButton color="primary" textFont="medium" onPress={handleRegister}>
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
