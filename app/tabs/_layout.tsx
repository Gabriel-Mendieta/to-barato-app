import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Tabs } from 'expo-router'

const TabsLayout = () => {
    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: '#001D35', headerShown: false }}>
            <Tabs.Screen
                name="home/index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <Ionicons size={28} name="home" color={color} />,
                }}
            />
            <Tabs.Screen
                name="lista/index"
                options={{
                    title: 'Listas',
                    tabBarIcon: ({ color }) => <Ionicons size={28} name="cart-outline" color={color} />,
                }}
            />
            <Tabs.Screen
                name="map/index"
                options={{
                    title: 'Proveedores',
                    tabBarIcon: ({ color }) => <Ionicons size={28} name="map-outline" color={color} />,
                }}
            />
            <Tabs.Screen
                name="perfil/index"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color }) => <Ionicons size={28} name="person-outline" color={color} />,
                }}
            />
        </Tabs>
    )
}

export default TabsLayout