# TASK-021: TanStack Query em Todo o Admin

**Prioridade:** ALTA
**Estimativa:** 3h
**Dependências:** TASK-020
**Status:** Pendente

## Objetivo**

Migrar todas as queries do admin de `useEffect + useState` para TanStack Query. Configurar QueryClient adequadamente. Adicionar invalidação declarativa.

## Escopo

### A. QueryClient
**Arquivos:**
- `perfectjob-admin/src/lib/queryClient.ts` (criar)

**Ações:**
1. Criar com config adequada:
```typescript
import { QueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error instanceof AxiosError && error.response?.status && error.response.status >= 400 && error.response.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});
```

### B. App Provider
**Arquivos:**
- `perfectjob-admin/src/App.tsx`

**Ações:**
1. Importar `queryClient` de `@/lib/queryClient`
2. Passar para `QueryClientProvider`
3. Adicionar React Query Devtools (apenas em dev)

### C. Dashboard
**Arquivos:**
- `perfectjob-admin/src/pages/Dashboard.tsx`
- `perfectjob-admin/src/hooks/useDashboard.ts` (criar)

**Ações:**
1. Criar hooks:
```typescript
export function useJobStats() {
  return useQuery({
    queryKey: ['job-stats'],
    queryFn: () => jobApi.getStats(),
  });
}

export function useRecentApplications() {
  return useQuery({
    queryKey: ['applications', 'recent'],
    queryFn: () => apiClient.get('/v1/applications/recent').then(r => r.data),
  });
}
```

2. Refatorar Dashboard para usar hooks
3. Mostrar loading state
4. Mostrar error state

### D. JobsPage
**Arquivos:**
- `perfectjob-admin/src/pages/JobsPage.tsx`
- `perfectjob-admin/src/hooks/useJobs.ts` (criar)

**Ações:**
1. Criar hooks:
```typescript
export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobApi.getAll(),
  });
}

export function useCloseJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: jobApi.close,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-stats'] });
    },
  });
}
```

2. Refatorar `JobsPage` para usar hooks
3. Adicionar loading state
4. Adicionar error state
5. Adicionar confirmation modal (substituir window.confirm)

### E. CompaniesPage
**Arquivos:**
- `perfectjob-admin/src/pages/CompaniesPage.tsx`
- `perfectjob-admin/src/hooks/useCompanies.ts` (criar)

**Ações:**
1. Criar hooks:
```typescript
export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: () => companyApi.getAll(),
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: companyApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CompanyInput }) => companyApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: companyApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  });
}
```

2. Refatorar `CompaniesPage` para usar hooks
3. Adicionar loading state
4. Adicionar error state

### F. Application Hooks
**Arquivos:**
- `perfectjob-admin/src/hooks/useApplications.ts` (criar)

**Ações:**
1. Criar hooks para candidaturas:
```typescript
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
      applicationApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
```

### G. Service Updates
**Arquivos:**
- `perfectjob-admin/src/services/api/applicationApi.ts` (criar)

**Ações:**
1. Criar service:
```typescript
export const applicationApi = {
  getRecent: () => apiClient.get<ApplicationResponse[]>('/v1/applications/recent').then(r => r.data),
  getByJob: (jobId: number) => apiClient.get<PageResponse<ApplicationResponse>>(`/v1/applications/job/${jobId}`).then(r => r.data),
  updateStatus: (id: number, data: { status: ApplicationStatus }) =>
    apiClient.patch<ApplicationResponse>(`/v1/applications/${id}/status`, data).then(r => r.data),
};
```

## Critérios de Aceite

- [ ] `QueryClient` configurado em arquivo único
- [ ] Dashboard usa TanStack Query
- [ ] JobsPage usa TanStack Query
- [ ] CompaniesPage usa TanStack Query
- [ ] Cache é invalidado após mutations
- [ ] Loading states aparecem
- [ ] Error states aparecem (com retry)
- [ ] Sem `useEffect + fetch` em páginas

## Como Testar

### Manual
```bash
# 1. Carregar Dashboard: deve mostrar loading
# 2. Criar vaga via JobFormModal
# 3. Voltar para JobsPage: deve mostrar a nova vaga automaticamente (cache invalidado)
# 4. Criar empresa via CompaniesPage
# 5. Editar empresa: deve atualizar a lista
# 6. Fechar vaga: deve atualizar a lista
# 7. Refresh da página: cache deve estar populado (sem loading)
```

## Arquivos Criados/Modificados

- `src/lib/queryClient.ts` (criar)
- `src/App.tsx` (modificar)
- `src/hooks/useDashboard.ts` (criar)
- `src/hooks/useJobs.ts` (criar)
- `src/hooks/useCompanies.ts` (criar)
- `src/hooks/useApplications.ts` (criar)
- `src/services/api/applicationApi.ts` (criar)
- `src/pages/Dashboard.tsx` (modificar)
- `src/pages/JobsPage.tsx` (modificar)
- `src/pages/CompaniesPage.tsx` (modificar)
