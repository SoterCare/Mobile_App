// Web fallback DB module.
// Prevents Expo web bundling from pulling native expo-sqlite/wasm worker paths.

type NoopTx = {
  update: () => {
    set: () => {
      where: () => Promise<void>;
    };
  };
};

export const db = {
  insert: () => ({
    values: async () => undefined,
  }),
  select: () => ({
    from: () => ({
      where: async () => [],
    }),
  }),
  update: () => ({
    set: () => ({
      where: async () => undefined,
    }),
  }),
  transaction: async (callback: (tx: NoopTx) => Promise<unknown>) => {
    const tx: NoopTx = {
      update: () => ({
        set: () => ({
          where: async () => undefined,
        }),
      }),
    };
    return callback(tx);
  },
};

export const initDatabase = async () => {
  return;
};

export const insertLog = async (_data: unknown) => {
  return;
};
