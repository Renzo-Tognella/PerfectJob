import {
  useInfiniteQuery, useMutation, useQuery, useQueryClient,
} from '@tanstack/react-query';
import { resumeApi } from '@/services/api/resumeApi';
import type { GenerateResumeRequest, ResumeResponse, ResumeDetailResponse } from '@/types/resume';
import { useIsBackendReachable } from '@/hooks/useHealthCheck';

export class BackendUnreachableError extends Error {
  constructor() {
    super('Sem conexão com o servidor');
    this.name = 'BackendUnreachableError';
  }
}

export function useResumes() {
  return useInfiniteQuery<import('@/types/page').PageResponse<ResumeResponse>, Error>({
    queryKey: ['resumes', 'list'],
    queryFn: ({ pageParam = 0 }) => resumeApi.list(pageParam as number),
    getNextPageParam: (last) => (last.number < last.totalPages - 1 ? last.number + 1 : undefined),
    initialPageParam: 0,
  });
}

export function useGenerateResume() {
  const queryClient = useQueryClient();
  const reachable = useIsBackendReachable();
  return useMutation<ResumeResponse, Error, GenerateResumeRequest>({
    mutationFn: (req) => {
      if (!reachable) return Promise.reject(new BackendUnreachableError());
      return resumeApi.generate(req);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    },
  });
}

export function useResumeDetail(resumeId: number | undefined) {
  return useQuery<ResumeDetailResponse, Error>({
    queryKey: ['resumes', 'detail', resumeId],
    queryFn: () => resumeApi.getDetail(resumeId as number),
    enabled: !!resumeId,
  });
}

export function useDeleteResume() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => resumeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    },
  });
}
