import { apiClient } from './client';
import type { PageResponse } from '@/types/page';

export interface Company {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  industry?: string;
  size?: string;
  foundedYear?: number;
  rating?: number;
  ratingCount?: number;
}

export interface CompanyInput {
  name: string;
  slug: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  industry?: string;
  size?: string;
  foundedYear?: number;
}

const toSlug = (name: string) =>
  name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

export const getAll = async (): Promise<Company[]> => {
  const response = await apiClient.get<PageResponse<Company> | Company[]>('/v1/companies', {
    params: { size: 100 },
  });
  const data = response.data;
  if (Array.isArray(data)) return data;
  return data.content || [];
};

export const create = async (data: Omit<CompanyInput, 'slug'> & { slug?: string }): Promise<Company> => {
  const payload: CompanyInput = {
    ...data,
    slug: data.slug || toSlug(data.name),
  };
  const response = await apiClient.post<Company>('/v1/companies', payload);
  return response.data;
};

export const update = async (id: number, data: CompanyInput): Promise<Company> => {
  const response = await apiClient.patch<Company>(`/v1/companies/${id}`, data);
  return response.data;
};

export const remove = async (id: number): Promise<void> => {
  await apiClient.delete(`/v1/companies/${id}`);
};

export const companyApi = {
  getAll,
  create,
  update,
  remove,
};
