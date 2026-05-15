import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '../../api';

export const staffKeys = {
  all: ['staff'],
  lists: () => [...staffKeys.all, 'list'],
  list: (filters) => [...staffKeys.lists(), { filters }],
  details: () => [...staffKeys.all, 'detail'],
  detail: (id) => [...staffKeys.details(), id],
};

export const useStaff = (params = {}) => {
  return useQuery({
    queryKey: staffKeys.list(params),
    queryFn: async () => {
      const response = await staffApi.getAll(params);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useStaffDetail = (id) => {
  return useQuery({
    queryKey: staffKeys.detail(id),
    queryFn: async () => {
      const response = await staffApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useInviteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => staffApi.invite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
    },
  });
};

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => staffApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(variables.id) });
    },
  });
};
