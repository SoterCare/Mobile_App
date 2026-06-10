# Graph Report - .  (2026-06-10)

## Corpus Check
- 126 files · ~134,191 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 632 nodes · 877 edges · 55 communities (38 shown, 17 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.84)
- Token cost: 9,789 input · 3,820 output

## Community Hubs (Navigation)
- [[_COMMUNITY_AI Summary UI Components|AI Summary UI Components]]
- [[_COMMUNITY_API Client and Report Export|API Client and Report Export]]
- [[_COMMUNITY_Device Context and Dashboard|Device Context and Dashboard]]
- [[_COMMUNITY_Package Dependencies|Package Dependencies]]
- [[_COMMUNITY_Auth Context and User Profile|Auth Context and User Profile]]
- [[_COMMUNITY_Expo App Configuration|Expo App Configuration]]
- [[_COMMUNITY_Dev Dependencies and Testing|Dev Dependencies and Testing]]
- [[_COMMUNITY_App Layout and Navigation|App Layout and Navigation]]
- [[_COMMUNITY_Payment Settings|Payment Settings]]
- [[_COMMUNITY_Authentication Flow|Authentication Flow]]
- [[_COMMUNITY_Root Layout and Error Handling|Root Layout and Error Handling]]
- [[_COMMUNITY_Docs and E2E Tests|Docs and E2E Tests]]
- [[_COMMUNITY_EAS Build Configuration|EAS Build Configuration]]
- [[_COMMUNITY_Sample Sensor Data|Sample Sensor Data]]
- [[_COMMUNITY_React Logo Assets|React Logo Assets]]
- [[_COMMUNITY_Project Reset Script|Project Reset Script]]
- [[_COMMUNITY_SoterCare Brand Assets|SoterCare Brand Assets]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_Help and FAQ Screen|Help and FAQ Screen]]
- [[_COMMUNITY_Android Adaptive Icon|Android Adaptive Icon]]
- [[_COMMUNITY_Profile Menu|Profile Menu]]
- [[_COMMUNITY_Data Sync Service|Data Sync Service]]
- [[_COMMUNITY_Subscription Plans|Subscription Plans]]
- [[_COMMUNITY_Primary Logo Design|Primary Logo Design]]
- [[_COMMUNITY_Vitals Generation Script|Vitals Generation Script]]
- [[_COMMUNITY_Language Settings|Language Settings]]
- [[_COMMUNITY_Temperature Unit Settings|Temperature Unit Settings]]
- [[_COMMUNITY_Healthcare UI Icons|Healthcare UI Icons]]
- [[_COMMUNITY_Tab Navigation|Tab Navigation]]
- [[_COMMUNITY_Patient Bed Visual|Patient Bed Visual]]
- [[_COMMUNITY_JSONL Parser Script|JSONL Parser Script]]
- [[_COMMUNITY_About Screen|About Screen]]
- [[_COMMUNITY_Summary Header Component|Summary Header Component]]
- [[_COMMUNITY_Android Icon Design|Android Icon Design]]
- [[_COMMUNITY_Welcome Screen|Welcome Screen]]
- [[_COMMUNITY_External Link Component|External Link Component]]
- [[_COMMUNITY_ESLint Configuration|ESLint Configuration]]
- [[_COMMUNITY_App Icon Asset|App Icon Asset]]
- [[_COMMUNITY_BLE Configuration|BLE Configuration]]
- [[_COMMUNITY_Vitals History Data|Vitals History Data]]
- [[_COMMUNITY_Caring Hand Motif|Caring Hand Motif]]
- [[_COMMUNITY_Mock Heart Rate Data|Mock Heart Rate Data]]
- [[_COMMUNITY_Mock SpO2 Data|Mock SpO2 Data]]
- [[_COMMUNITY_Mock Temperature Data|Mock Temperature Data]]
- [[_COMMUNITY_Favicon Asset|Favicon Asset]]
- [[_COMMUNITY_SoterCare Only Logo|SoterCare Only Logo]]
- [[_COMMUNITY_S Letterform|S Letterform]]
- [[_COMMUNITY_Shield Motif|Shield Motif]]

## God Nodes (most connected - your core abstractions)
1. `expo` - 15 edges
2. `useAuth()` - 15 edges
3. `API_CONFIG` - 13 edges
4. `useRaspberryPi()` - 11 edges
5. `scripts` - 11 edges
6. `TimelineColors` - 11 edges
7. `useRealtimeVitals()` - 9 edges
8. `android` - 8 edges
9. `useThemeColor()` - 8 edges
10. `Shadows` - 8 edges

## Surprising Connections (you probably didn't know these)
- `ProfileScreen()` --calls--> `useAuth()`  [EXTRACTED]
  app/(tabs)/profile.tsx → contexts/AuthContext.tsx
- `TimelineScreen()` --calls--> `useRaspberryPi()`  [INFERRED]
  app/(tabs)/timeline/index.tsx → contexts/RaspberryPiContext.tsx
- `Collapsible()` --calls--> `useColorScheme()`  [INFERRED]
  components/ui/collapsible.tsx → hooks/use-color-scheme.web.ts
- `OTPVerificationScreen()` --calls--> `useAuth()`  [EXTRACTED]
  app/(auth)/otp-verification.tsx → contexts/AuthContext.tsx
- `RootLayoutNav()` --calls--> `useAuth()`  [EXTRACTED]
  app/_layout.tsx → contexts/AuthContext.tsx

## Import Cycles
- 1-file cycle: `app/(tabs)/timeline/index.tsx -> app/(tabs)/timeline/index.tsx`

## Hyperedges (group relationships)
- **Tabs Layout TypeScript Type Errors (TS7031 color binding)** — tsc_output_tabs_layout, tsc_output_ts7031_error, tsc_output_tsc_output [EXTRACTED 1.00]
- **Device TSX - Missing useBLE Hook Module** — tsc_output_device_tsx, tsc_output_useble_hook, tsc_output_ts2307_error [EXTRACTED 1.00]

## Communities (55 total, 17 thin omitted)

### Community 0 - "AI Summary UI Components"
Cohesion: 0.06
Nodes (42): GenerateButton(), GenerateButtonProps, styles, styles, ToggleSwitch(), ToggleSwitchProps, ActivityEvent, activityEventsDay (+34 more)

### Community 1 - "API Client and Report Export"
Cohesion: 0.07
Nodes (32): apiClient, styles, API_CONFIG, ALERT_CONFIG, AlertCard(), AlertCardProps, AlertType, getRelativeTime() (+24 more)

### Community 2 - "Device Context and Dashboard"
Cohesion: 0.09
Nodes (31): RaspberryPiContext, RaspberryPiContextType, useRaspberryPi(), DeviceStatusHeader(), styles, RecentAlerts(), styles, styles (+23 more)

### Community 3 - "Package Dependencies"
Cohesion: 0.04
Nodes (45): dependencies, axios, buffer, d3-shape, expo, expo-apple-authentication, expo-auth-session, expo-constants (+37 more)

### Community 4 - "Auth Context and User Profile"
Cohesion: 0.07
Nodes (30): AuthContext, AuthProviderProps, ProfileHeaderProps, styles, MenuItemProps, ProfileSettingsCard(), styles, MenuItemProps (+22 more)

### Community 5 - "Expo App Configuration"
Cohesion: 0.05
Nodes (40): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, edgeToEdgeEnabled, enablePngCrunchInReleaseBuilds, package (+32 more)

### Community 6 - "Dev Dependencies and Testing"
Cohesion: 0.06
Nodes (32): devDependencies, eslint, eslint-config-expo, jest, jest-expo, @jest/globals, react-test-renderer, @testing-library/react-native (+24 more)

### Community 7 - "App Layout and Navigation"
Cohesion: 0.11
Nodes (20): RootLayoutNav(), styles, ParallaxScrollView(), Props, styles, styles, ThemedText(), ThemedTextProps (+12 more)

### Community 8 - "Payment Settings"
Cohesion: 0.11
Nodes (15): styles, Card, cardStore, CardVisual(), styles, styles, styles, setCardStore() (+7 more)

### Community 9 - "Authentication Flow"
Cohesion: 0.14
Nodes (22): OTPVerificationScreen(), styles, SignInScreen(), styles, SignUpScreen(), styles, useAuth(), RaspberryPiProvider() (+14 more)

### Community 10 - "Root Layout and Error Handling"
Cohesion: 0.08
Nodes (17): unstable_settings, ErrorBoundary, Props, State, styles, AuthProvider(), defaultVitals, VitalsContext (+9 more)

### Community 11 - "Docs and E2E Tests"
Cohesion: 0.16
Nodes (16): SoterCare App (com.sanjula.myapp), E2E Welcome Screen Test, Welcome to SoterCare Screen Text, App Directory (file-based routing root), create-expo-app, Expo Framework, Expo Go, File-Based Routing (+8 more)

### Community 12 - "EAS Build Configuration"
Cohesion: 0.12
Nodes (15): buildType, build, development, preview, production, cli, appVersionSource, version (+7 more)

### Community 13 - "Sample Sensor Data"
Cohesion: 0.15
Nodes (12): payload, device_name, device_type, interval_ms, record_id, sensors, values, protected (+4 more)

### Community 14 - "React Logo Assets"
Cohesion: 0.31
Nodes (11): assets/images directory, Partial React Logo, React Logo (SVG-style PNG), React Logo (@2x), React Logo (@3x), Splash Screen Icon - Concentric circles on grid background (app splash screen placeholder/template graphic), Mobile App, React Atom Icon (orbital design) (+3 more)

### Community 15 - "Project Reset Script"
Cohesion: 0.22
Nodes (7): exampleDirPath, fs, oldDirs, path, readline, rl, root

### Community 16 - "SoterCare Brand Assets"
Cohesion: 0.36
Nodes (8): App Assets, App Logo Asset, SoterCare Horizontal Logo, SoterCare Logo, SoterCare S Logo (Letter S Monogram), SoterCare — the application brand/product whose visual identity is represented by this logo, SoterCare Logo Icon - Hand Holding Plant, SoterCare Wordmark Text

### Community 17 - "TypeScript Configuration"
Cohesion: 0.25
Nodes (7): compilerOptions, jsx, paths, strict, extends, include, @/*

### Community 18 - "Help and FAQ Screen"
Cohesion: 0.29
Nodes (4): FAQ_ITEMS, faqStyles, styles, SUPPORT_OPTIONS

### Community 19 - "Android Adaptive Icon"
Cohesion: 0.33
Nodes (6): Android Adaptive Icon Foreground Layer, App Brand Logo Mark (chevron/caret symbol), Application Logo / Brand Mark, Blue Gradient Chevron/Caret Shape, Android Icon Foreground - Blue Chevron/Caret Logo, Android Icon Monochrome - App Logo (upward chevron/caret mark in grey on white background)

### Community 20 - "Profile Menu"
Cohesion: 0.33
Nodes (3): MenuItemProps, ProfileMenuProps, styles

### Community 21 - "Data Sync Service"
Cohesion: 0.40
Nodes (4): LocalSyncResult, logBuffer, syncService, { syncService }

### Community 22 - "Subscription Plans"
Cohesion: 0.40
Nodes (3): PLANS, styles, { width }

### Community 23 - "Primary Logo Design"
Cohesion: 0.50
Nodes (5): Brand Color Palette (Dark Charcoal + Light Blue), Helping Hand Icon (Logo Mark), Shield Icon (Logo Mark), SoterCare Brand Logo, SoterCare Wordmark Text

### Community 24 - "Vitals Generation Script"
Cohesion: 0.50
Nodes (4): generate_vitals(), Compresses data with GZIP and sends it to the backend., Generates synthetic vital signs data for the specified number of past days., send_to_backend()

### Community 25 - "Language Settings"
Cohesion: 0.40
Nodes (3): Language, LANGUAGES, styles

### Community 26 - "Temperature Unit Settings"
Cohesion: 0.40
Nodes (3): styles, Unit, UNITS

### Community 27 - "Healthcare UI Icons"
Cohesion: 0.67
Nodes (4): Blue Rounded Square Background, Healthcare UI Icon, Patient Bed 3D Icon, Mobile App Assets

### Community 29 - "Patient Bed Visual"
Cohesion: 0.83
Nodes (4): man.png - 3D rendered gray humanoid figure lying on a medical reclining bed/stretcher with blue cushioning and wheels, UI Asset: Human Body / Patient Illustration for Health App, 3D Rendered Gray Humanoid Mannequin Figure, Medical Reclining Bed / Stretcher with Blue Cushioning and Wheels

### Community 33 - "Android Icon Design"
Cohesion: 1.00
Nodes (3): Android Icon Design Guidelines, assets/images Directory, Android Icon Background (Design Guide)

### Community 37 - "App Icon Asset"
Cohesion: 1.00
Nodes (3): Expo Default App Icon Template, App Icon - Blue Angular Logo on Light Blue Background, Mobile App Brand Identity

## Knowledge Gaps
- **290 isolated node(s):** `{ syncService }`, `apiClient`, `name`, `slug`, `version` (+285 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Authentication Flow` to `Root Layout and Error Handling`, `Device Context and Dashboard`, `Auth Context and User Profile`, `App Layout and Navigation`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `API_CONFIG` connect `API Client and Report Export` to `Device Context and Dashboard`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Package Dependencies` to `Dev Dependencies and Testing`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `{ syncService }`, `apiClient`, `name` to the rest of the system?**
  _292 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AI Summary UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.056051587301587304 - nodes in this community are weakly interconnected._
- **Should `API Client and Report Export` be split into smaller, more focused modules?**
  _Cohesion score 0.06561085972850679 - nodes in this community are weakly interconnected._
- **Should `Device Context and Dashboard` be split into smaller, more focused modules?**
  _Cohesion score 0.0898989898989899 - nodes in this community are weakly interconnected._