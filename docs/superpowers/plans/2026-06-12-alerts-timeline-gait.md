# Alerts / Timeline / Gait — Backend Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the mobile app with three backend changes: gait no longer generates alerts, `GET /alerts/recent` is the pending-action queue, `GET /timeline/events` shows only attended alerts, and `device.logs.ingested` must never create alert cards.

**Architecture:** Five targeted edits across four files — remove fake alert generation from the socket hook, fix a double API call in the alert action handler, add optimistic removal to the context, wire it up in the alerts component, and drop the stale 'Movements' timeline filter.

**Tech Stack:** React Native / Expo, TypeScript, Socket.io client, React Context, Jest (`npm test`)

**Spec:** `docs/superpowers/specs/2026-06-12-alerts-timeline-gait-design.md`

---

## File Map

| File | Action | What changes |
|---|---|---|
| `hooks/useRealtimeVitals.ts` | Modify lines 124–183 | Delete `fallAlertVal`, `sosVal` vars and the entire `newAlerts` block |
| `contexts/RaspberryPiContext.tsx` | Modify | Add `removeRecentAlert` callback + expose in context |
| `components/dashboard/RecentAlerts.tsx` | Modify | Call both `removeRecentAlert` and `removeAlert` on dismiss |
| `components/dashboard/AlertCard.tsx` | Modify | Remove `recycleBinService.dismiss` from `handleFalseAlarm` |
| `app/(tabs)/timeline/index.tsx` | Modify | Replace `FILTER_OPTIONS` and `filterMap` |

---

## Task 1: Remove Fake Alert Generation from `device.logs.ingested`

**Files:**
- Modify: `hooks/useRealtimeVitals.ts`

**Context:** The `device.logs.ingested` socket handler currently reads `fall_alert`, `sos`, and `moisture` from the raw log and creates `RecentAlert` objects with generated IDs (`fall_{deviceId}_{ts}`). These IDs don't exist in the backend — any Attend/False-Alarm action fails silently. The backend's `alert.new` event now handles all real alert creation.

- [ ] **Step 1: Open `hooks/useRealtimeVitals.ts` and locate the `device.logs.ingested` handler**

  Find the block starting at `socketInstance.on('device.logs.ingested', (data: any) => {` (around line 109). Inside it, locate the `setVitals` call and the `newAlerts` block that follows it.

- [ ] **Step 2: Replace the handler body**

  The full handler currently spans lines 109–186. Replace **only the inner body** (keeping the outer `socketInstance.on(...)` wrapper) so it reads:

  ```ts
  socketInstance.on('device.logs.ingested', (data: any) => {
    // Mark device as online/streaming whenever data arrives
    markDeviceOnline();
    if (data && data.logs && data.logs.length > 0) {
      const latestLog = data.logs[0];
      const logDeviceId = data.deviceId || data.device_id || latestLog.device_id || deviceId || 'unknown';

      // If payload has no explicit deviceId, assume it's for the current device
      if (!deviceId || logDeviceId === deviceId) {
        // Normalize to Unix ms regardless of whether the backend sends ISO, Unix-s, or Unix-ms
        const timestampMs = parseToUnixMs(latestLog.timestamp ?? latestLog.ts);

        const tempVal = latestLog.temperature ?? latestLog.temp;
        const ambientTempVal = latestLog.ambient_temp ?? latestLog.ambientTemp;
        const moistureVal = latestLog.moisture;
        const gaitLabelVal = latestLog.gait_label ?? latestLog.gaitLabel;

        setVitals((prev) => ({
          ...(prev || {}),
          deviceId: logDeviceId,
          timestamp: timestampMs,
          ...(tempVal !== undefined && { temperature: Number(tempVal) }),
          ...(ambientTempVal !== undefined && { roomTemperature: Number(ambientTempVal) }),
          ...(moistureVal !== undefined && { moisture: Number(moistureVal) }),
          ...(gaitLabelVal !== undefined && { gaitAnalysis: String(gaitLabelVal) }),
        }) as DashboardVitals);

        // Alert cards come exclusively from the alert.new socket event (real backend IDs).
        // device.logs.ingested is for vitals/analytics only — never generate alerts here.
      }
    }
  });
  ```

  What was removed: `fallAlertVal`, `sosVal` variable declarations, the `const newAlerts: RecentAlert[] = []` block, the moisture anti-spam logic, and the `if (newAlerts.length > 0) { setRecentAlerts(...) }` call.

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  npx tsc --noEmit
  ```

  Expected: no new errors (there may be pre-existing ones from the known TS issues in the codebase — only new errors introduced by this task are a problem).

- [ ] **Step 4: Run existing tests**

  ```bash
  npm test
  ```

  Expected: all tests pass (they don't touch this hook directly, but this confirms nothing was broken).

- [ ] **Step 5: Commit**

  ```bash
  git add hooks/useRealtimeVitals.ts
  git commit -m "fix: stop generating fake alert cards from device.logs.ingested"
  ```

---

## Task 2: Add `removeRecentAlert` to `RaspberryPiContext`

**Files:**
- Modify: `contexts/RaspberryPiContext.tsx`

**Context:** When a user attends or marks an alert as false alarm, the card must disappear immediately. `contextAlerts` (the REST-polled list) stays visible until `refreshRecentAlerts` resolves. Adding `removeRecentAlert` lets the UI remove a specific alert from that list optimistically.

- [ ] **Step 1: Add `removeRecentAlert` to the context type interface**

  In `RaspberryPiContext.tsx`, find `interface RaspberryPiContextType` (line ~22) and add the new method:

  ```ts
  interface RaspberryPiContextType {
    // ... existing fields ...
    removeRecentAlert: (id: string) => void;   // ← add this line
  }
  ```

- [ ] **Step 2: Implement the callback**

  After the existing `refreshRecentAlerts` callback (around line 153), add:

  ```ts
  const removeRecentAlert = useCallback((id: string) => {
    setRecentAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);
  ```

- [ ] **Step 3: Expose in the context value**

  In the `useMemo` value object (around line 280), add `removeRecentAlert`:

  ```ts
  const value = useMemo<RaspberryPiContextType>(
    () => ({
      // ... existing fields ...
      removeRecentAlert,    // ← add this line
    }),
    [
      // ... existing deps ...
      removeRecentAlert,    // ← add to deps array (stable — useCallback with [] deps)
    ]
  );
  ```

  > `removeRecentAlert` uses `useCallback` with an empty dependency array, so it is referentially stable and adding it to the `useMemo` dep array does not cause extra renders.

- [ ] **Step 4: TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: no new errors. If TypeScript complains that `removeRecentAlert` is missing from a `RaspberryPiContextType` implementation, that is the context type interface — the fix is already in Step 1.

- [ ] **Step 5: Commit**

  ```bash
  git add contexts/RaspberryPiContext.tsx
  git commit -m "feat: add removeRecentAlert to RaspberryPiContext for immediate optimistic removal"
  ```

---

## Task 3: Wire `removeRecentAlert` into `RecentAlerts`

**Files:**
- Modify: `components/dashboard/RecentAlerts.tsx`

**Context:** `handleAlertDismissed` currently only removes from the socket-sourced list (`removeAlert`). After Task 2, we can also remove from the REST-polled list immediately.

- [ ] **Step 1: Destructure `removeRecentAlert` from the context**

  Find the existing `useRaspberryPi()` call (line ~20):

  ```ts
  const { recentAlerts: contextAlerts, selectedDeviceId, refreshRecentAlerts } = useRaspberryPi();
  ```

  Replace with:

  ```ts
  const { recentAlerts: contextAlerts, selectedDeviceId, refreshRecentAlerts, removeRecentAlert } = useRaspberryPi();
  ```

- [ ] **Step 2: Update `handleAlertDismissed`**

  Find the existing handler (lines ~32–36):

  ```ts
  const handleAlertDismissed = (id: string) => {
      // Refresh backend alerts
      refreshRecentAlerts();
      // Remove from realtime state (if it was from there)
      removeAlert(id);
  };
  ```

  Replace with:

  ```ts
  const handleAlertDismissed = (id: string) => {
      removeRecentAlert(id); // immediate — REST-polled list
      removeAlert(id);        // immediate — socket list
      refreshRecentAlerts(); // background re-poll to confirm
  };
  ```

- [ ] **Step 3: TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: no new errors.

- [ ] **Step 4: Commit**

  ```bash
  git add components/dashboard/RecentAlerts.tsx
  git commit -m "fix: remove dismissed alert card immediately from both REST and socket lists"
  ```

---

## Task 4: Fix Double API Call in `handleFalseAlarm`

**Files:**
- Modify: `components/dashboard/AlertCard.tsx`

**Context:** `handleFalseAlarm` calls both `alertService.falseAlarmAlert(id)` (`PATCH /alerts/:id/false-alarm`) and `recycleBinService.dismiss({id})` (`POST /timeline/dismiss`). The backend's false-alarm endpoint handles the dismissal internally — the second call is redundant and must be removed.

- [ ] **Step 1: Remove the `recycleBinService.dismiss` call**

  Find `handleFalseAlarm` (lines ~94–121). The `onPress` handler inside the `Alert.alert` currently reads:

  ```ts
  onPress: async () => {
      try {
          setIsProcessing(true);
          if (id) {
              await Promise.all([
                  alertService.falseAlarmAlert(id),
                  recycleBinService.dismiss({ id }),
              ]);
          }
          onDismiss?.(id);
      } catch (error) {
          console.error('Failed to mark false alarm:', error);
          setIsProcessing(false);
      }
  },
  ```

  Replace with:

  ```ts
  onPress: async () => {
      try {
          setIsProcessing(true);
          if (id) await alertService.falseAlarmAlert(id);
          onDismiss?.(id);
      } catch (error) {
          console.error('Failed to mark false alarm:', error);
          setIsProcessing(false);
      }
  },
  ```

- [ ] **Step 2: Remove the `recycleBinService` import**

  At the top of `AlertCard.tsx`, find:

  ```ts
  import { recycleBinService } from '@/services/recycleBinService';
  ```

  Delete that line. `recycleBinService` is not used anywhere else in this file.

- [ ] **Step 3: TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: no new errors.

- [ ] **Step 4: Run tests**

  ```bash
  npm test
  ```

  Expected: all tests pass.

- [ ] **Step 5: Commit**

  ```bash
  git add components/dashboard/AlertCard.tsx
  git commit -m "fix: false alarm calls only PATCH /alerts/:id/false-alarm, removes redundant dismiss POST"
  ```

---

## Task 5: Update Timeline Filter Options

**Files:**
- Modify: `app/(tabs)/timeline/index.tsx`

**Context:** The filter option 'Movements' maps to the backend filter value `movement`, which matched gait events. Gait no longer generates alerts — this filter will always return empty results and is misleading. Replace it with 'SOS' to reflect the actual pending alert types (fall, moisture/urine, SOS).

- [ ] **Step 1: Update `FILTER_OPTIONS`**

  Find at the top of `TimelineScreen` (line ~47):

  ```ts
  const FILTER_OPTIONS = ['All', 'Movements', 'Falls', 'Urine'];
  ```

  Replace with:

  ```ts
  const FILTER_OPTIONS = ['All', 'Falls', 'Urine', 'SOS'];
  ```

- [ ] **Step 2: Update `filterMap`**

  Find inside `fetchTimelineData` (line ~141):

  ```ts
  const filterMap: Record<string, string> = { All: 'all', Movements: 'movement', Falls: 'fall', Urine: 'urine' };
  ```

  Replace with:

  ```ts
  const filterMap: Record<string, string> = { All: 'all', Falls: 'fall', Urine: 'urine', SOS: 'sos' };
  ```

- [ ] **Step 3: TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: no new errors.

- [ ] **Step 4: Commit**

  ```bash
  git add "app/(tabs)/timeline/index.tsx"
  git commit -m "fix: remove Movements filter from timeline (gait is vitals-only), add SOS filter"
  ```

---

## Task 6: Manual Smoke Test

Run the app and verify each behaviour.

- [ ] **Step 1: Start the dev server**

  ```bash
  npx expo start
  ```

  Open on a device or emulator.

- [ ] **Step 2: Verify Recent Alerts feed**

  - [ ] Home screen shows alert cards loaded from `GET /alerts/recent`
  - [ ] No gait/movement cards appear unless they existed as real backend alerts
  - [ ] Tap an alert card → it expands to show **Attended** and **False** buttons

- [ ] **Step 3: Verify Attended action**

  - [ ] Tap **Attended** on an alert card → confirm dialog appears
  - [ ] Confirm → card disappears immediately (no full reload required)
  - [ ] App navigates to Timeline tab
  - [ ] The attended alert appears in the Activity Timeline on the Timeline screen

- [ ] **Step 4: Verify False Alarm action**

  - [ ] Tap **False** on an alert card → confirm dialog appears
  - [ ] Confirm → card disappears immediately
  - [ ] Navigate to Timeline → Recycle Bin (trash icon) → the alert appears there
  - [ ] Check the network log (or backend) — confirm only **one** API call was made (`PATCH /alerts/:id/false-alarm`), not two

- [ ] **Step 5: Verify Timeline filter options**

  - [ ] Open Timeline tab → tap the filter icon
  - [ ] Filter options shown: **All**, **Falls**, **Urine**, **SOS** — no 'Movements'

- [ ] **Step 6: Verify gait stays in vitals only**

  - [ ] When device is streaming, gait label appears in the VitalsGrid card on the home screen
  - [ ] Gait label does **not** produce an alert card in the Recent Alerts section

- [ ] **Step 7: Run full test suite one last time**

  ```bash
  npm test
  ```

  Expected: all tests pass.
