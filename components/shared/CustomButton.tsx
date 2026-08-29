/** @deprecated Prefer `@/src/shared/ui` Button. Thin NativeWind wrapper kept for legacy screens. */
import React from 'react';
import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cva, type VariantProps } from 'class-variance-authority';

const wrapperStyles = cva(
  'flex-row items-center justify-center rounded-md active:opacity-90 mb-4 py-3',
  {
    variants: {
      color: {
        primary: 'bg-primary',
        secondary: 'bg-secondary',
        container: 'bg-container',
        neutral: 'bg-neutral',
        white: 'bg-white',
      },
      variant: {
        contained: 'px-4 py-2',
        withIcon: 'px-4 py-2 gap-2',
      },
    },
    defaultVariants: {
      color: 'primary',
      variant: 'contained',
    },
  }
);

const textStyles = cva('', {
  variants: {
    textColor: {
      primary: 'text-primary',
      secondary: 'text-secondary',
      container: 'text-container',
      neutral: 'text-neutral',
      white: 'text-white',
    },
    font: {
      light: 'font-lexend-light',
      medium: 'font-lexend-medium',
      black: 'font-lexend-black',
    },
  },
  defaultVariants: {
    textColor: 'white',
    font: 'light',
  },
});

interface Props extends VariantProps<typeof wrapperStyles>, VariantProps<typeof textStyles> {
  children: React.ReactNode;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  /** @deprecated use `font` */
  textFont?: VariantProps<typeof textStyles>['font'];
  disabled?: boolean;
}

export default function CustomButton({
  children,
  onPress,
  color,
  variant,
  textColor,
  font,
  textFont,
  icon,
  disabled,
}: Props) {
  const resolvedFont = font ?? textFont;
  const iconColor = textColor === 'white' ? '#FFF' : '#0B2545';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={wrapperStyles({ color, variant })}
      style={{ opacity: disabled ? 0.55 : 1 }}
    >
      {icon ? (
        <Ionicons name={icon} size={24} color={iconColor} style={{ marginRight: 8 }} />
      ) : null}
      {typeof children === 'string' ? (
        <Text className={textStyles({ textColor, font: resolvedFont })}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
