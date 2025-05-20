import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Tabs } from 'expo-router'
import { Animated } from 'react-native';

const TabsLayout = () => {
    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: '#001D35', headerShown: false }}>
            <Tabs.Screen
                name="home/index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <Ionicons size={28} name="home" color={color} />,
                    animation: 'shift',
                }}

            />
            <Tabs.Screen
                name="lista/index"
                options={{
                    title: 'Listas',
                    tabBarIcon: ({ color }) => <Ionicons size={28} name="cart-outline" color={color} />,
                    animation: 'shift',
                }}
            />
            <Tabs.Screen
                name="map/index"
                options={{
                    title: 'Proveedores',
                    tabBarIcon: ({ color }) => <Ionicons size={28} name="map-outline" color={color} />,
                    animation: 'shift',
                }}
            />
            <Tabs.Screen
                name="perfil/index"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color }) => <Ionicons size={28} name="person-outline" color={color} />,
                    animation: 'shift',
                }}
            />
            <Tabs.Screen
                name="list/add"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    )
}

export default TabsLayout