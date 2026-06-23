import apiClient from './client';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import type { PageResponse } from '@/types/page';
import type { GenerateResumeRequest, ResumeResponse, ResumeDetailResponse } from '@/types/resume';
import { ENV } from '@/config/env';

const PDF_GENERATION_TIMEOUT_MS = 180_000; // LLM + LaTeX compile can take ~68s; add cold-start margin.

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

export class ResumePdfError extends Error {
  readonly status: number;
  readonly reason: 'http' | 'content-type' | 'empty-body' | 'download';
  constructor(message: string, status: number, reason: ResumePdfError['reason']) {
    super(message);
    this.name = 'ResumePdfError';
    this.status = status;
    this.reason = reason;
  }
}

export function isResumePdfError(err: unknown): err is ResumePdfError {
  return err instanceof ResumePdfError;
}

function getHeaderCI(headers: Record<string, string> | undefined, name: string): string | undefined {
  if (!headers) return undefined;
  const target = name.toLowerCase();
  for (const k of Object.keys(headers)) {
    if (k.toLowerCase() === target) return headers[k];
  }
  return undefined;
}

/**
 * Downloads the resume PDF to a local file via expo-file-system and returns the
 * local file URI (e.g. file:///.../resume-42.pdf). Uses the JWT bearer from
 * SecureStore because expo-file-system doesn't go through the axios interceptor.
 *
 * Validates:
 *   - HTTP status code (throws ResumePdfError with reason='http')
 *   - Content-Type header is application/pdf (reason='content-type')
 *   - Downloaded file size > 0 bytes (reason='empty-body')
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
    throw new ResumePdfError(
      `Falha ao baixar currículo (status ${downloadRes.status})`,
      downloadRes.status,
      'http',
    );
  }
  const contentType = getHeaderCI(downloadRes.headers as Record<string, string>, 'content-type');
  if (!contentType || !contentType.toLowerCase().includes('application/pdf')) {
    try {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch {
      // best-effort cleanup
    }
    throw new ResumePdfError(
      'Arquivo de currículo inválido. Tente gerar novamente.',
      downloadRes.status,
      'content-type',
    );
  }
  const info = await FileSystem.getInfoAsync(fileUri, { size: true });
  if (!info.exists || (info.size ?? 0) === 0) {
    throw new ResumePdfError(
      'Arquivo de currículo vazio. Tente gerar novamente.',
      downloadRes.status,
      'empty-body',
    );
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
