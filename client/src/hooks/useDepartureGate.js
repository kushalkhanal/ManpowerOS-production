import { useState, useEffect, useCallback } from 'react';
import feimsApi from '../api/feims.api.js';

/**
 * Fetches the departure gate evaluation for a candidate.
 * Re-evaluates on demand so callers can trigger a refresh after updates.
 *
 * @param {string} candidateId
 * @returns {{ data, loading, error, refetch }}
 *
 * data shape:
 *   { ready: boolean, blockers: string[], checks: [{id, label, passed, detail}] }
 */
export function useDepartureGate(candidateId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!candidateId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await feimsApi.getDepartureGate(candidateId);
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load departure gate');
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export default useDepartureGate;
