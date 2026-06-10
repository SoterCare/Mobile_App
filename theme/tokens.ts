/**
 * Design tokens — the single source of truth for the SoterCare UI.
 *
 * Colors, radii, spacing, and the screen-title style live here so screens
 * reference one value instead of copy-pasting hex codes and magic numbers.
 * Layout rule: alignment comes from SCREEN_PADDING + flexbox — never from
 * negative margins or width:'1xx%'.
 */
import type { TextStyle } from 'react-native';

export const Colors = {
  // Brand (canonical — replaces #91D7E4 and its drift variants app-wide)
  brand: '#91D7E4', // primary cyan
  brandDark: '#6BC4DB', // pressed / active shadow
  brandTint: '#E0F2FB', // light fills behind icons / active chips
  brandSurface: '#F0FBFC', // selected card background

  // Neutrals / surfaces
  screenBg: '#F2F3F7', // ONE canonical screen background (tab bar + Home already use this)
  cardBg: '#FFFFFF',
  border: '#EEF1F5',

  // Text
  textPrimary: '#333333',
  textSecondary: '#888888',
  textMuted: '#AAAAAA',

  // Status (replaces #ff2121 / #EF4444 / #FF6B6B / #2ee134 …)
  success: '#27C93F',
  danger: '#EF4444',
  warning: '#FFAB66',
};

export const Radius = {
  xs: 8, // small chips, inner inputs
  sm: 12, // inputs, list rows, small cards
  md: 16, // standard secondary cards / headers
  lg: 20, // primary content cards
  xl: 24, // hero cards (summary, profile, plan)
  pill: 999, // toggles, pill buttons, segmented controls
};

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

/** Canonical horizontal padding for every screen's content. */
export const SCREEN_PADDING = 20;

/** Icon circles must be true circles: borderRadius = circle(size). */
export const circle = (size: number) => size / 2;

export const Type: { screenTitle: TextStyle } = {
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
};
