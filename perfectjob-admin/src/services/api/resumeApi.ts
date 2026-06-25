import { apiClient } from './client';
import type { PageResponse } from '@/types/page';
import type { AdminResume, AdminResumeStats, ResumeCountByJob } from '@/types/resume';

export const getStats = async (): Promise<AdminResumeStats> => {
  const response = await apiClient.get<AdminResumeStats>('/v1/admin/resumes/stats');
  return response.data;
};

export const list = async (page = 0, size = 20): Promise<PageResponse<AdminResume>> => {
  const response = await apiClient.get<PageResponse<AdminResume>>('/v1/admin/resumes', {
    params: { page, size },
  });
  return response.data;
};

export const byJob = async (): Promise<ResumeCountByJob[]> => {
  const response = await apiClient.get<ResumeCountByJob[]>('/v1/admin/resumes/by-job');
  return response.data;
};

export const resumeApi = {
  getStats,
  list,
  byJob,
};
