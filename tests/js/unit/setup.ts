/**
 * Node has no Web Storage, but several admin stores are persisted with
 * `persist()` into sessionStorage/localStorage. A small in-memory shim keeps
 * the stores loading and saving exactly as they do in the browser.
 */
const createMemoryStorage = (): Storage => {
  let store = new Map<string, string>();
  const storage = {
    get length() {
      return store.size;
    },
    clear: () => {
      store = new Map();
    },
    getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };
  return storage as Storage;
};

for (const name of ['sessionStorage', 'localStorage'] as const) {
  if (typeof globalThis[name] === 'undefined') {
    Object.defineProperty(globalThis, name, {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
  }
}
