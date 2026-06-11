import { ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from '@/theme/tokens';
import { Shadows } from '@/theme/shadows';

/**
 * Standard content card. Full width within the screen's padding —
 * never width:'1xx%' or negative margins to bleed past the edge.
 */
export const cardStyle: ViewStyle = {
  backgroundColor: Colors.cardBg,
  borderRadius: Radius.lg,
  padding: Spacing.lg,
  ...Shadows.card,
};
