import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { demandsApi } from '../../api';

export const demandKeys = {
  all: ['demands'],
  lists: () => [...demandKeys.all, 'list'],
  list: (filters) => [...demandKeys.lists(), { filters }],
  details: () => [...demandKeys.all, 'detail'],
  detail: (id) => [...demandKeys.details(), id],
  expiring: () => [...demandKeys.all, 'expiring'],
  eligible: (id) => [...demandKeys.detail(id), 'eligible'],
};

export const useDemands = (params = {}) => {
  return useQuery({
    queryKey: demandKeys.list(params),
    queryFn: async () => {
      const response = await demandsApi.getAll(params);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
};

export const useDemandDetail = (id) => {
  return useQuery({
    queryKey: demandKeys.detail(id),
    queryFn: async () => {
      const response = await demandsApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useExpiringDemands = () => {
  return useQuery({
    queryKey: demandKeys.expiring(),
    queryFn: async () => {
      const response = await demandsApi.getExpiring();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useEligibleCandidates = (demandId) => {
  return useQuery({
    queryKey: demandKeys.eligible(demandId),
    queryFn: async () => {
      const response = await demandsApi.getEligibleCandidates(demandId);
      return response.data;
    },
    enabled: !!demandId,
  });
};

export const useCreateDemand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => demandsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: demandKeys.lists() });
    },
  });
};

export const useUpdateDemand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => demandsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: demandKeys.lists() });
      queryClient.invalidateQueries({ queryKey: demandKeys.detail(variables.id) });
    },
  });
};

export const useDeleteDemand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => demandsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: demandKeys.lists() });
    },
  });
};

export const useAssignCandidate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ demandId, candidateId }) => demandsApi.assignCandidate(demandId, candidateId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: demandKeys.detail(variables.demandId) });
    },
  });
};

export const useRemoveCandidate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ demandId, candidateId }) => demandsApi.removeCandidate(demandId, candidateId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: demandKeys.detail(variables.demandId) });
    },
  });
};
