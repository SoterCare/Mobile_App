import React from 'react';
import { StyleSheet, View, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { DeviceStatusHeader } from '@/components/dashboard/DeviceStatusHeader';
import { VitalsGrid } from '@/components/dashboard/VitalsGrid';
import { RecentAlerts } from '@/components/dashboard/RecentAlerts';

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

      {/* Top content */}
      <View style={styles.topContent}>
        <DeviceStatusHeader />
        <VitalsGrid />
      </View>

      {/* Alerts pinned to bottom */}
      <View style={styles.bottomContent}>
        <RecentAlerts />
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f3f7',
    padding: 20,
    paddingBottom: 10,
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
  topContent: {
    flex: 1,
  },
  bottomContent: {
    paddingBottom: 1,
  },
});