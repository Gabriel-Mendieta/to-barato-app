// app/auth/Profile-setup.tsx
import React, { useState, useEffect } from "react";
import {
    SafeAreaView,
    View,
    Text,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
    StatusBar,
    Platform,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import CustomButton from "@/components/shared/CustomButton";
import { useSignUp } from "../../src/presentation/hooks/useSignUp";
import { SignUpRequestDTO } from "../../src/data/dtos/SignUpRequestDTO";


export default function ProfileSetupScreen() {
    // Recupera datos del paso anterior
    const params = useLocalSearchParams<{ data?: string; otp?: string }>();
    const rawData = params.data ?? "";
    const formData = rawData ? JSON.parse(decodeURIComponent(rawData)) : {};
    const otpCode = params.otp ?? "";

    const { signUp, loading, error } = useSignUp();

    // estados de UI
    const [phone, setPhone] = useState("");
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [dob, setDob] = useState(new Date(1990, 0, 1));
    const [showPicker, setShowPicker] = useState(false);

    // validações
    const phoneValid = phone.length >= 7;
    const canFinish = phoneValid && photoUri !== null;

    // picker handler
    const onChangeDate = (_: any, selected?: Date) => {
        setShowPicker(false);
        if (selected) setDob(selected);
    };

    const pickImage = async () => {
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: true,
        });
        if (!res.canceled) setPhotoUri(res.assets[0].uri);
    };

    const handleFinish = async () => {
        if (!canFinish) {
            return Alert.alert("Completa todos los campos correctamente");
        }
        // prepara payload
        const payload: SignUpRequestDTO = {
            IdTipoUsuario: 2,
            NombreUsuario: formData.username,
            Correo: formData.email,
            Telefono: phone,
            Clave: formData.password,
            Nombres: formData.firstName,
            Apellidos: formData.lastName,
            Estado: true,
            UrlPerfil: photoUri,
            FechaNacimiento: dob.toISOString().split("T")[0], // formato YYYY-MM-DD
        };
        const res = await signUp(payload);
        if (res) {
            router.replace("/tabs/home");
        }
    };

    useEffect(() => {
        console.log("Completa tu perfil:", { ...formData, otp: otpCode });
    }, []);

    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor: "#F8F9FF",
                paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
            }}
        >
            <ScrollView
                contentContainerStyle={{ padding: 20, alignItems: "center" }}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.title}>Completa tu perfil</Text>

                {/* Foto */}
                <TouchableOpacity onPress={pickImage} style={styles.photoWrap}>
                    {photoUri ? (
                        <Image source={{ uri: photoUri }} style={styles.photo} />
                    ) : (
                        <View style={styles.photoPlaceholder}>
                            <Text>Seleccionar foto</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Teléfono */}
                <View style={styles.field}>
                    <Text style={styles.label}>Teléfono</Text>
                    <TextInput
                        placeholder="809-123-4567"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                        style={[
                            styles.input,
                            !phoneValid && phone.length > 0 && styles.inputError,
                        ]}
                    />
                </View>

                {/* Fecha de nacimiento */}
                <View style={styles.field}>
                    <Text style={styles.label}>Fecha de nacimiento</Text>
                    <TouchableOpacity
                        onPress={() => setShowPicker(true)}
                        style={styles.input}
                    >
                        <Text>{dob.toISOString().split("T")[0]}</Text>
                    </TouchableOpacity>
                    {showPicker && (
                        <DateTimePicker
                            value={dob}
                            mode="date"
                            display="spinner"
                            maximumDate={new Date()}
                            onChange={onChangeDate}
                        />
                    )}
                </View>

                {/* Botón Listo */}
                <View style={{ width: "100%" }}>
                    <CustomButton
                        color="primary"
                        textFont="medium"
                        onPress={handleFinish}
                        disabled={!canFinish || loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : "Continuar"}
                    </CustomButton>
                </View>

                {error && <Text style={styles.error}>{error}</Text>}
            </ScrollView>
        </SafeAreaView>
    );
}

import { TextInput } from "react-native";

const styles = StyleSheet.create({
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
        fontFamily: "Lexend-Medium",
        textAlign: "center",
    },
    photoWrap: { marginBottom: 20, alignItems: "center" },
    photo: { width: 120, height: 120, borderRadius: 60 },
    photoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#eee",
        alignItems: "center",
        justifyContent: "center",
    },
    field: { width: "100%", marginBottom: 20 },
    label: { fontFamily: "Lexend-Medium", marginBottom: 6 },
    input: {
        width: "100%",
        borderWidth: 1,
        borderColor: "#DBE1E7",
        borderRadius: 8,
        padding: 10,
        backgroundColor: "#fff",
        fontFamily: "Lexend-Light",
    },
    inputError: { borderColor: "#D1170F" },
    error: {
        color: "#D1170F",
        marginTop: 12,
        fontSize: 14,
        textAlign: "center",
    },
});
