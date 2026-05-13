type CacheEntry<T> = {
  expiresAt: number;
  payload: T;
};

type CacheStore<T> = {
  ttlMs: number;
  maxEntries: number;
  items: Map<string, CacheEntry<T>>;
};

const DEFAULT_MAX_ENTRIES = 200;

const workflowStatusStore: CacheStore<unknown> = {
  ttlMs: 60_000,
  maxEntries: DEFAULT_MAX_ENTRIES,
  items: new Map(),
};

const completionMonitorStore: CacheStore<unknown> = {
  ttlMs: 300_000,
  maxEntries: 50,
  items: new Map(),
};

const patrolAlertsStore: CacheStore<unknown> = {
  ttlMs: 300_000,
  maxEntries: 50,
  items: new Map(),
};

const patrolShopsStore: CacheStore<unknown> = {
  ttlMs: 180_000,
  maxEntries: DEFAULT_MAX_ENTRIES,
  items: new Map(),
};

function readCache<T>(store: CacheStore<T>, key: string): T | null {
  const cached = store.items.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    store.items.delete(key);
    return null;
  }
  return cached.payload;
}

function writeCache<T>(store: CacheStore<T>, key: string, payload: T) {
  store.items.set(key, {
    expiresAt: Date.now() + store.ttlMs,
    payload,
  });

  if (store.items.size <= store.maxEntries) return;

  const oldestKey = store.items.keys().next().value;
  if (oldestKey) {
    store.items.delete(oldestKey);
  }
}

export function buildWorkflowStatusCacheKey(operatorName: string, shopIds: string[]) {
  const normalizedOperator = operatorName.trim();
  const normalizedShopIds = [...new Set(shopIds.map((item) => item.trim()).filter(Boolean))]
    .sort()
    .join(",");
  return `${normalizedOperator}|${normalizedShopIds}`;
}

export function getCachedWorkflowStatus<T>(key: string) {
  return readCache(workflowStatusStore as CacheStore<T>, key);
}

export function setCachedWorkflowStatus<T>(key: string, payload: T) {
  writeCache(workflowStatusStore as CacheStore<T>, key, payload);
}

export function getCachedCompletionMonitor<T>(key: string) {
  return readCache(completionMonitorStore as CacheStore<T>, key);
}

export function setCachedCompletionMonitor<T>(key: string, payload: T) {
  writeCache(completionMonitorStore as CacheStore<T>, key, payload);
}

export function getCachedPatrolAlerts<T>(key: string) {
  return readCache(patrolAlertsStore as CacheStore<T>, key);
}

export function setCachedPatrolAlerts<T>(key: string, payload: T) {
  writeCache(patrolAlertsStore as CacheStore<T>, key, payload);
}

export function getCachedPatrolShops<T>(key: string) {
  return readCache(patrolShopsStore as CacheStore<T>, key);
}

export function setCachedPatrolShops<T>(key: string, payload: T) {
  writeCache(patrolShopsStore as CacheStore<T>, key, payload);
}

/** toggle 进度项后：只清除 workflowStatus 和 completionMonitor */
export function clearWorkflowToggleCaches() {
  workflowStatusStore.items.clear();
  completionMonitorStore.items.clear();
}

/** 巡店操作影响所有缓存，全量清除 */
export function clearWorkflowReadCaches() {
  workflowStatusStore.items.clear();
  completionMonitorStore.items.clear();
  patrolAlertsStore.items.clear();
  patrolShopsStore.items.clear();
}
