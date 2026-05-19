import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feeApi } from '../../api';

export const feeKeys = {
  all: ['fees'],
  lists: () => [...feeKeys.all, 'list'],
  list: (filters) => [...feeKeys.lists(), { filters }],
  details: () => [...feeKeys.all, 'detail'],
  detail: (id) => [...feeKeys.details(), id],
  summary: (filters) => [...feeKeys.all, 'summary', { filters }],
  candidate: (candidateId) => [...feeKeys.all, 'candidate', candidateId],
};

export const useFees = (params = {}) => {
  return useQuery({
    queryKey: feeKeys.list(params),
    queryFn: async () => {
      const response = await feeApi.getAll(params);
      return response.data;
    },
    staleTime: 1 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
};

export const useFeeDetail = (id) => {
  return useQuery({
    queryKey: feeKeys.detail(id),
    queryFn: async () => {
      const response = await feeApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useFeeSummary = (params = {}) => {
  return useQuery({
    queryKey: feeKeys.summary(params),
    queryFn: async () => {
      const response = await feeApi.getSummary(params);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useCandidateFeeSummary = (candidateId) => {
  return useQuery({
    queryKey: feeKeys.candidate(candidateId),
    queryFn: async () => {
      const response = await feeApi.getCandidateSummary(candidateId);
      return response.data;
    },
    enabled: !!candidateId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateFee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => feeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: feeKeys.all });
    },
  });
};

export const useUpdateFee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => feeApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: feeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: feeKeys.detail(variables.id) });
    },
  });
};

export const useDeleteFee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => feeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feeKeys.lists() });
    },
  });
};
