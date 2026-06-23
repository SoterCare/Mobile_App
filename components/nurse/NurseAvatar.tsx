import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, circle } from '@/theme/tokens';

/** Small "A" avatar shown beside nurse (Aria) bubbles. */
export function NurseAvatar({ size = 28 }: { size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: circle(size) }]}>
      <Text style={[styles.text, { fontSize: size * 0.5 }]}>A</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: '#FFFFFF', fontWeight: '700' },
});
