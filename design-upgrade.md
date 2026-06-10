# SoterCare UI Design Upgrade — Alignment, Sizing & Consistency

> **Date:** 2026-06-10
> **Scope:** The UI is visually good. This document is **not a redesign**. It fixes three classes of problems only: **(1) alignment hacks, (2) inconsistent sizing, (3) drift from the established design language** (cyan `#91D7E4` + soft-shadow cards). No new screens, no new look, no logo/animation work.
> **Approach (approved):** Introduce a single source of truth — **design tokens + a standard screen/card scaffold** — then refactor screens to adopt them. This both fixes the current issues and stops the drift from coming back.

---

## 1. Root Cause

Every screen hardcodes its own colors, radii, paddings, and title styles, and there is **no shared token layer or layout scaffold**. The result:

| Symptom | Evidence (codebase-wide) |
|---------|--------------------------|
| Layout done with "nudge hacks" | ~27 negative-margin / `width > 100%` instances across ~18 files |
| No radius scale | **~32 distinct `borderRadius` values** in use (2 → 999) |
| Brand color copy-pasted | cyan hardcoded **118× across 34 files**, with 6 drift variants |
| Backgrounds inconsistent | 4 near-identical greys (`#f2f3f7 / #F6F6F6 / #F7F7F7 / #f8f9fc`) |
| Shadows duplicated | `theme/shadows.ts` exists but most screens re-inline their own |
| Dead color source | `constants/theme.ts` still Expo boilerplate (`tint: #0a7ea4`) |

The fix is to define the values **once** and have screens reference them, plus a rule that **layout uses container padding, never negative margins or `width: '1xx%'`.**

---

## 2. Design Tokens (the single source of truth)

Create `theme/tokens.ts` and re-export from `theme/index.ts`. Reconcile `theme/colors.ts`, `theme/shadows.ts`, and the dead `constants/theme.ts` into this one place.

### 2.1 Color tokens

```ts
export const Colors = {
  // Brand (canonical — replaces #91D7E4 ×118 and all drift variants)
  brand:        '#91D7E4',   // primary cyan (the dominant, canonical value)
  brandDark:    '#6BC4DB',   // pressed / active-shadow
  brandTint:    '#E0F2FB',   // light fills behind icons / active chips
  brandSurface: '#F0FBFC',   // selected card background

  // Neutrals / surfaces
  screenBg:     '#F2F3F7',   // ONE canonical screen background (the tab bar + Home already use this; replaces the 4 greys)
  cardBg:       '#FFFFFF',
  border:       '#EEF1F5',

  // Text
  textPrimary:   '#333333',
  textSecondary: '#888888',
  textMuted:     '#AAAAAA',

  // Status (replaces #ff2121 / #EF4444 / #FF6B6B / #FF9D93 / #F05A5A / #2ee134 …)
  success: '#27C93F',
  danger:  '#EF4444',
  warning: '#FFAB66',
};
```

**Drift to collapse into `Colors.brand`:** `#84D3E8`, `#8FD3E8`, `#6BC4DB` (keep only as `brandDark`), `#42dfdf`, `#5DC8C8`, `#0a7ea4`.
Chart-specific colors in `TimelineColors` (e.g. `chartLineRed`, gradients) are **out of scope** — they're intentional data-viz colors, keep them, but re-point `primaryCyan` → `Colors.brand`.

### 2.2 Radius scale

Replace the ~32 ad-hoc values with **6 tokens**:

```ts
export const Radius = {
  xs:   8,    // small chips, inner inputs
  sm:   12,   // inputs, list rows, small cards
  md:   16,   // standard secondary cards / headers
  lg:   20,   // primary content cards
  xl:   24,   // hero cards (summary, profile, plan)
  pill: 999,  // toggles, pill buttons, segmented controls
};
// Icon circles: never hardcode — use circle(size) => size / 2
export const circle = (size: number) => size / 2;
```

**Mapping rules:**
- Cards → `lg` (20) for grid/list cards, `xl` (24) for hero cards. Pick one per role; don't mix 16/20/22/25 on the same screen.
- Buttons & pills → `pill` (or a single fixed `Radius.button = 28` if a full pill is too round). **Standardize all CTA buttons to one value** (currently 22/25/28/30).
- Icon circles → `circle(size)`. Fixes `gaitIconCircle` r27-on-46px (`VitalsGrid.tsx:113`) → must be `circle(46)=23` to match its twin `vitalIconCircle` (`VitalCard.tsx:80`).

### 2.3 Spacing scale

```ts
export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const SCREEN_PADDING = 20;   // canonical horizontal padding for ALL screens
```

Screens currently use 20 / 24 / 30. Standardize content padding to `SCREEN_PADDING` (20). Cards fill the padded width — **no `width: '102%'`, no `marginLeft: -4`.**

### 2.4 Typography — screen title

```ts
export const Type = {
  screenTitle: { fontSize: 22, fontWeight: '700' as const, color: Colors.textPrimary, marginBottom: Spacing.lg },
  // (extend with cardTitle, body, caption as adoption proceeds)
};
```

Replaces the title drift (fontSize 20/22/25/28 · weight 600/700/800/bold · color #333/#4A4A4A/#1e293b/#5a5858) **and** removes the `marginLeft: -2/-3` hacks.

### 2.5 Shadows

`theme/shadows.ts` already defines `Shadows.card/button/segment/active`. **Rule: never re-inline a shadow** — import the token. Audit every inline `shadowColor/shadowOpacity` block and replace with `Shadows.card` (or the right role).

---

## 3. Standard Scaffold

### 3.1 `<Screen>` wrapper (new — `components/ui/Screen.tsx`)
SafeAreaView + `Colors.screenBg` + optional ScrollView with `contentContainerStyle={{ padding: SCREEN_PADDING, paddingBottom: Spacing.xxxl }}`. Every tab/settings screen uses it, guaranteeing identical background and padding.

### 3.2 `<ScreenTitle>` (new)
Renders `Type.screenTitle`. Replaces every hand-rolled title `<Text>` and kills the negative-margin nudges.

### 3.3 Card convention
A `Card` style (or component) = `{ backgroundColor: Colors.cardBg, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadows.card }`. Cards are **full width within screen padding** — they must not exceed it.

### 3.4 The hard rule (lint-enforceable later)
> **No negative margins/padding and no `width`/`marginLeft` percentages are used to position content.** Alignment comes from the screen's single padding value and fl/flexbox. Optical back-button alignment is handled with `hitSlop` + real padding, not `marginLeft: -20`.

---

## 4. Fix Inventory

### 4.1 Alignment hacks → remove (use scaffold padding)

| File:line | Current | Fix |
|-----------|---------|-----|
| `components/profile/ProfileUserCard.tsx:51` | `paddingHorizontal: -1` (invalid) | delete; rely on screen padding |
| `components/profile/ProfileUserCard.tsx:64-65` | `width:'102%' marginLeft:-4` | full width, remove offset |
| `components/profile/ProfileSettingsCard.tsx:113-114` | `width:'102%' marginLeft:-4` | full width, remove offset |
| `components/profile/ProfileSupportCard.tsx:65-66` | `width:'102%' marginLeft:-4` | full width, remove offset |
| `app/subscription.tsx:171-172` | `width:'119%' marginLeft:-40` | use full-bleed via padding, not overflow |
| `app/subscription.tsx:158,165` | back/title `marginTop:20` | move to header layout |
| `app/(tabs)/ai-summary.tsx:317,321,323` | `marginLeft:-3`, `width:'101%'` | `<ScreenTitle>` + remove |
| `app/(tabs)/profile.tsx:68` | title `marginLeft:-2` | `<ScreenTitle>` |
| `components/dashboard/AlertCard.tsx:183-184` | `width:'98%' marginLeft:'0.9%'` | full width |
| `components/dashboard/AlertCard.tsx:218` | `marginTop:-10` row nudge | align via flex |
| `app/export-report.tsx` (×10) | `marginLeft/Right:-4` (744,796,813,856-7,880,953-4,965-6) | adopt `SCREEN_PADDING`, drop offsets |
| `app/(auth)/sign-up.tsx:179`, `sign-in.tsx:210` | back btn `marginLeft:-20/-15` | `hitSlop` + padding |
| `app/settings/payment-add.tsx:207` | `marginLeft:-4 marginTop:20` | header layout |
| `app/user/update.tsx:260`, `recycle-bin.tsx:284` | `marginLeft:-4` | header layout |
| `components/timeline/ActivityStatsCards.tsx:116`, `timeline/index.tsx:497` | `marginTop:-35/-10` | spacing token |

### 4.2 Sizing inconsistencies → snap to scale

| File:line | Current | Fix |
|-----------|---------|-----|
| `components/dashboard/VitalsGrid.tsx:113` | `gaitIconCircle borderRadius:27` (46px box) | `circle(46)` = 23 (match twin, real circle) |
| `components/dashboard/VitalsGrid.tsx:96` vs `VitalCard.tsx:63` | gait card r22 vs vital card r20 (siblings) | both `Radius.lg` (20) |
| Home stack: `DeviceStatusHeader` r16 · `VitalCard` r20 · `GaitCard` r22 · `AlertCard` r25 | mixed | header `Radius.md`, cards `Radius.lg` |
| `app/(tabs)/ai-summary.tsx` r16/24/8/24/20/18/16 | 6 radii on one screen | `Radius` tokens by role |
| `app/(auth)/welcome.tsx:77` (h56/r28) vs `sign-in.tsx:215` & `sign-up.tsx:203` (h50/r25) | auth buttons differ in one flow | one button height + `Radius` token |
| Screen titles (profile 22/700, ai-summary 20/bold, device 20/800, sign-in 25/bold, welcome 28) | size/weight drift | `Type.screenTitle` |
| Settings screens (`payment-*`, `about`, `help`, `language`, `temperature`) radii 2/6/10/11/13/44/62… | per-file ad-hoc | snap each to nearest `Radius` token |

### 4.3 Design-language drift → tokenize

| Issue | Where | Fix |
|-------|-------|-----|
| Cyan as 6 different hex values | 34 files, 118 hits | replace all with `Colors.brand` / `brandDark` |
| Screen background, 4 greys | index `#f2f3f7`, ai-summary `#F6F6F6`, profile `#F7F7F7`, device `#f8f9fc` | `Colors.screenBg` via `<Screen>` |
| Status red, 5 variants | DeviceStatusHeader `#ff2121`, device `#EF4444`, AlertCard `#FF6B6B/#FF9D93`, TimelineColors `#F05A5A` | `Colors.danger` (keep chart red as data-viz) |
| Shadows re-inlined | ai-summary (4×), VitalCard, GaitCard, DeviceStatusHeader, subscription, ProfileUserCard, welcome, sign-up … | import `Shadows.card` |
| Dead boilerplate color source | `constants/theme.ts` (`#0a7ea4`) | delete or replace with re-export of `theme/tokens` |
| Debug control in production UI | `app/(tabs)/ai-summary.tsx:179-189` "Force Stop Loading" red button | gate behind `__DEV__` or remove |

---

## 5. Phased Plan

**Phase 0 — Tokens (foundation).** Create `theme/tokens.ts` (Colors, Radius, Spacing, Type, circle), reconcile `theme/colors.ts` + `theme/shadows.ts`, neutralize `constants/theme.ts`. No screen changes yet. *Verify:* app builds, looks identical.

**Phase 1 — Scaffold.** Add `<Screen>` and `<ScreenTitle>`; define the shared `Card` style. *Verify:* render one screen through them.

**Phase 2 — High-traffic screens.** Migrate the 5 tabs + their components (Home/dashboard, Timeline, AI Summary, Device, Profile) to tokens + scaffold; remove every §4.1/§4.2 hack in them; fix the gait-circle bug. *Verify:* visual diff per screen — same look, aligned edges, consistent radii.

**Phase 3 — Auth, settings, subscription, export.** Same migration for `(auth)/*`, `settings/*`, `subscription.tsx`, `export-report.tsx`, `user/update.tsx`. This clears the bulk of the radius drift and the `marginLeft:-4` cluster.

**Phase 4 — Guardrail + cleanup.** Add an ESLint rule (or CI grep) that flags new negative margins, `width:'1xx%'`, raw cyan hex, and inline `shadowColor`. Remove the debug button. Remove now-dead boilerplate (`hello-wave`, `themed-text/view`, etc. — confirm unused first).

---

## 6. Acceptance Criteria

- [ ] One screen background color app-wide (`Colors.screenBg`).
- [ ] Zero negative margins/paddings and zero `width:'1xx%'` used for layout.
- [ ] All `borderRadius` values are `Radius.*` tokens (≤6 distinct values).
- [ ] No raw cyan hex literals remain; all reference `Colors.brand*`.
- [ ] No inline `shadowColor` blocks; all use `Shadows.*`.
- [ ] All screen titles render via `<ScreenTitle>` (one size/weight/color).
- [ ] Sibling cards/icon-circles on a screen share radius; icon circles are true circles.
- [ ] Each migrated screen is visually unchanged except for corrected alignment/radii.

---

## 7. Out of Scope (deliberately)
Logos/branding, app icon/splash assets, animations (splash duration, AnimatedCounter re-renders), data-viz chart colors, feature/behavior changes, and any new screens. This document only removes alignment hacks, normalizes sizing, and tokenizes the existing visual language.
