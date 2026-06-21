import apiClient from './client';
import type { JobResponse } from '@/types/job';
import type { PageResponse } from '@/types/page';
import type { SkillCount } from '@/types/skill';

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

  getFeatured: async (): Promise<PageResponse<JobResponse>> => {
    const response = await apiClient.get<PageResponse<JobResponse>>('/v1/jobs/featured')
    return response.data
  },

  getTrendingSkills: async (limit = 10): Promise<SkillCount[]> => {
    const response = await apiClient.get<SkillCount[]>('/v1/jobs/trending-skills', {
      params: { limit },
    })
    return response.data
  },
};
