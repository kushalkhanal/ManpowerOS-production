import { useState, useCallback } from 'react';
import { departmentsApi } from '../api';

export function useDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await departmentsApi.getAll();
      const data = response.data.data || response.data;
      setDepartments(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch departments');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createDepartment = useCallback(async (data) => {
    const response = await departmentsApi.create(data);
    setDepartments(prev => [...prev, response.data]);
    return response.data;
  }, []);

  const updateDepartment = useCallback(async (id, data) => {
    const response = await departmentsApi.update(id, data);
    setDepartments(prev => prev.map(d => d._id === id ? response.data : d));
    return response.data;
  }, []);

  const deleteDepartment = useCallback(async (id) => {
    await departmentsApi.delete(id);
    setDepartments(prev => prev.filter(d => d._id !== id));
  }, []);

  return {
    departments,
    loading,
    error,
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment
  };
}

export default useDepartments;