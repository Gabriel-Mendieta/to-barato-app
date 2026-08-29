import React from 'react';
import { Stack } from 'expo-router';

/** Auth stack — same slide animation as root (forward + back). */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 280,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
    />
  );
}
