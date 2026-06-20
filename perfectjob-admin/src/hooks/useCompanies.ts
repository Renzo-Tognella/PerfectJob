import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApi } from '@/services/api/companyApi';
import type { CompanyInput } from '@/services/api/companyApi';

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: () => companyApi.getAll(),
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: companyApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CompanyInput }) => companyApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: companyApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  });
}
