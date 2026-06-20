import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { jobApi, type SearchJobParams } from '@/services/api/jobApi'
import { toJob } from '@/services/api/mappers'
import type { Job } from '@/types'

export const useSearchJobs = (filters: SearchJobParams) => {
  return useInfiniteQuery({
    queryKey: ['jobs', 'search', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const page = await jobApi.search({ ...filters, page: pageParam, size: 20 })
      return {
        jobs: page.content.map(toJob),
        currentPage: page.number,
        totalPages: page.totalPages,
        totalElements: page.totalElements,
      }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.currentPage + 1 < lastPage.totalPages
        ? lastPage.currentPage + 1
        : undefined
    },
    initialPageParam: 0,
  })
}

export const useJobDetail = (slug: string) => {
  return useQuery({
    queryKey: ['jobs', 'detail', slug],
    queryFn: async () => {
      const response = await jobApi.getBySlug(slug)
      return toJob(response)
    },
    enabled: !!slug && slug !== '0',
  })
}

export const useFeaturedJobs = () => {
  return useQuery({
    queryKey: ['jobs', 'featured'],
    queryFn: async () => {
      const page = await jobApi.getFeatured()
      return page.content.map(toJob)
    },
  })
}

export const useSearchSuggestions = (prefix: string) => {
  return useQuery({
    queryKey: ['jobs', 'suggestions', prefix],
    queryFn: () => jobApi.suggest(prefix),
    enabled: prefix.length >= 2,
  })
}
