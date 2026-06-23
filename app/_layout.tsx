import { useEffect, useState } from 'react';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { VitalsProvider } from '@/contexts/VitalsContext';
import { RaspberryPiProvider } from '@/contexts/RaspberryPiContext';
import { reportError } from '@/services/crashReportService';
import { CustomSplashScreen } from '@/components/ui/CustomSplashScreen';

const APP_BG = '#fafafa';

const AppTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: APP_BG },
};

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isSplashAnimationFinished, setIsSplashAnimationFinished] = useState(false);

  useEffect(() => {}, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    const isRoot = (segments as string[]).length === 0;
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && (inAuthGroup || isRoot)) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isLoading, router]);

  return (
    <ThemeProvider value={AppTheme}>
      <Stack screenOptions={{ contentStyle: { backgroundColor: APP_BG } }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="subscription" />
        <Stack.Screen name="export-report" />
        <Stack.Screen name="settings/payment" />
        <Stack.Screen name="settings/temperature" />
        <Stack.Screen name="settings/language" />
        <Stack.Screen name="settings/about" />
        <Stack.Screen name="settings/help" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="dark" />
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
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: APP_BG }}>
      <AuthProvider>
        <VitalsProvider>
          <RaspberryPiProvider>
            <RootLayoutNav />
          </RaspberryPiProvider>
        </VitalsProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
