import { useState, useCallback } from 'react';
import { staffApi } from '../api';
import { useAsyncState } from './useAsyncState';
import { devError } from '../utils/devLog';

export function useStaff() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [currentUser, setCurrentUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [assignedCandidates, setAssignedCandidates] = useState([]);
  const { loading, error, execute } = useAsyncState();

  const getUsers = useCallback((params = {}) =>
    execute(async () => {
      const response = await staffApi.getAll(params);
      setUsers(response.data.data);
      setPagination({
        total: response.data.total,
        page: response.data.page,
        pages: response.data.pages,
      });
      return response.data;
    }, 'Failed to fetch users'),
  [execute]);

  const getUserById = useCallback((id) =>
    execute(async () => {
      const response = await staffApi.getById(id);
      setCurrentUser(response.data);
      return response.data;
    }, 'Failed to fetch user'),
  [execute]);

  const getUserActivity = useCallback(async (id) => {
    try {
      const response = await staffApi.getActivity(id);
      setActivities(response.data);
      return response.data;
    } catch (err) {
      devError('Failed to fetch activity:', err);
      return [];
    }
  }, []);

  const getUserCandidates = useCallback(async (id) => {
    try {
      const response = await staffApi.getCandidates(id);
      setAssignedCandidates(response.data);
      return response.data;
    } catch (err) {
      devError('Failed to fetch candidates:', err);
      return [];
    }
  }, []);

  const inviteUser = useCallback((data) =>
    execute(async () => {
      const response = await staffApi.invite(data);
      setUsers(prev => [...prev, response.data.user]);
      return response.data;
    }, 'Failed to invite user'),
  [execute]);

  const updateUser = useCallback((id, data) =>
    execute(async () => {
      const response = await staffApi.update(id, data);
      setUsers(prev => prev.map(u => u._id === id ? response.data : u));
      setCurrentUser(response.data);
      return response.data;
    }, 'Failed to update user'),
  [execute]);

  const toggleUser = useCallback((id) =>
    execute(async () => {
      const response = await staffApi.toggle(id);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !u.isActive } : u));
      return response.data;
    }, 'Failed to toggle user'),
  [execute]);

  const deleteUser = useCallback((id) =>
    execute(async () => {
      await staffApi.delete(id);
      setUsers(prev => prev.filter(u => u._id !== id));
    }, 'Failed to delete user'),
  [execute]);

  return {
    users,
    pagination,
    currentUser,
    activities,
    assignedCandidates,
    loading,
    error,
    getUsers,
    getUserById,
    getUserActivity,
    getUserCandidates,
    inviteUser,
    updateUser,
    toggleUser,
    deleteUser,
    setUsers,
    setCurrentUser,
  };
}

export default useStaff;
