# Alerts / Timeline / Gait — Backend Alignment Design

**Date:** 2026-06-12  
**Status:** Approved

---

## Context

Three backend changes were shipped that break existing assumptions in the mobile app:

1. Gait analysis (`gait_label`) no longer generates alerts — it is a sensor reading stored in vitals only.
2. `GET /alerts/recent` returns only `{ isDismissed: false, isAttended: false }` alerts ("pending action" queue).
3. `GET /timeline/events` now returns only `isAttended: true` alerts (previously all non-dismissed).
4. `alert.new` WebSocket no longer fires for gait movement — only for SOS, fall, and moisture.
5. `device.logs.ingested` WebSocket still carries raw `gait_label` — for vitals/analytics only.

---

## Files Affected

| File | Change |
|---|---|
| `hooks/useRealtimeVitals.ts` | Remove fake alert generation from `device.logs.ingested` |
| `components/dashboard/AlertCard.tsx` | Remove redundant `recycleBinService.dismiss` call |
| `contexts/RaspberryPiContext.tsx` | Add `removeRecentAlert(id)` for optimistic removal |
| `components/dashboard/RecentAlerts.tsx` | Call `removeRecentAlert` on dismiss for immediate UI update |
| `app/(tabs)/timeline/index.tsx` | Update filter options — remove 'Movements', add 'SOS' |

---

## Change 1 — Remove Fake Alerts from `device.logs.ingested`

**File:** `hooks/useRealtimeVitals.ts`

**Problem:** The `device.logs.ingested` handler currently reads `fall_alert`, `sos`, and `moisture` from the raw log payload and creates local `RecentAlert` objects with generated IDs (`fall_{deviceId}_{ts}`). These IDs do not exist in the backend's alert table. Any Attend or False Alarm action against them will silently fail or produce undefined behaviour.

**Fix:** Delete the entire `newAlerts` block (currently lines ~138–181), including:
- `const newAlerts: RecentAlert[] = []`
- The `fallAlertVal` and `sosVal` branches that push to `newAlerts`
- The `moistureVal > 25` branch
- The anti-spam moisture deduplication block
- The `if (newAlerts.length > 0) { setRecentAlerts(...) }` call

Also remove the now-unused variable declarations `fallAlertVal` and `sosVal`.

**Keep intact:**
- The `setVitals` call that includes `moistureVal` (moisture is a vital reading) and `gaitLabelVal` (already vitals-only, no change needed).
- All `alert.new`, `alert.attended`, `alert.dismissed`, `alert.updated` socket handlers — these are correct.

**After this change:** `recentAlerts` inside `useRealtimeVitals` is populated only by `alert.new` — real backend alerts with real IDs.

---

## Change 2 — Fix Double API Call in `handleFalseAlarm`

**File:** `components/dashboard/AlertCard.tsx`

**Problem:** `handleFalseAlarm` calls both:
- `alertService.falseAlarmAlert(id)` → `PATCH /alerts/:id/false-alarm`
- `recycleBinService.dismiss({ id })` → `POST /timeline/dismiss`

The backend's false-alarm endpoint handles dismissal internally. The second call is redundant and incorrect.

**Fix:** Remove `recycleBinService.dismiss({ id })` from `handleFalseAlarm`. The `Promise.all` becomes a single `await alertService.falseAlarmAlert(id)`. Remove the `recycleBinService` import if no other code in the file uses it.

---

## Change 3 — Immediate Optimistic Removal from Both Alert Sources

**File:** `contexts/RaspberryPiContext.tsx`

**Problem:** `RecentAlerts` merges two sources: `contextAlerts` (REST-polled list in context) and `realtimeAlerts` (socket list in `useRealtimeVitals`). When `handleAlertDismissed` fires, `removeAlert(id)` only removes from `realtimeAlerts`. If the alert came from the REST poll, it remains visible until `refreshRecentAlerts` resolves.

**Fix:** Add `removeRecentAlert` to `RaspberryPiContext`:

```ts
// In RaspberryPiContextType interface:
removeRecentAlert: (id: string) => void;

// Implementation:
const removeRecentAlert = useCallback((id: string) => {
  setRecentAlerts((prev) => prev.filter((a) => a.id !== id));
}, []);
```

Expose it in the context `value` object and the `useMemo` dependency array.

**File:** `components/dashboard/RecentAlerts.tsx`

Update `handleAlertDismissed`:
```ts
const { recentAlerts: contextAlerts, selectedDeviceId, refreshRecentAlerts, removeRecentAlert } = useRaspberryPi();

const handleAlertDismissed = (id: string) => {
  removeRecentAlert(id);   // immediate — REST-polled list
  removeAlert(id);          // immediate — socket list
  refreshRecentAlerts();   // background re-poll to confirm
};
```

This ensures the card disappears instantly regardless of which source it came from.

---

## Change 4 — Timeline Filter Options

**File:** `app/(tabs)/timeline/index.tsx`

**Problem:** Filter options include 'Movements' which maps to `movement` — the gait type. Since gait no longer generates alerts, this filter will always return empty results and is misleading.

**Fix:**
```ts
// Before:
const FILTER_OPTIONS = ['All', 'Movements', 'Falls', 'Urine'];
const filterMap = { All: 'all', Movements: 'movement', Falls: 'fall', Urine: 'urine' };

// After:
const FILTER_OPTIONS = ['All', 'Falls', 'Urine', 'SOS'];
const filterMap: Record<string, string> = { All: 'all', Falls: 'fall', Urine: 'urine', SOS: 'sos' };
```

---

## What Does NOT Change

- `services/alertService.ts` — endpoints already correct
- `api/config/api.config.ts` — all endpoints already defined
- `services/timelineService.ts` — already correct
- `services/recycleBinService.ts` — correct for recycle bin display
- `app/(tabs)/timeline/recycle-bin.tsx` — correct; shows `isDismissed: true` alerts
- `AlertCard.tsx` attend flow — already calls `PATCH /alerts/:id/attend`, calls `onDismiss`, navigates to timeline (which triggers `useFocusEffect` refresh)
- `gait_label` in vitals — already correctly displayed only in `VitalsGrid`, not as any alert card

---

## Data Flow After Changes

```
alert.new (socket)
  └─→ useRealtimeVitals.recentAlerts  ─┐
                                        ├─→ RecentAlerts (merged, deduped)
GET /alerts/recent (REST poll)          │     └─→ AlertCard × N
  └─→ RaspberryPiContext.recentAlerts  ─┘           ├─ Attended → PATCH /alerts/:id/attend
                                                     │     → removeRecentAlert + removeAlert
                                                     │     → refreshRecentAlerts (bg)
                                                     │     → navigate to timeline
                                                     └─ False Alarm → PATCH /alerts/:id/false-alarm
                                                           → removeRecentAlert + removeAlert
                                                           → refreshRecentAlerts (bg)

device.logs.ingested (socket)
  └─→ vitals only (temp, moisture, gaitAnalysis)
        → VitalsGrid (live readings)
        → NOT alerts, NOT activity items

GET /timeline/events → attended alerts only → ActivityTimeline
GET /timeline/dismissed → false-alarm alerts → RecycleBin
GET /timeline/vitals?metric=gait → gait chart data (future analytics)
```
