import { useQuery } from '@tanstack/react-query';
import { resumeApi } from '@/services/api/resumeApi';

export function useResumeStats() {
  return useQuery({
    queryKey: ['resume-stats'],
    queryFn: () => resumeApi.getStats(),
  });
}

export function useResumes(page = 0, size = 20) {
  return useQuery({
    queryKey: ['resumes', page, size],
    queryFn: () => resumeApi.list(page, size),
  });
}

export function useResumesByJob() {
  return useQuery({
    queryKey: ['resumes-by-job'],
    queryFn: () => resumeApi.byJob(),
  });
}
