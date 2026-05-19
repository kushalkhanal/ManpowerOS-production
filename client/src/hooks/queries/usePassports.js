import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { passportsApi } from '../../api';

export const passportKeys = {
  all: ['passports'],
  lists: () => [...passportKeys.all, 'list'],
  list: (filters) => [...passportKeys.lists(), { filters }],
  details: () => [...passportKeys.all, 'detail'],
  detail: (id) => [...passportKeys.details(), id],
  expiring: () => [...passportKeys.all, 'expiring'],
};

export const usePassports = (params = {}) => {
  return useQuery({
    queryKey: passportKeys.list(params),
    queryFn: async () => {
      const response = await passportsApi.getAll(params);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
};

export const usePassportDetail = (id) => {
  return useQuery({
    queryKey: passportKeys.detail(id),
    queryFn: async () => {
      const response = await passportsApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useExpiringPassports = () => {
  return useQuery({
    queryKey: passportKeys.expiring(),
    queryFn: async () => {
      const response = await passportsApi.getExpiring();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreatePassport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => passportsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: passportKeys.lists() });
    },
  });
};

export const useUpdatePassport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => passportsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: passportKeys.lists() });
      queryClient.invalidateQueries({ queryKey: passportKeys.detail(variables.id) });
    },
  });
};

export const useUpdatePassportStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => passportsApi.updateStatus(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: passportKeys.lists() });
      queryClient.invalidateQueries({ queryKey: passportKeys.detail(variables.id) });
    },
  });
};

export const useDeletePassport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => passportsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: passportKeys.lists() });
    },
  });
};
