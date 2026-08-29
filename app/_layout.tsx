import './global.css';
import React, { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { I18nextProvider } from 'react-i18next';
import { initDevMode } from '@/src/shared/dev';
import i18n from '@/src/shared/i18n';
import { wrapRootLayout } from '@/src/shared/monitoring/sentry';
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
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/src/shared/api';
import { BottomSheetModalProvider } from '@/src/shared/ui/BottomSheetCompat';
import { ToastProvider } from '@/src/shared/ui';

SplashScreen.preventAutoHideAsync();

/** Shared iOS-like slide for forward and back (same style both ways). */
const SHARED_STACK_OPTIONS = {
  headerShown: false,
  animation: 'slide_from_right' as const,
  animationDuration: 280,
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
};

function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
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
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <BottomSheetModalProvider>
              <Stack screenOptions={SHARED_STACK_OPTIONS}>
                <Stack.Screen name="index" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="tabs" />
              </Stack>
              <ToastProvider />
            </BottomSheetModalProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

export default wrapRootLayout(RootLayout);
