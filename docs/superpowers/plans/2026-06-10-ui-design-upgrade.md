# UI Design Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate alignment hacks, normalize sizing, and tokenize the cyan/background/shadow drift across the SoterCare app by introducing a single source of truth (design tokens) + a standard screen/card scaffold, then migrating screens to them — without changing the visual look.

**Architecture:** Add `theme/tokens.ts` (Colors, Radius, Spacing, Type, `circle()`), reconcile the existing `theme/colors.ts` + `theme/shadows.ts` + dead `constants/theme.ts` into it, expose via `theme/index.ts`. Add `<Screen>` + `<ScreenTitle>` wrappers and a shared `Card` style. Migrate screens phase-by-phase, removing every negative-margin / `width:'1xx%'` hack and snapping radii/colors to tokens. A Jest guardrail test enforces the rules going forward.

**Tech Stack:** React Native 0.81 + Expo 54, TypeScript (strict), expo-router, Jest + jest-expo, ESLint (eslint-config-expo).

---

## File Structure

| File | Responsibility |
|------|----------------|
| `theme/tokens.ts` (create) | Single source of truth: `Colors`, `Radius`, `Spacing`, `SCREEN_PADDING`, `Type`, `circle()` |
| `theme/colors.ts` (modify) | Keep data-viz `TimelineColors`; re-point `primaryCyan*` to `Colors.brand*` |
| `theme/shadows.ts` (modify) | Unchanged values; ensure exported via index |
| `theme/index.ts` (modify) | Re-export everything from `tokens` |
| `constants/theme.ts` (modify) | Remove Expo boilerplate `Colors/Fonts`; re-export tokens (or delete if unused) |
| `components/ui/Screen.tsx` (create) | SafeAreaView + canonical bg + padded ScrollView |
| `components/ui/ScreenTitle.tsx` (create) | One screen-title style |
| `components/ui/cardStyle.ts` (create) | Shared `cardStyle` object (bg, radius, padding, shadow) |
| `__tests__/tokens.test.ts` (create) | Regression guard on token shape/values |
| `__tests__/designGuardrails.test.ts` (create) | Scans migrated files for banned patterns |
| Screens/components (modify) | Adopt tokens + scaffold, remove hacks (per design-upgrade.md §4) |

Reference for every concrete fix: **`design-upgrade.md` §4 (Fix Inventory)** — file:line → current → fix.

---

## PHASE 0 — Tokens (foundation)

### Task 1: Create the token module

**Files:**
- Create: `theme/tokens.ts`
- Test: `__tests__/tokens.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/tokens.test.ts
import { Colors, Radius, Spacing, SCREEN_PADDING, Type, circle } from '@/theme/tokens';

describe('design tokens', () => {
  it('exposes the canonical brand cyan', () => {
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/tokens.test.ts`
Expected: FAIL — cannot find module `@/theme/tokens`.

- [ ] **Step 3: Write the token module**

```ts
// theme/tokens.ts
import type { TextStyle } from 'react-native';

export const Colors = {
  brand:        '#91D7E4',
  brandDark:    '#6BC4DB',
  brandTint:    '#E0F2FB',
  brandSurface: '#F0FBFC',

  screenBg: '#F2F3F7',
  cardBg:   '#FFFFFF',
  border:   '#EEF1F5',

  textPrimary:   '#333333',
  textSecondary: '#888888',
  textMuted:     '#AAAAAA',

  success: '#27C93F',
  danger:  '#EF4444',
  warning: '#FFAB66',
};

export const Radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
};

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const SCREEN_PADDING = 20;

export const circle = (size: number) => size / 2;

export const Type: { screenTitle: TextStyle } = {
  screenTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.lg },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/tokens.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add theme/tokens.ts __tests__/tokens.test.ts
git commit -m "feat(theme): add design tokens (colors, radius, spacing, type)"
```

---

### Task 2: Reconcile colors.ts and the theme barrel

**Files:**
- Modify: `theme/colors.ts` (re-point cyan to tokens; keep chart colors)
- Modify: `theme/index.ts:1-2`

- [ ] **Step 1: Re-point the brand cyan in `theme/colors.ts`**

Change the three cyan entries to reference the tokens (import at top):

```ts
import { Colors as Tokens } from './tokens';
// ...inside TimelineColors:
  primaryCyan: Tokens.brand,       // was '#84D3E8'
  primaryCyanLight: Tokens.brand,  // was '#8FD3E8'
  primaryCyanDark: Tokens.brandDark, // was '#6BC4DB'
```

Leave `chartLineRed`, gradients, and activity-card colors untouched (intentional data-viz).

- [ ] **Step 2: Export tokens from the barrel — `theme/index.ts`**

```ts
export { TimelineColors } from './colors';
export { Shadows, applyShadow } from './shadows';
export { Colors, Radius, Spacing, SCREEN_PADDING, Type, circle } from './tokens';
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no new errors from these files.

- [ ] **Step 4: Commit**

```bash
git add theme/colors.ts theme/index.ts
git commit -m "refactor(theme): point TimelineColors cyan at brand token; export tokens"
```

---

### Task 3: Neutralize the dead boilerplate color source

**Files:**
- Modify: `constants/theme.ts`

- [ ] **Step 1: Confirm usage**

Run: `git grep -n "constants/theme" -- '*.ts' '*.tsx'`
Expected: list importers (likely `use-theme-color.ts`, themed-* components).

- [ ] **Step 2: Replace boilerplate palette with token-backed values**

Rewrite `Colors.light.tint` / `tabIconSelected` and `dark` equivalents to reference the brand token instead of `#0a7ea4`:

```ts
import { Colors as Tokens } from '@/theme/tokens';
const tintColorLight = Tokens.brand;   // was '#0a7ea4'
```

Keep `Fonts` as-is (used by themed text). Do not delete the file if anything imports it (avoids breaking `use-theme-color`).

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add constants/theme.ts
git commit -m "refactor(theme): retire Expo boilerplate tint, use brand token"
```

---

## PHASE 1 — Scaffold

### Task 4: `<Screen>` wrapper

**Files:**
- Create: `components/ui/Screen.tsx`
- Test: `__tests__/Screen.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/Screen.test.tsx
import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { Screen } from '@/components/ui/Screen';

it('renders children', () => {
  const { getByText } = render(<Screen><Text>hi</Text></Screen>);
  expect(getByText('hi')).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/Screen.test.tsx`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement**

```tsx
// components/ui/Screen.tsx
import React, { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors, SCREEN_PADDING, Spacing } from '@/theme/tokens';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  edges?: readonly Edge[];
  contentStyle?: ViewStyle;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  scroll = true,
  edges = ['top', 'left', 'right'],
  contentStyle,
}) => {
  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, contentStyle]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.content, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.container} edges={edges}>
      <StatusBar style="dark" />
      {body}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.screenBg },
  flex: { flex: 1 },
  content: { padding: SCREEN_PADDING, paddingBottom: Spacing.xxxl },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/Screen.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/ui/Screen.tsx __tests__/Screen.test.tsx
git commit -m "feat(ui): add Screen scaffold with canonical bg + padding"
```

---

### Task 5: `<ScreenTitle>` + shared card style

**Files:**
- Create: `components/ui/ScreenTitle.tsx`
- Create: `components/ui/cardStyle.ts`
- Test: `__tests__/ScreenTitle.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/ScreenTitle.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { ScreenTitle } from '@/components/ui/ScreenTitle';

it('renders the title text', () => {
  const { getByText } = render(<ScreenTitle>Profile</ScreenTitle>);
  expect(getByText('Profile')).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/ScreenTitle.test.tsx`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement both files**

```tsx
// components/ui/ScreenTitle.tsx
import React, { ReactNode } from 'react';
import { Text, TextStyle } from 'react-native';
import { Type } from '@/theme/tokens';

export const ScreenTitle: React.FC<{ children: ReactNode; style?: TextStyle }> = ({ children, style }) => (
  <Text style={[Type.screenTitle, style]}>{children}</Text>
);
```

```ts
// components/ui/cardStyle.ts
import { ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from '@/theme/tokens';
import { Shadows } from '@/theme/shadows';

// Standard content card. Full width within the screen's padding — never width:'1xx%'.
export const cardStyle: ViewStyle = {
  backgroundColor: Colors.cardBg,
  borderRadius: Radius.lg,
  padding: Spacing.lg,
  ...Shadows.card,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/ScreenTitle.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/ui/ScreenTitle.tsx components/ui/cardStyle.ts __tests__/ScreenTitle.test.tsx
git commit -m "feat(ui): add ScreenTitle + shared cardStyle"
```

---

## PHASE 2 — Migrate the 5 tabs + dashboard components

For EACH task below: import tokens/scaffold, replace the cited hacks (see `design-upgrade.md` §4), snap radii/colors to tokens, remove inline shadows in favor of `Shadows.card`. After each: `npx tsc --noEmit` clean, then commit.

### Task 6: Home dashboard

**Files:**
- Modify: `app/(tabs)/index.tsx`, `components/dashboard/VitalCard.tsx`, `components/dashboard/VitalsGrid.tsx`, `components/dashboard/DeviceStatusHeader.tsx`, `components/dashboard/AlertCard.tsx`, `components/dashboard/RecentAlerts.tsx`

- [ ] **Step 1: Fix the icon-circle bug + radius mismatch (highest-value)**

In `components/dashboard/VitalsGrid.tsx:113` change `borderRadius: 27` → `borderRadius: circle(46)` (import `circle`). Change `gaitCard` `borderRadius: 22` (line 96) → `Radius.lg`. In `VitalCard.tsx:63` confirm `Radius.lg` and `vitalIconCircle` (line 80) `circle(46)`.

- [ ] **Step 2: Tokenize colors + shadows in these files**

Replace every `#91D7E4`/`#e0f2fb`/`#dff1fd` with `Colors.brand`/`Colors.brandTint`; replace inline `shadowColor/shadowOffset/...` blocks with `...Shadows.card`. In `DeviceStatusHeader.tsx` set header `borderRadius: Radius.md`, devicePill `Colors.brand`, status colors `Colors.success`/`Colors.danger` (was `#2ee134`/`#ff2121`).

- [ ] **Step 3: Remove AlertCard alignment hacks**

`components/dashboard/AlertCard.tsx:183-184` remove `width:'98%'` + `marginLeft:'0.9%'`; `:218` remove `marginTop:-10` (align via flex). Card radius → `Radius.lg`; icon circle → `circle(52)`.

- [ ] **Step 4: Route the screen through `<Screen>`**

`app/(tabs)/index.tsx` — keep the background image layer, but use `Colors.screenBg` for the container and `SCREEN_PADDING` for content (already 20; just import the token).

- [ ] **Step 5: Verify + commit**

Run: `npx tsc --noEmit` (clean) and visually confirm Home looks unchanged.
```bash
git add app/(tabs)/index.tsx components/dashboard/
git commit -m "refactor(home): tokenize colors/radii/shadows, fix gait circle + alert alignment"
```

### Task 7: AI Summary screen

**Files:** Modify `app/(tabs)/ai-summary.tsx`, `components/ai-summary/*`

- [ ] **Step 1:** Replace title block with `<ScreenTitle>AI Summary</ScreenTitle>`; delete `marginLeft:-3` (`:317`) and `controlsRow` `width:'101%'` + `marginLeft:-3` (`:321-323`).
- [ ] **Step 2:** Snap radii (16/24/8/20/18/16) to tokens by role: cards `Radius.xl`, chips `Radius.lg`, pills `Radius.pill`. Replace `#91D7E4` → `Colors.brand`; reconcile `TimelineColors.primaryCyan` use (now already brand). Replace inline shadows with `Shadows.card`/`Shadows.button`.
- [ ] **Step 3:** Gate the debug button (`:179-189` "Force Stop Loading") behind `__DEV__` or remove.
- [ ] **Step 4:** Route through `<Screen>` (background already `TimelineColors.background` → use `Colors.screenBg`).
- [ ] **Step 5:** `npx tsc --noEmit` clean; commit `refactor(ai-summary): scaffold + tokens, remove nudges and debug button`.

### Task 8: Timeline (+ components)

**Files:** Modify `app/(tabs)/timeline/index.tsx`, `recycle-bin.tsx`, `components/timeline/*`

- [ ] **Step 1:** Remove `marginLeft:-4` (`recycle-bin.tsx:284`), `marginTop:-35` (`timeline/index.tsx:497`), `ActivityStatsCards.tsx:116` `marginTop:-10`.
- [ ] **Step 2:** Snap card radii (16/24) to `Radius.md`/`Radius.xl`; `SegmentedControl` keep `Radius.pill` (999). Tokenize cyan + reds; inline shadows → `Shadows.*`.
- [ ] **Step 3:** `npx tsc --noEmit`; commit `refactor(timeline): tokens + scaffold, remove nudges`.

### Task 9: Device screen

**Files:** Modify `app/(tabs)/device.tsx`

- [ ] **Step 1:** Header title via `<ScreenTitle>My Devices</ScreenTitle>`; container bg `Colors.screenBg` (was `#f8f9fc`).
- [ ] **Step 2:** Snap radii (12/14/16/20) to tokens; cyan → `Colors.brand`; status `#EF4444`/`#2ee134` → `Colors.danger`/`Colors.success`; inline shadows → `Shadows.card`.
- [ ] **Step 3:** `npx tsc --noEmit`; commit `refactor(device): tokens + title scaffold`.

### Task 10: Profile (+ cards)

**Files:** Modify `app/(tabs)/profile.tsx`, `components/profile/*`

- [ ] **Step 1: Remove the card-bleed hack in all three cards** — `ProfileUserCard.tsx:51` delete `paddingHorizontal:-1`; `:64-65` remove `width:'102%'`+`marginLeft:-4`. Same for `ProfileSettingsCard.tsx:113-114` and `ProfileSupportCard.tsx:65-66`. Cards become full width inside `<Screen>` padding.
- [ ] **Step 2:** `profile.tsx:68` title via `<ScreenTitle>Profile</ScreenTitle>` (drop `marginLeft:-2`); bg `Colors.screenBg` (was `#F7F7F7`).
- [ ] **Step 3:** Snap radii (24/32/12/8) to tokens; avatar circle `circle(64)`; cyan → `Colors.brand`; inline shadows → `Shadows.card`.
- [ ] **Step 4:** `npx tsc --noEmit`; commit `refactor(profile): remove card-bleed hacks, tokens + scaffold`.

---

## PHASE 3 — Auth, settings, subscription, export, user

### Task 11: Auth flow

**Files:** Modify `app/(auth)/welcome.tsx`, `sign-in.tsx`, `sign-up.tsx`, `otp-verification.tsx`

- [ ] **Step 1:** Standardize CTA button: one height (50) + `Radius.pill` (or fixed 28) across welcome/sign-in/sign-up (welcome currently h56/r28).
- [ ] **Step 2:** Replace back-button `marginLeft:-20/-15` (`sign-up.tsx:179`, `sign-in.tsx:210`) with `hitSlop={{top:8,bottom:8,left:8,right:8}}` + real padding.
- [ ] **Step 3:** Cyan → `Colors.brand`; snap radii to tokens.
- [ ] **Step 4:** `npx tsc --noEmit`; commit `refactor(auth): consistent buttons + token colors, drop margin nudges`.

### Task 12: Subscription

**Files:** Modify `app/subscription.tsx`

- [ ] **Step 1:** Remove `toggleContainer` `width:'119%'`+`marginLeft:-40` (`:171-172`) — achieve full-bleed with negative-free layout (container padding 0 + inner padding). Remove header `marginTop:20` (`:158,165`) — use header layout.
- [ ] **Step 2:** Snap radii (35/30/22) to `Radius.pill`/`Radius.xl`; cyan → `Colors.brand`.
- [ ] **Step 3:** `npx tsc --noEmit`; commit `refactor(subscription): remove overflow hack, tokens`.

### Task 13: Settings screens (batch)

**Files:** Modify `app/settings/payment.tsx`, `payment-add.tsx`, `payment-edit.tsx`, `payment-detail.tsx`, `payment-delete.tsx`, `payment-success.tsx`, `about.tsx`, `help.tsx`, `language.tsx`, `temperature.tsx`

- [ ] **Step 1:** For each: header back-button hacks (e.g. `payment-add.tsx:207` `marginLeft:-4 marginTop:20`) → header layout; bg → `Colors.screenBg`.
- [ ] **Step 2:** Snap the ad-hoc radii (2/6/10/11/13/44/62…) to nearest `Radius` token; cyan → `Colors.brand`; inline shadows → `Shadows.card`.
- [ ] **Step 3:** Do these one file per commit (10 commits) so visual diffs stay small. `npx tsc --noEmit` after each.
- [ ] **Step 4:** Commit pattern: `refactor(settings/<name>): tokens + scaffold`.

### Task 14: Export report + user update

**Files:** Modify `app/export-report.tsx`, `app/user/update.tsx`

- [ ] **Step 1:** Remove the 10 `marginLeft/Right:-4` fudges in `export-report.tsx` (744,796,813,856-7,880,953-4,965-6) — rely on `SCREEN_PADDING`. Remove `user/update.tsx:260` `marginLeft:-4`.
- [ ] **Step 2:** Snap radii to tokens; cyan + `#91D7E4` literals → `Colors.brand`; inline shadows → `Shadows.card`.
- [ ] **Step 3:** `npx tsc --noEmit`; commit `refactor(export+user): drop margin fudges, tokens`.

---

## PHASE 4 — Guardrail + cleanup

### Task 15: Guardrail test

**Files:**
- Create: `__tests__/designGuardrails.test.ts`

- [ ] **Step 1: Write the test that scans source for banned patterns**

```ts
// __tests__/designGuardrails.test.ts
import { readFileSync } from 'fs';
import { globSync } from 'glob';

const files = globSync('{app,components}/**/*.{ts,tsx}', { cwd: process.cwd() });

const read = (f: string) => readFileSync(f, 'utf8');

it('no raw brand-cyan hex literals remain (use Colors.brand)', () => {
  const offenders = files.filter((f) => /#91D7E4|#84D3E8|#8FD3E8/i.test(read(f)));
  expect(offenders).toEqual([]);
});

it('no negative margins/padding used for layout', () => {
  const offenders = files.filter((f) =>
    /(margin(Left|Right|Top|Bottom)?|padding(Horizontal|Left|Right)?):\s*-\d/.test(read(f))
  );
  expect(offenders).toEqual([]);
});

it('no width/marginLeft percentages over 100% used for layout', () => {
  const offenders = files.filter((f) => /(width|marginLeft):\s*'1[0-9][0-9]%'/.test(read(f)));
  expect(offenders).toEqual([]);
});
```

- [ ] **Step 2: Run it**

Run: `npm test -- __tests__/designGuardrails.test.ts`
Expected: PASS only after Phases 2–3 are complete. If any phase remains, the offender list shows exactly what's left — treat as the remaining worklist.

- [ ] **Step 3: Commit**

```bash
git add __tests__/designGuardrails.test.ts
git commit -m "test: add design-system guardrails (no raw cyan, no negative-margin layout)"
```

### Task 16: Remove dead boilerplate (confirm unused first)

**Files:** potentially delete `components/hello-wave.tsx`, `components/themed-text.tsx`, `components/themed-view.tsx`, `components/external-link.tsx`, `components/parallax-scroll-view.tsx`, `components/ui/collapsible.tsx`

- [ ] **Step 1:** For each, run `git grep -n "<name>"` excluding its own file and `app/modal.tsx`. Only delete if `app/modal.tsx` is the sole consumer AND modal is a demo screen (verify by reading it). If modal is real, leave them.
- [ ] **Step 2:** Run `npm test` + `npx tsc --noEmit` after deletions.
- [ ] **Step 3:** Commit `chore: remove unused Expo starter components`.

---

## Verification (whole-plan)

- [ ] `npm test` green (tokens, Screen, ScreenTitle, guardrails).
- [ ] `npx tsc --noEmit` clean.
- [ ] `npx expo start` — spot-check Home, Timeline, AI Summary, Device, Profile, Subscription, one settings screen: each looks the same but with aligned edges and consistent corner radii.
- [ ] design-upgrade.md §6 acceptance checklist all ticked.

## Notes for the executor
- **Do not change behavior or layout intent** — only the styling values and the way alignment is achieved.
- Commit per task (settings: per file). Keep diffs reviewable.
- **Commits must NOT include a Co-Authored-By trailer** (project preference).
- When a token doesn't cleanly fit an existing value, snap to the *nearest* token rather than inventing a new one.
