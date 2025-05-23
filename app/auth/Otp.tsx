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
import CustomButton from "@/components/shared/CustomButton";

export default function OtpVerificationScreen() {
    const colorScheme = useColorScheme();
    const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
    const inputsRef = useRef<TextInput[]>([]);
    const [timer, setTimer] = useState(60);

    // 1️⃣ Recupera los datos pasados desde RegisterScreen
    const params = useLocalSearchParams<{ data?: string }>();
    const raw = params.data ?? "";
    const formData = raw
        ? JSON.parse(decodeURIComponent(raw))
        : {};

    // 2️⃣ Loggea los datos al montar la pantalla
    useEffect(() => {
        console.log("Registro paso1:", formData);
    }, []);

    // cuenta atrás
    useEffect(() => {
        if (timer > 0) {
            const id = setTimeout(() => setTimer(timer - 1), 1000);
            return () => clearTimeout(id);
        }
    }, [timer]);

    const focusNext = (index: number, value: string) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < inputsRef.current.length - 1) {
            inputsRef.current[index + 1].focus();
        }
    };

    const handleVerify = () => {
        const code = otp.join("");
        if (code.length === 6) {
            // 3️⃣ Envía formData + OTP a Profile-setup
            router.replace({
                pathname: "/auth/Profile-setup",
                params: {
                    data: encodeURIComponent(JSON.stringify(formData)),
                    otp: code,
                },
            });
        }
    };

    const handleResend = () => {
        // TODO: reenvío real
        setTimer(60);
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
                                Ingresa el código de 6 dígitos que te enviamos a tu correo.
                            </Text>

                            <View style={styles.otpContainer}>
                                {otp.map((digit, idx) => (
                                    <TextInput
                                        key={idx}
                                        ref={(el) => (inputsRef.current[idx] = el!)}
                                        value={digit}
                                        onChangeText={(v) =>
                                            focusNext(idx, v.replace(/[^0-9]/g, ""))
                                        }
                                        keyboardType="number-pad"
                                        maxLength={1}
                                        style={styles.otpInput}
                                    />
                                ))}
                            </View>

                            <CustomButton
                                color="primary"
                                textFont="medium"
                                onPress={handleVerify}
                                disabled={otp.some((d) => d === "")}
                            >
                                Verificar
                            </CustomButton>

                            <View style={styles.resendRow}>
                                <Text style={styles.resendText}>Reenviar código en </Text>
                                <Text style={styles.resendTimer}>{timer}s</Text>
                            </View>
                            {timer === 0 && (
                                <TouchableOpacity
                                    onPress={handleResend}
                                    style={styles.resendBtn}
                                >
                                    <Text style={styles.resendBtnText}>Reenviar código</Text>
                                </TouchableOpacity>
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
        marginBottom: 25,
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
    resendRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 15,
    },
    resendText: { color: "#7D747E" },
    resendTimer: { color: "#33618D", fontWeight: "bold" },
    resendBtn: { marginTop: 10, alignItems: "center" },
    resendBtnText: { color: "#33618D", fontWeight: "bold" },
});
