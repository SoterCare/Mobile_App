import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Colors, Radius } from '@/theme/tokens';
import { Shadows } from '@/theme/shadows';
import { NurseAvatar } from './NurseAvatar';

/** Three dots bouncing in sequence — shown while the HTTP reply is in flight. */
export function TypingIndicator() {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const make = (v: Animated.Value, delay: number) =>
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 300, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        Animated.delay(600 - delay),
      ]);
    const loop = Animated.loop(
      Animated.parallel(dots.map((v, i) => make(v, i * 150)))
    );
    loop.start();
    return () => loop.stop();
  }, [dots]);

  return (
    <View style={styles.row}>
      <NurseAvatar />
      <View style={[styles.bubble, Shadows.card]}>
        {dots.map((v, i) => {
          const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
          const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
          return <Animated.View key={i} style={[styles.dot, { opacity, transform: [{ translateY }] }]} />;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 14,
    gap: 8,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.cardBg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopLeftRadius: Radius.xs,
    borderTopRightRadius: Radius.lg,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.textMuted,
  },
});
