import apiClient from './client'

export interface Company {
  id: string
  name: string
  description?: string
  website?: string
  logoUrl?: string
  industry?: string
  size?: string
  location?: string
  createdAt: string
  updatedAt: string
}

export interface CompanyInput {
  name: string
  description?: string
  website?: string
  logoUrl?: string
  industry?: string
  size?: string
  location?: string
}

export const getAll = async (): Promise<Company[]> => {
  const response = await apiClient.get<Company[]>('/companies')
  return response.data
}

export const create = async (data: CompanyInput): Promise<Company> => {
  const response = await apiClient.post<Company>('/companies', data)
  return response.data
}

export const update = async (id: string, data: Partial<CompanyInput>): Promise<Company> => {
  const response = await apiClient.put<Company>(`/companies/${id}`, data)
  return response.data
}
