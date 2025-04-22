import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StatusBar,
    Platform,
    Pressable
} from 'react-native';
// Importa los sets de iconos que necesites
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'; // Para iconos de categorías y puntos

// --- Datos de ejemplo para la lista ---
const shoppingListsData = [
    { id: '1', name: 'Frutas y vegetales', itemCount: 2, icon: 'food-apple-outline' },
    { id: '2', name: 'Artículos del hogar', itemCount: 7, icon: 'hammer-screwdriver' },
    { id: '3', name: 'Comida para perro', itemCount: 3, icon: 'dog' },
    // Agrega más listas aquí si es necesario
];
// --- Fin Datos de ejemplo ---

// --- Componente para cada fila de la lista ---
const ListItem = ({ item }) => (
    <TouchableOpacity className="flex-row items-center justify-between py-4 px-4 border-b border-gray-200 bg-white">
        {/* Icono de la izquierda */}
        <MaterialCommunityIcons name={item.icon} size={24} color="#4B5563" /> {/* Gris oscuro */}

        {/* Contenedor del texto (ocupa el espacio restante) */}
        <View className="flex-1 mx-4">
            <Text className="text-base font-semibold text-gray-800">{item.name}</Text>
            <Text className="text-sm text-gray-500">{item.itemCount} artículos</Text>
        </View>

        {/* Icono de opciones (derecha) */}
        <TouchableOpacity>
            <MaterialCommunityIcons name="dots-horizontal" size={24} color="#6B7280" /> {/* Gris medio */}
        </TouchableOpacity>
    </TouchableOpacity>
);

// --- Componente Principal de la Pantalla ---
const ShoppingListScreen = () => {
    // Estado para simular la pestaña activa (debería venir de la navegación real)
    const [activeTab, setActiveTab] = useState('Listas');

    // Colores para la barra de navegación inferior
    const activeTabColor = 'text-blue-600'; // Mismo color que antes
    const inactiveTabColor = 'text-gray-500';

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            {/* Barra de estado (ajusta el color si el header fuera diferente) */}
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* --- Cabecera --- */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
                {/* Icono Izquierda (Back) */}
                <TouchableOpacity>
                    <Ionicons name="chevron-back" size={28} color="#374151" /> {/* Gris oscuro */}
                </TouchableOpacity>

                {/* Título Centrado */}
                <Text className="text-lg font-bold text-gray-800">Lista de Compras</Text>

                {/* Icono Derecha (Add) */}
                <TouchableOpacity className="p-1 bg-blue-100 rounded-full">
                    {/* Puedes ajustar el color y tamaño del icono/círculo */}
                    <Ionicons name="add" size={24} color="#2563EB" /> {/* Azul */}
                </TouchableOpacity>
            </View>

            {/* --- Lista de Compras --- */}
            <FlatList
                data={shoppingListsData}
                renderItem={({ item }) => <ListItem item={item} />}
                keyExtractor={(item) => item.id}
                className="flex-1" // Ocupa el espacio disponible
            // Puedes añadir un View vacío al final si necesitas espacio extra abajo
            // ListFooterComponent={<View className="h-4" />}
            />

            {/* --- Barra de Navegación Inferior (Simulada) --- */}
            {/* Asegúrate que los colores coincidan con la pestaña "Listas" activa */}
            <View className={`flex-row justify-around items-center bg-white border-t border-gray-300 py-2 ${Platform.OS === 'ios' ? 'pb-5' : 'pb-2'}`}>
                <TouchableOpacity className="items-center" onPress={() => router.push('/home')}>
                    {/* Usaremos MaterialCommunityIcons aquí para consistencia */}
                    < MaterialCommunityIcons name="home-outline" size={26} color={activeTab === 'Inicio' ? '#3b82f6' : '#6b7280'} />
                    <Text className={`text-[10px] mt-0.5 ${activeTab === 'Inicio' ? activeTabColor : inactiveTabColor}`}>Inicio</Text>
                </TouchableOpacity>

                <Pressable className="items-center" onPress={() => setActiveTab('Listas')}>
                    {/* Icono Lleno para activo */}
                    <MaterialCommunityIcons name={activeTab === 'Listas' ? "format-list-bulleted" : "format-list-bulleted"} size={26} color={activeTab === 'Listas' ? '#3b82f6' : '#6b7280'} />
                    <Text className={`text-[10px] mt-0.5 ${activeTab === 'Listas' ? activeTabColor : inactiveTabColor}`}>Listas</Text>
                </Pressable>

                <TouchableOpacity className="items-center" onPress={() => setActiveTab('Proveedores')}>
                    <MaterialCommunityIcons name="store-outline" size={26} color={activeTab === 'Proveedores' ? '#3b82f6' : '#6b7280'} />
                    <Text className={`text-[10px] mt-0.5 ${activeTab === 'Proveedores' ? activeTabColor : inactiveTabColor}`}>Proveedores</Text>
                </TouchableOpacity>

                <TouchableOpacity className="items-center" onPress={() => setActiveTab('Perfil')}>
                    <MaterialCommunityIcons name="account-outline" size={26} color={activeTab === 'Perfil' ? '#3b82f6' : '#6b7280'} />
                    <Text className={`text-[10px] mt-0.5 ${activeTab === 'Perfil' ? activeTabColor : inactiveTabColor}`}>Perfil</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView >
    );
};

export default ShoppingListScreen;