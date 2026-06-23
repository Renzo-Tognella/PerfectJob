jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
  useInfiniteQuery: jest.fn(),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(() => ({ invalidateQueries: jest.fn() })),
}));

jest.mock('@/services/api/resumeApi', () => ({
  resumeApi: {
    list: jest.fn(),
    generate: jest.fn(),
    getDetail: jest.fn(),
    getPdfUri: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@/hooks/useHealthCheck', () => ({
  useHealthCheck: jest.fn(),
  useIsBackendReachable: jest.fn(),
}));

import { useMutation } from '@tanstack/react-query';
import { resumeApi } from '@/services/api/resumeApi';
import { useIsBackendReachable } from '@/hooks/useHealthCheck';
import { useGenerateResume, BackendUnreachableError } from '@/hooks/useResumes';

const useMutationMock = useMutation as unknown as jest.Mock;
const useReachableMock = useIsBackendReachable as unknown as jest.Mock;

describe('useGenerateResume early-return when offline', () => {
  let capturedMutationFn: ((req: { jobId: number }) => Promise<unknown>) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedMutationFn = null;
    useMutationMock.mockImplementation((opts: any) => {
      capturedMutationFn = opts.mutationFn;
      return { mutate: jest.fn(), mutateAsync: opts.mutationFn };
    });
  });

  it('rejects with BackendUnreachableError when backend is not reachable', async () => {
    useReachableMock.mockReturnValue(false);
    useGenerateResume();

    expect(capturedMutationFn).not.toBeNull();
    await expect(capturedMutationFn!({ jobId: 7 })).rejects.toBeInstanceOf(BackendUnreachableError);
    expect(resumeApi.generate).not.toHaveBeenCalled();
  });

  it('delegates to resumeApi.generate when backend is reachable', async () => {
    useReachableMock.mockReturnValue(true);
    const fakeResume = { id: 99, jobId: 7, jobTitle: 'X', pdfStoragePath: 'p', createdAt: '2026-01-01', updatedAt: '2026-01-01' };
    (resumeApi.generate as jest.Mock).mockResolvedValue(fakeResume);
    useGenerateResume();

    const result = await capturedMutationFn!({ jobId: 7 });
    expect(result).toEqual(fakeResume);
    expect(resumeApi.generate).toHaveBeenCalledWith({ jobId: 7 });
  });
});
