import apiClient from './client';
import type { CompanyResponse } from '@/types/company';
import type { PageResponse } from '@/types/page';

export const companyApi = {
  getAll: async (page?: number): Promise<PageResponse<CompanyResponse>> => {
    const response = await apiClient.get('/v1/companies', {
      params: page !== undefined ? { page } : undefined,
    });
    return response.data;
  },

  getBySlug: async (slug: string): Promise<CompanyResponse> => {
    const response = await apiClient.get(`/v1/companies/${slug}`);
    return response.data;
  },
};
