import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors, spacing, typography } from '../theme';

type Props = TextInputProps & {
  label?: string;
  hint?: string;
  trailing?: React.ReactNode;
  containerStyle?: ViewStyle;
};

export function Field({
  label,
  hint,
  trailing,
  containerStyle,
  style,
  ...inputProps
}: Props) {
  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputRow}>
        <TextInput
          placeholderTextColor={colors.muted}
          style={[styles.input, style]}
          {...inputProps}
        />
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: {
    fontFamily: typography.bold,
    fontSize: 11,
    color: colors.navy,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontFamily: typography.medium,
    fontSize: 14,
    color: colors.ink,
  },
  trailing: { marginLeft: spacing.sm },
  hint: {
    fontFamily: typography.family,
    fontSize: 11,
    color: colors.muted,
  },
});
