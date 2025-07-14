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
    StyleSheet,
} from "react-native";
import { router } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import CustomButton from "@/components/shared/CustomButton";
import peso from "../../assets/images/peso_dominicano.jpg";
import { globalStyles } from "@/styles/global-styles";

export default function IniciarSesion() {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const colorScheme = useColorScheme();
    const [checkingToken, setCheckingToken] = useState(true);

    //
    // 1) AL MONTAR, MIRAMOS SI HAY TOKEN EN SECURESTORE. 
    //    Si lo hay, hacemos un “ping” rápido al backend para validar
    //    que siga siendo válido. Si es válido, redirigimos a Home. 
    //    Si no es válido (401/403), lo borramos y mostramos el formulario normalmente.
    //
    useEffect(() => {
        (async () => {
            const storedToken = await SecureStore.getItemAsync("access_token");
            const storedUserId = await SecureStore.getItemAsync("user_id");

            if (!storedToken || !storedUserId) {
                // No hay token ni user_id → mostrar formulario de Login
                setCheckingToken(false);
                return;
            }

            // Fijamos header temporalmente para validar token
            axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;

            try {
                // LLAMADA “PING” PARA VALIDAR TOKEN. Asumimos que GET /usuario/{id}
                // devolverá 200 si el token es correcto, o 401/403 si expiró/invalidó.
                await axios.get(`https://tobarato-api.alirizvi.dev/api/usuario/${storedUserId}`);
                // Si llegamos aquí, el token es VÁLIDO: redirigimos a Home.
                router.replace("/tabs/home");
            } catch (e) {
                // Si da error (401, 403, cualquier otro), borramos todo y mostramos el formulario
                await SecureStore.deleteItemAsync("access_token");
                await SecureStore.deleteItemAsync("refresh_token");
                await SecureStore.deleteItemAsync("user_id");
                delete axios.defaults.headers.common["Authorization"];
                setCheckingToken(false);
            }
        })();
    }, []);

    // La pantalla no se mostrará hasta que termine de “chequear” el token
    if (checkingToken) {
        return null; // O un spinner si lo prefieres
    }

    const verificarBiometria = async () => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const registrado = await LocalAuthentication.isEnrolledAsync();

        if (compatible && registrado) {
            const resultado = await LocalAuthentication.authenticateAsync({
                promptMessage: "Iniciar sesión con biometría",
                fallbackLabel: "Usar contraseña",
            });

            if (resultado.success) {
                router.replace("/tabs/home");
            } else {
                Alert.alert("Autenticación fallida", "Puedes usar tu contraseña.");
            }
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            return Alert.alert("Error", "Debes ingresar correo y contraseña");
        }

        try {
            const resp = await axios.post<{
                message: string;
                tokens: {
                    access_token: string;
                    refresh_token: string;
                    token_type: string;
                };
                usuario: {
                    id: number;
                    email: string;
                    nombre: string;
                };
            }>("https://tobarato-api.alirizvi.dev/api/login", {
                Correo: email,
                Clave: password,
            });

            const {
                tokens: { access_token, refresh_token, token_type },
                usuario,
            } = resp.data;

            // 1) Guardar tokens y user_id de forma segura
            await SecureStore.setItemAsync("access_token", access_token);
            await SecureStore.setItemAsync("refresh_token", refresh_token);
            await SecureStore.setItemAsync("user_id", usuario.id.toString());

            // 2) Fijar header global de axios para futuras peticiones
            axios.defaults.headers.common["Authorization"] = `${token_type} ${access_token}`;

            // 3) Redirigir a Home
            router.replace("/tabs/home");
        } catch (err: any) {
            console.error(err);
            Alert.alert(
                "Login fallido",
                err.response?.data?.message || "Credenciales incorrectas"
            );
        }
    };

    return (
        <SafeAreaView
            style={{
                flex: 1,
                // backgroundColor: colorScheme === "dark" ? "#0a0a0a" : "#F8F9FF",
                backgroundColor: "#F8F9FF",


            }}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
                >
                    <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
                        {/* Fondo superior con logo */}
                        <ImageBackground
                            source={peso}
                            resizeMode="stretch"
                            style={globalStyles.pesosBacground}
                        >
                            <View
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: "rgba(16, 55, 92, 0.61)",
                                }}
                            />
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    paddingHorizontal: 20,
                                    paddingTop: 40,
                                }}
                            >
                                <Image
                                    source={require("../../assets/icons/logo.png")}
                                    resizeMode="contain"
                                    style={{ width: 70, height: 105, marginRight: 10 }}
                                />
                                <View>
                                    <Text
                                        style={{
                                            marginBottom: -10,
                                            fontSize: 47,
                                            color: "#fff",
                                            fontFamily: "Lexend-Medium",
                                        }}
                                    >
                                        To'
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 47,
                                            color: "#fff",
                                            fontWeight: "bold",
                                            fontFamily: "Lexend-Medium",
                                        }}
                                    >
                                        Barato
                                    </Text>
                                </View>
                            </View>
                        </ImageBackground>

                        <MotiView
                            from={{ opacity: 0, translateY: 25 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: "timing", duration: 500 }}
                            style={{ paddingHorizontal: 30, paddingTop: 20 }}
                        >
                            <Text
                                style={{
                                    color: "#101418",
                                    fontSize: 30,
                                    textAlign: "center",
                                    marginBottom: 15,
                                    marginHorizontal: 10,
                                    fontFamily: "Lexend-Black",
                                }}
                            >
                                Ayuda a tu bolsillo con nosotros!
                            </Text>

                            {/* Email */}
                            <Text
                                style={{
                                    color: "#001D35",
                                    fontSize: 12,
                                    marginBottom: 4,
                                }}
                            >
                                Correo electrónico o teléfono
                            </Text>
                            <TextInput
                                placeholder="Ingresa tu correo"
                                placeholderTextColor="#999"
                                value={email}
                                onChangeText={setEmail}
                                style={styles.input}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            {/* Contraseña */}
                            <Text
                                style={{
                                    color: "#001D35",
                                    fontSize: 12,
                                    marginBottom: 4,
                                }}
                            >
                                Contraseña
                            </Text>
                            <View style={styles.passwordWrap}>
                                <TextInput
                                    placeholder="Ingresa tu contraseña"
                                    placeholderTextColor="#999"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!passwordVisible}
                                    style={styles.passwordInput}
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

                            {/* Botón login */}
                            <CustomButton
                                color="primary"
                                textFont="medium"
                                onPress={handleLogin}
                            >
                                Iniciar Sesión
                            </CustomButton>

                            {/* Línea divisoria */}
                            <View style={styles.dividerRow}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>o</Text>
                            </View>

                            {/* Google / Apple */}
                            {/* <CustomButton
                                color="white"
                                textFont="medium"
                                textColor="neutral"
                                variant="withIcon"
                                icon="logo-google"
                                onPress={() => router.push("../tabs/home")}
                            >
                                Continuar con Google
                            </CustomButton>

                            <CustomButton
                                color="white"
                                textFont="medium"
                                textColor="neutral"
                                variant="withIcon"
                                icon="logo-apple"
                                onPress={() => router.push("../tabs/home")}
                            >
                                Continuar con Apple
                            </CustomButton> */}

                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "center",
                                    marginBottom: 40,
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: "Lexend-Light",
                                        color: "#001D35",
                                    }}
                                >
                                    ¿No tienes una cuenta?
                                </Text>
                                <TouchableOpacity
                                    onPress={() => router.push("/auth/RegisterScreen")}
                                >
                                    <Text
                                        style={{
                                            color: "#7F5610",
                                            fontWeight: "bold",
                                            paddingLeft: 5,
                                        }}
                                    >
                                        Regístrate
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </MotiView>
                    </ScrollView>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    input: {
        borderWidth: 1,
        borderColor: "#DBE1E7",
        borderRadius: 6,
        padding: 10,
        marginBottom: 10,
        backgroundColor: "#fff",
    },
    passwordWrap: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#DBE1E7",
        borderRadius: 6,
        backgroundColor: "#fff",
        marginBottom: 20,
    },
    passwordInput: {
        flex: 1,
        padding: 10,
    },
    eyeBtn: {
        paddingHorizontal: 10,
    },
    dividerRow: {
        alignItems: "center",
        marginBottom: 20,
        position: "relative",
    },
    dividerLine: {
        position: "absolute",
        height: 1,
        backgroundColor: "#B5C1CC",
        left: 0,
        right: 0,
        top: 12,
    },
    dividerText: {
        backgroundColor: "#F8F9FF",
        paddingHorizontal: 10,
        color: "#33618D",
        fontWeight: "bold",
    },
});
