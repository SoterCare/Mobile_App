import React from 'react';
import { StyleSheet, Text, Pressable, View, ViewStyle, TextStyle, Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

interface NeumorphicButtonProps {
    label?: string;
    onPress: () => void;
    style?: ViewStyle;
    contentStyle?: ViewStyle; // New prop for inner view styling
    textStyle?: TextStyle;
    icon?: React.ReactNode;
    variant?: 'primary' | 'dark';
}

/**
 * A button component with Neumorphic press interactions.
 * - Scales down slightly on press.
 * - Simulates "inset" effect by manipulating shadows/translation.
 */
export const NeumorphicButton: React.FC<NeumorphicButtonProps> = ({
    label,
    onPress,
    style,
    contentStyle,
    textStyle,
    icon,
    variant = 'primary'
}) => {
    const isDark = variant === 'dark';
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);

    // Animation handling
    const handlePressIn = () => {
        scale.value = withSpring(0.97, { damping: 10, stiffness: 300 }); // "Active" scale
        translateY.value = withTiming(0, { duration: 50 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 10, stiffness: 300 });
        translateY.value = withTiming(0, { duration: 50 });
    };

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: scale.value },
                { translateY: translateY.value }
            ],
        };
    });

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={({ pressed }) => [styles.touchable, style]}
        >
            {({ pressed }) => (
                <Animated.View style={[
                    styles.base,
                    isDark ? styles.darkBase : styles.lightBase,
                    // Only show OUTWARD shadows when NOT pressed
                    !pressed && (isDark ? styles.darkShadows : styles.lightShadows),
                    // When pressed, we simulate the "inset" look by removing outer shadows
                    // and relying on the background/scale. Pure Native "Inset" is hard.
                    pressed && styles.pressedState,
                    contentStyle, // Apply custom inner styles provided by usage
                    animatedStyle
                ]}>
                    {icon && <View style={styles.iconContainer}>{icon}</View>}
                    {label && (
                        <Text style={[
                            styles.text,
                            isDark ? styles.darkText : styles.lightText,
                            textStyle
                        ]}>
                            {label}
                        </Text>
                    )}
                </Animated.View>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    touchable: {
        // wrapper
    },
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,  // CSS: 10px
        paddingHorizontal: 20, // CSS: 20px
        borderRadius: 15,     // CSS: 15px
    },
    lightBase: {
        backgroundColor: '#f2f3f7', // CSS: #f2f3f7
    },
    darkBase: {
        backgroundColor: '#1a1a1a', // CSS: #1a1a1a
    },
    pressedState: {
        // Optional: slight bg darken to simulate depth since we can't do inset shadow easily
        backgroundColor: '#e6e7eb',
    },
    iconContainer: {
        marginRight: 8,
    },
    text: {
        fontWeight: '700', // CSS: 700
        fontSize: 16,
        textAlign: 'center',
    },
    lightText: {
        color: '#222', // CSS: #222
    },
    darkText: {
        color: '#ffffff', // CSS: #ffffff
    },
    // Light Theme Shadows
    lightShadows: {
        ...Platform.select({
            ios: {
                shadowColor: '#FFFFFF',
                shadowOffset: { width: -4, height: -4 },
                shadowOpacity: 0.9,
                shadowRadius: 6,
                // We need the second shadow.
                // For buttons, a single view can't hold two shadows.
                // We'll prioritize the Drop Shadow depth.
                // Or we stick to one strong shadow combo.
                // Let's compromise: standard shadow + elevation
            },
            android: {
                elevation: 6,
                shadowColor: '#000',
            }
        })
    },
    // Dark Theme Shadows
    darkShadows: {
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 5, height: 5 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
                shadowColor: '#000',
            }
        })
    }
});
