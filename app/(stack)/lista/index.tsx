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

import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'; // Para iconos de categorías y puntos

const shoppingListsData = [
    { id: '1', name: 'Frutas y vegetales', itemCount: 2, icon: 'food-apple-outline' },
    { id: '2', name: 'Artículos del hogar', itemCount: 7, icon: 'hammer-screwdriver' },
    { id: '3', name: 'Comida para perro', itemCount: 3, icon: 'dog' },
];

const ListItem = ({ item }) => (
    <TouchableOpacity className="flex-row items-center justify-between py-4 px-4 border-b border-gray-200 bg-white">
        <MaterialCommunityIcons name={item.icon} size={24} color="#4B5563" />

        <View className="flex-1 mx-4">
            <Text className="text-base font-semibold text-gray-800">{item.name}</Text>
            <Text className="text-sm text-gray-500">{item.itemCount} artículos</Text>
        </View>

        <TouchableOpacity>
            <MaterialCommunityIcons name="dots-horizontal" size={24} color="#6B7280" />
        </TouchableOpacity>
    </TouchableOpacity>
);

const ShoppingListScreen = () => {
    const [activeTab, setActiveTab] = useState('Listas');

    const activeTabColor = 'text-blue-600';
    const inactiveTabColor = 'text-gray-500';

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
                <TouchableOpacity>
                    <Ionicons name="chevron-back" size={28} color="#374151" />
                </TouchableOpacity>

                <Text className="text-lg font-bold text-gray-800">Lista de Compras</Text>


                <TouchableOpacity className="p-1 bg-blue-100 rounded-full">
                    <Ionicons name="add" size={24} color="#2563EB" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={shoppingListsData}
                renderItem={({ item }) => <ListItem item={item} />}
                keyExtractor={(item) => item.id}
                className="flex-1"
            />


            <View className={`flex-row justify-around items-center bg-white border-t border-gray-300 py-2 ${Platform.OS === 'ios' ? 'pb-5' : 'pb-2'}`}>
                <TouchableOpacity className="items-center" onPress={() => router.push('/home')}>
                    < MaterialCommunityIcons name="home-outline" size={26} color={activeTab === 'Inicio' ? '#3b82f6' : '#6b7280'} />
                    <Text className={`text-[10px] mt-0.5 ${activeTab === 'Inicio' ? activeTabColor : inactiveTabColor}`}>Inicio</Text>
                </TouchableOpacity>

                <Pressable className="items-center" onPress={() => setActiveTab('Listas')}>
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