import apiClient from './client';
import type { JobResponse } from '@/types/job';
import type { PageResponse } from '@/types/page';

export interface SearchJobParams {
  keyword?: string;
  workModel?: string;
  experienceLevel?: string;
  minSalary?: number;
  skills?: string[];
  page?: number;
  size?: number;
}

export const jobApi = {
  search: async (params: SearchJobParams): Promise<PageResponse<JobResponse>> => {
    const response = await apiClient.get('/v1/jobs', { params });
    return response.data;
  },

  getBySlug: async (slug: string): Promise<JobResponse> => {
    const response = await apiClient.get(`/v1/jobs/${slug}`);
    return response.data;
  },

  suggest: async (q: string): Promise<string[]> => {
    const response = await apiClient.get('/v1/jobs/suggest', { params: { q } });
    return response.data;
  },

  getFeatured: async (): Promise<JobResponse[]> => {
    const response = await apiClient.get('/v1/jobs/featured');
    return response.data;
  },
};
