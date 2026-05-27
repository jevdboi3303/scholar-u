// Node.js v22+ ships a built-in `localStorage` object that exists but has no
// working methods unless the process was started with `--localstorage-file`.
// @supabase/auth-js falls back to `globalThis.localStorage`, so we polyfill
// it here (server startup, before any route handler runs) with an in-memory
// implementation that is safe for SSR.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const ls = (globalThis as unknown as Record<string, unknown>).localStorage

    if (ls !== undefined && typeof (ls as Storage).getItem !== 'function') {
      const store: Record<string, string> = {}
      const polyfill: Storage = {
        getItem: (key) => store[key] ?? null,
        setItem: (key, value) => { store[key] = value },
        removeItem: (key) => { delete store[key] },
        clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
        key: (index) => Object.keys(store)[index] ?? null,
        get length() { return Object.keys(store).length },
      }
      Object.defineProperty(globalThis, 'localStorage', {
        value: polyfill,
        writable: true,
        configurable: true,
      })
    }
  }
}
