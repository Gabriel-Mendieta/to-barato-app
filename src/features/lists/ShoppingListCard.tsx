import React, { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ListDTO } from '@/src/shared/api';
import { calculateListProgress } from './screenSelectors';
import { Chip } from '@/src/shared/ui/Chip';
import { radii, typography, useThemeColors } from '@/src/shared/theme';

type ListVisual = { bg: string; emoji: string };

const VISUAL_BY_PROVIDER: Record<number, ListVisual> = {
  1: { bg: '#E2F1FA', emoji: '🛒' },
  2: { bg: '#DCF3E5', emoji: '🛒' },
  3: { bg: '#FFE3E0', emoji: '🛒' },
  4: { bg: '#E3EDFA', emoji: '🔧' },
  5: { bg: '#FFE3E1', emoji: '💊' },
  6: { bg: '#F1E7FA', emoji: '🛒' },
  7: { bg: '#DCE5F7', emoji: '🛒' },
  8: { bg: '#FFE3E1', emoji: '🛒' },
};

const VISUAL_FALLBACK: ListVisual[] = [
  { bg: '#FFE8D9', emoji: '🍎' },
  { bg: '#E3EDFA', emoji: '🔧' },
  { bg: '#F1E7FA', emoji: '🐶' },
  { bg: '#DCF3E7', emoji: '🧃' },
  { bg: '#FFF1C8', emoji: '🥖' },
  { bg: '#FFE3E1', emoji: '💊' },
];

function listVisual(lista: ListDTO, index: number): ListVisual {
  return VISUAL_BY_PROVIDER[lista.IdProveedor] ?? VISUAL_FALLBACK[index % VISUAL_FALLBACK.length];
}

type Props = {
  item: ListDTO;
  index: number;
  count: number;
  selected: boolean;
  articleLabel: string;
  purchasedLabel: string | null;
  listOptionsLabel: string;
  onPress: () => void;
  onLongPress: () => void;
  onMenu: () => void;
};

export function ShoppingListCard({
  item,
  index,
  count,
  selected,
  articleLabel,
  purchasedLabel,
  listOptionsLabel,
  onPress,
  onLongPress,
  onMenu,
}: Props) {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const visual = listVisual(item, index);
  const progress = calculateListProgress(item.IdLista, count);

  return (
    <View
      style={[styles.card, selected && styles.cardSelected]}
      testID={`shopping-list-card-${item.IdLista}`}
    >
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={350}
        style={({ pressed }) => [styles.cardPressable, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={item.Nombre}
      >
        <View style={[styles.catIcon, { backgroundColor: visual.bg }]}>
          <Text style={styles.catEmoji}>{visual.emoji}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.Nombre}
            </Text>
            <Pressable
              onPress={onMenu}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={listOptionsLabel}
              style={styles.moreBtn}
              testID={`shopping-list-menu-${item.IdLista}`}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color={themeColors.tabInactive} />
            </Pressable>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{articleLabel}</Text>
            {purchasedLabel ? (
              <Chip tone="green" size="sm" style={styles.doneChip}>
                {purchasedLabel}
              </Chip>
            ) : null}
          </View>

          <View style={styles.cardProgressTrack} testID={`shopping-list-progress-${item.IdLista}`}>
            <View
              style={[styles.cardProgressFill, { width: `${Math.min(100, progress.percentage)}%` }]}
            />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

function createStyles(themeColors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    card: {
      width: '100%',
      alignSelf: 'stretch',
      ...Platform.select({
        web: { boxSizing: 'border-box' },
        default: {},
      }),
      backgroundColor: themeColors.card,
      borderRadius: 18,
      minHeight: 120,
      borderWidth: 1,
      borderColor: themeColors.line,
      ...Platform.select({
        ios: {
          shadowColor: themeColors.navy,
          shadowOpacity: 0.08,
          shadowRadius: 9,
          shadowOffset: { width: 0, height: 4 },
        },
        android: { elevation: 3 },
        default: {},
      }),
    },
    cardSelected: {
      borderColor: themeColors.orange,
      borderWidth: 2,
      backgroundColor: themeColors.orangeSoft,
    },
    cardPressable: {
      width: '100%',
      minHeight: 118,
      ...Platform.select({
        web: { boxSizing: 'border-box' },
        default: {},
      }),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      padding: 18,
    },
    pressed: { opacity: 0.94 },
    catIcon: {
      width: 62,
      height: 62,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    catEmoji: { fontSize: 32, lineHeight: 36 },
    cardBody: { flex: 1, minWidth: 0 },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    cardTitle: {
      flex: 1,
      fontSize: 15,
      fontFamily: typography.extrabold,
      color: themeColors.navy,
      letterSpacing: -0.15,
    },
    moreBtn: { padding: 4 },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 6,
      flexWrap: 'wrap',
    },
    metaText: {
      fontSize: 12,
      fontFamily: typography.semibold,
      color: themeColors.muted,
    },
    doneChip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    cardProgressTrack: {
      width: '100%',
      marginTop: 8,
      height: 5,
      backgroundColor: themeColors.line,
      borderRadius: radii.pill,
      overflow: 'hidden',
    },
    cardProgressFill: {
      height: '100%',
      backgroundColor: themeColors.orange,
      borderRadius: radii.pill,
    },
  });
}
