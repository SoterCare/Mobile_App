import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, TouchableWithoutFeedback } from 'react-native';
import { Colors, Radius } from '@/theme/tokens';
import { Shadows } from '@/theme/shadows';

interface Props {
  chips: string[];
  onSend: (text: string) => void;
  disabled?: boolean;
}

function Chip({ label, index, onPress, disabled }: { label: string; index: number; onPress: () => void; disabled?: boolean }) {
  const enter = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 260,
      delay: index * 60,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  const handlePress = () => {
    if (disabled) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 90, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

  return (
    <TouchableWithoutFeedback onPress={handlePress} disabled={disabled}>
      <Animated.View
        style={[styles.chip, Shadows.segment, { opacity: enter, transform: [{ translateY }, { scale }] }]}
      >
        <Text style={styles.chipText}>{label}</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

export function QuickReplyChips({ chips, onSend, disabled }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.content}
      style={styles.scroll}
    >
      {chips.map((label, i) => (
        <Chip key={label} label={label} index={i} disabled={disabled} onPress={() => onSend(label)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  content: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  chip: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.pill,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
});
