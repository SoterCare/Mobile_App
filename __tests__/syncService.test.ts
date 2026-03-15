import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ----- Mocks -----

const mockInsertValues: any = jest.fn(async () => undefined);
const mockInsert: any = jest.fn(() => ({ values: mockInsertValues }));

const mockWhere: any = jest.fn(async () => []);
const mockFrom: any = jest.fn(() => ({
  where: mockWhere,
}));
const mockSelect: any = jest.fn(() => ({
  from: mockFrom,
}));

const mockSetWhere: any = jest.fn(async () => undefined);
const mockSet: any = jest.fn(() => ({ where: mockSetWhere }));
const mockUpdate: any = jest.fn(() => ({ set: mockSet }));

const mockTransaction: any = jest.fn(async (callback: any) => {
  const tx = {
    update: (...args: any[]) => mockUpdate(...args),
  };
  return callback(tx);
});

jest.mock('../database/db', () => ({
  db: {
    insert: (...args: any[]) => mockInsert(...args),
    select: (...args: any[]) => mockSelect(...args),
    update: (...args: any[]) => mockUpdate(...args),
    transaction: (callback: any) => mockTransaction(callback),
  },
}));

jest.mock('../database/schema', () => ({
  nightlyLogs: { id: 'id', synced: 'synced' },
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((...args: any[]) => args),
}));

const { syncService } = require('../services/syncService');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('syncService.syncNightlyLogs', () => {
  it('returns successful no-op result when there are no unsynced logs', async () => {
    mockWhere.mockImplementationOnce(async () => []);

    const result = await syncService.syncNightlyLogs();

    expect(mockSelect).toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      message: 'Mobile upload is disabled. Logs remain local and backend is read-only for mobile.',
      syncedCount: 0,
    });
  });

  it('reports unsynced log count without making network calls', async () => {
    const fakeLogs: any[] = [
      { id: 1, data: '{"hr":72}', synced: false, createdAt: new Date() },
      { id: 2, data: '{"hr":75}', synced: false, createdAt: new Date() },
    ];

    mockWhere.mockImplementationOnce(async () => fakeLogs);

    const result = await syncService.syncNightlyLogs();

    expect(result.success).toBe(true);
    expect(result.syncedCount).toBe(2);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('returns failure response when reading local logs throws', async () => {
    mockWhere.mockImplementationOnce(async () => {
      throw new Error('db error');
    });

    const result = await syncService.syncNightlyLogs();

    expect(result).toEqual({
      success: false,
      message: 'Unable to read local logs',
      syncedCount: 0,
    });
  });
});

describe('syncService.logVitals', () => {
  it('buffers data without writing to DB when under BATCH_SIZE', async () => {
    await syncService.logVitals({ hr: 70 });
    await syncService.logVitals({ hr: 71 });

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('flushes buffer to DB when BATCH_SIZE is reached', async () => {
    for (let i = 0; i < 5; i++) {
      await syncService.logVitals({ hr: 60 + i });
    }

    expect(mockInsert).toHaveBeenCalled();
    expect(mockInsertValues).toHaveBeenCalled();
  });
});