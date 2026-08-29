import React, { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
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
          width: '100%',
          minHeight: 64,
          alignSelf: 'stretch',
          ...Platform.select({
            web: { boxSizing: 'border-box' },
            default: {},
          }),
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: themeColors.orange,
          backgroundColor: themeColors.orangeSoft,
          borderRadius: radii.lg,
          paddingVertical: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
        },
        pressed: {
          backgroundColor: themeColors.navy,
          borderColor: themeColors.navy,
        },
        disabled: {
          opacity: 0.5,
        },
        label: {
          fontFamily: typography.bold,
          fontSize: 13,
          color: themeColors.navy,
        },
        labelPressed: {
          color: themeColors.white,
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
      {({ pressed }) => (
        <>
          <Ionicons name="add" size={18} color={pressed ? themeColors.white : themeColors.navy} />
          <Text style={[styles.label, pressed && styles.labelPressed]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
