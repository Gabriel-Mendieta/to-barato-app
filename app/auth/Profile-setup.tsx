import React, { useState } from "react";
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import CustomButton from "@/components/shared/CustomButton";

export default function ProfileSetupScreen() {
    const [phone, setPhone] = useState("");
    const [photoUri, setPhotoUri] = useState<string | null>(null);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: true,
        });
        if (!result.canceled) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const handleFinish = () => {
        if (!phone || phone.length < 7) {
            return Alert.alert("Ingresa un teléfono válido");
        }
        // TODO: enviar photoUri y phone a tu API para completar perfil
        router.replace("/tabs/home"); // o la ruta principal de tu app
    };

    return (
        <SafeAreaView style={{ flex: 1, padding: 20 }}>
            <ScrollView contentContainerStyle={{ alignItems: "center" }}>
                <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
                    Completa tu perfil
                </Text>

                {/* Foto */}
                <TouchableOpacity onPress={pickImage} style={{ marginBottom: 20 }}>
                    {photoUri ? (
                        <Image
                            source={{ uri: photoUri }}
                            style={{ width: 120, height: 120, borderRadius: 60 }}
                        />
                    ) : (
                        <View
                            style={{
                                width: 120,
                                height: 120,
                                borderRadius: 60,
                                backgroundColor: "#eee",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Text>Seleccionar foto</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Teléfono */}
                <Text style={{ alignSelf: "flex-start", marginBottom: 5 }}>Teléfono</Text>
                <TextInput
                    placeholder="809-123-4567"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    style={{
                        width: "100%",
                        borderWidth: 1,
                        borderColor: "#ccc",
                        borderRadius: 8,
                        padding: 10,
                        marginBottom: 30,
                    }}
                />

                <CustomButton color="primary" textFont="medium" onPress={handleFinish}>
                    ¡Listo!
                </CustomButton>
            </ScrollView>
        </SafeAreaView>
    );
}
