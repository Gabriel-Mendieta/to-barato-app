import React, { useState } from "react";
import { SafeAreaView, View, ScrollView, ImageBackground, Image, Text, TextInput, TouchableOpacity, Pressable, Animated, } from "react-native";
import peso from '../../assets/images/peso_dominicano.jpg';
import { globalStyles } from "@/styles/global-styles";
import { router } from "expo-router";
import CustomButton from "@/components/shared/CustomButton";
export default () => {

    const [passwordVisible, setPasswordVisible] = useState(false);
    const [password, setPassword] = useState("");
    const [textInput1, onChangeTextInput1] = useState('');
    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
            }}>
            <ScrollView
                style={{
                    flex: 1,
                    backgroundColor: "#F8F9FF",
                }}>
                <ImageBackground
                    source={peso}
                    resizeMode={'stretch'}
                    style={globalStyles.pesosBacground}
                >

                    <View style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(16, 55, 92, 0.61)'
                    }} />

                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            shadowColor: "#0C294557",
                            shadowOpacity: 0.3,
                            shadowOffset: {
                                width: 0,
                                height: 5.25
                            },
                            shadowRadius: 5,
                            elevation: 5,
                        }}>
                        <Image
                            source={{ uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/vvIy7dtdIT/fccxqomw.png" }}
                            resizeMode={"stretch"}
                            style={{
                                width: 70,
                                height: 105,
                                marginRight: 11,
                            }}
                        />
                        <View
                            style={{
                                // alignItems: "center",
                            }}>
                            <Text
                                className="font-lexend-medium flex-initial color-white bottom-0"
                                style={{
                                    fontSize: 47,
                                }}>
                                To'
                            </Text>
                            <Text
                                className="font-lexend-medium"
                                style={{
                                    color: "#FFFFFF",
                                    fontSize: 47,
                                    fontWeight: "bold",
                                }}>
                                Barato
                            </Text>
                        </View>
                    </View>
                </ImageBackground>
                <Text
                    className="font-lexend-black"
                    style={{
                        color: "#101418",
                        fontSize: 30,
                        textAlign: "center",
                        marginBottom: 15,
                        marginHorizontal: 43,
                    }}>
                    Ayuda a tu bolsillo con nosotros!
                </Text>
                <Text
                    className="font-lexend-medium"
                    style={{
                        color: "#001D35",
                        fontSize: 12,
                        fontWeight: "bold",
                        marginBottom: 4,
                        marginLeft: 30,
                    }}>
                    Correo electronico o telefono
                </Text>
                <TextInput
                    className="font-lexend-light"

                    placeholder={"mario.luciano@gmail.com"}
                    value={textInput1}
                    onChangeText={onChangeTextInput1}
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
                    }}
                />
                <Text
                    className="font-lexend-medium"

                    style={{
                        color: "#7D747E",
                        fontSize: 14,
                        marginBottom: 23,
                        marginLeft: 30,
                    }}>
                    Igrese su correo o telefono
                </Text>
                <Text
                    className="font-lexend-medium"

                    style={{
                        color: "#001D35",
                        fontSize: 12,
                        fontWeight: "bold",
                        marginBottom: 4,
                        marginLeft: 30,
                    }}>
                    Contraseña
                </Text>
                <View className="flex-row items-center bg-[#F8F9FF] border border-[#DBE1E7] rounded px-3 mb-1.5 mx-8">
                    <TextInput
                        className="flex-1 font-lexend-light text-base text-[#101418]"
                        secureTextEntry={!passwordVisible}
                        placeholder="************"
                        value={password}
                        onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                        <Image
                            source={{
                                uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/vvIy7dtdIT/itm6kgg5.png",
                            }}
                            resizeMode="contain"
                            className="w-5 h-5 ml-2"
                        />
                    </TouchableOpacity>
                </View>
                <Text
                    className="font-lexend-medium"

                    style={{
                        color: "#7D747E",
                        fontSize: 14,
                        marginBottom: 20,
                        marginLeft: 30,
                    }}>
                    Ingrese su contrasena
                </Text>
                <CustomButton color="primary" textFont="medium"
                    onPress={() => router.push('/tabs/home')}
                >
                    Iniciar Sesion
                </CustomButton>
                <View
                    style={{
                        alignItems: "center",
                        marginBottom: 20,
                        marginHorizontal: 31,
                    }}>
                    <View
                        style={{
                            width: 31,
                            height: 24,
                            backgroundColor: "#F8F9FF",
                        }}>
                    </View>
                    <View
                        style={{
                            position: "absolute",
                            bottom: 8,
                            right: 180,
                            left: 0,
                            height: 1,
                            alignSelf: "stretch",
                            backgroundColor: "#B5C1CC",
                        }}>
                    </View>
                    <Text
                        className="font-lexend-medium"
                        style={{
                            position: "absolute",
                            bottom: 0,
                            right: 150,
                            left: 150,
                            color: "#33618D",
                            fontSize: 14,
                            fontWeight: "bold",
                            textAlign: "center",
                        }}>
                        o
                    </Text>
                    <View
                        style={{
                            position: "absolute",
                            bottom: 8,
                            right: 0,
                            left: 180,
                            height: 1,
                            alignSelf: "stretch",
                            backgroundColor: "#B5C1CC",
                        }}>
                    </View>
                </View>

                <CustomButton color="white" textFont="medium" textColor="neutral" variant="whithImage" image="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/vvIy7dtdIT/2zz0srva.png"
                    onPress={() => router.push('/home')}
                >
                    Continuar con Google
                </CustomButton>

                <CustomButton color="white" textFont="medium" textColor="neutral" variant="whithImage" image="https://img.icons8.com/?size=100&id=30840&format=png&color=000000"
                    onPress={() => router.push('/home')}
                >
                    Continuar con Apple
                </CustomButton>

                <View
                    className="flex flex-row items-center mb-10 px-6 py-2">
                    <Text
                        className="font-lexend-light text-center text-neutral ml-24"
                    >
                        No tienes una cuenta?
                    </Text>
                    <Text
                        className="font-lexend-medium text-center ml-2 text-gold">
                        Registrate
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView >
    )
}