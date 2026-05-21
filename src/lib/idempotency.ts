/**
 * In-process idempotency cache. Replace with Redis when moving to multi-replica.
 * Keys are scoped to the requesting principal (user/api-key/IP).
 */

type Entry = { status: number; body: unknown; expiresAt: number };

const TTL_MS = 24 * 60 * 60 * 1000; // 24h
const MAX_ENTRIES = 5_000;
const store = new Map<string, Entry>();

function gc() {
  if (store.size <= MAX_ENTRIES) return;
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.expiresAt < now) store.delete(k);
  }
  if (store.size > MAX_ENTRIES) {
    // drop oldest insertions
    const toDrop = store.size - MAX_ENTRIES;
    let i = 0;
    for (const k of store.keys()) {
      if (i++ >= toDrop) break;
      store.delete(k);
    }
  }
}

export function idempotencyKey(principal: string, header: string | null): string | null {
  if (!header) return null;
  const trimmed = header.trim();
  if (!trimmed || trimmed.length > 200) return null;
  return `${principal}::${trimmed}`;
}

export function getCached(key: string): { status: number; body: unknown } | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    store.delete(key);
    return null;
  }
  return { status: entry.status, body: entry.body };
}

export function setCached(key: string, status: number, body: unknown): void {
  store.set(key, { status, body, expiresAt: Date.now() + TTL_MS });
  gc();
}
