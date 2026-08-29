import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import { radii, useThemeColors } from '../theme';

type Props = {
  width: ViewStyle['width'];
  height: ViewStyle['height'];
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Lightweight placeholder that uses semantic theme colors and works offline.
 * Keep the animation subtle so large lists do not compete with content.
 */
export function Skeleton({ width, height, borderRadius = radii.sm, style }: Props) {
  const colors = useThemeColors();

  return (
    <MotiView
      accessibilityLabel="Cargando"
      from={{ opacity: 0.45 }}
      animate={{ opacity: 0.9 }}
      transition={{
        type: 'timing',
        duration: 850,
        loop: true,
        repeatReverse: true,
      }}
      style={[styles.base, { width, height, borderRadius, backgroundColor: colors.line }, style]}
    />
  );
}

export function CardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <MotiView style={[styles.card, compact && styles.compactCard]}>
      <Skeleton width={compact ? 52 : '100%'} height={compact ? 52 : 110} />
      <Skeleton width="82%" height={14} style={styles.line} />
      <Skeleton width="58%" height={11} style={styles.lineSmall} />
    </MotiView>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  card: {
    width: 158,
    padding: 12,
    gap: 6,
  },
  compactCard: {
    width: '100%',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  line: { marginTop: 4 },
  lineSmall: { marginTop: 2 },
});
