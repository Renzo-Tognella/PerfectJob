# TASK-015: Persistência de Saved Jobs no Mobile

**Prioridade:** 🟠 ALTA
**Estimativa:** 2.5h
**Dependências:** TASK-012, TASK-014
**Status:** ⬜ Pendente

## Objetivo

Conectar a feature de "salvar vaga" ao backend. Persistir favoritos do candidato. Adicionar indicador visual (coração preenchido).

## Escopo

### A. API Service
**Arquivos:**
- `perfectjob-mobile/src/services/api/savedJobApi.ts` (criar)

**Ações:**
1. Criar API:
```typescript
import { apiClient } from './client';
import type { PageResponse } from '@/types/page';
import type { JobResponse } from '@/types/job';

export const savedJobApi = {
  save: (jobId: number) => 
    apiClient.post<SavedJobResponse>(`/v1/saved-jobs`, { jobId }),
  
  unsave: (jobId: number) => 
    apiClient.delete(`/v1/saved-jobs/${jobId}`),
  
  list: (page = 0, size = 20) => 
    apiClient.get<PageResponse<JobResponse>>(`/v1/saved-jobs?page=${page}&size=${size}`),
  
  check: (jobId: number) => 
    apiClient.get<{ saved: boolean }>(`/v1/saved-jobs/${jobId}/check`),
};
```

### B. Hook
**Arquivos:**
- `perfectjob-mobile/src/hooks/useSavedJobs.ts` (criar)

**Ações:**
1. Criar hooks:
```typescript
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
    queryFn: () => savedJobApi.check(jobId).then(r => r.data.saved),
    enabled: !!jobId,
  });
}

export function useToggleSavedJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, isSaved }: { jobId: number; isSaved: boolean }) =>
      isSaved ? savedJobApi.unsave(jobId) : savedJobApi.save(jobId),
    onMutate: async ({ jobId, isSaved }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['saved-jobs', 'check', jobId] });
      const previous = queryClient.getQueryData(['saved-jobs', 'check', jobId]);
      queryClient.setQueryData(['saved-jobs', 'check', jobId], !isSaved);
      return { previous };
    },
    onError: (err, vars, context) => {
      // Rollback
      if (context?.previous) {
        queryClient.setQueryData(['saved-jobs', 'check', vars.jobId], context.previous);
      }
    },
    onSettled: (data, err, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs', 'check', jobId] });
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
    },
  });
}
```

### C. JobCard
**Arquivos:**
- `perfectjob-mobile/src/components/shared/JobCard.tsx`

**Ações:**
1. Adicionar `saved` e `onToggleSave` props (já tem)
2. Garantir que o ícone do bookmark é visualmente diferente quando `saved=true`
3. Adicionar `accessibilityLabel`

### D. JobDetailScreen
**Arquivos:**
- `perfectjob-mobile/src/screens/job-detail/JobDetailScreen.tsx`

**Ações:**
1. Adicionar botão de favoritar (ícone de coração ou bookmark)
2. Usar `useIsJobSaved(slugToId)` (precisa resolver slug → id, ou usar slug direto)
3. Ao clicar, chamar `useToggleSavedJob`
4. Mostrar feedback visual (toast ou animação)

### E. SavedJobsScreen
**Arquivos:**
- `perfectjob-mobile/src/screens/saved-jobs/SavedJobsScreen.tsx`

**Ações:**
1. Substituir `useState<Job[]>([])` por `useSavedJobs()`
2. Renderizar `JobCard` para cada vaga salva
3. Long-press para remover (com confirmação)
4. Estado vazio quando não há salvos
5. Pull-to-refresh
6. Loading state

### F. HomeScreen
**Arquivos:**
- `perfectjob-mobile/src/screens/home/HomeScreen.tsx`

**Ações:**
1. JobCard na home deve permitir favoritar
2. Passar props `saved` e `onToggleSave` para cada JobCard

### G. Type para SavedJobResponse
**Arquivos:**
- `perfectjob-mobile/src/types/savedJob.ts` (criar)

**Ações:**
1. Criar tipo:
```typescript
export interface SavedJobResponse {
  id: number;
  userId: number;
  jobId: number;
  jobSlug: string;
  createdAt: string;
}
```

### H. Tests
**Arquivos:**
- `perfectjob-mobile/__tests__/hooks/useSavedJobs.test.ts` (criar)
- `perfectjob-mobile/__tests__/services/savedJobApi.test.ts` (criar)

## Critérios de Aceite

- [ ] Botão de favoritar em JobCard funciona
- [ ] Clicar em favoritar adiciona à lista de salvos
- [ ] Clicar novamente remove
- [ ] Estado persiste após reabrir o app
- [ ] SavedJobsScreen lista vagas salvas
- [ ] Estado vazio aparece quando não há salvos
- [ ] Otimistic update: UI atualiza antes da confirmação do server
- [ ] Erro faz rollback
- [ ] Testes passam

## Como Testar

### Manual
```bash
# 1. Login no app
# 2. Abrir detalhe de uma vaga
# 3. Clicar no botão de favoritar
# 4. Verificar que ícone muda (preenchido)
# 5. Ir para tab "Salvas"
# 6. Vaga deve aparecer
# 7. Fechar e reabrir app
# 8. Vaga ainda deve estar em "Salvas"
# 9. Clicar novamente para desfavoritar
# 10. Vaga some de "Salvas"
```

### Automatizado
```typescript
test('useToggleSavedJob calls save API when not saved', async () => {
  const { result } = renderHook(() => useToggleSavedJob(), { wrapper });
  await act(() => result.current.mutateAsync({ jobId: 1, isSaved: false }));
  expect(savedJobApi.save).toHaveBeenCalledWith(1);
});

test('useToggleSavedJob calls unsave API when already saved', async () => {
  const { result } = renderHook(() => useToggleSavedJob(), { wrapper });
  await act(() => result.current.mutateAsync({ jobId: 1, isSaved: true }));
  expect(savedJobApi.unsave).toHaveBeenCalledWith(1);
});
```

## Arquivos Criados/Modificados

- `src/services/api/savedJobApi.ts` (criar)
- `src/types/savedJob.ts` (criar)
- `src/hooks/useSavedJobs.ts` (criar)
- `src/components/shared/JobCard.tsx` (modificar)
- `src/screens/job-detail/JobDetailScreen.tsx` (modificar)
- `src/screens/saved-jobs/SavedJobsScreen.tsx` (modificar)
- `src/screens/home/HomeScreen.tsx` (modificar)
- `__tests__/hooks/useSavedJobs.test.ts` (criar)
- `__tests__/services/savedJobApi.test.ts` (criar)

## Notas

- Backend já terá `saved-jobs` endpoints (criado em TASK-012)
- Para resolver `slug → id`, pode ser necessário chamada extra OU incluir `id` em JobResponse
- Otimistic update melhora UX mas precisa de rollback em caso de erro
- Considerar usar `expo-haptics` para feedback tátil ao favoritar
- Estado vazio deve ser visual e motivador ("Salve vagas para ver depois")
