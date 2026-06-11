import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/theme/tokens';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.brand, // Cyan Theme Color
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarButton: HapticTab,

        tabBarStyle: {
          backgroundColor: '#f2f3f7', // Neumorphic Base
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          // Reserve space for the system navigation bar (edge-to-edge) so the
          // tab buttons sit above it and stay tappable on all devices.
          height: 60 + insets.bottom,
          paddingTop: 10,
          paddingBottom: insets.bottom,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }: { color: string }) => <Ionicons size={24} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: 'Timeline',
          tabBarIcon: ({ color }: { color: string }) => <Ionicons size={24} name="stats-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai-summary"
        options={{
          title: 'AI Summary',
          tabBarIcon: ({ color }: { color: string }) => <Ionicons size={24} name="bulb" color={color} />,
        }}
      />
      <Tabs.Screen
        name="device"
        options={{
          title: 'Device',
          tabBarIcon: ({ color }: { color: string }) => <Ionicons size={24} name="phone-portrait" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }: { color: string }) => <Ionicons size={24} name="person" color={color} />,
        }}
      />
    </Tabs>
  );
}
