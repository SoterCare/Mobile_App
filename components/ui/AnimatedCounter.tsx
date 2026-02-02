import React, { useEffect } from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    useDerivedValue,
    runOnJS,
} from 'react-native-reanimated';

interface AnimatedCounterProps {
    value: number;
    style?: TextStyle | TextStyle[];
    precision?: number; // 0 for integers, 1 for 98.6, etc.
}

// Create animated Text component
const AnimatedText = Animated.createAnimatedComponent(Text);

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, style, precision = 0 }) => {
    // Shared value for the number
    const sharedValue = useSharedValue(value);
    const [displayValue, setDisplayValue] = React.useState(value.toFixed(precision));

    // Trigger animation when value changes
    useEffect(() => {
        sharedValue.value = withTiming(value, {
            duration: 1500, // Smooth 1.5s transition
            easing: Easing.out(Easing.exp),
        });
    }, [value, sharedValue]);

    // Update display value on JS thread
    useDerivedValue(() => {
        const formatted = sharedValue.value.toFixed(precision);
        runOnJS(setDisplayValue)(formatted);
    }, [precision]);

    return (
        <Text style={[styles.text, style]}>
            {displayValue}
        </Text>
    );
};

const styles = StyleSheet.create({
    text: {
        padding: 0, // Remove default padding
        margin: 0,
        color: '#000', // Default color, can be overridden
    },
});
