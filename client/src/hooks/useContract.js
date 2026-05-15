import { useState, useCallback } from 'react';
import contractApi from '../api/contract.api.js';

export function useContract() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getByCandidate = useCallback(async (candidateId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await contractApi.getByCandidate(candidateId);
      setContracts(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch contracts');
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
        if (k === 'contractFile' && v) {
          formData.append(k, v);
        } else if (v !== undefined && v !== null && v !== '') {
          formData.append(k, v);
        }
      });
      const res = await contractApi.create(formData);
      setContracts(prev => [res.data, ...prev]);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create contract');
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
        if (k === 'contractFile' && v) {
          formData.append(k, v);
        } else if (v !== undefined && v !== null && v !== '') {
          formData.append(k, v);
        }
      });
      const res = await contractApi.update(id, formData);
      setContracts(prev => prev.map(c => c._id === id ? res.data : c));
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update contract');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { contracts, loading, error, getByCandidate, create, update };
}

export default useContract;
