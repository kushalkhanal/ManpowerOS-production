/**
 * In-process alert cache — 5-minute TTL per agency.
 *
 * Alert computation runs 9+ MongoDB aggregations per request. With a nav
 * badge polling every ~30s, that's ~18 heavy queries/minute/user uncached.
 * This cache cuts nearly all of those to zero at the cost of up to 5 minutes
 * of staleness, which is acceptable for an alert system.
 *
 * Trade-off: single-process only. If the app ever scales to multiple Node
 * instances, replace this with a Redis-backed cache (ioredis + JSON
 * serialization, same TTL). The interface here is intentionally designed to
 * make that swap a 1-file change.
 */

const TTL_MS = 5 * 60 * 1000; // 5 minutes

// Map<agencyIdStr, { data: AlertsResult, expiresAt: number }>
const store = new Map();

/**
 * @returns {{ alerts: object[], total: number } | null}  null = cache miss
 */
export const getCachedAlerts = (agencyId) => {
  const entry = store.get(agencyId.toString());
  if (!entry || Date.now() > entry.expiresAt) {
    store.delete(agencyId.toString()); // evict stale entry
    return null;
  }
  return entry.data;
};

/**
 * @param {string|ObjectId} agencyId
 * @param {{ alerts: object[], total: number }} data
 */
export const setCachedAlerts = (agencyId, data) => {
  store.set(agencyId.toString(), {
    data,
    expiresAt: Date.now() + TTL_MS,
  });
};

/**
 * Call this whenever a write operation could change the alert picture for an
 * agency (candidate status change, medical result update, etc.). Forces the
 * next request to recompute from DB.
 */
export const invalidateAlertCache = (agencyId) => {
  if (agencyId) store.delete(agencyId.toString());
};

/** Expose cache size for health-check endpoints. */
export const alertCacheSize = () => store.size;
