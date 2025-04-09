import React, { useEffect, useState } from "react";
import { SafeAreaView, View, ScrollView, ImageBackground, Image, Text, TextInput, TouchableOpacity, } from "react-native";
import peso from '../assets/images/peso_dominicano.jpg';
import useFonts from 'expo-font';
import { globalStyles } from "@/styles/global-styles";
export default () => {

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
                        backgroundColor: 'rgba(16, 55, 92, 0.61)' // Gris al 50% de opacidad
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
                                style={{
                                    alignItems: "flex-start",
                                    color: "#FFFFFF",
                                    fontSize: 47,
                                    fontWeight: "bold",
                                    marginBottom: 0,
                                    fontFamily: 'Lexend',
                                }}>
                                {"To’"}
                            </Text>
                            <Text
                                style={{
                                    color: "#FFFFFF",
                                    fontSize: 47,
                                    fontWeight: "bold",
                                }}>
                                {"Barato"}
                            </Text>
                        </View>
                    </View>
                </ImageBackground>
                <Text
                    style={{
                        color: "#101418",
                        fontSize: 32,
                        fontWeight: "bold",
                        textAlign: "center",
                        marginBottom: 23,
                        marginHorizontal: 43,
                    }}>
                    {"Ayuda a tu bolsillo\ncon nosotros!"}
                </Text>
                <Text
                    style={{
                        color: "#001D35",
                        fontSize: 12,
                        fontWeight: "bold",
                        marginBottom: 4,
                        marginLeft: 30,
                    }}>
                    {"Correo electronico o telefono"}
                </Text>
                <TextInput
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
                    style={{
                        color: "#7D747E",
                        fontSize: 14,
                        marginBottom: 23,
                        marginLeft: 30,
                    }}>
                    {"Igrese su correo o telefono"}
                </Text>
                <Text
                    style={{
                        color: "#001D35",
                        fontSize: 12,
                        fontWeight: "bold",
                        marginBottom: 4,
                        marginLeft: 30,
                    }}>
                    {"Contrasena"}
                </Text>
                <TouchableOpacity
                    style={{
                        flexDirection: "row",
                        backgroundColor: "#F8F9FF",
                        borderColor: "#DBE1E7",
                        borderRadius: 5,
                        borderWidth: 1,
                        paddingVertical: 5,
                        paddingHorizontal: 9,
                        marginBottom: 6,
                        marginHorizontal: 31,
                    }} onPress={() => alert('Pressed!')}>
                    <Text
                        style={{
                            color: "#101418",
                            fontSize: 16,
                            marginVertical: 2,
                            flex: 1,
                        }}>
                        {"**************"}
                    </Text>
                    <Image
                        source={{ uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/vvIy7dtdIT/itm6kgg5.png" }}
                        resizeMode={"stretch"}
                        style={{
                            width: 24,
                            height: 24,
                        }}
                    />
                </TouchableOpacity>
                <Text
                    style={{
                        color: "#7D747E",
                        fontSize: 14,
                        marginBottom: 23,
                        marginLeft: 30,
                    }}>
                    {"Ingrese su contrasena"}
                </Text>
                <TouchableOpacity
                    style={{
                        alignItems: "center",
                        backgroundColor: "#33618D",
                        borderRadius: 6,
                        paddingVertical: 8,
                        marginBottom: 23,
                        marginHorizontal: 31,
                    }} onPress={() => alert('Pressed!')}>
                    <Text
                        style={{
                            color: "#F8F9FF",
                            fontSize: 16,
                            fontWeight: "bold",
                        }}>
                        {"Iniciar Sesion"}
                    </Text>
                </TouchableOpacity>
                <View
                    style={{
                        alignItems: "center",
                        marginBottom: 32,
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
                            bottom: 11,
                            right: 0,
                            left: 0,
                            height: 1,
                            alignSelf: "stretch",
                            backgroundColor: "#B5C1CC",
                        }}>
                    </View>
                    <Text
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
                        {"O"}
                    </Text>
                </View>
                <View
                    style={{
                        alignItems: "center",
                        marginBottom: 30,
                    }}>
                    <View
                        style={{
                            flexDirection: "row",
                        }}>
                        <Image
                            source={{ uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/vvIy7dtdIT/2zz0srva.png" }}
                            resizeMode={"stretch"}
                            style={{
                                borderRadius: 10,
                                width: 24,
                                height: 24,
                                marginRight: 15,
                            }}
                        />
                        <Text
                            style={{
                                color: "#000000",
                                fontSize: 16,
                                fontWeight: "bold",
                            }}>
                            {"Continue Google"}
                        </Text>
                    </View>
                </View>
                <View
                    style={{
                        alignItems: "center",
                        marginBottom: 76,
                    }}>
                    <Text
                        style={{
                            color: "#000000",
                            fontSize: 16,
                            width: 259,
                        }}>
                        {"No tienes una cuenta? Registrate"}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView >
    )
}