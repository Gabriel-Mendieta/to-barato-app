import React, { useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    FlatList,
    StatusBar,
    Platform // Import Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { router } from 'expo-router';

const popularSearchesData = [
    { id: '1', name: 'Apio', price: 'RD$39.00/L', imageUrl: 'https://picsum.photos/seed/apio/200/200' },
    { id: '2', name: 'Chuleta de Cerdo', price: 'RD$114.00/L', imageUrl: 'https://picsum.photos/seed/chuleta/200/200' },
    { id: '3', name: 'Manzanas', price: 'RD$55.00/L', imageUrl: 'https://picsum.photos/seed/manzana/200/200' },
];

const marketData = [
    { id: '4', name: 'Pollo Fresco', price: 'RD$72.60/L', imageUrl: 'https://picsum.photos/seed/pollo/200/200' },
    { id: '5', name: 'Plátanos', price: 'RD$22.95/L', imageUrl: 'https://picsum.photos/seed/platano/200/200' },
    { id: '6', name: 'Arroz', price: 'RD$30.00/L', imageUrl: 'https://picsum.photos/seed/arroz/200/200' },
];

const categories = ['Ofertas', 'Mercado', 'Farmacia', 'Ferreteria'];

const ProductCard = ({ item }) => (
    <View className="bg-white rounded-lg p-2.5 mr-4 w-[225px] shadow-md items-center">
        <Image
            source={{ uri: item.imageUrl }}
            className="w-44 h-44 mb-2.5 rounded"
            resizeMode="cover"
        />
        <Text className="text-sm font-medium text-gray-700 text-center mb-1">{item.name}</Text>
        <Text className="text-xs text-gray-500 text-center">{item.price}</Text>
    </View>
);

const HomeScreen = () => {
    const [activeCategory, setActiveCategory] = useState('Ofertas');
    const [activeTab, setActiveTab] = useState('Inicio');

    const activeTabColor = 'text-blue-600';
    const inactiveTabColor = 'text-gray-500';
    const activeCategoryColor = 'colors-container';
    const activeCategoryBorderColor = 'colors-container';
    const inactiveCategoryColor = 'text-gray-600';


    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <StatusBar barStyle="light-content" className='bg-container' />

            <View className={`flex-row justify-between items-center bg-container px-4 py-3 ${Platform.OS === 'android' ? 'pt-4' : 'pt-3'}`}>
                <View className="flex-row items-center">

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
                            }}>
                            <Text
                                className="font-lexend-medium flex-initial color-white"
                                style={{
                                    fontSize: 20,
                                    marginBottom: -5,
                                }}>
                                To'
                            </Text>
                            <Text
                                className="font-lexend-medium"
                                style={{
                                    color: "#FFFFFF",
                                    fontSize: 20,
                                    fontWeight: "bold",
                                }}>
                                Barato
                            </Text>
                        </View>
                    </View>
                </View>
                <View className="flex-row items-center">
                    <TouchableOpacity>
                        <Ionicons name="notifications-outline" size={26} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <View className="bg-white py-1 border-b border-gray-200">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10 }}>
                    {categories.map((category) => (
                        <TouchableOpacity
                            key={category}
                            className={`py-2.5 px-4 mr-1.5 rounded-xl ${activeCategory === category ? `border-b-[3px] ${activeCategoryBorderColor}` : ''
                                }`}
                            onPress={() => setActiveCategory(category)}>
                            <Text
                                className={`text-sm font-medium ${activeCategory === category ? `${activeCategoryColor} font-bold` : inactiveCategoryColor
                                    }`}>
                                {category}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView className="flex-1">
                <View className="mt-5 px-4">
                    <Text className="text-lg font-bold text-gray-800 mb-4">Búsquedas Populares</Text>
                    <FlatList
                        data={popularSearchesData}
                        renderItem={({ item }) => <ProductCard item={item} />}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="pb-2.5"
                    />
                </View>

                <View className="mt-5 px-4">
                    <Text className="text-lg font-bold text-gray-800 mb-4">Mercado</Text>
                    <FlatList
                        data={marketData}
                        renderItem={({ item }) => <ProductCard item={item} />}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="pb-2.5"
                    />
                </View>

                <View className="h-5" />

            </ScrollView>

            <View className={`flex-row justify-around items-center bg-white border-t border-gray-300 py-2 ${Platform.OS === 'ios' ? 'pb-5' : 'pb-2'}`}>
                <TouchableOpacity className="items-center" onPress={() => setActiveTab('Inicio')}>
                    <Icon name="home" size={26} color={activeTab === 'Inicio' ? '#3b82f6' : '#6b7280'} /> {/* Usando colores directos */}
                    <Text className={`text-[10px] mt-0.5 ${activeTab === 'Inicio' ? activeTabColor : inactiveTabColor}`}>Inicio</Text>
                </TouchableOpacity>
                <TouchableOpacity className="items-center" onPress={() => {
                    router.push('/lista');
                }}>
                    <Icon name="list-alt" size={26} color={activeTab === 'Listas' ? '#3b82f6' : '#6b7280'} />
                    <Text className={`text-[10px] mt-0.5 ${activeTab === 'Listas' ? activeTabColor : inactiveTabColor}`}>Listas</Text>
                </TouchableOpacity>
                <TouchableOpacity className="items-center" onPress={() => router.push('/map')}>
                    <Icon name="store" size={26} color={activeTab === 'Proveedores' ? '#3b82f6' : '#6b7280'} />
                    <Text className={`text-[10px] mt-0.5 ${activeTab === 'Proveedores' ? activeTabColor : inactiveTabColor}`}>Proveedores</Text>
                </TouchableOpacity>
                <TouchableOpacity className="items-center" onPress={() => setActiveTab('Perfil')}>
                    <Icon name="person" size={26} color={activeTab === 'Perfil' ? '#3b82f6' : '#6b7280'} />
                    <Text className={`text-[10px] mt-0.5 ${activeTab === 'Perfil' ? activeTabColor : inactiveTabColor}`}>Perfil</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default HomeScreen;
