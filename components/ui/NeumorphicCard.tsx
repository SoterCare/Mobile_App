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
        // Wrapper, ensure it has dimensions (flex:1 or explicit w/h)
        // Default to no style, user provides via style prop
    },
    lightShadow: {
        shadowColor: '#FFFFFF',
        shadowOffset: { width: -4, height: -4 },
        shadowOpacity: 1, // Stronger for visibility
        shadowRadius: 4,
        backgroundColor: 'transparent',
        flex: 1, // Ensure it fills the parent
    },
    darkShadow: {
        shadowColor: '#AEAEC0', // Better dark shadow color for Neumorphism
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        backgroundColor: 'transparent',
        flex: 1, // Ensure it fills the parent
    },
    innerSurface: {
        backgroundColor: '#f2f3f7',
        borderRadius: 20, // Increased to match new standard
        flex: 1, // Ensure it fills the shadow containers
        // Ensure inner surface fills the shadow containers
    },
});
