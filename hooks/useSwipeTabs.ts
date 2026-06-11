import { useRouter, usePathname } from 'expo-router';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

const TAB_HREFS = [
  '/(tabs)',
  '/(tabs)/timeline',
  '/(tabs)/ai-summary',
  '/(tabs)/device',
  '/(tabs)/profile',
];

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
  const tabIndex = pathnameToTabIndex(pathname);

  const goToTab = (href: string) => {
    router.navigate(href as any);
  };

  return Gesture.Pan()
    .activeOffsetX([-30, 30])
    .failOffsetY([-20, 20])
    .onEnd((event) => {
      'worklet';
      if (tabIndex < 0) return;
      const swipeLeft = event.translationX < -60 && event.velocityX < -200;
      const swipeRight = event.translationX > 60 && event.velocityX > 200;
      const hrefs = [
        '/(tabs)',
        '/(tabs)/timeline',
        '/(tabs)/ai-summary',
        '/(tabs)/device',
        '/(tabs)/profile',
      ];
      if (swipeLeft && tabIndex < hrefs.length - 1) {
        runOnJS(goToTab)(hrefs[tabIndex + 1]);
      } else if (swipeRight && tabIndex > 0) {
        runOnJS(goToTab)(hrefs[tabIndex - 1]);
      }
    });
}
