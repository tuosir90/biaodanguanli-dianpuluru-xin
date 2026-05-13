import type { NextRequest } from "next/server";

type RateLimitConfig = {
  routeKey: string;
  maxRequests: number;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
  lastSeenAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSec: number;
  resetAt: number;
};

declare global {
  var requestRateLimitStore: Map<string, RateLimitBucket> | undefined;
}

const MAX_BUCKETS = 10_000;

function getStore() {
  if (!globalThis.requestRateLimitStore) {
    globalThis.requestRateLimitStore = new Map<string, RateLimitBucket>();
  }
  return globalThis.requestRateLimitStore;
}

function getClientIp(request: NextRequest) {
  const xForwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const firstForwardedIp = xForwardedFor
    .split(",")
    .map((part) => part.trim())
    .find(Boolean);
  if (firstForwardedIp) return firstForwardedIp;

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

function cleanupBuckets(store: Map<string, RateLimitBucket>, now: number) {
  if (store.size <= MAX_BUCKETS) return;

  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) {
      store.delete(key);
    }
  }

  if (store.size <= MAX_BUCKETS) return;

  const entries = Array.from(store.entries()).sort(
    (a, b) => a[1].lastSeenAt - b[1].lastSeenAt
  );
  const removeCount = Math.max(entries.length - MAX_BUCKETS, 0);
  for (let index = 0; index < removeCount; index += 1) {
    const [key] = entries[index];
    store.delete(key);
  }
}

export function checkRouteRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const store = getStore();
  const ip = getClientIp(request);
  const bucketKey = `${config.routeKey}:${ip}`;
  const existing = store.get(bucketKey);
  const resetAt = now + config.windowMs;

  let bucket: RateLimitBucket;
  if (!existing || existing.resetAt <= now) {
    bucket = {
      count: 0,
      resetAt,
      lastSeenAt: now,
    };
    store.set(bucketKey, bucket);
  } else {
    bucket = existing;
    bucket.lastSeenAt = now;
  }

  const allowed = bucket.count < config.maxRequests;
  if (allowed) {
    bucket.count += 1;
  }

  cleanupBuckets(store, now);

  const remaining = Math.max(config.maxRequests - bucket.count, 0);
  const retryAfterSec = allowed
    ? 0
    : Math.max(Math.ceil((bucket.resetAt - now) / 1000), 1);

  return {
    allowed,
    limit: config.maxRequests,
    remaining,
    retryAfterSec,
    resetAt: bucket.resetAt,
  };
}

export function buildRateLimitHeaders(result: RateLimitResult) {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };

  if (result.retryAfterSec > 0) {
    headers["Retry-After"] = String(result.retryAfterSec);
  }

  return headers;
}
