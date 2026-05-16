import { useState, useCallback } from 'react';
import { jobDemandApi } from '../api';
import { useAsyncState } from './useAsyncState';

export function useJobDemands() {
  const [demands, setDemands] = useState([]);
  const [currentDemand, setCurrentDemand] = useState(null);
  const [expiringDemands, setExpiringDemands] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const { loading, error, execute } = useAsyncState();

  const getDemands = useCallback((params = {}) =>
    execute(async () => {
      const response = await jobDemandApi.getAll(params);
      setDemands(response.data.data);
      setPagination({
        total: response.data.total,
        page: response.data.page,
        pages: response.data.pages,
      });
      return response.data;
    }, 'Failed to fetch demands'),
  [execute]);

  const getDemandById = useCallback((id) =>
    execute(async () => {
      const response = await jobDemandApi.getById(id);
      setCurrentDemand(response.data);
      return response.data;
    }, 'Failed to fetch demand'),
  [execute]);

  const createDemand = useCallback((data) =>
    execute(async () => {
      const response = await jobDemandApi.create(data);
      return response.data;
    }, 'Failed to create demand'),
  [execute]);

  const deleteDemand = useCallback((id) =>
    execute(async () => {
      await jobDemandApi.delete(id);
      setDemands(prev => prev.filter(d => d._id !== id));
    }, 'Failed to delete demand'),
  [execute]);

  const updateDemand = useCallback((id, data) =>
    execute(async () => {
      const response = await jobDemandApi.update(id, data);
      setCurrentDemand(response.data);
      return response.data;
    }, 'Failed to update demand'),
  [execute]);

  const assignCandidate = useCallback((demandId, candidateId) =>
    execute(async () => {
      const response = await jobDemandApi.assignCandidate(demandId, candidateId);
      setCurrentDemand(response.data);
      return response.data;
    }, 'Failed to assign candidate'),
  [execute]);

  const removeCandidate = useCallback((demandId, candidateId) =>
    execute(async () => {
      const response = await jobDemandApi.removeCandidate(demandId, candidateId);
      setCurrentDemand(response.data);
      return response.data;
    }, 'Failed to remove candidate'),
  [execute]);

  const getExpiring = useCallback(async () => {
    try {
      const response = await jobDemandApi.getExpiring();
      setExpiringDemands(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to get expiring demands:', err);
      return [];
    }
  }, []);

  const getEligibleCandidates = useCallback(async (demandId) => {
    try {
      const response = await jobDemandApi.getEligibleCandidates(demandId);
      return response.data;
    } catch (err) {
      console.error('Failed to get eligible candidates:', err);
      return [];
    }
  }, []);

  return {
    demands,
    currentDemand,
    expiringDemands,
    loading,
    error,
    pagination,
    getDemands,
    getDemandById,
    createDemand,
    deleteDemand,
    updateDemand,
    assignCandidate,
    removeCandidate,
    getExpiring,
    getEligibleCandidates,
  };
}

export default useJobDemands;
