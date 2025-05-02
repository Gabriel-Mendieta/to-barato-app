import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Platform,
    ImageSourcePropType // Import ImageSourcePropType for image source typing
} from 'react-native';
// Importa los sets de iconos que necesites
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/MaterialIcons';

// --- Interfaces de Tipos ---
interface ProfileData {
    name: string;
    phone: string;
    email: string;
    imageUrl: string; // O podrías usar ImageSourcePropType si fuera local
}

interface ProfileOption {
    id: string;
    text: string;
    icon: string; // El nombre del icono como string
    screen?: string; // Opcional: nombre de la pantalla a navegar
    action?: 'logout' | string; // Opcional: acción específica a realizar
}

interface ProfileOptionItemProps {
    item: ProfileOption;
    onPress: (item: ProfileOption) => void; // Función que recibe el item presionado
}

type TabName = 'Inicio' | 'Listas' | 'Proveedores' | 'Perfil';

// --- Datos de ejemplo con tipos ---
const profileData: ProfileData = {
    name: 'Mario Luciano',
    phone: '809-123-4567',
    email: 'mario.luciano@gmail.com',
    imageUrl: 'https://picsum.photos/seed/MarioLuciano/200/200',
};

const profileOptions: ProfileOption[] = [ // Array de ProfileOption
    { id: '1', text: 'Editar perfil', icon: 'settings-outline', screen: 'EditProfile' },
    { id: '2', text: 'Preferencias', icon: 'star-outline', screen: 'Preferences' },
    { id: '3', text: 'Cerrar Sesion', icon: 'log-out-outline', action: 'logout' },
];
// --- Fin Datos de ejemplo ---


// --- Componente para cada opción del perfil (Tipado) ---
const ProfileOptionItem: React.FC<ProfileOptionItemProps> = ({ item, onPress }) => (
    <TouchableOpacity
        className="flex-row items-center justify-between py-4 px-6 bg-white mt-2 rounded-lg mx-4 shadow-sm"
        onPress={() => onPress(item)} // Llama a la función onPress pasando el item
    >
        <View className="flex-row items-center flex-1">
            {/* Asegúrate que Ionicons acepte 'string' para name, lo cual es común */}
            <Ionicons name={item.icon} size={22} color="#4B5563" />
            <Text className="text-base text-gray-700 ml-4">{item.text}</Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={20} color="#6B7280" />
    </TouchableOpacity>
);


// --- Componente Principal de la Pantalla (Tipado) ---
const ProfileScreen: React.FC = () => {
    // Estado tipado para la pestaña activa
    const [activeTab, setActiveTab] = useState<TabName>('Perfil');

    // Colores (se mantienen igual, solo como referencia)
    const activeTabColor = '#001D35';
    const inactiveTabColor = 'text-gray-500';
    const headerBgColor = 'bg-[#2a3a75]';

    // Función para manejar el press en las opciones (Tipada)
    const handleOptionPress = (item: ProfileOption): void => {
        if (item.action === 'logout') {
            router.push('/auth/IniciarSesion');
            // Lógica real de logout
        } else if (item.screen) {
            console.log("Navegando a:", item.screen);
            // Lógica de navegación real (usando React Navigation, etc.)
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <StatusBar barStyle="light-content" className='bg-container' />

            {/* --- Cabecera --- */}
            <View className={`flex-row justify-between items-center bg-container px-4 py-3 ${Platform.OS === 'android' ? 'pt-4' : 'pt-3'}`}>
                {/* Ajuste de padding top para Android */}
                <View className="flex-row items-center">
                    {/* <Icon name="shopping-basket" size={28} color="#FFFFFF" className="mr-2" />
                               <Text className="text-white text-lg font-bold">To' Barato</Text> */}
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
                                width: 33,
                                height: 48,
                                marginRight: 5,
                            }}
                        />
                        <View
                            style={{
                                // alignItems: "center",
                            }}>
                            <Text
                                className="font-lexend-medium flex-initial color-white"
                                style={{
                                    fontSize: 20,
                                    marginBottom: -5,
                                }}>
                                {"To'"}
                            </Text>
                            <Text
                                className="font-lexend-medium"
                                style={{
                                    color: "#FFFFFF",
                                    fontSize: 20,
                                    fontWeight: "bold",
                                }}>
                                {"Barato"}
                            </Text>
                        </View>
                    </View>
                </View>
                <View className="flex-row items-center">
                    <TouchableOpacity>
                        <Ionicons name="notifications-outline" size={26} color="#FFFFFF" />
                    </TouchableOpacity>
                    {/* <Text className="text-white ml-4 text-base">{'</>'}</Text> */}
                </View>
            </View>

            {/* Contenido Principal */}
            <ScrollView className="flex-1">

                {/* Sección de Información del Perfil */}
                <View className="items-center pt-8 pb-6">
                    <Text className="text-2xl font-bold text-gray-800 mb-6">Perfil</Text>
                    <Image
                        source={{ uri: profileData.imageUrl }} // `uri` espera un string
                        className="w-28 h-28 rounded-full border-4 border-white shadow-lg"
                        resizeMode="cover"
                    />
                    <Text className="text-xl font-semibold text-gray-900 mt-4">{profileData.name}</Text>
                    <Text className="text-sm text-gray-600 mt-1">{profileData.phone}</Text>
                    <Text className="text-sm text-gray-600">{profileData.email}</Text>
                </View>

                {/* Sección de Opciones del Perfil */}
                <View className="pb-6">
                    {/* TypeScript infiere el tipo de 'item' aquí como ProfileOption */}
                    {profileOptions.map((item) => (
                        <ProfileOptionItem
                            key={item.id}
                            item={item}
                            onPress={handleOptionPress} // Pasamos la función onPress definida
                        />
                    ))}
                </View>

            </ScrollView>

            {/* Barra de Navegación Inferior */}
            {/* La lógica de activeTab y colores es la misma */}
            <View className={`flex-row justify-around items-center bg-white border-t border-gray-300 py-2 ${Platform.OS === 'ios' ? 'pb-5' : 'pb-2'}`}>
                {/* Ajuste de padding bottom para iOS */}
                <TouchableOpacity className="items-center" onPress={() => router.push('/home')}>
                    <Icon name="home" size={26} color={activeTab === 'Inicio' ? '#001D35' : '#6b7280'} /> {/* Usando colores directos */}
                    <Text className={`text-[10px] mt-0.5 ${activeTab === 'Inicio' ? activeTabColor : inactiveTabColor}`}>Inicio</Text>
                </TouchableOpacity>
                <TouchableOpacity className="items-center" onPress={() => {
                    router.push('/lista'); // Navegación a la pantalla de listas
                }}>
                    <Icon name="list-alt" size={26} color={activeTab === 'Listas' ? '#001D35' : '#6b7280'} />
                    <Text className={`text-[10px] mt-0.5 ${activeTab === 'Listas' ? activeTabColor : inactiveTabColor}`}>Listas</Text>
                </TouchableOpacity>
                <TouchableOpacity className="items-center" onPress={() => router.push('/map')}>
                    <Icon name="store" size={26} color={activeTab === 'Proveedores' ? '#001D35' : '#6b7280'} />
                    <Text className={`text-[10px] mt-0.5 ${activeTab === 'Proveedores' ? activeTabColor : inactiveTabColor}`}>Proveedores</Text>
                </TouchableOpacity>
                <TouchableOpacity className="items-center" onPress={() => setActiveTab('Perfil')}>
                    <Icon name="person" size={26} color={activeTab === 'Perfil' ? '#001D35' : '#6b7280'} />
                    <Text className={`text-[10px] mt-0.5 ${activeTab === 'Perfil' ? activeTabColor : inactiveTabColor}`}>Perfil</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default ProfileScreen;