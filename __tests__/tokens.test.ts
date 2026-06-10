import { describe, it, expect } from '@jest/globals';
import { Colors, Radius, Spacing, SCREEN_PADDING, Type, circle } from '@/theme/tokens';

describe('design tokens', () => {
  it('exposes the canonical brand cyan and screen background', () => {
    expect(Colors.brand).toBe('#91D7E4');
    expect(Colors.screenBg).toBe('#F2F3F7');
  });

  it('radius scale has exactly the 6 tokens', () => {
    expect(Object.keys(Radius).sort()).toEqual(['lg', 'md', 'pill', 'sm', 'xl', 'xs']);
    expect(Radius.pill).toBe(999);
  });

  it('circle() returns half the size', () => {
    expect(circle(46)).toBe(23);
  });

  it('screenTitle is one consistent style', () => {
    expect(Type.screenTitle.fontSize).toBe(22);
    expect(Type.screenTitle.fontWeight).toBe('700');
    expect(SCREEN_PADDING).toBe(20);
    expect(Spacing.lg).toBe(16);
  });
});
