import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/theme/tokens';
import { Shadows } from '@/theme/shadows';

interface Props {
  visible: boolean;
  message: string;
  onHide: () => void;
  durationMs?: number;
}

/** Bottom snackbar that slides up, holds, then auto-hides. */
export function Snackbar({ visible, message, onHide, durationMs = 2800 }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 240, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => onHide());
    }, durationMs);
    return () => clearTimeout(t);
  }, [visible, anim, durationMs, onHide]);

  if (!visible) return null;

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] });

  return (
    <Animated.View style={[styles.bar, Shadows.card, { opacity: anim, transform: [{ translateY }] }]}>
      <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 90,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  text: { flex: 1, fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
});
