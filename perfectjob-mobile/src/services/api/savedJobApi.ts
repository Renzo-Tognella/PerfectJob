import apiClient from './client';
import type { PageResponse } from '@/types/page';
import type { JobResponse } from '@/types/job';
import type { SavedJobResponse } from '@/types/savedJob';

export const savedJobApi = {
  save: (jobId: number) =>
    apiClient.post<SavedJobResponse>('/v1/saved-jobs', { jobId }).then(r => r.data),

  unsave: (jobId: number) =>
    apiClient.delete<void>(`/v1/saved-jobs/${jobId}`).then(() => undefined),

  list: (page = 0, size = 20) =>
    apiClient.get<PageResponse<JobResponse>>(`/v1/saved-jobs?page=${page}&size=${size}`).then(r => r.data),

  check: (jobId: number) =>
    apiClient.get<{ saved: boolean }>(`/v1/saved-jobs/${jobId}/check`).then(r => r.data.saved),
};
