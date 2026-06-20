import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationApi } from '@/services/api/applicationApi';
import type { ApplicationStatus } from '@/types/application';

export function useRecentApplications() {
  return useQuery({
    queryKey: ['applications', 'recent'],
    queryFn: () => applicationApi.getRecent(),
  });
}

export function useApplicationsByJob(jobId: number) {
  return useQuery({
    queryKey: ['applications', 'job', jobId],
    queryFn: () => applicationApi.getByJob(jobId),
    enabled: !!jobId,
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: ApplicationStatus }) =>
      applicationApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
