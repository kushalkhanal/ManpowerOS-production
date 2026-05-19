import { useState, useCallback } from 'react';
import { agencyDocApi } from '../api';
import { useAsyncState } from './useAsyncState';
import { devError } from '../utils/devLog';

export function useAgencyDocuments() {
  const [documents, setDocuments] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [expiringDocs, setExpiringDocs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const { loading, error, execute } = useAsyncState();

  const getDocuments = useCallback((params = {}) =>
    execute(async () => {
      const response = await agencyDocApi.getAll(params);
      setDocuments(response.data.data);
      setCategoryCounts(response.data.categoryCounts || {});
      setPagination({
        total: response.data.total,
        page: response.data.page,
        pages: response.data.pages,
      });
      return response.data;
    }, 'Failed to fetch documents'),
  [execute]);

  const getExpiringDocuments = useCallback(async (days = 60) => {
    try {
      const response = await agencyDocApi.getExpiring({ days });
      setExpiringDocs(response.data);
      return response.data;
    } catch (err) {
      devError('Failed to fetch expiring documents:', err);
      return [];
    }
  }, []);

  const createDocument = useCallback((data) =>
    execute(async () => {
      const response = await agencyDocApi.create(data);
      setDocuments(prev => [response.data, ...prev]);
      return response.data;
    }, 'Failed to create document'),
  [execute]);

  const updateDocument = useCallback((id, data) =>
    execute(async () => {
      const response = await agencyDocApi.update(id, data);
      setDocuments(prev => prev.map(d => d._id === id ? response.data : d));
      return response.data;
    }, 'Failed to update document'),
  [execute]);

  const deleteDocument = useCallback((id) =>
    execute(async () => {
      await agencyDocApi.delete(id);
      setDocuments(prev => prev.filter(d => d._id !== id));
    }, 'Failed to delete document'),
  [execute]);

  const downloadDocument = useCallback(async (id, fileName) => {
    try {
      const response = await agencyDocApi.download(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'document');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      devError('Download failed:', err);
      throw err;
    }
  }, []);

  return {
    documents,
    categoryCounts,
    expiringDocs,
    loading,
    error,
    pagination,
    getDocuments,
    getExpiringDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    downloadDocument,
  };
}

export default useAgencyDocuments;
