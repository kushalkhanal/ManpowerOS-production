import { useState, useCallback } from 'react';
import { settingsApi } from '../api';
import { useAuth } from '../context/AuthContext';

export function useSettings() {
  const { agency } = useAuth();
  const [settings, setSettings] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getSettings = useCallback(async () => {
    if (!agency?._id) return null;
    setLoading(true);
    setError(null);
    try {
      const response = await settingsApi.getById(agency._id);
      const data = response.data.data || response.data; // fallback for safety
      setSettings(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch settings');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [agency?._id]);

  const updateSettings = useCallback(async (data) => {
    if (!agency?._id) return null;
    setLoading(true);
    setError(null);
    try {
      const response = await settingsApi.update(agency._id, data);
      const updatedData = response.data.data || response.data;
      setSettings(updatedData);
      return updatedData;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [agency?._id]);

  const getUsage = useCallback(async () => {
    if (!agency?._id) return null;
    setLoading(true);
    setError(null);
    try {
      const response = await settingsApi.getUsage(agency._id);
      const usageData = response.data.data || response.data;
      setUsage(usageData);
      return usageData;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch usage');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [agency?._id]);

  return {
    settings,
    usage,
    loading,
    error,
    getSettings,
    updateSettings,
    getUsage,
    setSettings
  };
}

export default useSettings;