import './global.css'
import React, { useEffect } from 'react'
import { Slot, SplashScreen } from 'expo-router'

import { useFonts } from 'expo-font'

const RootLayout = () => {

    SplashScreen.preventAutoHideAsync();

    const [fontsLoaded, error] = useFonts({
        'Lexend-Black': require('../assets/fonts/Lexend-Black.ttf'),
        'Lexend-Light': require('../assets/fonts/Lexend-Light.ttf'),
        'Lexend-Medium': require('../assets/fonts/Lexend-Medium.ttf'),
    })

    useEffect(() => {
        if (error) throw error;

        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }

    }, [fontsLoaded, error])

    if (!fontsLoaded && !error) {
        return null;
    }

    return <Slot />;
}

export default RootLayout