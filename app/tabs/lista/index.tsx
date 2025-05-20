import React, { useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StatusBar,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { MotiView } from 'moti';
import { router } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const shoppingListsData = [
    { id: '1', name: 'Frutas y vegetales', itemCount: 2, icon: 'food-apple-outline' },
    { id: '2', name: 'Artículos del hogar', itemCount: 7, icon: 'hammer-screwdriver' },
    { id: '3', name: 'Comida para perro', itemCount: 3, icon: 'dog' },
];

function ListItem({ item, index }: { item: typeof shoppingListsData[0]; index: number }) {
    return (
        <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: index * 100, type: 'timing', duration: 400 }}
            className="mx-4 mb-4"
        >
            <TouchableOpacity
                onPress={() => {/* navegar a detalle de lista */ }}
                className="flex-row items-center bg-white rounded-2xl p-4 shadow-lg"
                activeOpacity={0.8}
            >
                <MaterialCommunityIcons name={item.icon} size={28} color="#33618D" />
                <View className="flex-1 ml-4">
                    <Text className="text-lg font-lexend-medium text-gray-800">{item.name}</Text>
                    <Text className="text-sm text-gray-500">{item.itemCount} artículos</Text>
                </View>
                <TouchableOpacity onPress={() => {/* opciones: compartir, duplicar, eliminar */ }}
                    className="p-2 rounded-full active:bg-gray-100">
                    <MaterialCommunityIcons name="dots-horizontal" size={24} color="#6B7280" />
                </TouchableOpacity>
            </TouchableOpacity>
        </MotiView>
    );
}

export default function ShoppingListScreen() {
    const { height } = useWindowDimensions();

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <StatusBar
                barStyle="light-content"
                backgroundColor="#001D35"
            />

            {/* Header igual al Home */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#001D35',
                paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 16,
                paddingBottom: 12,
                paddingHorizontal: 16,
            }}>
                <Text style={{
                    color: '#FFFFFF',
                    fontSize: 20,
                    fontWeight: '500',
                }}>
                    Lista de Compras
                </Text>

                {/* Botón “+” fijo a la derecha */}
                <TouchableOpacity
                    onPress={() => router.push('../list/add')}
                    style={{
                        position: 'absolute',
                        right: 16,
                        padding: 4,
                        marginTop: 45,
                    }}
                >
                    <Ionicons name="add-circle-outline" size={34} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Lista animada */}
            <FlatList
                data={shoppingListsData}
                renderItem={({ item, index }) => <ListItem item={item} index={index} />}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingTop: 16, paddingBottom: height * 0.15 }}
                showsVerticalScrollIndicator={false}
            />

            {/* Botón flotante permanente */}
            <TouchableOpacity
                onPress={() => {/* nueva lista */ }}
                className="absolute bottom-8 right-6 bg-secondary rounded-full p-4 shadow-2xl"
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}
