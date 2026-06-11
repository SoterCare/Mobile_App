/**
 * Converts any timestamp format the device/backend might send into Unix milliseconds.
 *
 * Handles:
 *   - Unix seconds  (number < 1e11, e.g. 1_734_567_890)   → ×1000
 *   - Unix milliseconds (number ≥ 1e11)                   → as-is
 *   - ISO 8601 string (e.g. "2024-01-15T14:30:45.000Z")   → Date.parse
 *   - Numeric string  (e.g. "1734567890")                  → parsed then re-normalized
 *   - null / undefined / invalid                           → Date.now()
 *
 * The 1e11 threshold (≈ year 5138 in seconds, ≈ year 1973 in ms) cleanly
 * separates the two numeric formats without any year-range overlap.
 */
export function parseToUnixMs(raw: unknown): number {
  if (typeof raw === 'number' && isFinite(raw) && raw > 0) {
    return raw < 1e11 ? raw * 1000 : raw;
  }
  if (typeof raw === 'string' && raw.trim() !== '') {
    const asDate = Date.parse(raw);
    if (!isNaN(asDate)) return asDate;
    const asNum = Number(raw);
    if (!isNaN(asNum) && asNum > 0) return parseToUnixMs(asNum);
  }
  return Date.now();
}

/** Formats Unix ms as a UTC date string "YYYY-MM-DD" — for API query params only, not for display. */
export function toDateString(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

// ─── Display helpers — all use device local timezone automatically ────────────

/** "2:30 PM" — short time, device locale + local timezone. */
export function toTimeStr(ms: number): string {
  if (!ms || !isFinite(ms)) return '--';
  return new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(new Date(ms));
}

/** "Jun 11, 2:30 PM" — medium date + short time, local timezone. */
export function toDateTimeStr(ms: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ms));
}

/** "Jun 11, 2026" — date only, local timezone. */
export function toFullDateStr(ms: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(ms));
}

/** "5s ago" / "3m ago" / "2h ago" / "4d ago" */
export function relativeTime(ms: number): string {
  const diff = Math.max(0, Date.now() - ms);
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (s < 60) return `${s}s ago`;
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}
