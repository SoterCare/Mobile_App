import React from 'react';
import { StyleSheet, ScrollView, View, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Components
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
          source={require('@/assets/images/patient-bed-3d.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      </View>

      <ScrollView 
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
    backgroundColor: '#f2f3f7',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    opacity: 0.15, // Subtle background effect
  },
  backgroundImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
});