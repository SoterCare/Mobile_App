import React, { useEffect } from 'react';
import { TextInput, TextStyle, StyleSheet, Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withTiming,
    Easing,
    useDerivedValue,
} from 'react-native-reanimated';

interface AnimatedCounterProps {
    value: number;
    style?: TextStyle | TextStyle[];
    precision?: number; // 0 for integers, 1 for 98.6, etc.
}

// Create an animated TextInput to act as our text display
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, style, precision = 0 }) => {
    // Shared value for the number
    const sharedValue = useSharedValue(value);

    // Trigger animation when value changes
    useEffect(() => {
        sharedValue.value = withTiming(value, {
            duration: 1500, // Smooth 1.5s transition
            easing: Easing.out(Easing.exp),
        });
    }, [value, sharedValue]);

    // Create animated props for the TextInput
    const animatedProps = useAnimatedProps(() => {
        // Format the number based on precision
        const currentVal = sharedValue.value;
        const formattedText = currentVal.toFixed(precision);

        return {
            text: formattedText,
        } as any; // Cast to any to avoid TS issues with 'text' prop on TextInput (it exists natively)
    });

    return (
        <AnimatedTextInput
            underlineColorAndroid="transparent"
            editable={false}
            defaultValue={String(value)} // Fallback / Initial
            style={[styles.text, style]}
            animatedProps={animatedProps}
        />
    );
};

const styles = StyleSheet.create({
    text: {
        padding: 0, // Remove default padding
        margin: 0,
        color: '#000', // Default color, can be overridden
    },
});
