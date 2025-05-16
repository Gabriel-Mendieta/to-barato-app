import React from 'react';
import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cva, type VariantProps } from 'class-variance-authority';

// 1) Wrapper del botón
const wrapperStyles = cva(
    'flex-row items-center justify-center rounded-md active:opacity-90 mb-4 mx-9',
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

// 2) Estilos solo de texto
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
    children: string;
    onPress?: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
}

export default function CustomButton({
    children,
    onPress,
    color,
    variant,
    textColor,
    font,
    icon,
}: Props) {
    // El color del icono debería seguir tu palette de colores
    const iconColor = textColor === 'white' ? '#FFF' : '#001D35';

    return (
        <Pressable
            onPress={onPress}
            className={wrapperStyles({ color, variant })}
        >
            {icon && (
                <Ionicons
                    name={icon}
                    size={24}
                    color={iconColor}
                    style={{ marginRight: 8 }}
                />
            )}
            <Text className={textStyles({ textColor, font })}>
                {children}
            </Text>
        </Pressable>
    );
}
