import { View, Text, Pressable, PressableProps, Image } from 'react-native'
import React from 'react'

interface Props extends PressableProps {
    children: string;
    color: "primary" | "secondary" | "container" | "neutral" | "white";
    textColor?: "primary" | "secondary" | "container" | "neutral" | "white";
    textFont?: "light" | "medium" | "black";

    variant?: 'contained' | 'whithImage'
    image?: string;
}


const CustomButton = ({ children, color, onPress, onLongPress, variant = 'contained', image, textColor = 'white', textFont = 'light' }: Props) => {

    const btnColor = {
        primary: 'bg-primary',
        secondary: 'bg-secondary',
        container: 'bg-container',
        neutral: 'bg-neutral',
        white: 'bg-white'
    }[color];

    const colorText = {
        primary: 'text-primary',
        secondary: 'text-secondary',
        container: 'text-container',
        neutral: 'text-neutral',
        white: 'text-white'
    }[textColor];

    const fontText = {
        light: 'font-lexend-light',
        medium: 'font-lexend-medium',
        black: 'font-lexend-black'
    }[textFont];


    if (variant === 'whithImage') {

        return (
            <Pressable
                className={`flex rounded-md items-center justify-center px-4 py-2 mb-4 mx-9 ${btnColor} active:opacity-90 flex-row`}
                onPress={onPress}
                onLongPress={onLongPress}
            >
                <Image
                    source={{ uri: `${image}` }}
                    resizeMode={"stretch"}
                    className='rounded-3xl w-7 h-7 mr-5'
                />
                <Text
                    className={`${colorText} ${fontText} text-center`}
                >
                    {children}
                </Text>
            </Pressable>
        )
    }
    return (
        <Pressable
            className={`rounded-md items-center py-2 mb-4 mx-9 ${btnColor} active:opacity-90`}
            onPress={onPress}
            onLongPress={onLongPress}
        >
            <Text
                className={`${colorText} ${fontText} text-center `}
            >
                {children}
            </Text>
        </Pressable>
    )
}

export default CustomButton