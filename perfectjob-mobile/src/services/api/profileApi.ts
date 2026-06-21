import apiClient from './client';
import type {
  ProfileResponse,
  ResumeAnalysisResponse,
  UpdateProfilePayload,
} from '@/types/profile';

export interface ResumeFile {
  uri: string;
  name: string;
  mimeType?: string | null;
}

export const profileApi = {
  getMe: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get<ProfileResponse>('/v1/profile/me');
    return response.data;
  },

  update: async (payload: UpdateProfilePayload): Promise<ProfileResponse> => {
    const response = await apiClient.patch<ProfileResponse>('/v1/profile/me', payload);
    return response.data;
  },

  uploadResume: async (file: ResumeFile): Promise<ResumeAnalysisResponse> => {
    const form = new FormData();
    // React Native FormData file shape
    form.append('file', {
      uri: file.uri,
      name: file.name || 'curriculo.pdf',
      type: file.mimeType || 'application/pdf',
    } as unknown as Blob);

    const response = await apiClient.post<ResumeAnalysisResponse>(
      '/v1/profile/me/resume',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },
};
