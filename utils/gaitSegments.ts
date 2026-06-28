/**
 * Gait activity ring — pure helpers (no React / no SVG component code).
 *
 * Builds gap-free, whole-day segments of mutually-exclusive gait states for the
 * 24-hour ring on the Timeline tab, plus the geometry/formatting it needs.
 *
 * Time unit throughout: seconds-since-local-midnight (0..86400).
 */
import { Colors } from '@/theme/tokens';
import { TimelineColors } from '@/theme/colors';

export const DAY_SECONDS = 86400;

export type GaitState =
  | 'walking'
  | 'standing_idle'
  | 'sitting_idle'
  | 'standing_up'
  | 'sitting_down'
  | 'device_off';

export type GaitKind = 'sustained' | 'transition' | 'off';

export interface GaitStateMeta {
  label: string;
  color: string;
  kind: GaitKind;
}

/** Display order + token-bound colors (light-only, matches the app palette). */
export const GAIT_CONFIG: Record<GaitState, GaitStateMeta> = {
  walking: { label: 'Walking', color: Colors.brand, kind: 'sustained' },
  standing_idle: { label: 'Standing idle', color: TimelineColors.urineBlue, kind: 'sustained' },
  sitting_idle: { label: 'Sitting idle', color: TimelineColors.gaitSittingViolet, kind: 'sustained' },
  standing_up: { label: 'Standing up', color: Colors.warning, kind: 'transition' },
  sitting_down: { label: 'Sitting down', color: TimelineColors.gaitTransitionOrange, kind: 'transition' },
  device_off: { label: 'Device off', color: TimelineColors.iconGray, kind: 'off' },
};

/** Order used by the legend and breakdown list. */
export const GAIT_ORDER: GaitState[] = [
  'walking',
  'standing_idle',
  'sitting_idle',
  'standing_up',
  'sitting_down',
  'device_off',
];

export interface Segment {
  startSec: number;
  endSec: number;
  state: GaitState;
}

/** A state-change event: `state` holds from `sec` until the next event. */
export interface GaitChange {
  sec: number;
  state: GaitState;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Local midnight (ms) for a 'YYYY-MM-DD' or 'YYYY/MM/DD' day string. */
export function localDayStartMs(day: string): number {
  const [y, m, d] = day.replace(/\//g, '-').split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0).getTime();
}

export function secondsSinceMidnight(tsMs: number, dayStartMs: number): number {
  return (tsMs - dayStartMs) / 1000;
}

/** Merge touching segments that share a state. */
function mergeAdjacent(segs: Segment[]): Segment[] {
  const out: Segment[] = [];
  for (const s of segs) {
    const last = out[out.length - 1];
    if (last && last.state === s.state && Math.abs(last.endSec - s.startSec) < 0.001) {
      last.endSec = s.endSec;
    } else if (s.endSec > s.startSec) {
      out.push({ ...s });
    }
  }
  return out;
}

/**
 * Convert raw per-sample classifications into change-events, inserting an
 * explicit `device_off` whenever the gap between consecutive samples exceeds
 * `gapThresholdSec` (the device stopped writing).
 */
export function samplesToChangeEvents(
  samples: GaitChange[],
  gapThresholdSec = 120,
): GaitChange[] {
  const sorted = [...samples].sort((a, b) => a.sec - b.sec);
  const out: GaitChange[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i];
    const prev = out[out.length - 1];
    if (prev && sorted[i].sec - sorted[i - 1].sec > gapThresholdSec) {
      out.push({ sec: sorted[i - 1].sec + 0.001, state: 'device_off' });
    }
    if (!prev || prev.state !== cur.state) out.push({ sec: cur.sec, state: cur.state });
  }
  return out;
}

/**
 * Build gap-free, whole-day segments from change-events. Anything not covered
 * (before the first event, after the last, or explicit `device_off`) reads as
 * "device off". Output always spans [dayStartSec, dayEndSec].
 */
export function buildDaySegments(
  changes: GaitChange[],
  opts: { dayStartSec?: number; dayEndSec?: number } = {},
): Segment[] {
  const dayStartSec = opts.dayStartSec ?? 0;
  const dayEndSec = opts.dayEndSec ?? DAY_SECONDS;
  const s = [...changes].sort((a, b) => a.sec - b.sec);

  if (s.length === 0) {
    return [{ startSec: dayStartSec, endSec: dayEndSec, state: 'device_off' }];
  }

  const segs: Segment[] = [];
  const first = clamp(s[0].sec, dayStartSec, dayEndSec);
  if (first > dayStartSec) {
    segs.push({ startSec: dayStartSec, endSec: first, state: 'device_off' });
  }
  for (let i = 0; i < s.length; i++) {
    const start = clamp(s[i].sec, dayStartSec, dayEndSec);
    const end = clamp(i + 1 < s.length ? s[i + 1].sec : dayEndSec, dayStartSec, dayEndSec);
    if (end > start) segs.push({ startSec: start, endSec: end, state: s[i].state });
  }
  const last = segs[segs.length - 1];
  if (last && last.endSec < dayEndSec) {
    segs.push({ startSec: last.endSec, endSec: dayEndSec, state: 'device_off' });
  }
  return mergeAdjacent(segs);
}

/** Seconds spent in each state across the day (sums to 86400). */
export function totalsByState(segments: Segment[]): Record<GaitState, number> {
  const totals = {
    walking: 0,
    standing_idle: 0,
    sitting_idle: 0,
    standing_up: 0,
    sitting_down: 0,
    device_off: 0,
  } as Record<GaitState, number>;
  for (const seg of segments) totals[seg.state] += seg.endSec - seg.startSec;
  return totals;
}

// ── Formatting ──────────────────────────────────────────────────────────────

export function formatDuration(totalSec: number): string {
  const s = Math.round(totalSec);
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return `${m}m`;
  return s > 0 ? '<1m' : '0m';
}

export function formatClock(sec: number): string {
  const s = clamp(Math.round(sec), 0, DAY_SECONDS);
  const h = Math.floor(s / 3600) % 24;
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ── Ring geometry (00:00 at top, clockwise) ──────────────────────────────────

export const angleForSec = (sec: number) => (sec / DAY_SECONDS) * 360;

export function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
}

/** SVG path `d` for a ring arc between two angles (clockwise). */
export function describeArc(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  // A full 360° arc can't be drawn as a single A command; cap just under.
  let end = endDeg;
  if (end - startDeg >= 360) end = startDeg + 359.999;
  const start = polarToCartesian(cx, cy, r, startDeg);
  const finish = polarToCartesian(cx, cy, r, end);
  const largeArc = end - startDeg > 180 ? 1 : 0;
  // sweep = 1 → clockwise (matches north-up sin/cos mapping above)
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${finish.x} ${finish.y}`;
}

// ── Fallback derivation (until a backend gait endpoint exists) ───────────────

export interface ApproxEvent {
  type: string; // 'movement' | 'fall' | 'connected' | 'disconnected' | 'help_call' | ...
  timestamp: number; // unix ms
}
export interface HourlyPoint {
  value: number | null;
}

/**
 * Best-effort gait day derived from data the Timeline tab already has, used only
 * until a real per-time gait source is wired:
 *   - device on/off comes from the hourly vitals points (null value = off),
 *   - `movement` events → short `walking` runs,
 *   - `help_call` → a `standing_up` marker,
 *   - remaining on-time defaults to `sitting_idle` (at rest).
 * This is an approximation of posture, not a classification. Replace with the
 * real endpoint via timelineService.getGaitSegments.
 */
export function deriveApproxChanges(
  events: ApproxEvent[],
  hourlyPoints: HourlyPoint[],
  dayStartMs: number,
): GaitChange[] {
  const MIN = 1440;
  const minute: GaitState[] = new Array(MIN);
  for (let m = 0; m < MIN; m++) {
    const hour = Math.floor(m / 60);
    const on = hourlyPoints[hour]?.value != null;
    minute[m] = on ? 'sitting_idle' : 'device_off';
  }
  for (const e of events) {
    const sec = secondsSinceMidnight(e.timestamp, dayStartMs);
    if (sec < 0 || sec >= DAY_SECONDS) continue;
    const m = Math.floor(sec / 60);
    if (e.type === 'movement') {
      for (let k = m; k < Math.min(MIN, m + 20); k++) {
        if (minute[k] !== 'device_off') minute[k] = 'walking';
      }
    } else if (e.type === 'help_call' || e.type === 'fall') {
      if (minute[m] !== 'device_off') minute[Math.min(MIN - 1, m)] = 'standing_up';
    }
  }
  const changes: GaitChange[] = [];
  for (let m = 0; m < MIN; m++) {
    if (m === 0 || minute[m] !== minute[m - 1]) changes.push({ sec: m * 60, state: minute[m] });
  }
  return changes;
}
