import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationApi } from '@/services/api/applicationApi';
import type { SubmitApplicationRequest } from '@/types/application';

export function useMyApplications() {
  return useInfiniteQuery({
    queryKey: ['applications', 'me'],
    queryFn: ({ pageParam = 0 }) => applicationApi.listMyApplications(pageParam),
    getNextPageParam: (last) => last.number < last.totalPages - 1 ? last.number + 1 : undefined,
    initialPageParam: 0,
  });
}

export function useSubmitApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: SubmitApplicationRequest) => applicationApi.submit(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
