import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { reportError } from '@/services/crashReportService';
import { CustomSplashScreen } from '@/components/ui/CustomSplashScreen';
import { initDatabase } from '@/database/db';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

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
    const isRoot = segments.length === 0;

    if (!isAuthenticated && !inAuthGroup) {
      // Not authenticated and not in auth group -> redirect to welcome
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && (inAuthGroup || isRoot)) {
      // Authenticated but trying to access auth screens or root -> redirect to tabs
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isLoading, router]);

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
      {(isLoading || !isSplashAnimationFinished) && (
        <CustomSplashScreen onFinish={() => setIsSplashAnimationFinished(true)} />
      )}
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
