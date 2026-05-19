import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '../../api';

export const alertKeys = {
  all: ['alerts'],
  list: () => [...alertKeys.all, 'list'],
  counts: () => [...alertKeys.all, 'counts'],
};

export const useAlertsQuery = () => {
  return useQuery({
    queryKey: alertKeys.list(),
    queryFn: async () => {
      const response = await alertsApi.getAll();
      return response.data;
    },
    staleTime: 30 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
};

export const useAlertCounts = () => {
  return useQuery({
    queryKey: alertKeys.counts(),
    queryFn: async () => {
      const response = await alertsApi.getCounts();
      return response.data;
    },
    staleTime: 30 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
};

export const useCreateAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => alertsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.all });
    },
  });
};

export const useDeleteAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => alertsApi.deleteManual(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.all });
    },
  });
};
