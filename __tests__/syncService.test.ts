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

const mockPost: any = jest.fn();
jest.mock('../api/client', () => ({
  __esModule: true,
  default: {
    post: (...args: any[]) => mockPost(...args),
  },
}));

jest.mock('../api/config/api.config', () => ({
  API_CONFIG: {
    ENDPOINTS: {
      LOGS: { SYNC: '/logs/sync' },
    },
  },
}));

jest.mock('pako', () => ({
  gzip: jest.fn(() => new Uint8Array([1, 2, 3])),
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((...args: any[]) => args),
}));

const { syncService } = require('../services/syncService');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('syncService.syncNightlyLogs', () => {
  it('does not call API when there are no unsynced logs', async () => {
    mockWhere.mockImplementationOnce(async () => []);

    await syncService.syncNightlyLogs();

    expect(mockSelect).toHaveBeenCalled();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('syncs logs and marks them as synced on success', async () => {
    const fakeLogs: any[] = [
      { id: 1, data: '{"hr":72}', synced: false, createdAt: new Date() },
      { id: 2, data: '{"hr":75}', synced: false, createdAt: new Date() },
    ];

    mockWhere.mockImplementationOnce(async () => fakeLogs);

    mockPost.mockImplementationOnce(async () => ({
      data: { success: true, message: 'ok', syncedCount: 2 },
    }));

    await syncService.syncNightlyLogs();

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith(
      '/logs/sync',
      expect.any(Uint8Array),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Encoding': 'gzip',
        }),
      })
    );

    // Current implementation should mark each log as synced
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  it('does not mark logs as synced when API returns failure', async () => {
    const fakeLogs: any[] = [
      { id: 1, data: '{"hr":72}', synced: false, createdAt: new Date() },
    ];

    mockWhere.mockImplementationOnce(async () => fakeLogs);

    mockPost.mockImplementationOnce(async () => ({
      data: { success: false, message: 'server error', syncedCount: 0 },
    }));

    await syncService.syncNightlyLogs();

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockUpdate).not.toHaveBeenCalled();
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