import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
    runOnJS,
} from 'react-native-reanimated';

const EASE_OUT = Easing.out(Easing.cubic);
const EASE_IN  = Easing.in(Easing.cubic);

interface Props { onFinish: () => void; }

export const CustomSplashScreen: React.FC<Props> = ({ onFinish }) => {
    // Container fades to 0 at the end for a smooth hand-off
    const screenOpacity = useSharedValue(1);

    // Logo: scale + fade in
    const logoOpacity = useSharedValue(0);
    const logoScale   = useSharedValue(0.78);

    // App name: fade + slide up
    const nameOpacity = useSharedValue(0);
    const nameY       = useSharedValue(22);

    // Tagline: fade only, slightly later
    const tagOpacity  = useSharedValue(0);

    useEffect(() => {
        // ── Phase 1: logo appears (0 – 750ms) ──
        logoOpacity.value = withTiming(1, { duration: 750, easing: EASE_OUT });
        logoScale.value   = withTiming(1, { duration: 750, easing: EASE_OUT });

        // ── Phase 2: name slides up (350 – 950ms) ──
        nameOpacity.value = withDelay(350, withTiming(1, { duration: 600, easing: EASE_OUT }));
        nameY.value       = withDelay(350, withTiming(0,  { duration: 600, easing: EASE_OUT }));

        // ── Phase 3: tagline fades in (600 – 1100ms) ──
        tagOpacity.value  = withDelay(600, withTiming(1, { duration: 500, easing: EASE_OUT }));

        // ── Phase 4: everything fades out (1700 – 2200ms) ──
        screenOpacity.value = withDelay(1700, withTiming(0, { duration: 500, easing: EASE_IN }));

        const t = setTimeout(() => runOnJS(onFinish)(), 2250);
        return () => clearTimeout(t);
    }, []);

    const screenStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }));
    const logoStyle   = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
        transform: [{ scale: logoScale.value }],
    }));
    const nameStyle   = useAnimatedStyle(() => ({
        opacity: nameOpacity.value,
        transform: [{ translateY: nameY.value }],
    }));
    const tagStyle    = useAnimatedStyle(() => ({ opacity: tagOpacity.value }));

    return (
        <Animated.View style={[styles.container, screenStyle]}>
            {/* Logo */}
            <Animated.View style={logoStyle}>
                <Image
                    source={require('@/assets/images/Insta-highlights.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* App name */}
            <Animated.View style={[styles.nameWrapper, nameStyle]}>
                <Text style={styles.appName}>SoterCare</Text>
            </Animated.View>

            {/* Tagline */}
            <Animated.View style={tagStyle}>
                <Text style={styles.tagline}>Wellness Simplified</Text>
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#fafafa',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
    },
    logo: {
        width: 220,
        height: 220,
    },
    nameWrapper: {
        marginTop: 12,
        alignItems: 'center',
    },
    appName: {
        fontSize: 34,
        fontWeight: '700',
        color: '#1a1a1a',
        letterSpacing: 0.4,
    },
    tagline: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: '400',
        color: '#aaa',
        letterSpacing: 0.6,
    },
});
