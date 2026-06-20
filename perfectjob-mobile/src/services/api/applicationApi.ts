import apiClient from './client';
import type { PageResponse } from '@/types/page';
import type { ApplicationResponse, SubmitApplicationRequest } from '@/types/application';

export { type ApplicationResponse, type SubmitApplicationRequest };

export const applicationApi = {
  listMyApplications: async (page = 0, size = 20): Promise<PageResponse<ApplicationResponse>> => {
    const response = await apiClient.get<PageResponse<ApplicationResponse>>(
      `/v1/applications?page=${page}&size=${size}`
    );
    return response.data;
  },

  submit: async (data: SubmitApplicationRequest): Promise<ApplicationResponse> => {
    const response = await apiClient.post<ApplicationResponse>('/v1/applications', data);
    return response.data;
  },
};
