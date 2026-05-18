import { useState, useCallback } from 'react';
import visaApi from '../api/visa.api.js';

export function useVisa() {
  const [visaApplications, setVisaApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getByCandidate = useCallback(async (candidateId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await visaApi.getByCandidate(candidateId);
      setVisaApplications(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch visa applications');
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
        if (k === 'visaFile' && v) {
          formData.append(k, v);
        } else if (v !== undefined && v !== null && v !== '') {
          formData.append(k, v);
        }
      });
      const res = await visaApi.create(formData);
      setVisaApplications(prev => [res.data, ...prev]);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create visa application');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id, data, fileType) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if ((k === 'visaFile' || k === 'eStickerFile') && v) {
          formData.append(k, v);
        } else if (v !== undefined && v !== null && v !== '') {
          formData.append(k, v);
        }
      });
      const res = await visaApi.update(id, formData, fileType);
      setVisaApplications(prev => prev.map(a => a._id === id ? res.data : a));
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update visa application');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { visaApplications, loading, error, getByCandidate, create, update };
}

export default useVisa;
