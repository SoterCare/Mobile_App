import { Stack } from 'expo-router';
import React from 'react';

export default function TimelineLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F6F6F6' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="recycle-bin" />
    </Stack>
  );
}
