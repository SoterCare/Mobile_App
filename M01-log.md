# M01-Log — SoterCare Mobile App: Complete Technical Reference

> **Generated:** 2026-06-10
> **Repo:** `SoterCare/Mobile_App` (branch `main`)
> **Scope:** Full repo analysis — architecture, APIs, endpoints, services, realtime, auth, device data contracts, configuration, and how to connect everything.

---

## 1. What This App Is

**SoterCare** is a **React Native + Expo** healthcare monitoring mobile app (TypeScript). It pairs with a **Raspberry Pi / ESP32 sensor band** ("SoterCare Band") that streams patient vitals (skin temperature, room/ambient temperature, moisture, accelerometer/gait, fall & SOS alerts). The app:

- Authenticates users via **email OTP** + **social login** (Google / Facebook / Apple).
- **Claims** physical devices by a `device_id` (typically scanned from a QR code).
- Shows a **live dashboard** of latest vitals, fed by a **Socket.IO realtime websocket**.
- Renders a **timeline** of historical vitals + activity events with charts.
- Generates **AI clinical summaries** of patient data.
- **Exports reports** (CSV / PDF, with optional AI clinical analysis) via device share sheet.
- Manages profile, subscription/payment, language, temperature units, help/FAQ, and a recycle bin for dismissed alerts.

> **Architecture note:** The mobile app is **read-only** against the backend for device data. It no longer uploads logs (see `syncService` §6.9). The Raspberry Pi pushes data to the backend directly; the app consumes it over REST + websocket.

---

## 2. Tech Stack & Key Dependencies

| Area | Library / Version |
|------|-------------------|
| Framework | `expo` ~54.0.31, `react-native` 0.81.5, `react` 19.1.0 |
| Routing | `expo-router` ~6.0.22 (file-based, typed routes enabled) |
| Navigation | `@react-navigation/native` 7, `@react-navigation/bottom-tabs` 7 |
| HTTP | `axios` ^1.13.1 |
| Realtime | `socket.io-client` ^4.8.3 |
| Storage | `@react-native-async-storage/async-storage` ^2.2.0 |
| Auth (social) | `expo-auth-session` ~7.0.10, `expo-apple-authentication` ~8.0.8, `expo-web-browser`, `expo-crypto` |
| JWT | `jwt-decode` ^4.0.0 |
| State | React Context (Auth/Vitals/RaspberryPi) + `zustand` ^5.0.12 + `@tanstack/react-query` ^5.91.2 |
| Charts | `react-native-svg` 15.12.1, `d3-shape` ^3.2.0 |
| Calendars | `react-native-calendars` ^1.1313.0 |
| Reports | `expo-print`, `expo-sharing`, `expo-file-system` |
| Compression | `pako` ^2.1.0, `buffer` ^6.0.3 |
| Animations | `react-native-reanimated` ~4.1.1, `react-native-worklets` 0.5.1, `expo-haptics` |
| Testing | `jest` ~29.7.0, `jest-expo`, `@testing-library/react-native`; E2E via **Maestro** |
| Lint | `eslint` ^9.25.0, `eslint-config-expo` |
| TypeScript | ~5.9.2, `strict: true`, path alias `@/* → ./*` |

**New Architecture (Fabric/TurboModules)** is enabled (`newArchEnabled: true`), and the **React Compiler** experiment is on (`experiments.reactCompiler: true`).

---

## 3. Backend Connection — The Single Source of Truth

All backend configuration lives in **`api/config/api.config.ts`**.

```ts
export const API_CONFIG = {
  BASE_URL:     'https://unlikely-caryn-sotercare-873e6112.koyeb.app',          // Production REST
  REALTIME_URL: 'wss://unlikely-caryn-sotercare-873e6112.koyeb.app/realtime',   // Socket.IO websocket
  TIMEOUT:      1000000,  // ms (~16.6 min — effectively no timeout)
  ENDPOINTS: { /* see §5 */ },
};
export const getApiUrl = () => API_CONFIG.BASE_URL;
```

- **Hosting:** Backend is deployed on **Koyeb** at `unlikely-caryn-sotercare-873e6112.koyeb.app`.
- To point the app at a different backend (e.g. local dev), **edit `BASE_URL` and `REALTIME_URL` directly** in this file. There is a commented-out `EXPO_PUBLIC_API_URL` in `.env.example` but it is **not currently wired** into the config — the URLs are hard-coded.
- The Python data-generator script (`scripts/generate_vitals.py`) targets `http://localhost:3000/logs/sync`, implying the backend runs on **port 3000** locally.

---

## 4. The HTTP Client (`api/client.ts`)

A single shared **Axios instance** (`apiClient`) with two interceptors:

**Request interceptor:**
1. Reads `accessToken` from AsyncStorage (key: `'accessToken'`) and sets `Authorization: Bearer <token>`.
2. For mutations (`POST/PUT/PATCH/DELETE`), adds a unique **`Idempotency-Key`** header generated via `expo-crypto`'s `randomUUID()`.
3. Default header: `Content-Type: application/json`.

**Response interceptor:**
- On **HTTP 401**: clears `accessToken` and `user` from AsyncStorage (forces re-login). Navigation/redirect is handled reactively by `AuthContext` + `RootLayoutNav`.
- All other errors are rejected to the caller.

**Exported from `api/index.ts`:** `apiClient` (default) and `API_CONFIG`.

---

## 5. Complete API Endpoint Catalogue

Base URL prefix: `https://unlikely-caryn-sotercare-873e6112.koyeb.app`

### 5.1 Auth — `/auth/*`
| Key | Method | Path | Body / Params | Used by |
|-----|--------|------|---------------|---------|
| `LOGIN` | POST | `/auth/login` | `{ email }` | `authService.sendLoginCode` |
| `LOGIN_VERIFY` | POST | `/auth/login-verify` | `{ email, otp }` → `{ accessToken, user }` | `authService.verifyLogin` |
| `REGISTER` | POST | `/auth/register` | `{ name, email }` | `authService.sendSignupCode` |
| `VERIFY_REGISTER` | POST | `/auth/verify` | `{ email, otp }` → `{ accessToken, user }` | `authService.verifyRegistration` |
| `LOGOUT` | — | `/auth/logout` | (defined, not actively called) | — |
| `REFRESH` | — | `/auth/refresh` | (defined, not actively called) | — |
| `SOCIAL_LOGIN` | POST | `/auth/social-login` | `{ providerToken, ...userDetails }` → `{ accessToken, user }` | `authService.socialLogin` |

### 5.2 User — `/user/*`
| Key | Method | Path | Body | Used by |
|-----|--------|------|------|---------|
| `PROFILE` | GET | `/user/profile` | → `{ user }` | `userService.getProfile` |
| `UPDATE` | POST | `/user/update` | `{ name, mobileNumber }` → `{ user }` | `userService.updateProfile` |
| `EMAIL_INITIATE` | POST | `/user/email/initiate` | `{ newEmail }` | `userService.initiateEmailUpdate` |
| `EMAIL_VERIFY` | POST | `/user/email/verify` | `{ newEmail, otp }` → `{ user }` | `userService.verifyEmailUpdate` |

### 5.3 Summary (AI) — `/summary/*`
| Key | Method | Path | Body | Used by |
|-----|--------|------|------|---------|
| `GENERATE` | POST | `/summary` | `{ text: <prompt> }` | `summaryService.*` |
| `HISTORY` | GET | `/summary/history` | — (local history used instead) | (defined) |
| `UPLOAD_PRESCRIPTION` | — | `/summary/upload_prescription` | (defined) | — |
| `QUERY_PRESCRIPTION` | — | `/summary/query_prescription` | (defined) | — |

> Summary responses are **free-form text** that may arrive wrapped in Portable-Text-like arrays; `summaryService.cleanSummaryText()` / `normalizeSummaryText()` unwrap them. Summary history is stored **locally** in AsyncStorage under `@summary_history` (max 100 entries).

### 5.4 Logs — `/logs/*`
| Key | Method | Path | Params | Used by |
|-----|--------|------|--------|---------|
| `SYNC` | POST | `/logs/sync` | gzip body (Pi → backend; **not used by mobile**) | `generate_vitals.py` |
| `DATES` | GET | `/logs/dates` | → `string[]` (available dates) | `healthLogsService.getAvailableDates` |
| `RANGE` | GET | `/logs/range` | `{ startDate, endDate }` (ISO) → `HealthLogItem[]` | `healthLogsService.getLogsByRange` |

### 5.5 Devices — `/devices/*`
| Key | Method | Path | Params / Body | Used by |
|-----|--------|------|---------------|---------|
| `LIST` | GET | `/devices` | `{ userId?, includeStatus? }` → `{ devices }` | `deviceDataService.getDevices` |
| `CLAIM` | POST | `/devices/claim` | `{ device_id }` | `healthLogsService.claimDevice` |
| `STATUS` | GET | `/devices/:deviceId/status` | → `PiDeviceStatus` | `deviceDataService.getDeviceStatus` |

### 5.6 Dashboard — `/dashboard/*`
| Key | Method | Path | Params | Used by |
|-----|--------|------|--------|---------|
| `LATEST_VITALS` | GET | `/dashboard/vitals/latest` | `{ deviceId }` → `DashboardVitals` | `deviceDataService.getLatestVitals`, `healthLogsService.getLatestVitals` |

### 5.7 Alerts — `/alerts/*`
| Key | Method | Path | Params | Used by |
|-----|--------|------|--------|---------|
| `RECENT` | GET | `/alerts/recent` | `{ deviceId, limit }` → `RecentAlert[]` | `alertService.getRecentAlerts`, `deviceDataService.getRecentAlerts` |
| `ATTEND` | PATCH | `/alerts/:id/attend` | — | `alertService.attendAlert` |
| `FALSE_ALARM` | PATCH | `/alerts/:id/false-alarm` | — | `alertService.falseAlarmAlert` |

### 5.8 Reports — `/reports/*`
| Key | Method | Path | Body | Used by |
|-----|--------|------|------|---------|
| `EXPORT` | POST | `/reports/export` | see §10 payload → CSV rows OR `{ meta, report, logs }` | `export-report.tsx` |
| `DEVICES` | GET | `/reports/devices` | (defined) | — |

### 5.9 Timeline — `/timeline/*`
| Key | Method | Path | Params / Body | Used by |
|-----|--------|------|---------------|---------|
| `VITALS` | GET | `/timeline/vitals` | `{ deviceId, metric, period, date?, startDate?, endDate? }` | `timelineService.getVitalsTimeline` |
| `EVENTS` | GET | `/timeline/events` | `{ deviceId, period, filter, date?, startDate?, endDate? }` | `timelineService.getEventsTimeline` |
| `STATS` | GET | `/timeline/stats` | `{ deviceId, period, date, month }` | `timelineService.getTimelineStats` |
| `DATE_OPTIONS` | GET | `/timeline/date-options` | `{ deviceId, period }` → `{ options }` | `timelineService.getDateOptions` |
| `DISMISSED` | GET | `/timeline/dismissed` | `{ deviceId? }` → `{ items }` | `timelineService.getDismissedAlerts`, `recycleBinService.getDismissed` |
| `RESTORE` | POST | `/timeline/restore` | `{ id }` | `timelineService.restoreAlert`, `recycleBinService.restore` |
| `DISMISS` | POST | `/timeline/dismiss` | `{ id }` | `timelineService.dismissAlert`, `recycleBinService.dismiss` |

> **Response envelope convention:** Many endpoints return `{ success: true, data: ... }`. Services use a shared `unwrapData()` helper that transparently unwraps `{ success, data }` envelopes and also tolerates bare arrays / `{ items }` / `{ alerts }` / `{ logs }` shapes.

---

## 6. Services Layer (`services/*`)

Every service imports the shared `apiClient` and `API_CONFIG`. All are stateless object literals exposing async methods.

### 6.1 `authService.ts`
Email-OTP + social login orchestration:
- `sendSignupCode(name, email)` → POST `/auth/register`
- `verifyRegistration(email, code)` → POST `/auth/verify` (OTP coerced to string)
- `sendLoginCode(email)` → POST `/auth/login`
- `verifyLogin(email, code)` → POST `/auth/login-verify`
- `socialLogin(providerToken, userDetails)` → POST `/auth/social-login`

### 6.2 `socialAuthService.ts`
Provider OAuth via `expo-auth-session`. Calls `WebBrowser.maybeCompleteAuthSession()` at import.
- **Redirect URI:** `AuthSession.makeRedirectUri({ scheme: 'sotercare', path: 'auth' })`. Uses the Expo proxy when running in **Expo Go** (`Constants.appOwnership === 'expo'`).
- **Google:** `useGoogleAuth()` hook (web/android/iOS client IDs from env), scopes `openid profile email`. `fetchGoogleUserProfile()` hits `https://www.googleapis.com/oauth2/v3/userinfo`.
- **Facebook:** `useFacebookAuth()` hook. Authorization endpoint `https://www.facebook.com/v19.0/dialog/oauth`, token endpoint `https://graph.facebook.com/v19.0/oauth/access_token`, profile from `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)`. Response type = Token.
- **Apple:** `appleSignIn()` — iOS only, via `expo-apple-authentication`. Returns identity-token JWT; Apple gives name/email only on first sign-in; no profile picture.
- Returns a unified `SocialAuthResult` (`{ success, user?, error?, cancelled? }`) where `user: SocialUser` has `{ name, email, picture, provider, providerToken, idToken? }`.
- The provider token is then exchanged with the backend via `authService.socialLogin()`.

### 6.3 `userService.ts`
- `getProfile()` GET `/user/profile`
- `updateProfile({ name, phone })` → POST `/user/update` as `{ name, mobileNumber }`
- `initiateEmailUpdate(_userId, newEmail)` → POST `/user/email/initiate`
- `verifyEmailUpdate(_userId, newEmail, otp)` → POST `/user/email/verify`

### 6.4 `summaryService.ts`
AI summary generation + local history:
- `generateSummary('today' | 'previous')` — sends a natural-language prompt to `/summary`.
- `generateTodaySummary()` — returns `{ summary, from: '12.00 AM', to: <now> }`.
- `generatePreviousSummary(date)` — prompt scoped to a specific ISO day.
- `getHistory()` — reads local AsyncStorage history.
- Helpers: `cleanSummaryText()` (regex-unwraps Portable-Text-style `[{type:'text', text:'...'}]` blobs and unescapes `\n \t \" \'`), `normalizeSummaryText()` (probes many response shapes: `data.summary`, `summary`, `result`, `data.message`, `message`).

### 6.5 `deviceDataService.ts`
- `getDevices({ userId?, includeStatus? })` → `PiDevice[]`
- `getDeviceStatus(deviceId)` → `PiDeviceStatus`
- `getLatestVitals(deviceId)` → `DashboardVitals`
- `getRecentAlerts({ deviceId, limit })` → `RecentAlert[]` (tolerant of array / `{alerts}` / `{data}`)

### 6.6 `healthLogsService.ts`
- `claimDevice(deviceId)` → POST `/devices/claim` `{ device_id }`
- `getAvailableDates()` → GET `/logs/dates` (sorted `string[]`)
- `getLogsByRange(startDate, endDate)` → GET `/logs/range` (`HealthLogItem[]`)
- `getLatestVitals(deviceId)` → GET `/dashboard/vitals/latest`
- Types: `HealthLogItem`, `ClaimDeviceResponse`, `LatestVitalsResponse` (`{ deviceId, timestamp, temperature?, roomTemperature?, moisture?, gaitAnalysis? }`).

### 6.7 `alertService.ts`
- `getRecentAlerts(deviceId, limit=20)` → GET `/alerts/recent`
- `attendAlert(id)` → PATCH `/alerts/:id/attend`
- `falseAlarmAlert(id)` → PATCH `/alerts/:id/false-alarm`

### 6.8 `timelineService.ts`
Wraps all `/timeline/*` endpoints (vitals, events, stats, date-options, dismissed, restore, dismiss). All GETs unwrap `{ success, data }`.

### 6.9 `syncService.ts`
**In-memory only / deprecated upload path.**
- `logVitals(data)` — pushes into an in-memory `logBuffer`; flushes (clears) at `BATCH_SIZE = 5`. (Previously wrote to local SQLite — now a no-op buffer.)
- `syncNightlyLogs()` — returns a no-op `LocalSyncResult` with message: *"Mobile upload is disabled. Logs remain local and backend is read-only for mobile."*

### 6.10 `recycleBinService.ts`
Alias surface over `/timeline/dismissed|restore|dismiss` with extra-defensive response shape handling for `getDismissed`.

### 6.11 `crashReportService.ts`
- `reportError(error, context?)` — currently `console.error('[CrashReport]', ...)`. Placeholder for Sentry/Crashlytics. Wired as the **global JS error handler** in `app/_layout.tsx` via `ErrorUtils.setGlobalHandler`.

---

## 7. State Management (Contexts)

Provider nesting in `app/_layout.tsx`:
```
AuthProvider → VitalsProvider → RaspberryPiProvider → RootLayoutNav
```

### 7.1 `AuthContext` (`contexts/AuthContext.tsx`)
- State: `{ user, token, isLoading, isAuthenticated }`.
- On mount, `initializeAuth()` reads `accessToken` from AsyncStorage, **decodes the JWT** (`jwt-decode`), checks `exp`, and builds a `User` from `{ userId, email, name }`. Expired/invalid → `signOut()`.
- `signIn(token, user?)` — persists `accessToken` (+ `user`) to AsyncStorage; falls back to decoding the token if `user` omitted.
- `signOut()` — clears `accessToken` + `user`.
- `signup({ name, email, password })` — **placeholder/stub** (no real backend call here; real registration goes through `authService` + OTP).
- Hook: `useAuth()` (**the most-connected node in the codebase** — bridges auth, navigation, device context, profile).

### 7.2 `VitalsContext` (`contexts/VitalsContext.tsx`)
- Lightweight in-memory vitals store: `{ heartRate, spO2, fallDetected, batteryLevel, accelerometer }`.
- `updateVitals(partial)`, `resetVitals()`. Hook: `useVitals()`.

### 7.3 `RaspberryPiContext` (`contexts/RaspberryPiContext.tsx`)
The device/data orchestration hub. State includes `connectionState`, `devices`, `selectedDeviceId`, `availableLogDates`, `historicalLogs`, `liveLogs`, `latestVitals`, `recentAlerts`, `logsError`, `lastError`.
- Actions: `claimDevice`, `loadAvailableLogDates`, `loadLogsByRange`, `scanAndConnect`, `disconnect`, `refreshDevices`, `refreshLatestVitals`, `refreshRecentAlerts`, `setSelectedDeviceId`.
- `parseApiError()` — on 401 triggers `signOut()` ("Session expired"); surfaces backend messages for 400/403.
- `toDeviceLog()` / `dedupeLogs()` — normalize heterogeneous log shapes (`device_id|deviceId`, `timestamp|ts|createdAt`, `fallAlert` → type `fall`) and de-dupe by `device::timestamp::id`, newest first.
- **Polling is disabled** by design (commented-out 30s device poll and 15s vitals poll) in favor of the realtime websocket. On auth + device select it does an initial `refreshLatestVitals + refreshRecentAlerts + loadAvailableLogDates + loadLogsByRange(last 24h)`.
- Hook: `useRaspberryPi()`.

---

## 8. Realtime Vitals — Socket.IO (`hooks/useRealtimeVitals.ts`)

This is how the **live dashboard / device "LIVE" indicator** works.

- Connects to `API_CONFIG.REALTIME_URL` (`wss://.../realtime`) via `socket.io-client`, `transports: ['websocket']`, passing `auth: { token }` (the stored `accessToken`).
- On `connect`: emits `subscribe` `{ deviceId }` for the selected device.
- `onAny` logs every inbound event (debug).
- **Offline detection:** if no data within `DEVICE_OFFLINE_TIMEOUT_MS = 10_000` (10s), `isDeviceStreaming` flips to false.

**Inbound events handled:**
| Event | Purpose |
|-------|---------|
| `connect` / `disconnect` / `connect_error` | connection lifecycle → `isConnected`, `error` |
| `vitals_update` | direct `DashboardVitals` push (filtered by `deviceId`) |
| `device.logs.ingested` | **primary** stream. Marks device online; maps raw log fields → vitals and derives alerts |

**Field mapping in `device.logs.ingested`** (raw → vitals):
- `temperature|temp` → `temperature`
- `ambient_temp|ambientTemp` → `roomTemperature`
- `moisture` → `moisture`
- `gait_label|gaitLabel` → `gaitAnalysis`
- timestamps: `timestamp` or `ts*1000`

**Derived client-side alerts:**
- `fall_alert|fallAlert` truthy → `RecentAlert` type `fall` ("Fall Detected")
- `sos` truthy → type `help_call` ("Help Call")
- `moisture > 25` → type `urine` ("High Moisture Detected"), with a **5-minute anti-spam cooldown** to avoid repeated continuous-analogue alerts.
- Recent alerts list capped at 10.

Returns: `{ vitals, recentAlerts, isConnected, isDeviceStreaming, error, reconnect, removeAlert }`.

---

## 9. Device Data Contracts

### 9.1 Raw live stream / recording (`*.jsonl`, one JSON object per line)
Example line from `sotercare_recording_20260308_195017.jsonl` (11,220 lines):
```json
{"accX":"0.0289","accY":"-0.0922","accZ":"0.9877","gTotal":"0.9924",
 "temp":"31.43","ambientTemp":"31.49","moisture":"0","rssi":"-48",
 "sos":"0","source":"wifi","gaitLabel":"N/A","fallAlert":"0","ts":"1772979617.869"}
```
- All values are **strings**; `ts` is a Unix epoch in **seconds** (float).
- `source` indicates transport (`wifi`). `gTotal` = accelerometer magnitude.

### 9.2 Sensor record envelope (`sampledata.json`)
A signed-record format (`{ protected, signature, payload }`) where `payload` holds:
- `record_id`, `device_name` (`HealthSensor`), `device_type` (`MAX30100 + TEMP`), `interval_ms` (1000)
- `sensors`: `[{name:'bpm',units:'bpm'},{name:'spo2',units:'%'},{name:'temperature',units:'°C'}]`
- `values`: array of `[bpm, spo2, temperature]` tuples.

### 9.3 Backend log/sync format (`vitals_history_3days.json`, produced by `scripts/generate_vitals.py`)
```json
{ "logs": [ { "id":1, "userId":1,
    "data": { "heartRate":80, "spo2":98, "temperature":36.8, "timestamp":1768176000000 },
    "timestamp": "2026-01-12T00:00:00" } ] }
```

### 9.4 TypeScript domain types (`types/raspberryPi.types.ts`)
- `PiConnectionState = 'disconnected'|'scanning'|'connecting'|'connected'|'reconnecting'`
- `PiDevice { id, name, type, status, lastSeenAt? }`
- `PiDeviceStatus { deviceId, status, battery?, signalRssi?, connectedAt?, bands? }`
- `DashboardVitals { deviceId, timestamp, temperature?, roomTemperature?, moisture?, gaitAnalysis? }`
- `RecentAlert { id, type:'movement'|'fall'|'urine'|string, title, timestamp }`
- `DeviceLog { id?, device_id?, deviceId?, timestamp, type?, title?, eventType?, ... }`
- `GatewayResponse<T> { requestId, status, data?, error? }`

### 9.5 Auth types (`types/auth.types.ts`)
- `User { userId, email, name?, phone? }`
- `JWTPayload { userId, email, name?, exp?, iat?, ... }`
- `AuthContextType` exposes `signIn / signOut / signup`.

---

## 10. Report Export Flow (`app/export-report.tsx`)

1. Loads available dates via `healthLogsService.getAvailableDates()`; user picks single/range dates (calendar bounded to available dates).
2. User selects metrics: **Skin Temp / Room Temp / Moisture / Activity** and format **CSV** or **PDF**.
3. POSTs to `/reports/export` with payload:
```json
{ "device":"Device 01",
  "startDate":"<ISO>","endDate":"<ISO>","isSingleDate":false,
  "metrics":{"temperature":true,"ambientTemp":false,"moisture":false},
  "format":"PDF","includeActivity":true }
```
4. **Two response shapes** supported:
   - **New format** `{ meta, report, logs }` → renders a styled HTML PDF including an **"AI Clinical Analysis"** section (markdown → HTML, via `cleanSummaryText`), plus a data table and `meta.dataPointsAnalyzed` / `meta.generatedAt`.
   - **Legacy** array/`{data}` → CSV or simple PDF table.
5. PDF via `expo-print` `printToFileAsync`, then shared via `expo-sharing`. CSV written to `documentDirectory` then shared.
6. 401/403 → "Session Expired" alert redirecting to `/(auth)/sign-in`.

---

## 11. Navigation Map (expo-router, file-based)

```
app/
├── _layout.tsx                 Root: providers + auth-gated redirect + custom splash + global error handler
├── (auth)/                     [unauthenticated group]
│   ├── _layout.tsx
│   ├── welcome.tsx             landing ("Welcome to SoterCare")
│   ├── sign-in.tsx             email + Google/Facebook/Apple
│   ├── sign-up.tsx             name + email
│   └── otp-verification.tsx    6-digit OTP (signin|signup modes)
├── (tabs)/                     [authenticated bottom tabs]
│   ├── _layout.tsx             tabs: Home / Timeline / AI Summary / Device / Profile
│   ├── index.tsx               Home dashboard (vitals grid, alerts)
│   ├── timeline/
│   │   ├── _layout.tsx
│   │   ├── index.tsx           charts + activity timeline
│   │   └── recycle-bin.tsx     dismissed alerts
│   ├── ai-summary.tsx          generate/view AI summaries
│   ├── device.tsx              claim/select devices, live status
│   └── profile.tsx             profile + settings menu
├── export-report.tsx           CSV/PDF export
├── subscription.tsx            subscription plans
├── modal.tsx                   generic modal
├── settings/                   about, help, language, temperature, payment(+add/edit/delete/detail/success)
└── user/update.tsx             profile edit
```

**Auth gating** (`RootLayoutNav`): when `!isAuthenticated` and not in `(auth)` → redirect `/(auth)/welcome`. When `isAuthenticated` and in auth group/root → redirect `/(tabs)`. A `CustomSplashScreen` covers the transition while `isLoading`.

**Auth flows:**
- **Sign up:** name+email → `/auth/register` → OTP screen (`mode=signup`) → `/auth/verify` → auto-login if `accessToken` returned, else prompt to sign in.
- **Sign in:** email → `/auth/login` → OTP screen (`mode=signin`) → `/auth/login-verify` → `signIn(accessToken, user)`.
- **Social:** provider OAuth → `authService.socialLogin(providerToken, {email,name,userId})` → `signIn()`.

---

## 12. Device Claiming & BLE Notes

- **Current claiming is by `device_id` string** (pasted/scanned from a QR) via `/devices/claim` — see `app/(tabs)/device.tsx`. The device list comes from `/devices`; live/offline status comes from the websocket (`isDeviceStreaming`), backend-sync status from `connectionState`.
- **BLE config exists but BLE is not the active data path.** `constants/bleConfig.ts` defines `BLE_CONFIG` (device name prefix `SoterCare`, standard + custom service/characteristic UUIDs for battery, heart rate, SpO2, fall detection, accelerometer) for an **ESP32** band. `app.json` declares BLE permissions and the `react-native-ble-manager` plugin, but `tsc_output.txt` shows a dangling `hooks/useBLE` import (TS2307) — **BLE services were removed** (see git history) and data now flows Pi→backend→app.

---

## 13. Configuration & Build

### 13.1 `app.json` (Expo)
- name/slug: `my-app`; scheme: `myapp`; version `1.0.0`; portrait; automatic UI style; New Arch on.
- **iOS** bundle id: `com.sanjula.myapp`; Bluetooth usage strings + background modes; non-exempt encryption false; tablet support.
- **Android** package: `com.sanjula.myapp`; adaptive icon (bg `#E6F4FE`); edge-to-edge; BLUETOOTH/LOCATION permissions.
- **Plugins:** `expo-router`, `expo-splash-screen` (logo `SoterCare-Primary-logo.png`, width 246), `react-native-ble-manager`, `expo-font`, `@react-native-community/datetimepicker`.
- **Experiments:** `typedRoutes`, `reactCompiler`.
- **EAS project id:** `e2e1225d-98fc-4d56-bd6e-7c3658d77ab6`.

> ⚠️ **Inconsistency:** `app.json` uses bundle/package `com.sanjula.myapp`, while `.env.example` references `com.sotercare.mobileapp` and the OAuth redirect scheme is `sotercare`. The active OAuth redirect scheme in code is `sotercare` (`socialAuthService.getRedirectUri`), but `app.json` `scheme` is `myapp`. Align these before production OAuth on standalone builds.

### 13.2 `eas.json` (build profiles)
- `development`: dev client, internal distribution.
- `preview`: internal, Android `apk`.
- `production`: `autoIncrement: true`. CLI `>= 12.9.0`, `appVersionSource: remote`.

### 13.3 `tsconfig.json`
- extends `expo/tsconfig.base`; `strict: true`; `jsx: react-native`; path alias `@/* → ./*`.

### 13.4 Known type errors (`tsc_output.txt`)
- `app/(tabs)/_layout.tsx`: **TS7031** implicit `any` on the `color` tab-icon binding (cosmetic — already typed in current source).
- `app/(tabs)/device.tsx`: **TS2307** cannot find module `hooks/useBLE` (leftover from removed BLE layer).

---

## 14. Environment Variables (`.env.example`)

Copy `.env.example` → `.env` (never commit `.env`). All public vars are `EXPO_PUBLIC_*`:

| Var | Purpose |
|-----|---------|
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google OAuth Web client (required for Expo Go) |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Google OAuth Android (standalone) |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Google OAuth iOS (standalone) |
| `EXPO_PUBLIC_FACEBOOK_APP_ID` | Facebook Login app id |
| `EXPO_PUBLIC_API_URL` | (commented; **not wired** — edit `api.config.ts` instead) |

Apple Sign-In needs no env var (uses `expo-apple-authentication`); requires Apple Developer "Sign in with Apple" capability and is iOS-only.

---

## 15. Scripts

| Script (`package.json`) | Command | Purpose |
|--------------------------|---------|---------|
| `start` | `expo start` | Dev server |
| `android` | `expo run:android` | Native Android build/run |
| `ios` | `expo run:ios` | Native iOS build/run |
| `web` | `expo start --web` | Web target |
| `lint` | `expo lint` | ESLint |
| `test` | `jest` | Unit tests |
| `test:watch` | `jest --watch` | Watch mode |
| `test:ci` | `jest --ci --coverage` | CI coverage |
| `e2e` | `maestro test e2e/` | Maestro E2E (`e2e/welcome-screen.yaml`) |
| `reset-project` | `node ./scripts/reset-project.js` | Move starter code to `app-example/`, scaffold blank `app/` |

**Utility scripts:**
- `scripts/generate_vitals.py` — generates 3 days of synthetic vitals (circadian temp curve, sleep-aware HR), writes `vitals_history_3days.json`, **gzip-POSTs to `http://localhost:3000/logs/sync`** with `Content-Encoding: gzip` and a hard-coded Bearer JWT (dev/testing only). ⚠️ Contains an embedded JWT — rotate/remove before sharing.
- `scripts/parse_jsonl.js` — Node line-reader for `.jsonl` recordings.

**Tests present:** `__tests__/syncService.test.ts`, `__tests__/validation.test.ts` (`utils/validation.ts`).

---

## 16. Theming

- `theme/colors.ts` → `TimelineColors` (primary cyan `#84D3E8`, chart red `#F05A5A`, activity colors for movement/fall/urine, text/border tokens).
- `theme/shadows.ts` → `Shadows` (neumorphic). `theme/index.ts` barrel.
- `constants/theme.ts` → app-wide theme. Primary brand accent across screens: **`#91D7E4`** (cyan). Tab bar base: `#f2f3f7` (neumorphic).
- Color scheme hooks: `hooks/use-color-scheme.ts` (+ `.web.ts`), `hooks/use-theme-color.ts`.
- UI primitives: `NeumorphicButton`, `NeumorphicCard`, `AnimatedCounter`, `CustomSplashScreen`, `IconSymbol` (iOS SF Symbols variant), `ThemedText`, `ThemedView`, `Collapsible`, `ParallaxScrollView`, `HapticTab`.

---

## 17. How to Connect & Run (End-to-End)

**Prerequisites:** Node, `npm`, Expo CLI (`npx expo`), and for native builds the EAS CLI + Android Studio / Xcode.

1. **Install:** `npm install`
2. **Env:** `cp .env.example .env` and fill Google/Facebook client IDs (Apple needs none).
3. **Point at backend:** by default it talks to the Koyeb production backend. For local dev, edit `BASE_URL` / `REALTIME_URL` in `api/config/api.config.ts` (e.g. `http://<LAN-IP>:3000` and `ws://<LAN-IP>:3000/realtime`).
4. **Run:** `npx expo start` → open in Expo Go, Android emulator, or iOS simulator. (Social login + BLE require a **dev/standalone build**, not plain Expo Go for everything.)
5. **Authenticate:** Sign up (name+email) or sign in (email) → enter the 6-digit OTP the backend emails. The returned `accessToken` (JWT) is stored in AsyncStorage and auto-attached to every request.
6. **Claim a device:** Device tab → paste the device's `device_id` (from its QR) → Claim. The device appears in the list.
7. **Go live:** Select the device → the app opens a Socket.IO connection to `/realtime`, subscribes to the `deviceId`, and renders incoming `device.logs.ingested` / `vitals_update` events. "LIVE" shows when data arrives within 10s.
8. **Explore:** Home (dashboard), Timeline (charts + events), AI Summary (`/summary`), Export Report (CSV/PDF via `/reports/export`).

**Backend contract checklist (what the server must implement):** all endpoints in §5; JWT bearer auth with `exp`; `{ success, data }` response envelope (or bare arrays — the client tolerates both); a Socket.IO server at `/realtime` accepting `auth.token`, a `subscribe { deviceId }` message, and broadcasting `vitals_update` and `device.logs.ingested`.

---

## 18. Security & Hardening Notes

- **Hard-coded production backend URL** in source (`api.config.ts`) — fine for a fixed deployment, but not environment-switchable.
- **Embedded JWT in `scripts/generate_vitals.py`** — a real(ish) Bearer token is committed. Rotate it and move to an env var.
- **`TIMEOUT: 1000000` ms** (~16 min) effectively disables request timeouts — long-hanging requests won't fail fast.
- **Idempotency-Key** is correctly added to mutations (good for retry-safety).
- **401 handling** clears tokens client-side; there's a defined `/auth/refresh` endpoint but **no refresh-token rotation is implemented** in the client (expired access token → full re-login).
- **Bundle id / scheme mismatch** (`com.sanjula.myapp` vs `com.sotercare.mobileapp` / `sotercare`) will break standalone OAuth redirects unless reconciled.
- GitHub Dependabot reports **59 dependency vulnerabilities** (31 high) on the repo — audit before release.
- `crashReportService` is a console stub — wire Sentry/Crashlytics for production error visibility.

---

## 19. Quick Reference — File → Responsibility

| File | Responsibility |
|------|----------------|
| `api/config/api.config.ts` | Base/realtime URLs, timeout, **all endpoint paths** |
| `api/client.ts` | Axios instance + auth/idempotency/401 interceptors |
| `services/authService.ts` | Email-OTP + social login backend calls |
| `services/socialAuthService.ts` | Google/Facebook/Apple OAuth (expo-auth-session) |
| `services/userService.ts` | Profile + email change |
| `services/summaryService.ts` | AI summary generation + local history |
| `services/deviceDataService.ts` | Devices, status, latest vitals, alerts |
| `services/healthLogsService.ts` | Claim device, log dates/ranges, latest vitals |
| `services/alertService.ts` | Recent alerts, attend, false-alarm |
| `services/timelineService.ts` | Timeline vitals/events/stats/dismiss/restore |
| `services/recycleBinService.ts` | Dismissed-alert recycle bin |
| `services/syncService.ts` | (Deprecated) in-memory vitals buffer |
| `services/crashReportService.ts` | Global error reporting stub |
| `contexts/AuthContext.tsx` | Auth state, JWT decode, sign in/out |
| `contexts/RaspberryPiContext.tsx` | Device + log orchestration |
| `contexts/VitalsContext.tsx` | In-memory vitals store |
| `hooks/useRealtimeVitals.ts` | Socket.IO live vitals + alert derivation |
| `app/_layout.tsx` | Providers, auth-gated routing, splash, error handler |
| `app/export-report.tsx` | CSV/PDF report export |
| `constants/bleConfig.ts` | ESP32 BLE UUIDs (inactive path) |
| `types/auth.types.ts`, `types/raspberryPi.types.ts` | Domain types |
| `scripts/generate_vitals.py` | Synthetic data generator → `/logs/sync` |

---

*End of M01-Log. For a navigable view of code relationships, see `graphify-out/graph.html` (632 nodes, 877 edges). `useAuth()`, `API_CONFIG`, and `useRaspberryPi()` are the central hubs.*
