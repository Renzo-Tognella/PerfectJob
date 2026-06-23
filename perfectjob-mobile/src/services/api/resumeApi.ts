import apiClient from './client';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import type { PageResponse } from '@/types/page';
import type { GenerateResumeRequest, ResumeResponse, ResumeDetailResponse } from '@/types/resume';
import { ENV } from '@/config/env';

const PDF_GENERATION_TIMEOUT_MS = 120_000; // LLM + LaTeX compile is slow

async function list(page: number, size = 20): Promise<PageResponse<ResumeResponse>> {
  const response = await apiClient.get<PageResponse<ResumeResponse>>('/v1/resumes', {
    params: { page, size },
  });
  return response.data;
}

async function generate(data: GenerateResumeRequest): Promise<ResumeResponse> {
  const response = await apiClient.post<ResumeResponse>('/v1/resumes', data, {
    timeout: PDF_GENERATION_TIMEOUT_MS,
  });
  return response.data;
}

async function getDetail(id: number): Promise<ResumeDetailResponse> {
  const response = await apiClient.get<ResumeDetailResponse>(`/v1/resumes/${id}`);
  return response.data;
}

async function deleteResume(id: number): Promise<void> {
  await apiClient.delete(`/v1/resumes/${id}`);
}

/**
 * Downloads the resume PDF to a local file via expo-file-system and returns the
 * local file URI (e.g. file:///.../resume-42.pdf). Uses the JWT bearer from
 * SecureStore because expo-file-system doesn't go through the axios interceptor.
 */
async function getPdfUri(id: number): Promise<string> {
  const token = (await SecureStore.getItemAsync('auth_token')) ?? '';
  const fileUri = `${FileSystem.documentDirectory ?? ''}resume-${id}.pdf`;
  const downloadRes = await FileSystem.downloadAsync(
    `${ENV.API_URL}/v1/resumes/${id}/pdf`,
    fileUri,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  if (downloadRes.status >= 400) {
    throw new Error(`Failed to download resume PDF (status ${downloadRes.status})`);
  }
  return downloadRes.uri;
}

export const resumeApi = {
  list,
  generate,
  getDetail,
  delete: deleteResume,
  getPdfUri,
};
