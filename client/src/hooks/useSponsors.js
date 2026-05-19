import { useState, useCallback } from 'react';
import { sponsorsApi } from '../api/sponsors.api';
import { useAsyncState } from './useAsyncState';
import { devError } from '../utils/devLog';

export function useSponsors() {
  const [sponsors, setSponsors] = useState([]);
  const [currentSponsor, setCurrentSponsor] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const { loading, error, execute } = useAsyncState();

  const getSponsors = useCallback((params = {}) =>
    execute(async () => {
      const response = await sponsorsApi.getAll({ page: 1, limit: 20, ...params });
      setSponsors(response.data.data);
      setPagination({
        total: response.data.total,
        page: response.data.page,
        pages: response.data.pages,
      });
      return response.data;
    }, 'Failed to fetch sponsors'),
  [execute]);

  const getSponsorById = useCallback((id) =>
    execute(async () => {
      const response = await sponsorsApi.getById(id);
      setCurrentSponsor(response.data);
      return response.data;
    }, 'Failed to fetch sponsor'),
  [execute]);

  const createSponsor = useCallback((data) =>
    execute(async () => {
      const response = await sponsorsApi.create(data);
      setSponsors(prev => [response.data, ...prev]);
      return response.data;
    }, 'Failed to create sponsor'),
  [execute]);

  const updateSponsor = useCallback((id, data) =>
    execute(async () => {
      const response = await sponsorsApi.update(id, data);
      setSponsors(prev => prev.map(s => s._id === id ? response.data : s));
      setCurrentSponsor(prev => prev?._id === id ? response.data : prev);
      return response.data;
    }, 'Failed to update sponsor'),
  [execute]);

  const toggleSponsorActive = useCallback((id, isActive, reason) =>
    execute(async () => {
      const response = await sponsorsApi.toggleActive(id, { isActive, deactivatedReason: reason });
      setSponsors(prev => prev.map(s => s._id === id ? response.data : s));
      setCurrentSponsor(prev => prev?._id === id ? response.data : prev);
      return response.data;
    }, 'Failed to toggle sponsor status'),
  [execute]);

  const deleteSponsor = useCallback((id) =>
    execute(async () => {
      await sponsorsApi.delete(id);
      setSponsors(prev => prev.filter(s => s._id !== id));
    }, 'Failed to delete sponsor'),
  [execute]);

  const searchSponsors = useCallback(async (query) => {
    if (!query || query.length < 2) return [];
    try {
      const response = await sponsorsApi.search(query);
      return response.data;
    } catch (err) {
      devError('Search sponsors error:', err);
      return [];
    }
  }, []);

  return {
    sponsors,
    currentSponsor,
    loading,
    error,
    pagination,
    getSponsors,
    getSponsorById,
    createSponsor,
    updateSponsor,
    toggleSponsorActive,
    deleteSponsor,
    searchSponsors,
  };
}
