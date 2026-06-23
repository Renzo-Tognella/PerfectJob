import { apiClient } from './client';
import type { PageResponse } from '@/types/page';

export interface Job {
  id: number;
  title: string;
  description: string;
  requirements?: string;
  benefits?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  workModel: string;
  experienceLevel: string;
  jobType: string;
  contractType: string;
  locationCity?: string;
  locationState?: string;
  locationCountry?: string;
  skills: string[];
  status: string;
  views: number;
  applicationsCount: number;
  companyId: number;
  companyName?: string;
  slug?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  externalUrl?: string;
}

export interface JobInput {
  title: string;
  companyId: number;
  description: string;
  requirements?: string;
  benefits?: string;
  salaryMin?: number;
  salaryMax?: number;
  workModel: string;
  experienceLevel: string;
  jobType: string;
  contractType: string;
  locationCity?: string;
  locationState?: string;
  skills: string[];
  expiresAt: string;
  externalUrl?: string;
}

export interface JobStats {
  activeJobs: number;
  totalApplications: number;
  applicationsToday: number;
  totalCompanies: number;
}

export const getAll = async (): Promise<Job[]> => {
  const response = await apiClient.get<PageResponse<Job> | Job[]>('/v1/jobs', {
    params: { size: 100 },
  });
  const data = response.data;
  if (Array.isArray(data)) return data;
  return data.content || [];
};

export const create = async (data: JobInput): Promise<Job> => {
  const payload = {
    ...data,
    skills: data.skills || [],
    expiresAt: data.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
  const response = await apiClient.post<Job>('/v1/jobs', payload);
  return response.data;
};

export const update = async (id: number, data: Partial<JobInput>): Promise<Job> => {
  const payload = {
    ...data,
    skills: data.skills || [],
    expiresAt: data.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
  const response = await apiClient.patch<Job>(`/v1/jobs/${id}`, payload);
  return response.data;
};

export const close = async (id: number): Promise<Job> => {
  const response = await apiClient.post<Job>(`/v1/jobs/${id}/close`);
  return response.data;
};

export const getStats = async (): Promise<JobStats> => {
  const response = await apiClient.get<JobStats>('/v1/jobs/stats');
  return response.data;
};

export const jobApi = {
  getAll,
  create,
  update,
  close,
  getStats,
};
