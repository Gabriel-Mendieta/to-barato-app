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
} from "react-native";
import { MotiView } from "moti";
import { router } from "expo-router";
import CustomButton from "@/components/shared/CustomButton";

export default function OtpVerificationScreen() {
    const colorScheme = useColorScheme();
    const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
    const inputsRef = useRef<TextInput[]>([]);
    const [timer, setTimer] = useState(60);

    // Cuenta regresiva
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
        // TODO: validar OTP con API
        if (code.length === 6) {
            router.replace('/auth/Profile-setup');
        }
    };

    const handleResend = () => {
        // TODO: llamar API para reenviar OTP
        setTimer(60);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#F8F9FF' }}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={80}
                >
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 30 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <MotiView
                            from={{ opacity: 0, translateY: 20 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'timing', duration: 400 }}
                        >
                            <Text
                                style={{
                                    fontSize: 24,
                                    fontWeight: 'bold',
                                    color: colorScheme === 'dark' ? '#fff' : '#101418',
                                    textAlign: 'center',
                                    marginBottom: 20,
                                    fontFamily: 'Lexend-Medium',
                                }}
                            >
                                Verifica tu cuenta
                            </Text>
                            <Text
                                style={{
                                    fontSize: 16,
                                    color: colorScheme === 'dark' ? '#ccc' : '#7D747E',
                                    textAlign: 'center',
                                    marginBottom: 30,
                                    fontFamily: 'Lexend-Light',
                                }}
                            >
                                Ingresa el código de 6 dígitos que te enviamos a tu correo.
                            </Text>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 }}>
                                {otp.map((digit, idx) => (
                                    <TextInput
                                        key={idx}
                                        ref={(el) => (inputsRef.current[idx] = el!)}
                                        value={digit}
                                        onChangeText={(v) => focusNext(idx, v.replace(/[^0-9]/g, ''))}
                                        keyboardType="number-pad"
                                        maxLength={1}
                                        style={{
                                            width: 45,
                                            height: 55,
                                            borderWidth: 1,
                                            borderColor: '#DBE1E7',
                                            borderRadius: 6,
                                            textAlign: 'center',
                                            fontSize: 24,
                                            backgroundColor: '#fff',
                                            fontFamily: 'Lexend-Medium',
                                        }}
                                    />
                                ))}
                            </View>

                            <CustomButton
                                color="primary"
                                textFont="medium"
                                onPress={handleVerify}
                                disabled={otp.some((d) => d === '')}
                            >
                                Verificar
                            </CustomButton>

                            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 15 }}>
                                <Text style={{ color: '#7D747E' }}>Reenviar código en </Text>
                                <Text style={{ color: '#33618D', fontWeight: 'bold' }}>{timer}s</Text>
                            </View>
                            {timer === 0 && (
                                <TouchableOpacity onPress={handleResend} style={{ marginTop: 10, alignItems: 'center' }}>
                                    <Text style={{ color: '#33618D', fontWeight: 'bold' }}>Reenviar código</Text>
                                </TouchableOpacity>
                            )}
                        </MotiView>
                    </ScrollView>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
}
