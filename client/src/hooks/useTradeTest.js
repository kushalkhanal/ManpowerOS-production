import { useState, useCallback } from 'react';
import tradeTestApi from '../api/tradeTest.api.js';

export function useTradeTest() {
  const [tradeTests, setTradeTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getByCandidate = useCallback(async (candidateId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await tradeTestApi.getByCandidate(candidateId);
      setTradeTests(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch trade test records');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (k === 'certificateFile' && v) {
          formData.append(k, v);
        } else if (v !== undefined && v !== null && v !== '') {
          formData.append(k, v);
        }
      });
      const res = await tradeTestApi.create(formData);
      setTradeTests(prev => [res.data, ...prev]);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create trade test record');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (k === 'certificateFile' && v) {
          formData.append(k, v);
        } else if (v !== undefined && v !== null && v !== '') {
          formData.append(k, v);
        }
      });
      const res = await tradeTestApi.update(id, formData);
      setTradeTests(prev => prev.map(t => t._id === id ? res.data : t));
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update trade test record');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { tradeTests, loading, error, getByCandidate, create, update };
}

export default useTradeTest;
