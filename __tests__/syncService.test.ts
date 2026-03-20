import { jest, describe, it, expect, beforeEach } from '@jest/globals';
const { syncService } = require('../services/syncService');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('syncService.syncNightlyLogs', () => {
  it('returns successful no-op result', async () => {
    const result = await syncService.syncNightlyLogs();
    expect(result).toEqual({
      success: true,
      message: 'Mobile upload is disabled. Logs remain local and backend is read-only for mobile.',
      syncedCount: 0,
    });
  });
});

describe('syncService.logVitals', () => {
  it('buffers data successfully without throwing', async () => {
    // Should not throw any errors when calling logVitals
    await syncService.logVitals({ hr: 70 });
    await syncService.logVitals({ hr: 71 });
    
    // Call syncNightlyLogs to verify our mock in-memory buffer updated
    const result = await syncService.syncNightlyLogs();
    expect(result.syncedCount).toBeGreaterThan(0);
  });
});