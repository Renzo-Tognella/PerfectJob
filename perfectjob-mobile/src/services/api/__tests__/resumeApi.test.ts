jest.mock('@/services/api/client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///doc/',
  downloadAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
}));

jest.mock('@/config/env', () => ({
  ENV: { API_URL: 'http://example.test/api' },
}));

import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { resumeApi, isResumePdfError } from '@/services/api/resumeApi';

const mockedFS = FileSystem as jest.Mocked<typeof FileSystem>;
const mockedStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('resumeApi.getPdfUri content-type validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedStore.getItemAsync.mockResolvedValue('token-abc');
  });

  it('throws ResumePdfError(reason=content-type) when Content-Type is text/html', async () => {
    mockedFS.downloadAsync.mockResolvedValue({
      uri: 'file:///doc/resume-1.pdf',
      status: 200,
      headers: { 'content-type': 'text/html' },
    } as any);
    mockedFS.getInfoAsync.mockResolvedValue({ exists: true, size: 1234 } as any);

    await expect(resumeApi.getPdfUri(1)).rejects.toMatchObject({
      name: 'ResumePdfError',
      reason: 'content-type',
      status: 200,
    });
  });

  it('throws ResumePdfError(reason=empty-body) when downloaded file is 0 bytes', async () => {
    mockedFS.downloadAsync.mockResolvedValue({
      uri: 'file:///doc/resume-2.pdf',
      status: 200,
      headers: { 'content-type': 'application/pdf' },
    } as any);
    mockedFS.getInfoAsync.mockResolvedValue({ exists: true, size: 0 } as any);

    await expect(resumeApi.getPdfUri(2)).rejects.toMatchObject({
      reason: 'empty-body',
    });
  });

  it('throws ResumePdfError(reason=http) when status >= 400', async () => {
    mockedFS.downloadAsync.mockResolvedValue({
      uri: 'file:///doc/resume-3.pdf',
      status: 404,
      headers: {},
    } as any);

    await expect(resumeApi.getPdfUri(3)).rejects.toMatchObject({
      reason: 'http',
      status: 404,
    });
  });

  it('returns local URI when Content-Type is application/pdf and size > 0', async () => {
    mockedFS.downloadAsync.mockResolvedValue({
      uri: 'file:///doc/resume-4.pdf',
      status: 200,
      headers: { 'Content-Type': 'application/pdf' },
    } as any);
    mockedFS.getInfoAsync.mockResolvedValue({ exists: true, size: 9999 } as any);

    const uri = await resumeApi.getPdfUri(4);
    expect(uri).toBe('file:///doc/resume-4.pdf');
  });

  it('isResumePdfError narrows correctly', async () => {
    mockedFS.downloadAsync.mockResolvedValue({
      uri: 'x', status: 500, headers: {},
    } as any);
    try {
      await resumeApi.getPdfUri(5);
      fail('should have thrown');
    } catch (e) {
      expect(isResumePdfError(e)).toBe(true);
    }
  });
});
