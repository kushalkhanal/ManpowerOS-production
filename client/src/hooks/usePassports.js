import { useState, useCallback } from 'react';
import { passportApi, candidatesApi } from '../api';
import { useAsyncState } from './useAsyncState';

export function usePassports() {
  const [passports, setPassports] = useState([]);
  const [currentPassport, setCurrentPassport] = useState(null);
  const [expiringPassports, setExpiringPassports] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, nextCursor: null, hasMore: false });
  const { loading, error, execute } = useAsyncState();

  // append=true → load-more (cursor), append=false → fresh filter/search (reset list)
  const getPassports = useCallback((params = {}, append = false) =>
    execute(async () => {
      const response = await passportApi.getAll({ limit: 20, ...params });
      const { data, total, nextCursor, hasMore } = response.data;
      if (append) {
        setPassports(prev => [...prev, ...data]);
      } else {
        setPassports(data);
      }
      setPagination({ total: total ?? 0, nextCursor: nextCursor ?? null, hasMore: hasMore ?? false });
      return response.data;
    }, 'Failed to fetch passports'),
  [execute]);

  const getPassportById = useCallback((id) =>
    execute(async () => {
      const response = await passportApi.getById(id);
      setCurrentPassport(response.data.passport);
      return response.data;
    }, 'Failed to fetch passport'),
  [execute]);

  const createPassport = useCallback((data) =>
    execute(async () => {
      const response = await passportApi.create(data);
      return response.data;
    }, 'Failed to create passport'),
  [execute]);

  const updatePassport = useCallback((id, data) =>
    execute(async () => {
      const response = await passportApi.update(id, data);
      setCurrentPassport(response.data);
      return response.data;
    }, 'Failed to update passport'),
  [execute]);

  const updatePassportStatus = useCallback((id, data) =>
    execute(async () => {
      const response = await passportApi.updateStatus(id, data);
      setCurrentPassport(response.data);
      return response.data;
    }, 'Failed to update status'),
  [execute]);

  const deletePassport = useCallback((id) =>
    execute(async () => {
      await passportApi.delete(id);
      setPassports(prev => prev.filter(p => p._id !== id));
    }, 'Failed to delete passport'),
  [execute]);

  const getExpiringPassports = useCallback(() =>
    execute(async () => {
      const response = await passportApi.getExpiring();
      setExpiringPassports(response.data);
      return response.data;
    }, 'Failed to fetch expiring passports'),
  [execute]);

  const searchCandidates = useCallback(async (search) => {
    const response = await candidatesApi.getAll({ search, limit: 20 });
    return response.data.data || response.data;
  }, []);

  return {
    passports,
    currentPassport,
    expiringPassports,
    loading,
    error,
    pagination,
    getPassports,
    getPassportById,
    createPassport,
    updatePassport,
    updatePassportStatus,
    deletePassport,
    getExpiringPassports,
    searchCandidates,
  };
}

export default usePassports;
