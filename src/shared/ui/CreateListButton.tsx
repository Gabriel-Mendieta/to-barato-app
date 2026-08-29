import React, { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { radii, spacing, typography, useThemeColors } from '@/src/shared/theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function CreateListButton({ label, onPress, disabled = false }: Props) {
  const themeColors = useThemeColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        button: {
          marginTop: spacing.sm,
          marginHorizontal: spacing.lg,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: themeColors.line,
          borderRadius: radii.lg,
          paddingVertical: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        },
        pressed: {
          backgroundColor: themeColors.orangeSoft,
          borderColor: themeColors.orange,
        },
        disabled: {
          opacity: 0.5,
        },
        label: {
          fontFamily: typography.bold,
          fontSize: 13,
          color: themeColors.navy,
        },
      }),
    [themeColors],
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      testID="create-list-button"
    >
      <Ionicons name="add" size={18} color={themeColors.navy} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}
