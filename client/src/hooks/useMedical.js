import { useState, useCallback } from 'react';
import { medicalApi } from '../api';
import { toFormData } from '../utils/formData';
import { useAsyncState } from './useAsyncState';

export function useMedical() {
  const [medicals, setMedicals] = useState([]);
  const [expiringMedicals, setExpiringMedicals] = useState([]);
  const { loading, error, execute } = useAsyncState();

  const getMedicalByCandidate = useCallback((candidateId) =>
    execute(async () => {
      const response = await medicalApi.getByCandidate(candidateId);
      setMedicals(response.data);
      return response.data;
    }, 'Failed to fetch medical records'),
  [execute]);

  const createMedical = useCallback((data) =>
    execute(async () => {
      const response = await medicalApi.create(toFormData(data, true));
      setMedicals(prev => [response.data, ...prev]);
      return response.data;
    }, 'Failed to create medical record'),
  [execute]);

  const updateMedical = useCallback((id, data) =>
    execute(async () => {
      const response = await medicalApi.update(id, toFormData(data, true));
      setMedicals(prev => prev.map(m => m._id === id ? response.data : m));
      return response.data;
    }, 'Failed to update medical record'),
  [execute]);

  const getExpiringMedicals = useCallback(() =>
    execute(async () => {
      const response = await medicalApi.getExpiring();
      setExpiringMedicals(response.data);
      return response.data;
    }, 'Failed to fetch expiring medicals'),
  [execute]);

  const getRechecks = useCallback(async () => {
    try {
      const response = await medicalApi.getRechecks();
      return response.data;
    } catch (err) {
      console.error('Failed to get rechecks:', err);
      return [];
    }
  }, []);

  return {
    medicals,
    expiringMedicals,
    loading,
    error,
    getMedicalByCandidate,
    createMedical,
    updateMedical,
    getExpiringMedicals,
    getRechecks,
  };
}

export default useMedical;
