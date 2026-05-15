import { useState, useCallback } from 'react';
import { alertApi } from '../api';
import { useAsyncState } from './useAsyncState';

export function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [counts, setCounts] = useState({ total: 0, critical: 0, warning: 0, info: 0, byType: {} });
  const [dismissed, setDismissed] = useState({});
  const { loading, error, execute } = useAsyncState();

  const getAlerts = useCallback(() =>
    execute(async () => {
      const response = await alertApi.getAll();
      const fetchedAlerts = response.data.alerts;
      const now = new Date().toDateString();
      const savedDismissed = localStorage.getItem('alerts_dismissed');
      const savedDate = localStorage.getItem('alerts_dismissed_date');
      let currentDismissed = {};

      if (savedDismissed && savedDate === now) {
        currentDismissed = JSON.parse(savedDismissed);
      }

      const filteredAlerts = fetchedAlerts.filter(a => !currentDismissed[a.alertId]);
      setAlerts(filteredAlerts);
      setDismissed(currentDismissed);
      return filteredAlerts;
    }, 'Failed to fetch alerts'),
  [execute]);

  const getCounts = useCallback(async () => {
    try {
      const response = await alertApi.getCounts();
      setCounts(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch alert counts:', err);
      return { total: 0, critical: 0, warning: 0, info: 0, byType: {} };
    }
  }, []);

  const dismissAlert = useCallback((alertId) => {
    const now = new Date().toDateString();
    const newDismissed = { ...dismissed, [alertId]: true };
    setDismissed(newDismissed);
    localStorage.setItem('alerts_dismissed', JSON.stringify(newDismissed));
    localStorage.setItem('alerts_dismissed_date', now);
    setAlerts(prev => prev.filter(a => a.alertId !== alertId));
  }, [dismissed]);

  const dismissAll = useCallback(() => {
    const now = new Date().toDateString();
    const allIds = alerts.reduce((acc, a) => ({ ...acc, [a.alertId]: true }), {});
    setDismissed(allIds);
    localStorage.setItem('alerts_dismissed', JSON.stringify(allIds));
    localStorage.setItem('alerts_dismissed_date', now);
    setAlerts([]);
  }, [alerts]);

  const resetDailyDismiss = useCallback(() => {
    const now = new Date().toDateString();
    const savedDate = localStorage.getItem('alerts_dismissed_date');
    if (savedDate !== now) {
      localStorage.removeItem('alerts_dismissed');
      localStorage.removeItem('alerts_dismissed_date');
      setDismissed({});
    }
  }, []);

  return {
    alerts,
    counts,
    loading,
    error,
    getAlerts,
    getCounts,
    dismissAlert,
    dismissAll,
    resetDailyDismiss,
  };
}

export default useAlerts;
