import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { DeviceStatusHeader } from '@/components/dashboard/DeviceStatusHeader';
import { VitalsGrid } from '@/components/dashboard/VitalsGrid';
import { RecentAlerts } from '@/components/dashboard/RecentAlerts';
import { SCREEN_PADDING } from '@/theme/tokens';
import { useSwipeTabs } from '@/hooks/useSwipeTabs';
import { DottedBackground } from '@/components/ui/DottedBackground';

export default function HomeScreen() {
  const swipeHandlers = useSwipeTabs();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']} {...(swipeHandlers as any)}>
      <DottedBackground />
      <StatusBar style="dark" />

      <View style={styles.body}>
        <DeviceStatusHeader />
        <VitalsGrid />
        <View style={styles.alertsWrapper}>
          <RecentAlerts />
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  body: {
    flex: 1,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: SCREEN_PADDING,
    paddingBottom: 20,
  },
  alertsWrapper: {
    flex: 1,
  },
});
