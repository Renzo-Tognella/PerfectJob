import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savedJobApi } from '@/services/api/savedJobApi';

export function useSavedJobs() {
  return useInfiniteQuery({
    queryKey: ['saved-jobs'],
    queryFn: ({ pageParam = 0 }) => savedJobApi.list(pageParam),
    getNextPageParam: (last) => last.number < last.totalPages - 1 ? last.number + 1 : undefined,
    initialPageParam: 0,
  });
}

export function useIsJobSaved(jobId: number) {
  return useQuery({
    queryKey: ['saved-jobs', 'check', jobId],
    queryFn: () => savedJobApi.check(jobId),
    enabled: !!jobId,
  });
}

export function useToggleSavedJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, isSaved }: { jobId: number; isSaved: boolean }) =>
      isSaved ? savedJobApi.unsave(jobId) : savedJobApi.save(jobId),
    onMutate: async ({ jobId, isSaved }) => {
      await queryClient.cancelQueries({ queryKey: ['saved-jobs', 'check', jobId] });
      const previous = queryClient.getQueryData<boolean>(['saved-jobs', 'check', jobId]);
      queryClient.setQueryData(['saved-jobs', 'check', jobId], !isSaved);
      return { previous };
    },
    onError: (_err, { jobId }, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['saved-jobs', 'check', jobId], context.previous);
      }
    },
    onSettled: (_data, _err, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs', 'check', jobId] });
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
    },
  });
}
