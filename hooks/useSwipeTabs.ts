import { useRef } from 'react';
import { PanResponder } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const TAB_HREFS = [
  '/(tabs)',
  '/(tabs)/timeline',
  '/(tabs)/ai-summary',
  '/(tabs)/device',
  '/(tabs)/profile',
] as const;

function pathnameToTabIndex(pathname: string): number {
  if (pathname === '/' || pathname === '') return 0;
  if (pathname.startsWith('/timeline')) return 1;
  if (pathname.startsWith('/ai-summary')) return 2;
  if (pathname.startsWith('/device')) return 3;
  if (pathname.startsWith('/profile')) return 4;
  return -1;
}

export function useSwipeTabs() {
  const router = useRouter();
  const pathname = usePathname();

  // Refs keep the panResponder callback current without re-creating it
  const tabIndexRef = useRef(pathnameToTabIndex(pathname));
  tabIndexRef.current = pathnameToTabIndex(pathname);

  const routerRef = useRef(router);
  routerRef.current = router;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      // Only claim gesture when horizontal movement is dominant — lets ScrollView keep vertical
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > 20 && Math.abs(dx) > Math.abs(dy) * 2.5,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderRelease: (_, { dx, vx }) => {
        const idx = tabIndexRef.current;
        if (idx < 0) return;
        if (dx < -60 && vx < -0.3 && idx < TAB_HREFS.length - 1) {
          routerRef.current.navigate(TAB_HREFS[idx + 1] as any);
        } else if (dx > 60 && vx > 0.3 && idx > 0) {
          routerRef.current.navigate(TAB_HREFS[idx - 1] as any);
        }
      },
      onPanResponderTerminationRequest: () => true,
    })
  ).current;

  return panResponder.panHandlers;
}
