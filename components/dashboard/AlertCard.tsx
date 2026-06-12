import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { alertService } from '@/services/alertService';
import { Colors, Radius, circle } from '@/theme/tokens';
import { Shadows } from '@/theme/shadows';
import { relativeTime } from '@/utils/timestamp';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;

type AlertType = 'movement' | 'fall' | 'urine' | 'sos' | 'help_call' | 'moisture';

interface AlertCardProps {
    id: string;
    type: AlertType;
    title: string;
    /** Unix milliseconds */
    timestamp: number;
    onDismiss?: (id: string) => void;
}

const ALERT_CONFIG: Record<AlertType, { icon: keyof typeof Ionicons.glyphMap; iconColor: string; bgColor: string }> = {
    movement: { icon: 'walk', iconColor: '#ffffff', bgColor: '#42dfdf' },
    fall: { icon: 'warning', iconColor: '#ffffff', bgColor: '#FF9D93' },
    urine: { icon: 'water', iconColor: '#ffffff', bgColor: Colors.brand },
    sos: { icon: 'alert-circle', iconColor: '#ffffff', bgColor: '#FF6B6B' },
    help_call: { icon: 'call', iconColor: '#ffffff', bgColor: '#FFA94D' },
    moisture: { icon: 'water', iconColor: '#ffffff', bgColor: Colors.brand },
};

const DEFAULT_ALERT_CONFIG = ALERT_CONFIG.movement;

export const AlertCard: React.FC<AlertCardProps> = ({ id, type, title, timestamp, onDismiss }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [, forceUpdate] = useState(0);
    const config = ALERT_CONFIG[type] ?? DEFAULT_ALERT_CONFIG;
    const router = useRouter();

    const translateX = useSharedValue(0);
    const isBusy = useSharedValue(false);

    useEffect(() => {
        const interval = setInterval(() => forceUpdate((n: number) => n + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const attendAlert = async () => {
        try {
            if (id) await alertService.attendAlert(id);
            onDismiss?.(id);
            router.navigate('/(tabs)/timeline');
        } catch (error) {
            console.error('Failed to attend alert:', error);
            isBusy.value = false;
            setIsProcessing(false);
            translateX.value = withSpring(0);
        }
    };

    const showFalseAlarmDialog = () => {
        Alert.alert(
            'Mark as False Alarm?',
            'This alert will be moved to the Recycle Bin. You can restore it from there if needed.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'False Alarm',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsProcessing(true);
                            if (id) await alertService.falseAlarmAlert(id);
                            onDismiss?.(id);
                        } catch (error) {
                            console.error('Failed to mark false alarm:', error);
                            setIsProcessing(false);
                        }
                    },
                },
            ]
        );
    };

    const pan = Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-20, 20])
        .onUpdate((event) => {
            if (!isBusy.value) {
                translateX.value = event.translationX;
            }
        })
        .onEnd((event) => {
            if (isBusy.value) return;
            if (event.translationX > SWIPE_THRESHOLD) {
                isBusy.value = true;
                runOnJS(setIsProcessing)(true);
                translateX.value = withTiming(SCREEN_WIDTH * 1.2, { duration: 220 }, () => {
                    runOnJS(attendAlert)();
                });
            } else if (event.translationX < -SWIPE_THRESHOLD) {
                translateX.value = withSpring(0);
                runOnJS(showFalseAlarmDialog)();
            } else {
                translateX.value = withSpring(0);
            }
        });

    const cardStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    // Green layer fades in as card slides right
    const rightBgStyle = useAnimatedStyle(() => ({
        opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
    }));

    // Red layer fades in as card slides left
    const leftBgStyle = useAnimatedStyle(() => ({
        opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
    }));

    return (
        <View style={styles.container}>
            {/* Green reveal — right swipe (Attended) */}
            <Animated.View style={[styles.rightBg, rightBgStyle]}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.actionText}>Attended</Text>
            </Animated.View>

            {/* Red reveal — left swipe (False Alarm) */}
            <Animated.View style={[styles.leftBg, leftBgStyle]}>
                <Text style={styles.actionText}>False Alarm</Text>
                <Ionicons name="close-circle" size={20} color="#fff" />
            </Animated.View>

            {/* Swipeable card */}
            <GestureDetector gesture={pan}>
                <Animated.View style={[styles.alertCard, cardStyle]}>
                    <View style={styles.cardContent}>
                        <View style={[styles.alertIconCircle, { backgroundColor: config.bgColor }]}>
                            <Ionicons name={config.icon} size={26} color={config.iconColor} />
                        </View>
                        <View style={styles.rightArea}>
                            <View style={styles.titleRow}>
                                <Text style={styles.alertText} numberOfLines={1}>{title}</Text>
                                <View style={styles.timeRow}>
                                    <Text style={styles.alertTime}>{relativeTime(timestamp)}</Text>
                                    {isProcessing
                                        ? <ActivityIndicator size="small" color={Colors.brand} />
                                        : <Ionicons name="swap-horizontal" size={14} color={Colors.textMuted} />
                                    }
                                </View>
                            </View>
                        </View>
                    </View>
                </Animated.View>
            </GestureDetector>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
    },
    rightBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: Colors.success,
        borderRadius: Radius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 20,
        gap: 8,
        overflow: 'hidden',
    },
    leftBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: Colors.danger,
        borderRadius: Radius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingRight: 20,
        gap: 8,
        overflow: 'hidden',
    },
    actionText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    alertCard: {
        backgroundColor: Colors.cardBg,
        borderRadius: Radius.lg,
        paddingVertical: 15,
        paddingHorizontal: 16,
        ...Shadows.card,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    alertIconCircle: {
        width: 52,
        height: 52,
        borderRadius: circle(52),
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        flexShrink: 0,
    },
    rightArea: {
        flex: 1,
        justifyContent: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    alertText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    timeRow: {
        alignItems: 'flex-end',
        gap: 4,
        marginLeft: 8,
    },
    alertTime: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
});
