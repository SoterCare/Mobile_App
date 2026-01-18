import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Components
import { DeviceStatusHeader } from '@/components/dashboard/DeviceStatusHeader';
import { VitalsGrid } from '@/components/dashboard/VitalsGrid';
import { PatientVisualization } from '@/components/dashboard/PatientVisualization';
import { RecentAlerts } from '@/components/dashboard/RecentAlerts';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <DeviceStatusHeader />

        <VitalsGrid />

        <PatientVisualization />

        <RecentAlerts />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f3f7', // Neumorphic Base
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
});
