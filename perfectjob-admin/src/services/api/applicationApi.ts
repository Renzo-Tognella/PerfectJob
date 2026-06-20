import { apiClient } from './client';
import type { PageResponse } from '@/types/page';
import type { ApplicationResponse, ApplicationStatus } from '@/types/application';

export const applicationApi = {
  getRecent: (): Promise<ApplicationResponse[]> =>
    apiClient.get<ApplicationResponse[]>('/v1/applications/recent').then((r) => r.data),

  getByJob: (jobId: number): Promise<PageResponse<ApplicationResponse>> =>
    apiClient
      .get<PageResponse<ApplicationResponse>>(`/v1/applications/job/${jobId}`)
      .then((r) => r.data),

  updateStatus: (id: number, status: ApplicationStatus): Promise<ApplicationResponse> =>
    apiClient
      .patch<ApplicationResponse>(`/v1/applications/${id}/status`, { status })
      .then((r) => r.data),
};
