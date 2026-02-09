/**
 * Shadow styles for the Vitals Statistics screen
 * Provides consistent shadow styling across iOS and Android
 */

import { Platform, ViewStyle } from 'react-native';
import { TimelineColors } from './colors';

export const Shadows = {
  // Soft card shadow (for main chart card, stat cards)
  card: {
    shadowColor: TimelineColors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  } as ViewStyle,

  // Subtle button shadow (for pill buttons)
  button: {
    shadowColor: TimelineColors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,

  // Soft shadow for segmented controls
  segment: {
    shadowColor: TimelineColors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  } as ViewStyle,

  // Stronger shadow for active/selected items
  active: {
    shadowColor: TimelineColors.primaryCyan,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  } as ViewStyle,

  // Timeline card shadow
  timelineCard: {
    shadowColor: TimelineColors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,
};

/**
 * Helper to apply platform-specific shadows
 */
export const applyShadow = (shadowStyle: ViewStyle): ViewStyle => {
  if (Platform.OS === 'android') {
    return {
      elevation: shadowStyle.elevation || 2,
    };
  }
  return {
    shadowColor: shadowStyle.shadowColor,
    shadowOffset: shadowStyle.shadowOffset,
    shadowOpacity: shadowStyle.shadowOpacity,
    shadowRadius: shadowStyle.shadowRadius,
  };
};

export default Shadows;
