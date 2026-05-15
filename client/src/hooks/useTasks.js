import { useState, useCallback } from 'react';
import { taskApi } from '../api';
import { useAsyncState } from './useAsyncState';

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0, myTasks: 0 });
  const { loading, error, execute } = useAsyncState();

  const getTasks = useCallback((params = {}) =>
    execute(async () => {
      const response = await taskApi.getAll(params);
      setTasks(response.data.data);
      return response.data;
    }, 'Failed to fetch tasks'),
  [execute]);

  const getMyTasks = useCallback((params = {}) =>
    execute(async () => {
      const response = await taskApi.getMyTasks(params);
      setMyTasks(response.data);
      return response.data;
    }, 'Failed to fetch my tasks'),
  [execute]);

  const getStats = useCallback(async () => {
    try {
      const response = await taskApi.getStats();
      setStats(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch task stats:', err);
      return stats;
    }
  }, [stats]);

  const createTask = useCallback((data) =>
    execute(async () => {
      const response = await taskApi.create(data);
      setTasks(prev => [response.data, ...prev]);
      return response.data;
    }, 'Failed to create task'),
  [execute]);

  const updateTask = useCallback((id, data) =>
    execute(async () => {
      const response = await taskApi.update(id, data);
      setTasks(prev => prev.map(t => t._id === id ? response.data : t));
      setMyTasks(prev => prev.map(t => t._id === id ? response.data : t));
      return response.data;
    }, 'Failed to update task'),
  [execute]);

  const updateTaskStatus = useCallback((id, status, notes) =>
    execute(async () => {
      const response = await taskApi.updateStatus(id, { status, notes });
      setTasks(prev => prev.map(t => t._id === id ? response.data : t));
      setMyTasks(prev => prev.map(t => t._id === id ? response.data : t));
      return response.data;
    }, 'Failed to update task status'),
  [execute]);

  const deleteTask = useCallback((id) =>
    execute(async () => {
      await taskApi.delete(id);
      setTasks(prev => prev.filter(t => t._id !== id));
      setMyTasks(prev => prev.filter(t => t._id !== id));
    }, 'Failed to delete task'),
  [execute]);

  return {
    tasks,
    myTasks,
    stats,
    loading,
    error,
    getTasks,
    getMyTasks,
    getStats,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
  };
}

export default useTasks;
