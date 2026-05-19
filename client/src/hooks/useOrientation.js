import { useState, useCallback } from 'react';
import { orientationApi } from '../api';
import { toFormData } from '../utils/formData';
import { useAsyncState } from './useAsyncState';
import { devError } from '../utils/devLog';

export function useOrientation() {
  const [orientations, setOrientations] = useState([]);
  const { loading, error, execute } = useAsyncState();

  const getOrientationsByCandidate = useCallback((candidateId) =>
    execute(async () => {
      const response = await orientationApi.getByCandidate(candidateId);
      setOrientations(response.data);
      return response.data;
    }, 'Failed to fetch orientations'),
  [execute]);

  const createOrientation = useCallback((data) =>
    execute(async () => {
      const response = await orientationApi.create(data);
      setOrientations(prev => [response.data, ...prev]);
      return response.data;
    }, 'Failed to create orientation'),
  [execute]);

  const updateOrientation = useCallback((id, data) =>
    execute(async () => {
      const hasFile = data.certificateFile instanceof File;
      const payload = hasFile
        ? toFormData({ ...data, certificate: data.certificateFile, certificateFile: undefined })
        : data;
      const response = hasFile
        ? await orientationApi.updateWithFile(id, payload)
        : await orientationApi.update(id, payload);
      setOrientations(prev => prev.map(o => o._id === id ? response.data : o));
      return response.data;
    }, 'Failed to update orientation'),
  [execute]);

  const getUpcoming = useCallback(async () => {
    try {
      const response = await orientationApi.getUpcoming();
      return response.data;
    } catch (err) {
      devError('Failed to get upcoming orientations:', err);
      return [];
    }
  }, []);

  const getMissingCertificates = useCallback(async () => {
    try {
      const response = await orientationApi.getMissingCertificates();
      return response.data;
    } catch (err) {
      devError('Failed to get missing certificates:', err);
      return [];
    }
  }, []);

  return {
    orientations,
    loading,
    error,
    getOrientationsByCandidate,
    createOrientation,
    updateOrientation,
    getUpcoming,
    getMissingCertificates,
  };
}

export default useOrientation;
