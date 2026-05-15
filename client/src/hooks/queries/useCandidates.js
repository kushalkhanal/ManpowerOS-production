import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidatesApi } from '../../api';

// Query Keys
export const candidateKeys = {
  all: ['candidates'],
  lists: () => [...candidateKeys.all, 'list'],
  list: (filters) => [...candidateKeys.lists(), { filters }],
  details: () => [...candidateKeys.all, 'detail'],
  detail: (id) => [...candidateKeys.details(), id],
};

/**
 * Get candidates list with pagination and filters
 */
export const useCandidates = (params = {}) => {
  return useQuery({
    queryKey: candidateKeys.list(params),
    queryFn: async () => {
      const response = await candidatesApi.getAll(params);
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });
};

/**
 * Get single candidate details
 */
export const useCandidateDetail = (id) => {
  return useQuery({
    queryKey: candidateKeys.detail(id),
    queryFn: async () => {
      const response = await candidatesApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

/**
 * Update candidate
 */
export const useUpdateCandidate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => candidatesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(variables.id) });
    },
  });
};
