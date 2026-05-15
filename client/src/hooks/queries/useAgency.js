import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi, departmentsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

export const agencyKeys = {
  all: ['agencies'],
  current: () => [...agencyKeys.all, 'current'],
  departments: () => [...agencyKeys.all, 'departments'],
};

export const useAgencySettings = () => {
  const { agency } = useAuth();
  return useQuery({
    queryKey: agencyKeys.current(),
    queryFn: async () => {
      const response = await settingsApi.getById(agency._id);
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!agency?._id,
  });
};

export const useUpdateAgencySettings = () => {
  const { agency } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => settingsApi.update(agency._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agencyKeys.current() });
    },
  });
};

export const useDepartments = () => {
  return useQuery({
    queryKey: agencyKeys.departments(),
    queryFn: async () => {
      const response = await departmentsApi.getAll();
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => departmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agencyKeys.departments() });
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => departmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agencyKeys.departments() });
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => departmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agencyKeys.departments() });
    },
  });
};
