# SoterCare Mobile App — Developer Setup Guide

Complete guide to get the app running, make changes, and run tests. Covers Android emulator, physical device, and web.

---

## Prerequisites

Install these once on your machine.

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20 LTS | https://nodejs.org |
| npm | 10+ | bundled with Node |
| Git | any | https://git-scm.com |
| Android Studio | Ladybug+ | https://developer.android.com/studio |
| Java (JDK) | 17 | bundled with Android Studio |
| Expo CLI | latest | `npm install -g expo-cli` |
| EAS CLI | latest | `npm install -g eas-cli` |

**Windows only:** also install [Windows Terminal](https://aka.ms/terminal) — PowerShell 7+ is strongly recommended.

---

## 1. Clone and Install

```bash
git clone <repo-url>
cd Mobile_App
npm install
```

---

## 2. Environment Variables

```bash
# Copy the template
cp .env.example .env
```

Open `.env` and fill in:

```env
# Google OAuth — get from Google Cloud Console
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com

# Facebook OAuth — get from Facebook Developer Console
EXPO_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id
```

**Backend URL** is hardcoded in `api/config/api.config.ts`:
- Production: `https://unlikely-caryn-sotercare-873e6112.koyeb.app`
- WebSocket:  `wss://unlikely-caryn-sotercare-873e6112.koyeb.app/realtime`

To point at a local backend, edit `API_CONFIG.BASE_URL` in that file temporarily (don't commit it).

> `.env` is gitignored — never commit it.

---

## 3. Android Emulator Setup

### 3.1 — Configure Android Studio

1. Open **Android Studio → SDK Manager** (top-right gear icon)
2. **SDK Platforms** tab: install **Android 14 (API 34)** or **Android 15 (API 35)**
3. **SDK Tools** tab: ensure these are checked:
   - Android SDK Build-Tools
   - Android Emulator
   - Android SDK Platform-Tools
   - Intel x86 Emulator Accelerator (HAXM) — Windows/Intel only

### 3.2 — Create a Virtual Device

1. **Android Studio → Device Manager → Create Device**
2. Pick a phone (Pixel 8 recommended)
3. Select a system image: **API 34, x86_64, Google Play**
4. Name it (e.g. `Pixel_8_API34`) → Finish

### 3.3 — Set ANDROID_HOME environment variable (Windows)

```powershell
# Add to your PowerShell profile or set via System Properties → Environment Variables
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator"
```

Verify: `adb devices` should return a list (empty is fine).

---

## 4. Running the App

### Expo Go (fastest, no build needed)

1. Install **Expo Go** on your phone (iOS App Store / Google Play)
2. Start the dev server:

```bash
npm start
```

3. Scan the QR code shown in the terminal with your phone's camera (iOS) or the Expo Go app (Android)

> Some features (BLE, Apple Sign-In) won't work in Expo Go — use a dev build for those.

### Android Emulator

Start your emulator from Android Studio (Device Manager → ▶ Play), then:

```bash
npm run android
# or, with Expo tunnel if network is tricky:
npx expo start --tunnel
```

Press `a` in the terminal to open on the Android emulator.

### iOS Simulator (Mac only)

```bash
npm run ios
```

Press `i` in the terminal. Xcode + iOS Simulator must be installed.

### Web (browser preview)

```bash
npm run web
```

Opens at `http://localhost:8081`. Good for quick layout checks; native features won't work.

---

## 5. Dev Build (Full Native Features)

Use this when you need Bluetooth, background tasks, or native modules that Expo Go doesn't support.

```bash
# Android dev build (requires Android Studio + connected device/emulator)
npx expo run:android

# iOS dev build (Mac + Xcode required)
npx expo run:ios
```

This compiles the native shell locally. Subsequent JS changes are still hot-reloaded.

---

## 6. Project Structure

```
Mobile_App/
├── app/                    # Screens (expo-router file-based routing)
│   ├── (auth)/             # Sign-in, sign-up, OTP, welcome
│   ├── (tabs)/             # Home, Timeline, AI Summary, Device, Profile
│   ├── settings/           # About, help, language, temperature, payment
│   └── user/               # Profile update screen
├── components/             # Reusable UI components
│   ├── dashboard/          # VitalsGrid, AlertCard, DeviceStatusHeader, RecentAlerts
│   ├── ai-summary/         # GenerateButton, ToggleSwitch
│   ├── timeline/           # ActivityTimeline, SegmentedControl, ActivityStatsCards
│   ├── profile/            # ProfileHeader, ProfileUserCard, ProfileSettingsCard
│   └── ui/                 # Screen, ScreenTitle, cardStyle (shared scaffold)
├── theme/                  # Design tokens (colors, radius, spacing, shadows)
│   ├── tokens.ts           # Single source of truth — Colors, Radius, Spacing, Type
│   ├── colors.ts           # Extended palette (re-exports token values)
│   ├── shadows.ts          # Shadow presets
│   └── index.ts            # Barrel export
├── services/               # API service layer (authService, alertService, etc.)
├── api/
│   ├── client.ts           # Axios instance with interceptors
│   └── config/api.config.ts  # Base URL + all endpoints
├── hooks/                  # Custom React hooks
├── store/                  # Zustand global state
├── types/                  # TypeScript type definitions
├── constants/              # App-wide constants
├── __tests__/              # Jest unit tests
├── e2e/                    # Maestro end-to-end tests
├── .env.example            # Env variable template
└── app.json                # Expo config (bundle IDs, permissions, plugins)
```

---

## 7. Design System

All visual values live in `theme/tokens.ts`. **Never use raw hex codes or magic numbers** — always import from tokens.

```ts
import { Colors, Radius, Spacing, SCREEN_PADDING, circle } from '@/theme/tokens';

// Colors
Colors.brand       // #91D7E4  — primary cyan
Colors.screenBg    // #F2F3F7  — background grey
Colors.cardBg      // #FFFFFF
Colors.textPrimary // #333333
Colors.success     // #27C93F
Colors.danger      // #EF4444

// Radius
Radius.xs / sm / md / lg / xl / pill  // 8 / 12 / 16 / 20 / 24 / 999

// Spacing
Spacing.xs / sm / md / lg / xl / xxl  // 4 / 8 / 12 / 16 / 20 / 24

// Helpers
SCREEN_PADDING     // 20 — horizontal page padding
circle(size)       // size/2 — correct borderRadius for a circle
```

**Shared scaffold components:**

```tsx
import { Screen } from '@/components/ui/Screen';        // SafeAreaView + bg + padding
import { ScreenTitle } from '@/components/ui/ScreenTitle'; // canonical h1
import { cardStyle } from '@/components/ui/cardStyle';   // white card with shadow
```

---

## 8. Making Changes

### Editing a screen

Screen files are in `app/`. Each file maps directly to a route:
- `app/(tabs)/index.tsx` → Home tab
- `app/(auth)/sign-in.tsx` → `/sign-in` route
- `app/settings/about.tsx` → `/settings/about`

### Adding a new screen

1. Create `app/your-screen.tsx` — expo-router picks it up automatically
2. Wrap content in `<Screen>` for consistent bg + safe area
3. Use `<ScreenTitle>` for the page heading
4. Pull colors/radii from `theme/tokens.ts`

### Adding a new component

Create in `components/<category>/YourComponent.tsx`. Write a matching test in `__tests__/YourComponent.test.tsx` — see existing tests for the pattern.

### Calling the backend

Use the existing service layer in `services/`. Add new endpoints in `api/config/api.config.ts` first, then add methods to the relevant service file.

---

## 9. Tests

```bash
# Run all tests
npm test

# Watch mode (re-runs on save)
npm run test:watch

# With coverage report
npm run test:ci

# Type-check only (no emit)
npx tsc --noEmit
```

Tests live in `__tests__/`. The **design guardrails test** (`__tests__/designGuardrails.test.ts`) will fail if you:
- Use raw `#91D7E4` hex anywhere in `app/` or `components/`
- Add negative margins for layout purposes
- Use overflow widths like `width: '102%'`

Fix these by using tokens instead.

---

## 10. E2E Tests (Maestro)

Maestro tests are in `e2e/`. They run against a real device or emulator.

```bash
# Install Maestro CLI (once)
curl -Ls "https://get.maestro.mobile.dev" | bash

# Run a flow
maestro test e2e/welcome-screen.yaml

# Run all flows
npm run e2e
```

The app bundle ID is `com.sanjula.myapp` — make sure the running build matches.

---

## 11. Linting

```bash
npm run lint
```

Uses `eslint-config-expo`. Fix issues before committing — CI will catch them.

---

## 12. Building for Release (EAS)

```bash
# Log in to Expo account
eas login

# Android APK / AAB
eas build --platform android --profile preview

# iOS IPA (Mac + Apple Developer account required)
eas build --platform ios --profile preview

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

EAS project ID: `e2e1225d-98fc-4d56-bd6e-7c3658d77ab6`

---

## 13. Common Issues

### Metro bundler port conflict
```bash
npx expo start --port 8082
```

### `adb: no devices/emulators found`
- Check emulator is fully booted (home screen visible)
- Run `adb kill-server && adb start-server`

### "Unable to resolve module @/" alias errors
- Run `npm install` again
- Delete `.expo/` folder and restart: `rm -rf .expo && npm start`

### Blank white screen on Android
- Usually a JS error — check the Metro terminal for the red error
- Shake device → **Reload** to reset

### Realtime/WebSocket not connecting
- Backend on Koyeb may be sleeping (free tier cold start ~30s) — wait and retry
- Check `API_CONFIG.REALTIME_URL` in `api/config/api.config.ts`

### Google sign-in fails in Expo Go
- Expo Go uses a proxy redirect URI; ensure the **Web Client ID** (not Android/iOS) is in your `.env`

---

## 14. Key Contacts / Resources

| Resource | Link |
|----------|------|
| Backend API | `https://unlikely-caryn-sotercare-873e6112.koyeb.app` |
| Expo docs | https://docs.expo.dev |
| expo-router docs | https://expo.github.io/router |
| React Native docs | https://reactnative.dev |
| EAS Build | https://docs.expo.dev/build/introduction |
