import { useEffect, useState } from 'react';
import api from '../api/axios.js';

/**
 * ─── Short-circuit detection ─────────────────────────────────────────────────
 * For URLs that don't need server-side signing, we resolve them client-side
 * and skip the network entirely. Saves ~15 round trips per candidate page.
 *
 * Cases that short-circuit:
 *   - Local-disk uploads served from /uploads/ (dev fallback).
 *   - Cloudinary `upload` delivery type — public, no signing needed.
 *
 * Cases that go through the proxy:
 *   - Cloudinary `authenticated` or `private` delivery types.
 *   - Anything we can't confidently classify (fail safe → proxy).
 */
const classifyUrl = (storedUrl) => {
  if (!storedUrl || typeof storedUrl !== 'string') return 'invalid';

  if (storedUrl.startsWith('/uploads/')) return 'passthrough';

  if (storedUrl.includes('res.cloudinary.com')) {
    if (storedUrl.includes('/authenticated/') || storedUrl.includes('/private/')) {
      return 'needs-signing';
    }
    if (storedUrl.includes('/upload/')) return 'passthrough';
  }

  // Unknown shape — let the server decide. Safer than guessing.
  return 'needs-signing';
};

/**
 * ─── Module-scope cache ──────────────────────────────────────────────────────
 * Keyed by stored URL. Holds either a Promise (in-flight) or a resolved value.
 * Same URL rendered N times across the page = 1 network request.
 *
 * Entries are evicted on expiry (with a 30s buffer to avoid mid-render 401s).
 */
const cache = new Map();
const SIGNING_BUFFER_MS = 30_000;

const isFresh = (entry) => {
  if (!entry || typeof entry !== 'object') return false;
  if (entry.then) return true; // in-flight promise — wait for it
  if (!entry.expiresAt) return true; // no expiry → cached forever
  return Date.now() < entry.expiresAt - SIGNING_BUFFER_MS;
};

const cacheGet = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (!isFresh(entry)) {
    cache.delete(key);
    return null;
  }
  return entry;
};

/**
 * Resolve a stored document URL. Hits cache when possible, dedups concurrent
 * requests for the same URL, and short-circuits anything that doesn't need
 * server-side signing.
 *
 * @param {string} storedUrl
 * @returns {Promise<{ url: string, expiresAt: number|null }>}
 */
export const resolveSecureDocUrl = async (storedUrl) => {
  if (!storedUrl) throw new Error('resolveSecureDocUrl: no url');

  const verdict = classifyUrl(storedUrl);
  if (verdict === 'passthrough') {
    return { url: storedUrl, expiresAt: null };
  }

  const cached = cacheGet(storedUrl);
  if (cached) return cached;

  const promise = api
    .get('/secure-files/resolve', { params: { url: storedUrl } })
    .then(({ data }) => {
      cache.set(storedUrl, data);
      return data;
    })
    .catch((err) => {
      // Don't poison the cache on transient errors — let the next caller retry.
      cache.delete(storedUrl);
      throw err;
    });

  cache.set(storedUrl, promise);
  return promise;
};

/**
 * Manually invalidate the cache for a URL — useful after a file is replaced
 * and the parent re-renders with the same URL (rare).
 */
export const invalidateSecureDocUrl = (storedUrl) => {
  if (storedUrl) cache.delete(storedUrl);
};

/**
 * React hook: resolves a stored document URL to a viewable URL, with auto-refresh
 * shortly before the signed URL expires.
 *
 * If the URL is short-circuitable, initial state is the resolved URL — no
 * loading flash. If it needs the proxy and the cache already has it, same.
 * Only true cache misses show `loading: true`.
 */
export const useSecureDocUrl = (storedUrl) => {
  const [state, setState] = useState(() => {
    if (!storedUrl) return { url: null, expiresAt: null, loading: false, error: null };

    const verdict = classifyUrl(storedUrl);
    if (verdict === 'passthrough') {
      return { url: storedUrl, expiresAt: null, loading: false, error: null };
    }

    const cached = cacheGet(storedUrl);
    if (cached && !cached.then) {
      return { url: cached.url, expiresAt: cached.expiresAt, loading: false, error: null };
    }

    return { url: null, expiresAt: null, loading: true, error: null };
  });

  useEffect(() => {
    if (!storedUrl) {
      setState({ url: null, expiresAt: null, loading: false, error: null });
      return undefined;
    }

    const verdict = classifyUrl(storedUrl);
    if (verdict === 'passthrough') {
      setState({ url: storedUrl, expiresAt: null, loading: false, error: null });
      return undefined;
    }

    let cancelled = false;
    let refreshTimer = null;

    const load = async () => {
      try {
        const { url, expiresAt } = await resolveSecureDocUrl(storedUrl);
        if (cancelled) return;
        setState({ url, expiresAt, loading: false, error: null });

        if (expiresAt) {
          const ms = Math.max(expiresAt - Date.now() - SIGNING_BUFFER_MS, 30_000);
          refreshTimer = setTimeout(load, ms);
        }
      } catch (err) {
        if (!cancelled) {
          setState({ url: null, expiresAt: null, loading: false, error: err });
        }
      }
    };

    // Quick sync hit: if the cache has a resolved (non-promise) entry, prefer it.
    const cached = cacheGet(storedUrl);
    if (cached && !cached.then) {
      setState({ url: cached.url, expiresAt: cached.expiresAt, loading: false, error: null });
      if (cached.expiresAt) {
        const ms = Math.max(cached.expiresAt - Date.now() - SIGNING_BUFFER_MS, 30_000);
        refreshTimer = setTimeout(load, ms);
      }
      return () => {
        cancelled = true;
        if (refreshTimer) clearTimeout(refreshTimer);
      };
    }

    setState((prev) => (prev.loading ? prev : { ...prev, loading: true, error: null }));
    load();

    return () => {
      cancelled = true;
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, [storedUrl]);

  return state;
};

export default useSecureDocUrl;
