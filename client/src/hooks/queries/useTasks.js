import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../../api';

export const taskKeys = {
  all: ['tasks'],
  lists: () => [...taskKeys.all, 'list'],
  list: (filters) => [...taskKeys.lists(), { filters }],
  details: () => [...taskKeys.all, 'detail'],
  detail: (id) => [...taskKeys.details(), id],
  mine: (filters) => [...taskKeys.all, 'mine', { filters }],
  candidate: (candidateId) => [...taskKeys.all, 'candidate', candidateId],
  stats: () => [...taskKeys.all, 'stats'],
};

export const useTasks = (params = {}) => {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: async () => {
      const response = await tasksApi.getAll(params);
      return response.data;
    },
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });
};

export const useMyTasks = (params = {}) => {
  return useQuery({
    queryKey: taskKeys.mine(params),
    queryFn: async () => {
      const response = await tasksApi.getMyTasks(params);
      return response.data;
    },
    staleTime: 30 * 1000,
  });
};

export const useTaskDetail = (id) => {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: async () => {
      const response = await tasksApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCandidateTasks = (candidateId) => {
  return useQuery({
    queryKey: taskKeys.candidate(candidateId),
    queryFn: async () => {
      const response = await tasksApi.getByCandidate(candidateId);
      return response.data;
    },
    enabled: !!candidateId,
    staleTime: 30 * 1000,
  });
};

export const useTaskStats = () => {
  return useQuery({
    queryKey: taskKeys.stats(),
    queryFn: async () => {
      const response = await tasksApi.getStats();
      return response.data;
    },
    staleTime: 60 * 1000,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => tasksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.mine() });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => tasksApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.mine() });
    },
  });
};

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => tasksApi.updateStatus(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.mine() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.mine() });
    },
  });
};
