# SoterCare — Mobile App

The React Native (Expo) mobile client for **SoterCare**, an elderly-care monitoring system. The app is where carers and family members see a monitored person's status: live vitals, alerts, activity timeline, and exportable reports.

Built collaboratively by student developers. See [SoterCare Developers](https://github.com/SoterCare/community) for the community behind it.

## Features

- **Authentication** — email/password plus Apple Sign-In and OAuth via `expo-auth-session`, with JWT session handling
- **Live vitals** — real-time data over a Socket.IO connection to the backend
- **Alerts** — surfaced in-app when readings cross thresholds
- **Activity timeline** — calendar-based history of events and readings
- **3D avatar view** — Three.js / `expo-gl` rendering used to visualise posture and movement state
- **Report export** — generate a PDF and share it via the native share sheet
- **Subscription and settings** — plan screen, profile management, and per-user preferences

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | React Native via **Expo** (SDK managed workflow) |
| Language | **TypeScript** |
| Navigation | **Expo Router** (file-based, with `(auth)` and `(tabs)` groups) |
| Data | **TanStack Query** for server state · **Zustand** for local state |
| Realtime | **socket.io-client** |
| Networking | **axios** |
| 3D / charts | **three**, `expo-three`, `expo-gl`, `d3-shape`, `react-native-svg` |
| Testing | **Jest** (`jest-expo`) + React Native Testing Library |

## Project structure

```
app/            Expo Router routes
  (auth)/         sign-in / sign-up flow
  (tabs)/         main tabbed navigation
  settings/       preferences
  user/           profile
  subscription.tsx, export-report.tsx, avatar-demo.tsx
api/            API client and request helpers
components/     shared UI components
constants/      theme and configuration values
__tests__/      unit and component tests
```

## Running locally

Requires Node.js and the Expo tooling. An iOS simulator, Android emulator, or the Expo Go app is needed to view the running app.

```bash
git clone https://github.com/SoterCare/Mobile_App.git
cd Mobile_App
npm install

cp .env.example .env    # then fill in the API endpoint and keys

npm start               # Expo dev server — choose a target from the CLI
```

Platform-specific entry points:

```bash
npm run android
npm run ios
npm run web
```

## Tests and linting

```bash
npm test            # watch mode
npm run test:ci     # single run, CI reporter
npm run lint
```

## Contributors

Built by student developers in the SoterCare Developers community — Daham, Hirusha, Komudi, Kaweesha, Nimna, and Sanjula. See the [contributors graph](https://github.com/SoterCare/Mobile_App/graphs/contributors) for the full record.

## Related repositories

- [web-dev-v2](https://github.com/SoterCare/web-dev-v2) — the SoterCare website and web dashboard
- [community](https://github.com/SoterCare/community) — events, guides, and how to get involved

---

<sub>Maintained by <a href="https://github.com/SoterCare">SoterCare Developers</a>.</sub>
