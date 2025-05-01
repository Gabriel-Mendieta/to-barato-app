import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const StackLayout = () => {
    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerShadowVisible: false,
                contentStyle: {
                    backgroundColor: 'white',
                }
            }}
        >
            <Stack.Screen
                name='home/index'
                options={{
                    title: 'Home Screen',
                    headerTitleStyle: {
                        fontFamily: 'Lexend-Medium',
                        color: '#000',

                    },
                    headerShown: false,

                }}
            />
            <Stack.Screen
                name='lista/index'
                options={{
                    title: 'Lista de Compras',

                    headerTitleStyle: {
                        fontFamily: 'Lexend-Medium',
                        color: '#33618D',
                        fontSize: 20,
                    },
                    // headerShown: false,
                }}
            />
            <Stack.Screen
                name='map/index'
                options={{
                    title: 'Home Screen',
                    headerTitleStyle: {
                        fontFamily: 'Lexend-Medium',
                        color: '#000',

                    },
                    headerShown: false,
                }}
            />
        </Stack>
    )
}

export default StackLayout