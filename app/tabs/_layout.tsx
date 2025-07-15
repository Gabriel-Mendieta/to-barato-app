import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Tabs } from 'expo-router'

const TabsLayout = () => {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: { backgroundColor: '#001D35' },
                tabBarActiveTintColor: 'white',
                tabBarInactiveTintColor: 'gray',
            }}
        >
            <Tabs.Screen
                name="home/index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
                    animation: 'shift',
                }}
            />
            <Tabs.Screen
                name="lista/index"
                options={{
                    title: 'Listas',
                    tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" size={size} color={color} />,
                    animation: 'shift',
                }}
            />
            <Tabs.Screen
                name="map/index"
                options={{
                    title: 'Proveedores',
                    tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
                    animation: 'shift',
                }}
            />
            <Tabs.Screen
                name="perfil/index"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
                    animation: 'shift',
                }}
            />
            {/* Resto de pantallas ocultas */}
            <Tabs.Screen name="list/add" options={{ href: null }} />
            <Tabs.Screen name="list/providers" options={{ href: null }} />
            <Tabs.Screen name="list/[id]" options={{ href: null }} />
            <Tabs.Screen name="product/[id]" options={{ href: null }} />
            <Tabs.Screen name="settings/ChangePassword" options={{ href: null }} />
            <Tabs.Screen name="settings/EditProfile" options={{ href: null }} />
            <Tabs.Screen name="list/type-selection" options={{ href: null }} />
            <Tabs.Screen name="list/iaResult" options={{ href: null }} />

        </Tabs>
    )
}

export default TabsLayout
