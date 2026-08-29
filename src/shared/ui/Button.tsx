import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

type Tone = 'navy' | 'orange' | 'light';
type Size = 'md' | 'lg';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  tone?: Tone;
  size?: Size;
  full?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

/**
 * Solid fills live on an inner View so NativeWind / Tailwind preflight
 * cannot wipe Pressable backgrounds (white label on transparent → invisible CTA).
 */
const toneStyles: Record<
  Tone,
  { bg: string; fg: string; border?: string; shadow: string }
> = {
  navy: {
    bg: colors.navy,
    fg: colors.white,
    shadow: 'rgba(11,37,69,0.18)',
  },
  orange: {
    bg: colors.orange,
    fg: colors.white,
    shadow: 'rgba(242,160,61,0.32)',
  },
  light: {
    bg: colors.white,
    fg: colors.navy,
    border: colors.line,
    shadow: 'rgba(11,37,69,0.08)',
  },
};

/** Flatten JSX text (`Label {name}`) into one string; null if mixed with elements. */
function asLabelText(node: React.ReactNode): string | null {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (node == null || typeof node === 'boolean') {
    return '';
  }
  if (Array.isArray(node)) {
    const parts: string[] = [];
    for (const child of node) {
      const part = asLabelText(child);
      if (part == null) return null;
      parts.push(part);
    }
    return parts.join('');
  }
  return null;
}

export function Button({
  children,
  onPress,
  tone = 'navy',
  size = 'md',
  full = true,
  disabled,
  loading,
  style,
  textStyle,
}: Props) {
  const t = toneStyles[tone];
  const inactive = disabled || loading;
  const label = asLabelText(children);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        full ? styles.full : styles.inline,
        { opacity: inactive ? 0.55 : pressed ? 0.92 : 1 },
        style,
      ]}
    >
      <View
        style={[
          styles.face,
          size === 'lg' ? styles.lg : styles.md,
          {
            backgroundColor: t.bg,
            borderColor: t.border ?? t.bg,
            borderWidth: t.border ? 1 : 0,
            ...Platform.select({
              ios: {
                shadowColor: t.shadow,
                shadowOffset: { width: 0, height: tone === 'light' ? 1 : 6 },
                shadowOpacity: 1,
                shadowRadius: tone === 'light' ? 3 : 10,
              },
              android: { elevation: tone === 'light' ? 1 : 4 },
              default: {},
            }),
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={t.fg} />
        ) : label != null ? (
          <Text
            style={[
              styles.label,
              size === 'lg' && styles.labelLg,
              { color: t.fg },
              textStyle,
            ]}
          >
            {label}
          </Text>
        ) : (
          children
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  full: { alignSelf: 'stretch' },
  inline: { alignSelf: 'flex-start' },
  face: {
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    overflow: 'hidden',
  },
  md: { paddingVertical: 14, paddingHorizontal: spacing.lg },
  lg: { paddingVertical: 16, paddingHorizontal: spacing.xl },
  label: {
    fontFamily: typography.bold,
    fontSize: 15,
    letterSpacing: -0.1,
  },
  labelLg: { fontSize: 16 },
});
