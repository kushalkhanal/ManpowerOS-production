import { useState, useEffect, useCallback } from 'react';
import feimsApi from '../api/feims.api.js';

/**
 * Fetches and caches the pipeline stage tracker data for a candidate.
 *
 * @param {string} candidateId
 * @returns {{ data, loading, error, refetch }}
 */
export function usePipeline(candidateId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!candidateId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await feimsApi.getCandidateStatus(candidateId);
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pipeline status');
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export default usePipeline;
