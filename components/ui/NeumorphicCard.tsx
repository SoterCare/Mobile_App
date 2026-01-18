import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';

interface NeumorphicCardProps {
    children?: React.ReactNode;
    style?: ViewStyle;
    contentContainerStyle?: ViewStyle;
}

/**
 * A wrapper component that implements the Neumorphic "Soft UI" look
 * with a Light shadow (top-left) and Dark shadow (bottom-right).
 */
export const NeumorphicCard: React.FC<NeumorphicCardProps> = ({ children, style, contentContainerStyle }) => {
    return (
        <View style={[styles.outerContainer, style]}>
            {/* Layer 1: Light Shadow (Top-Left, White) */}
            <View style={styles.lightShadow}>
                {/* Layer 2: Dark Shadow (Bottom-Right, Gray/Black) */}
                <View style={styles.darkShadow}>
                    {/* Layer 3: Actual Content Surface */}
                    <View style={[styles.innerSurface, contentContainerStyle]}>
                        {children}
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        // Wrapper
    },
    lightShadow: {
        // CSS: -4px -4px 6px rgba(255, 255, 255, 0.9)
        shadowColor: '#FFFFFF',
        shadowOffset: { width: -4, height: -4 },
        shadowOpacity: 0.9,
        shadowRadius: 6,
        backgroundColor: 'transparent',
    },
    darkShadow: {
        // CSS: 3px 3px 6px rgba(0, 0, 0, 0.1)
        shadowColor: '#000000',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        backgroundColor: 'transparent',
    },
    innerSurface: {
        backgroundColor: '#f2f3f7',
        borderRadius: 15, // Matches CSS "15px"

        ...Platform.select({
            android: {
                elevation: 5,
                backgroundColor: '#f2f3f7',
            },
        }),
    },
});
