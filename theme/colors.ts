/**
 * Color palette for the Vitals Statistics screen
 * Matches the reference screenshots
 */

import { Colors as Tokens } from './tokens';

export const TimelineColors = {
  // Background colors
  background: '#F6F6F6',
  cardBackground: '#FFFFFF',

  // Primary cyan/teal color for active states (reconciled to the brand token)
  primaryCyan: Tokens.brand,
  primaryCyanLight: Tokens.brand,
  primaryCyanDark: Tokens.brandDark,

  // Chart line and gradient
  chartLineRed: '#F05A5A',
  chartGradientStart: 'rgba(240, 90, 90, 0.25)',
  chartGradientEnd: 'rgba(240, 90, 90, 0)',

  // Text colors
  textDark: '#333333',
  textMedium: '#666666',
  textLight: '#999999',
  textWhite: '#FFFFFF',

  // Activity card colors
  movementTeal: '#5DC8C8',
  movementTealBg: '#E8F8F8',
  fallRed: '#F05A5A',
  fallRedBg: '#FFEBEB',
  urineBlue: '#5A9CF0',
  urineBlueBg: '#EBF3FF',

  // Misc
  borderLight: '#E5E5E5',
  shadowColor: '#000000',
  iconGray: '#8A8A8A',
};

export default TimelineColors;
