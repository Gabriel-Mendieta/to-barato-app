import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, spacing, typography, useThemeColors } from '../theme';

type Props = {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  description,
  actionLabel,
  onAction,
}: Props) {
  const colors = useThemeColors();

  return (
    <View style={styles.wrap}>
      <View style={[styles.icon, { backgroundColor: colors.blueSoft }]}>
        <Ionicons name={icon} size={34} color={colors.navySoft} />
      </View>
      <Text style={[styles.title, { color: colors.navy }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.action,
            { borderColor: colors.line },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.actionText, { color: colors.navy }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: typography.extrabold,
    fontSize: 16,
    textAlign: 'center',
  },
  description: {
    fontFamily: typography.medium,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 320,
  },
  action: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.lg,
  },
  actionText: {
    fontFamily: typography.bold,
    fontSize: 13,
  },
  pressed: { opacity: 0.75 },
});
