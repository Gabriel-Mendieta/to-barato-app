import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, useThemeColors } from '../theme';
import { useTranslation } from 'react-i18next';

export type TabKey = 'home' | 'lista' | 'map' | 'perfil';

type TabDef = {
  key: TabKey;
  routeName: string;
  label: string;
  iconOutline: keyof typeof Ionicons.glyphMap;
  iconFilled: keyof typeof Ionicons.glyphMap;
};

/**
 * Specs from ToBarato.zip `BottomTabs` (components.jsx):
 * - absolute left/right 12, bottom 14
 * - card-colored pill, radius 22, padding 8, tokenized border
 * - shadow 0 10px 30px rgba(11,37,69,.10) + 0 2px 6px rgba(11,37,69,.06)
 * - 4 equal columns, gap 4
 * - active: orangeSoft bg, radius 16, padding 8/4/6, orangeDeep icon+label
 * - inactive: transparent, #8A93A6 outline icon + label
 * - icon 22, label 11 / weight 700
 */
const TABS: TabDef[] = [
  {
    key: 'home',
    routeName: 'home/index',
    label: 'Inicio',
    iconOutline: 'home-outline',
    iconFilled: 'home',
  },
  {
    key: 'lista',
    routeName: 'lista/index',
    label: 'Listas',
    iconOutline: 'cart-outline',
    iconFilled: 'cart',
  },
  {
    key: 'map',
    routeName: 'map/index',
    label: 'Proveedores',
    iconOutline: 'map-outline',
    iconFilled: 'map',
  },
  {
    key: 'perfil',
    routeName: 'perfil/index',
    label: 'Perfil',
    iconOutline: 'person-outline',
    iconFilled: 'person',
  },
];

const MAIN_ROUTE_NAMES = new Set(TABS.map((t) => t.routeName));

/** Gap from screen bottom to pill (zip: bottom: 14). */
const PILL_BOTTOM_GAP = 14;
/** Horizontal inset of the floating pill (zip: left/right 12). */
const PILL_SIDE_INSET = 12;
/**
 * Space screens should leave under scroll content so the last items clear the pill.
 * Zip screens use paddingBottom: 92; RN adds a little for larger phones.
 */
export const FLOATING_TAB_BAR_CLEARANCE = 100;

type RouteLike = { key: string; name: string; params?: object };

type FloatingProps = {
  active: TabKey;
  onChange: (key: TabKey) => void;
};

type PillProps = {
  active: TabKey;
  onPress: (tab: TabDef) => void;
  onLongPress?: (tab: TabDef) => void;
};

function TabPill({ active, onPress, onLongPress }: PillProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: colors.card,
          borderColor: colors.line,
          shadowColor: colors.navy,
        },
      ]}
      pointerEvents="auto"
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        const label = t(
          `shared.${tab.key === 'home' ? 'home' : tab.key === 'lista' ? 'lists' : tab.key === 'map' ? 'providers' : 'profile'}`,
        );
        const tint = isActive ? colors.orangeDeep : colors.tabInactive;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onPress(tab)}
            onLongPress={onLongPress ? () => onLongPress(tab) : undefined}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={label}
            style={styles.itemPressable}
          >
            {({ pressed }) => (
              <View
                style={[
                  styles.item,
                  isActive && { backgroundColor: colors.orangeSoft },
                  pressed && !isActive && styles.itemPressed,
                ]}
              >
                <Ionicons
                  name={isActive ? tab.iconFilled : tab.iconOutline}
                  size={22}
                  color={tint}
                />
                <Text
                  style={[
                    styles.label,
                    { color: isActive ? colors.orangeDeep : colors.tabInactive },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  {label}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Dock the pill above the home indicator — matches zip `bottom: 14`. */
function FloatingDock({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  // Zip mock is bottom: 14 from the physical screen edge (home indicator overlays).
  // On devices without a home indicator, keep a small lift so the pill isn't flush.
  const bottom = insets.bottom > 0 ? PILL_BOTTOM_GAP : Math.max(insets.bottom, 10);

  return (
    <View pointerEvents="box-none" style={[styles.dock, { bottom }]}>
      {children}
    </View>
  );
}

/** Floating tab bar matching the Claude Design prototype (RN-adapted). */
export function FloatingTabBar({ active, onChange }: FloatingProps) {
  return (
    <FloatingDock>
      <TabPill active={active} onPress={(tab) => onChange(tab.key)} />
    </FloatingDock>
  );
}

/**
 * Local tab-bar props — do not import BottomTabBarProps from @react-navigation
 * (SDK 56+ expo-router rejects that import in app code).
 * `navigation` stays `any` so Expo Router's emit generics remain assignable.
 */
type AppTabBarProps = {
  state: {
    index: number;
    routes: RouteLike[];
  };
  descriptors?: Record<string, { options: Record<string, unknown> }>;
  navigation: any;
};

function switchTab(
  navigation: AppTabBarProps['navigation'],
  state: AppTabBarProps['state'],
  tab: TabDef,
) {
  const route = state.routes.find((r) => r.name === tab.routeName);
  if (!route) return;

  const isFocused = state.routes[state.index]?.key === route.key;
  const event = navigation.emit({
    type: 'tabPress',
    target: route.key,
    canPreventDefault: true,
  });

  if (isFocused || event?.defaultPrevented) return;

  if (typeof navigation.jumpTo === 'function') {
    navigation.jumpTo(route.name);
  } else {
    navigation.navigate(route.name);
  }
}

/**
 * Expo Router bottom tab bar — floating pill only.
 * Host slot is height 0 (see tabs/_layout tabBarStyle); this docks absolutely.
 */
export function AppTabBar({ state, navigation }: AppTabBarProps) {
  const current = state.routes[state.index]?.name;
  if (!current || !MAIN_ROUTE_NAMES.has(current)) {
    return null;
  }

  const activeTab = TABS.find((t) => t.routeName === current)?.key ?? ('home' as TabKey);

  return (
    <FloatingDock>
      <TabPill
        active={activeTab}
        onPress={(tab) => switchTab(navigation, state, tab)}
        onLongPress={(tab) => {
          const route = state.routes.find((r) => r.name === tab.routeName);
          if (!route) return;
          navigation.emit({ type: 'tabLongPress', target: route.key });
        }}
      />
    </FloatingDock>
  );
}

const styles = StyleSheet.create({
  // Full-width absolute dock; pill is inset via padding — never 100% width without margin.
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 30,
    elevation: 30,
    paddingHorizontal: PILL_SIDE_INSET,
  },
  pill: {
    borderRadius: 22,
    padding: 8,
    flexDirection: 'row',
    gap: 4,
    borderWidth: 1,
    // Zip: 0 10px 30px rgba(11,37,69,.10), 0 2px 6px rgba(11,37,69,.06)
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    // Secondary soft contact shadow approximated via slightly higher Android elevation
    elevation: Platform.OS === 'android' ? 12 : 0,
  },
  itemPressable: {
    flex: 1,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 4,
    borderRadius: 16,
    gap: 2,
    backgroundColor: 'transparent',
  },
  itemPressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 11,
    fontFamily: typography.bold,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
