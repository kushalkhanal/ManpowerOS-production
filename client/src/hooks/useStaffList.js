// Lightweight hook for fetching a flat staff list for dropdowns/lookups.
// Use useStaff for full staff management (CRUD, pagination, etc.)
import { useState, useCallback } from 'react';
import { staffApi } from '../api';
import { devError } from '../utils/devLog';

export function useStaffList(limit = 100) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadStaff = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await staffApi.getAll({ limit, ...params });
      setStaffList(response.data.data || []);
      return response.data.data || [];
    } catch (err) {
      devError('Failed to load staff list:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [limit]);

  return { staffList, loading, loadStaff };
}

export default useStaffList;
