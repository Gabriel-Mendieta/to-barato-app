// app/auth/OtpVerificationScreen.tsx
import React, { useRef, useState, useEffect } from "react";
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    Keyboard,
    TouchableWithoutFeedback,
    useColorScheme,
    StyleSheet,
} from "react-native";
import { MotiView } from "moti";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import CustomButton from "@/components/shared/CustomButton";

export default function OtpVerificationScreen() {
    const colorScheme = useColorScheme();

    // OTP inputs
    const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
    const inputsRef = useRef<TextInput[]>([]);

    // timers + loaders + errores
    const [timer, setTimer] = useState(60);
    const [verifying, setVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState("");
    const [resending, setResending] = useState(false);
    const [resendError, setResendError] = useState("");

    // 1️⃣ Recupera datos de registro
    const params = useLocalSearchParams<{ data?: string }>();
    const raw = params.data ?? "";
    const formData: {
        firstName: string;
        lastName: string;
        username: string;
        email: string;
        password: string;
    } = raw ? JSON.parse(decodeURIComponent(raw)) : {
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: ""
    };

    // inicia cuenta atrás
    useEffect(() => {
        if (timer > 0) {
            const id = setTimeout(() => setTimer(timer - 1), 1000);
            return () => clearTimeout(id);
        }
    }, [timer]);

    // al cambiar un dígito, enfoca el siguiente
    const focusNext = (index: number, val: string) => {
        const digit = val.replace(/[^0-9]/g, "").slice(-1);
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);
        if (digit && index < inputsRef.current.length - 1) {
            inputsRef.current[index + 1].focus();
        }
    };

    // 2️⃣ Verificar OTP
    const handleVerify = async () => {
        const code = otp.join("");
        if (code.length !== 6) return;

        setVerifyError("");
        setVerifying(true);
        try {
            await axios.post(
                `https://tobarato-api.alirizvi.dev/api/solicitar-otp?email=${encodeURIComponent(
                    formData.email
                )}&codigo=${encodeURIComponent(code)}`
            );
            // si OK, vamos a Profile-setup
            router.replace({
                pathname: "/auth/Profile-setup",
                params: {
                    data: encodeURIComponent(JSON.stringify(formData)),
                },
            });
        } catch (err) {
            console.error(err);
            setVerifyError("Código incorrecto o expirado. Intenta de nuevo.");
        } finally {
            setVerifying(false);
        }
    };

    // 3️⃣ Reenviar OTP
    const handleResend = async () => {
        setResendError("");
        setResending(true);
        try {
            await axios.post(
                `https://tobarato-api.alirizvi.dev/api/solicitar-otp?email=${encodeURIComponent(
                    formData.email
                )}`
            );
            setTimer(60);
        } catch (err) {
            console.error(err);
            setResendError("No se pudo reenviar. Intenta más tarde.");
        } finally {
            setResending(false);
        }
    };

    return (
        <SafeAreaView
            style={[
                styles.container,
                { backgroundColor: colorScheme === "dark" ? "#0a0a0a" : "#F8F9FF" },
            ]}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={80}
                >
                    <ScrollView
                        contentContainerStyle={{
                            flexGrow: 1,
                            justifyContent: "center",
                            paddingHorizontal: 30,
                        }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <MotiView
                            from={{ opacity: 0, translateY: 20 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: "timing", duration: 400 }}
                        >
                            <Text
                                style={[
                                    styles.title,
                                    { color: colorScheme === "dark" ? "#fff" : "#101418" },
                                ]}
                            >
                                Verifica tu cuenta
                            </Text>
                            <Text
                                style={[
                                    styles.subtitle,
                                    { color: colorScheme === "dark" ? "#ccc" : "#7D747E" },
                                ]}
                            >
                                Ingresa el código de 6 dígitos que te enviamos a {formData.email}
                            </Text>

                            <View style={styles.otpContainer}>
                                {otp.map((d, i) => (
                                    <TextInput
                                        key={i}
                                        ref={(el) => (inputsRef.current[i] = el!)}
                                        value={d}
                                        onChangeText={(v) => focusNext(i, v)}
                                        keyboardType="number-pad"
                                        maxLength={1}
                                        style={styles.otpInput}
                                    />
                                ))}
                            </View>

                            {verifyError.length > 0 && (
                                <Text style={styles.errorText}>{verifyError}</Text>
                            )}

                            <CustomButton
                                color="primary"
                                textFont="medium"
                                onPress={handleVerify}
                                disabled={otp.some((d) => d === "") || verifying}
                            >
                                {verifying ? "Verificando..." : "Verificar"}
                            </CustomButton>

                            <View style={styles.resendRow}>
                                <Text style={styles.resendText}>
                                    {timer > 0
                                        ? `Reenviar código en ${timer}s`
                                        : ""}
                                </Text>
                            </View>

                            {timer === 0 && (
                                <>
                                    {resendError.length > 0 && (
                                        <Text style={styles.errorText}>{resendError}</Text>
                                    )}
                                    <TouchableOpacity
                                        onPress={handleResend}
                                        disabled={resending}
                                        style={styles.resendBtn}
                                    >
                                        <Text style={styles.resendBtnText}>
                                            {resending ? "Reenviando..." : "Reenviar código"}
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </MotiView>
                    </ScrollView>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
        fontFamily: "Lexend-Medium",
    },
    subtitle: {
        fontSize: 16,
        textAlign: "center",
        marginBottom: 30,
        fontFamily: "Lexend-Light",
    },
    otpContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 15,
    },
    otpInput: {
        width: 45,
        height: 55,
        borderWidth: 1,
        borderColor: "#DBE1E7",
        borderRadius: 6,
        textAlign: "center",
        fontSize: 24,
        backgroundColor: "#fff",
        fontFamily: "Lexend-Medium",
    },
    errorText: {
        color: "#D1170F",
        textAlign: "center",
        marginBottom: 12,
        fontSize: 12,
    },
    resendRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 10,
        marginBottom: 12,
    },
    resendText: { color: "#7D747E" },
    resendBtn: { alignItems: "center" },
    resendBtnText: { color: "#33618D", fontWeight: "bold" },
});
