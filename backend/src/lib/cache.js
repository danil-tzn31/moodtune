// Tiny in-memory TTL cache. Good enough to keep repeated searches/lookups
// from re-hitting iTunes/Last.fm on every render.
// Not shared across processes — fine for a single-instance small deployment.

const store = new Map();

export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

export function cacheSet(key, value, ttlMs = 10 * 60 * 1000) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export async function cached(key, ttlMs, fn) {
  const hit = cacheGet(key);
  if (hit !== undefined) return hit;
  const value = await fn();
  cacheSet(key, value, ttlMs);
  return value;
}
