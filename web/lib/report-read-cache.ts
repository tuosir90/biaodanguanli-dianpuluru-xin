type ReportCacheEntry<T> = {
  expiresAt: number;
  payload: T;
};

type ReportCacheStore = Map<string, ReportCacheEntry<unknown>>;

const DEFAULT_REPORT_CACHE_TTL_MS = 5 * 60 * 1000;
const REPORT_CACHE_MAX_ENTRIES = 50;

const reportCacheStores = new Map<string, ReportCacheStore>();

export const REPORT_READ_RESPONSE_HEADERS = {
  "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=900",
};

function getReportCacheStore(namespace: string) {
  const normalizedNamespace = namespace.trim();
  const existingStore = reportCacheStores.get(normalizedNamespace);
  if (existingStore) {
    return existingStore;
  }

  const nextStore: ReportCacheStore = new Map();
  reportCacheStores.set(normalizedNamespace, nextStore);
  return nextStore;
}

function deleteExpiredEntry(
  store: ReportCacheStore,
  key: string,
  cached: ReportCacheEntry<unknown>
) {
  if (cached.expiresAt > Date.now()) {
    return false;
  }

  store.delete(key);
  return true;
}

export function getCachedReportPayload<T>(namespace: string, key: string) {
  const store = getReportCacheStore(namespace);
  const cached = store.get(key);
  if (!cached) {
    return null;
  }

  if (deleteExpiredEntry(store, key, cached)) {
    return null;
  }

  return cached.payload as T;
}

export function setCachedReportPayload<T>(
  namespace: string,
  key: string,
  payload: T,
  ttlMs = DEFAULT_REPORT_CACHE_TTL_MS
) {
  const store = getReportCacheStore(namespace);
  store.set(key, {
    payload,
    expiresAt: Date.now() + ttlMs,
  });

  if (store.size <= REPORT_CACHE_MAX_ENTRIES) {
    return;
  }

  const oldestKey = store.keys().next().value;
  if (oldestKey) {
    store.delete(oldestKey);
  }
}

export function clearReportReadCaches() {
  reportCacheStores.clear();
}
