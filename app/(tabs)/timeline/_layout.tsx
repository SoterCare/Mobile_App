import { Stack } from 'expo-router';
import React from 'react';

export default function TimelineLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#fafafa' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="recycle-bin" />
    </Stack>
  );
}
