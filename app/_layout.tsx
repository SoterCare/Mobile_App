import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { reportError } from '@/services/crashReportService';

export const unstable_settings = {
  anchor: '(tabs)',
};

import { CustomSplashScreen } from '@/components/ui/CustomSplashScreen';
import { useState } from 'react';

// ... (previous imports)

import { initDatabase } from '@/database/db';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isSplashAnimationFinished, setIsSplashAnimationFinished] = useState(false);

  useEffect(() => {
    // Initialize Database
    initDatabase();
  }, []);

  useEffect(() => {
    // Only trigger routing logic if BOTH data loading AND animation are done
    // Or, allow routing behind the scenes, but cover with splash.

    // Optimization: Let the router work, splash covers it.
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isLoading, router]);

  // Combined Loading State
  // We show SplashScreen if:
  // 1. Data is Loading (isLoading = true)
  // OR
  // 2. Animation hasn't finished (isSplashAnimationFinished = false)

  if (isLoading || !isSplashAnimationFinished) {
    // If data is loaded but animation isn't done, we still show the Splash.
    // We pass onFinish to update state.
    // NOTE: We wrap this to ensure it sits ON TOP of everything if we mount the rest of the app underneath?
    // Actually, standard practice: Return Splash.
    return (
      <CustomSplashScreen onFinish={() => setIsSplashAnimationFinished(true)} />
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="subscription" options={{ headerShown: false }} />
        <Stack.Screen name="settings/payment" options={{ headerShown: false }} />
        <Stack.Screen name="settings/temperature" options={{ headerShown: false }} />
        <Stack.Screen name="settings/language" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const ErrorUtilsAny = (globalThis as any).ErrorUtils;
    if (ErrorUtilsAny?.getGlobalHandler && ErrorUtilsAny?.setGlobalHandler) {
      const prev = ErrorUtilsAny.getGlobalHandler();
      ErrorUtilsAny.setGlobalHandler((err: any, isFatal?: boolean) => {
        reportError(err, { isFatal });
        if (typeof prev === 'function') prev(err, isFatal);
      });
    }
  }, []);

  return (
    <AuthProvider>
      <ErrorBoundary>
        <RootLayoutNav />
      </ErrorBoundary>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 246,
    height: 96,
    resizeMode: 'contain',
  },
});
