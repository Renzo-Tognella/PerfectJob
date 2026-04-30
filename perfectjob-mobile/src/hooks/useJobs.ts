import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { jobApi, type SearchJobParams } from '@/services/api/jobApi';

export const useSearchJobs = (filters: SearchJobParams) => {
  return useInfiniteQuery({
    queryKey: ['jobs', 'search', filters],
    queryFn: ({ pageParam = 0 }) =>
      jobApi.search({ ...filters, page: pageParam, size: 20 }),
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.page.number;
      const totalPages = lastPage.page.totalPages;
      return currentPage + 1 < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 0,
  });
};

export const useJobDetail = (slug: string) => {
  return useQuery({
    queryKey: ['jobs', 'detail', slug],
    queryFn: () => jobApi.getBySlug(slug),
    enabled: !!slug,
  });
};

export const useFeaturedJobs = () => {
  return useQuery({
    queryKey: ['jobs', 'featured'],
    queryFn: () => jobApi.getFeatured(),
  });
};

export const useSearchSuggestions = (prefix: string) => {
  return useQuery({
    queryKey: ['jobs', 'suggestions', prefix],
    queryFn: () => jobApi.suggest(prefix),
    enabled: prefix.length >= 2,
  });
};
