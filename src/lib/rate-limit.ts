interface RateLimitState {
  count: number;
  resetAt: number;
}

interface ConsumeRateLimitInput {
  scope: string;
  key: string;
  limit: number;
  windowMs: number;
}

interface ConsumeRateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
}

declare global {
  var __terraRateLimitStore: Map<string, RateLimitState> | undefined;
}

function getStore() {
  if (!globalThis.__terraRateLimitStore) {
    globalThis.__terraRateLimitStore = new Map<string, RateLimitState>();
  }

  return globalThis.__terraRateLimitStore;
}

function cleanupExpiredEntries(now: number) {
  const store = getStore();

  for (const [key, state] of store.entries()) {
    if (state.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function getRequestIdentity(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfIp = request.headers.get("cf-connecting-ip");
  const rawIp = forwardedFor?.split(",")[0]?.trim() || realIp || cfIp || "unknown";

  return rawIp.toLowerCase();
}

export function consumeRateLimit(input: ConsumeRateLimitInput): ConsumeRateLimitResult {
  const now = Date.now();
  const store = getStore();

  if (store.size > 500) {
    cleanupExpiredEntries(now);
  }

  const bucketKey = `${input.scope}:${input.key}`;
  const existing = store.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    store.set(bucketKey, {
      count: 1,
      resetAt: now + input.windowMs,
    });

    return {
      allowed: true,
      retryAfterSeconds: Math.ceil(input.windowMs / 1000),
      remaining: Math.max(input.limit - 1, 0),
    };
  }

  if (existing.count >= input.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(Math.ceil((existing.resetAt - now) / 1000), 1),
      remaining: 0,
    };
  }

  existing.count += 1;
  store.set(bucketKey, existing);

  return {
    allowed: true,
    retryAfterSeconds: Math.max(Math.ceil((existing.resetAt - now) / 1000), 1),
    remaining: Math.max(input.limit - existing.count, 0),
  };
}
