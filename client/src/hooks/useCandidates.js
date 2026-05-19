import { useState, useCallback } from 'react';
import { candidatesApi } from '../api';
import { useAsyncState } from './useAsyncState';
import { devError } from '../utils/devLog';

export function useCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [currentCandidate, setCurrentCandidate] = useState(null);
  const [agents, setAgents] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const { loading, error, execute } = useAsyncState();

  const getCandidates = useCallback((params = {}) =>
    execute(async () => {
      const response = await candidatesApi.getAll({ page: 1, limit: 20, ...params });
      setCandidates(response.data.data);
      setPagination({
        total: response.data.total,
        page: response.data.page,
        pages: response.data.pages,
      });
      return response.data;
    }, 'Failed to fetch candidates'),
  [execute]);

  const getCandidateById = useCallback((id) =>
    execute(async () => {
      const response = await candidatesApi.getById(id);
      setCurrentCandidate(response.data);
      return response.data;
    }, 'Failed to fetch candidate'),
  [execute]);

  const createCandidate = useCallback((data) =>
    execute(async () => {
      const response = await candidatesApi.create(data);
      return response.data;
    }, 'Failed to create candidate'),
  [execute]);

  const updateCandidate = useCallback((id, data) =>
    execute(async () => {
      const response = await candidatesApi.update(id, data);
      setCurrentCandidate(response.data);
      return response.data;
    }, 'Failed to update candidate'),
  [execute]);

  const deleteCandidate = useCallback((id) =>
    execute(async () => {
      await candidatesApi.delete(id);
      setCandidates(prev => prev.filter(c => c._id !== id));
    }, 'Failed to delete candidate'),
  [execute]);

  const getAgents = useCallback(async () => {
    try {
      const response = await candidatesApi.getAgents();
      setAgents(response.data);
      return response.data;
    } catch (err) {
      devError('Failed to get agents:', err);
      return [];
    }
  }, []);

  return {
    candidates,
    currentCandidate,
    agents,
    loading,
    error,
    pagination,
    getCandidates,
    getCandidateById,
    createCandidate,
    updateCandidate,
    deleteCandidate,
    getAgents,
  };
}

export default useCandidates;
