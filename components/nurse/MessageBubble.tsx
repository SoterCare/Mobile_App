import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius } from '@/theme/tokens';
import { Shadows } from '@/theme/shadows';
import { NurseAvatar } from './NurseAvatar';
import { ChatMessage } from './chatTypes';

const TYPE_MS = 18; // per-character reveal speed

export function MessageBubble({
  message,
  onReveal,
}: {
  message: ChatMessage;
  onReveal?: () => void;
}) {
  const isNurse = message.role === 'nurse';
  const enter = useRef(new Animated.Value(0)).current;
  const cursor = useRef(new Animated.Value(1)).current;
  const [shown, setShown] = useState(message.typewriter ? '' : message.text);
  const [typing, setTyping] = useState(!!message.typewriter);

  // Entrance: slide in (nurse from left, user from right) + fade.
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  // Typewriter reveal (nurse only) — runs once on mount.
  useEffect(() => {
    if (!message.typewriter) return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(message.text.slice(0, i));
      onReveal?.();
      if (i >= message.text.length) {
        clearInterval(id);
        setTyping(false);
      }
    }, TYPE_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Blinking cursor while the typewriter is running.
  useEffect(() => {
    if (!typing) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(cursor, { toValue: 0, duration: 400, useNativeDriver: false }),
        Animated.timing(cursor, { toValue: 1, duration: 400, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [typing, cursor]);

  const translateX = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [isNurse ? -20 : 20, 0],
  });

  return (
    <Animated.View
      style={[
        styles.row,
        isNurse ? styles.rowNurse : styles.rowUser,
        { opacity: enter, transform: [{ translateX }] },
      ]}
    >
      {isNurse && <NurseAvatar />}
      <View
        style={[
          styles.bubble,
          isNurse ? [styles.bubbleNurse, Shadows.card] : styles.bubbleUser,
        ]}
      >
        <Text style={[styles.text, isNurse ? styles.textNurse : styles.textUser]}>
          {isNurse ? shown : message.text}
          {typing && <Animated.Text style={[styles.cursor, { opacity: cursor }]}>|</Animated.Text>}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 14,
    gap: 8,
    maxWidth: '100%',
  },
  rowNurse: { justifyContent: 'flex-start' },
  rowUser: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  bubbleNurse: {
    backgroundColor: Colors.cardBg,
    borderTopLeftRadius: Radius.xs,
    borderTopRightRadius: Radius.lg,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
  },
  bubbleUser: {
    backgroundColor: Colors.brand,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.xs,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
  },
  text: { fontSize: 15, lineHeight: 22 },
  textNurse: { color: Colors.textPrimary },
  textUser: { color: '#FFFFFF' },
  cursor: { color: Colors.textSecondary, fontWeight: '700' },
});
