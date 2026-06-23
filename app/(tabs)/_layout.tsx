import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/theme/tokens';
import { DottedBackground } from '@/components/ui/DottedBackground';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <DottedBackground />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.brand,
          tabBarInactiveTintColor: '#999',
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: '#fafafa',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            height: 60 + insets.bottom,
            paddingTop: 10,
            paddingBottom: insets.bottom,
          },
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
            title: 'Ask Aria',
            tabBarIcon: ({ color }: { color: string }) => <Ionicons size={24} name="chatbubble-ellipses" color={color} />,
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fafafa' },
});
