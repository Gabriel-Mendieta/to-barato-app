import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Tabs } from 'expo-router';
import { AppTabBar } from '@/src/shared/ui';
import { colors } from '@/src/shared/theme';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.orangeDeep,
        tabBarInactiveTintColor: colors.tabInactive,
        sceneStyle: { backgroundColor: colors.bg },
        // Collapse the default tab-bar host — AppTabBar docks the floating pill itself.
        // height: 0 so scenes are full-bleed (screens use FLOATING_TAB_BAR_CLEARANCE).
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        // Instant tab switches — fade made single taps feel laggy / missed.
        animation: 'none',
        freezeOnBlur: true,
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lista/index"
        options={{
          title: 'Listas',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'cart' : 'cart-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map/index"
        options={{
          title: 'Proveedores',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil/index"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen name="search/index" options={{ href: null }} />
      <Tabs.Screen name="list/add" options={{ href: null }} />
      <Tabs.Screen name="list/providers" options={{ href: null }} />
      <Tabs.Screen name="list/[id]" options={{ href: null }} />
      <Tabs.Screen name="product/[id]" options={{ href: null }} />
      <Tabs.Screen name="settings/ChangePassword" options={{ href: null }} />
      <Tabs.Screen name="settings/EditProfile" options={{ href: null }} />
      <Tabs.Screen name="list/iaResult" options={{ href: null }} />
    </Tabs>
  );
}
