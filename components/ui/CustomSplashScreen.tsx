import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, Image } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
    runOnJS
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CustomSplashScreenProps {
    onFinish: () => void;
}

export const CustomSplashScreen: React.FC<CustomSplashScreenProps> = ({ onFinish }) => {
    // Shared Values for Animation
    const textTranslateY = useSharedValue(50);
    const textOpacity = useSharedValue(0.1);

    // Box Expansion
    const boxWidth = useSharedValue(0);
    const boxHeight = useSharedValue(60);

    // Text Separation
    const leftTextTranslateX = useSharedValue(0);
    const rightTextTranslateX = useSharedValue(0);

    // Cover Image
    const imageOpacity = useSharedValue(0);
    const imageScale = useSharedValue(0.5);

    // Image container
    const imageContainerWidth = useSharedValue(60);
    const imageContainerHeight = useSharedValue(60);

    useEffect(() => {
        // 1. Text Slide Up
        textTranslateY.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.exp) });
        textOpacity.value = withTiming(1, { duration: 800 });

        // 2. Box Expands Width
        boxWidth.value = withDelay(800, withTiming(80, { duration: 800, easing: Easing.inOut(Easing.quad) }));

        // Image fades in and scales up smoothly
        imageOpacity.value = withDelay(1000, withTiming(1, { duration: 600 }));
        imageScale.value = withDelay(1000, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));

        // Image container grows with box
        imageContainerWidth.value = withDelay(800, withTiming(80, { duration: 800 }));

        // 3. Text Separates - move BOTH texts outward from center
        leftTextTranslateX.value = withDelay(800, withTiming(-50, { duration: 800 }));
        rightTextTranslateX.value = withDelay(800, withTiming(50, { duration: 800 }));

        // 4. Box Fills Screen
        boxWidth.value = withDelay(2000, withTiming(SCREEN_WIDTH * 2, { duration: 800, easing: Easing.inOut(Easing.exp) }));
        boxHeight.value = withDelay(2000, withTiming(SCREEN_HEIGHT, { duration: 800, easing: Easing.inOut(Easing.exp) }));

        // Scale image to fill screen
        imageContainerWidth.value = withDelay(2000, withTiming(SCREEN_WIDTH * 0.6, { duration: 800 }));
        imageContainerHeight.value = withDelay(2000, withTiming(SCREEN_HEIGHT * 0.6, { duration: 800 }));
        imageScale.value = withDelay(2000, withTiming(1.2, { duration: 800 }));

        // Fade out text as box expands
        textOpacity.value = withDelay(2200, withTiming(0, { duration: 600 }));

        // 5. Finish
        const timeout = setTimeout(() => {
            if (onFinish) runOnJS(onFinish)();
        }, 3200);

        return () => clearTimeout(timeout);
    }, []);

    const leftTextStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: textTranslateY.value },
            { translateX: leftTextTranslateX.value }
        ],
        opacity: textOpacity.value,
    }));

    const rightTextStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: textTranslateY.value },
            { translateX: rightTextTranslateX.value }
        ],
        opacity: textOpacity.value,
    }));

    const boxStyle = useAnimatedStyle(() => ({
        width: boxWidth.value,
        height: boxHeight.value,
        opacity: 1,
    }));

    const imageContainerStyle = useAnimatedStyle(() => ({
        width: imageContainerWidth.value,
        height: imageContainerHeight.value,
        opacity: imageOpacity.value,
        transform: [{ scale: imageScale.value }],
    }));

    return (
        <View style={styles.container}>
            <View style={styles.centeredRow}>
                <View style={styles.overflowHidden}>
                    <Animated.Text style={[styles.title, leftTextStyle]}>SOTER</Animated.Text>
                </View>

                {/* The Growing Box */}
                <Animated.View style={[styles.growingBox, boxStyle]}>
                    <Animated.View style={[styles.imageContainer, imageContainerStyle]}>
                        <Image
                            source={require('@/assets/images/SoterCare-Primary-logo.png')}
                            style={styles.boxImage}
                            resizeMode="contain"
                        />
                    </Animated.View>
                </Animated.View>

                <View style={styles.overflowHidden}>
                    <Animated.Text style={[styles.title, rightTextStyle]}>CARE</Animated.Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f4f4',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    centeredRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        width: SCREEN_WIDTH,
    },
    overflowHidden: {
        overflow: 'hidden',
        height: 70,
        justifyContent: 'flex-end',
    },
    title: {
        fontSize: 48,
        fontWeight: '500',
        color: '#201d1d',
        letterSpacing: 2,
    },
    growingBox: {
        height: 60,
        backgroundColor: 'transparent',
        overflow: 'hidden',
        marginHorizontal: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    imageContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    boxImage: {
        width: '100%',
        height: '100%',
    }
});