import { useQuery } from '@tanstack/react-query';
import { companyApi } from '@/services/api/companyApi';

export function useCompanies() {
  return useQuery({
    queryKey: ['companies', 'list'],
    queryFn: async () => {
      const page = await companyApi.getAll(0);
      return page.content;
    },
  });
}
