import { useState, useCallback } from 'react';
import { insuranceSsfApi } from '../api';
import { toFormData } from '../utils/formData';
import { useAsyncState } from './useAsyncState';
import { devError } from '../utils/devLog';

export function useInsuranceSsf() {
  const [record, setRecord] = useState(null);
  const { loading, error, execute } = useAsyncState();

  const getByCandidate = useCallback((candidateId) =>
    execute(async () => {
      const response = await insuranceSsfApi.getByCandidate(candidateId);
      setRecord(response.data);
      return response.data;
    }, 'Failed to fetch insurance/SSF record'),
  [execute]);

  const create = useCallback((data) =>
    execute(async () => {
      const response = await insuranceSsfApi.create(toFormData(data));
      setRecord(response.data);
      return response.data;
    }, 'Failed to create insurance/SSF record'),
  [execute]);

  const update = useCallback((id, data) =>
    execute(async () => {
      const response = await insuranceSsfApi.update(id, toFormData(data));
      setRecord(response.data);
      return response.data;
    }, 'Failed to update insurance/SSF record'),
  [execute]);

  const getExpiring = useCallback(async () => {
    try {
      const response = await insuranceSsfApi.getExpiring();
      return response.data;
    } catch (err) {
      devError('Failed to get expiring insurance:', err);
      return [];
    }
  }, []);

  const getIncompleteFeims = useCallback(async () => {
    try {
      const response = await insuranceSsfApi.getIncompleteFeims();
      return response.data;
    } catch (err) {
      devError('Failed to get incomplete records:', err);
      return [];
    }
  }, []);

  return {
    record,
    loading,
    error,
    getByCandidate,
    create,
    update,
    getExpiring,
    getIncompleteFeims,
  };
}

export default useInsuranceSsf;
