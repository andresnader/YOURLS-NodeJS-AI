// This is a simple in-memory rate limiter
// Note: In distributed environments, this will be per-instance.
// For persistent global rate limiting, Redis is required.

type RateLimitStore = Map<string, { count: number; reset: number }>;

const stores = new Map<string, RateLimitStore>();

export function rateLimit(options: {
  id: string;
  limit: number;
  windowMs: number;
}) {
  const { id, limit, windowMs } = options;
  
  if (!stores.has(id)) {
    stores.set(id, new Map());
  }
  
  const store = stores.get(id)!;
  
  return {
    check: (key: string) => {
      const now = Date.now();
      const record = store.get(key);
      
      if (!record || now > record.reset) {
        store.set(key, { count: 1, reset: now + windowMs });
        return { success: true, remaining: limit - 1, reset: now + windowMs };
      }
      
      if (record.count >= limit) {
        return { success: false, remaining: 0, reset: record.reset };
      }
      
      record.count += 1;
      return { success: true, remaining: limit - record.count, reset: record.reset };
    }
  };
}
