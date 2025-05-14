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
        <SafeAreaView className="flex-1 bg-gray-100 pt-14">
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


        </SafeAreaView >
    );
};

export default ShoppingListScreen;