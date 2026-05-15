import { useState, useCallback } from 'react';
import { feeApi } from '../api';
import { useAsyncState } from './useAsyncState';

export function useFees() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [candidateSummary, setCandidateSummary] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const { loading, error, execute } = useAsyncState();

  const createTransaction = useCallback((data) =>
    execute(async () => {
      const response = await feeApi.create(data);
      return response.data;
    }, 'Failed to create transaction'),
  [execute]);

  const getTransactions = useCallback((params = {}) =>
    execute(async () => {
      const response = await feeApi.getAll(params);
      setTransactions(response.data.data);
      setPagination({
        total: response.data.total,
        page: response.data.page,
        pages: response.data.pages,
      });
      return response.data;
    }, 'Failed to fetch transactions'),
  [execute]);

  const getSummary = useCallback((params = {}) =>
    execute(async () => {
      const response = await feeApi.getSummary(params);
      setSummary(response.data);
      return response.data;
    }, 'Failed to fetch summary'),
  [execute]);

  const getCandidateSummary = useCallback((candidateId) =>
    execute(async () => {
      const response = await feeApi.getCandidateSummary(candidateId);
      setCandidateSummary(response.data);
      return response.data;
    }, 'Failed to fetch candidate summary'),
  [execute]);

  const updateTransaction = useCallback((id, data) =>
    execute(async () => {
      const response = await feeApi.update(id, data);
      return response.data;
    }, 'Failed to update transaction'),
  [execute]);

  const deleteTransaction = useCallback((id) =>
    execute(() => feeApi.delete(id), 'Failed to delete transaction'),
  [execute]);

  return {
    transactions,
    summary,
    candidateSummary,
    loading,
    error,
    pagination,
    createTransaction,
    getTransactions,
    getSummary,
    getCandidateSummary,
    updateTransaction,
    deleteTransaction,
    setTransactions,
    setSummary,
  };
}

export default useFees;
