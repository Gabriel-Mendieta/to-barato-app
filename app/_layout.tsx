import './global.css';
import React, { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { initDevMode } from '@/src/shared/dev';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

/** Shared iOS-like slide for forward and back (same style both ways). */
const SHARED_STACK_OPTIONS = {
  headerShown: false,
  animation: 'slide_from_right' as const,
  animationDuration: 280,
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
};

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    'Lexend-Black': require('../assets/fonts/Lexend-Black.ttf'),
    'Lexend-Light': require('../assets/fonts/Lexend-Light.ttf'),
    'Lexend-Medium': require('../assets/fonts/Lexend-Medium.ttf'),
  });

  useEffect(() => {
    initDevMode();
  }, []);

  useEffect(() => {
    if (error) throw error;
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, error]);

  if (!fontsLoaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={SHARED_STACK_OPTIONS}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="tabs" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
