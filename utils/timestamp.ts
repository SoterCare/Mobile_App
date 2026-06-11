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

/** Formats Unix ms as a local date string "YYYY-MM-DD" (for API date params). */
export function toDateString(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}
