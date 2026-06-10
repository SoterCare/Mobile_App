import React from 'react';
import { StyleSheet, View, Image, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { DeviceStatusHeader } from '@/components/dashboard/DeviceStatusHeader';
import { VitalsGrid } from '@/components/dashboard/VitalsGrid';
import { RecentAlerts } from '@/components/dashboard/RecentAlerts';
import { Colors, SCREEN_PADDING, Spacing } from '@/theme/tokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* Fixed Background Image */}
      <View style={styles.backgroundContainer}>
        <Image
          source={require('@/assets/images/man.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      </View>

      {/* Scrollable content so the vitals grid and alerts never overlap */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DeviceStatusHeader />
        <VitalsGrid />
        <RecentAlerts />
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.screenBg,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    opacity: 0.8,
  },
  backgroundImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    transform: [{ scale: 1 }],
    marginTop: -40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SCREEN_PADDING,
    paddingBottom: Spacing.xxl,
  },
});