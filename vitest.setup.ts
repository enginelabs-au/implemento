import { vi } from "vitest";

const store = new Map<string, unknown>();

vi.stubGlobal("chrome", {
  storage: {
    local: {
      get: async (keys: string | string[] | null) => {
        if (keys === null) return Object.fromEntries(store.entries());
        const keyList = Array.isArray(keys) ? keys : [keys];
        return Object.fromEntries(
          keyList
            .map((key) => [key, store.get(key)])
            .filter((entry): entry is [string, unknown] => entry[1] !== undefined),
        );
      },
      set: async (items: Record<string, unknown>) => {
        for (const [key, value] of Object.entries(items)) {
          store.set(key, value);
        }
      },
    },
  },
  runtime: {
    sendMessage: vi.fn(async () => undefined),
  },
});
