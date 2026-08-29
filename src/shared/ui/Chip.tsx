import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

type Tone = 'navy' | 'orange' | 'green' | 'red' | 'cream' | 'lilac';

type Props = {
  children: React.ReactNode;
  tone?: Tone;
  size?: 'sm' | 'md';
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

const tones: Record<Tone, { bg: string; fg: string }> = {
  navy: { bg: '#E8EEF7', fg: colors.navySoft },
  orange: { bg: colors.orangeSoft, fg: '#A35A0E' },
  green: { bg: colors.greenSoft, fg: '#0E7A4B' },
  red: { bg: colors.redSoft, fg: '#A8362F' },
  cream: { bg: '#FFF4E0', fg: '#7A4B0E' },
  lilac: { bg: colors.lilacSoft, fg: '#5E3A9A' },
};

export function Chip({
  children,
  tone = 'navy',
  size = 'md',
  selected,
  onPress,
  style,
}: Props) {
  const t = selected ? tones.orange : tones[tone];
  const content = (
    <Text
      style={[
        styles.label,
        size === 'sm' ? styles.sm : styles.md,
        { color: t.fg },
      ]}
    >
      {children}
    </Text>
  );

  if (!onPress) {
    return (
      <Pressable style={[styles.base, { backgroundColor: t.bg }, style]}>
        {content}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: t.bg,
          opacity: pressed ? 0.85 : 1,
          borderWidth: selected ? 1 : 0,
          borderColor: colors.orange,
        },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    alignSelf: 'flex-start',
  },
  label: { fontFamily: typography.bold },
  sm: { fontSize: 11 },
  md: { fontSize: 12 },
});
