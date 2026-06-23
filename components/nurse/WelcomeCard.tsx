import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius } from '@/theme/tokens';
import { Shadows } from '@/theme/shadows';
import { NurseAvatar } from './NurseAvatar';

interface Props {
  /** When true, plays the exit animation then calls onExited. */
  exiting?: boolean;
  onExited?: () => void;
}

export function WelcomeCard({ exiting, onExited }: Props) {
  const anim = useRef(new Animated.Value(0)).current; // 0 hidden, 1 shown
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  useEffect(() => {
    if (!exiting) return;
    Animated.parallel([
      Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.92, duration: 220, useNativeDriver: true }),
    ]).start(() => onExited?.());
  }, [exiting, anim, scale, onExited]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.View style={[styles.card, Shadows.card, { opacity: anim, transform: [{ translateY }, { scale }] }]}>
        <NurseAvatar size={72} />
        <Text style={styles.title}>Hi, I&apos;m Aria</Text>
        <Text style={styles.subtitle}>Your AI nurse. Ask me anything about the patient.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 12,
    maxWidth: 320,
  },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginTop: 4 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21 },
});
