import apiClient from './client'

export interface Job {
  id: string
  title: string
  description: string
  requirements: string
  benefits?: string
  salaryMin?: number
  salaryMax?: number
  workModel: string
  experienceLevel: string
  jobType: string
  contractType: string
  location?: string
  skills: string[]
  expiresAt?: string
  status: 'active' | 'closed'
  companyId: string
  companyName?: string
  applicationsCount?: number
  createdAt: string
  updatedAt: string
}

export interface JobInput {
  title: string
  description: string
  requirements: string
  benefits?: string
  salaryMin?: number
  salaryMax?: number
  workModel: string
  experienceLevel: string
  jobType: string
  contractType: string
  location?: string
  skills: string[]
  expiresAt?: string
  companyId: string
}

export interface JobStats {
  activeJobs: number
  totalApplications: number
  applicationsToday: number
}

export const getAll = async (): Promise<Job[]> => {
  const response = await apiClient.get<Job[]>('/jobs')
  return response.data
}

export const create = async (data: JobInput): Promise<Job> => {
  const response = await apiClient.post<Job>('/jobs', data)
  return response.data
}

export const update = async (id: string, data: Partial<JobInput>): Promise<Job> => {
  const response = await apiClient.put<Job>(`/jobs/${id}`, data)
  return response.data
}

export const close = async (id: string): Promise<void> => {
  await apiClient.patch(`/jobs/${id}/close`)
}

export const getStats = async (): Promise<JobStats> => {
  const response = await apiClient.get<JobStats>('/jobs/stats')
  return response.data
}
