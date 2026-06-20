# TASK-016: TanStack Query em Applications (Mobile)

**Prioridade:** 🟠 ALTA
**Estimativa:** 1.5h
**Dependências:** TASK-014
**Status:** ⬜ Pendente

## Objetivo

Migrar `ApplicationsScreen` de `useEffect + useState` para TanStack Query. Adicionar invalidação declarativa após `submitApplication`.

## Escopo

### A. API Service
**Arquivos:**
- `perfectjob-mobile/src/services/api/applicationApi.ts`

**Ações:**
1. Garantir que `listMyApplications` retorna `Page<ApplicationResponse>` (após TASK-008)
2. Adicionar `submitApplication` (já existe)
3. Garantir tipos corretos

### B. Hook
**Arquivos:**
- `perfectjob-mobile/src/hooks/useApplications.ts` (criar)

**Ações:**
1. Criar hooks:
```typescript
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
      queryClient.invalidateQueries({ queryKey: ['jobs', 'search'] });  // pode ter mudado
    },
  });
}
```

### C. ApplicationsScreen
**Arquivos:**
- `perfectjob-mobile/src/screens/applications/ApplicationsScreen.tsx`

**Ações:**
1. Substituir `useEffect` + `useState` por `useMyApplications()`
2. Renderizar loading state
3. Renderizar empty state
4. Renderizar error state com retry
5. Pull-to-refresh
6. Infinite scroll
7. Adicionar badge colorido por status
8. Mapear status para label PT-BR

### D. JobDetailScreen
**Arquivos:**
- `perfectjob-mobile/src/screens/job-detail/JobDetailScreen.tsx`

**Ações:**
1. Substituir chamada direta de `applicationApi.submit` por `useSubmitApplication`
2. Mostrar loading no botão durante submit
3. Mostrar toast de sucesso/erro
4. Navegar para Applications tab após sucesso (ou voltar)

### E. Mappers
**Arquivos:**
- `perfectjob-mobile/src/services/api/mappers.ts`

**Ações:**
1. Criar `toApplication(response: ApplicationResponse): Application` para UI
2. Mapear status enum para label PT-BR
3. Mapear status para cor do badge

### F. Types
**Arquivos:**
- `perfectjob-mobile/src/types/application.ts` (criar)
- `perfectjob-mobile/src/types/index.ts` (exportar)

**Ações:**
1. Criar `Application` UI type (com labels PT-BR, cores, etc)
2. Exportar de index

### G. Tests
**Arquivos:**
- `__tests__/hooks/useApplications.test.ts` (criar)
- `__tests__/services/applicationApi.test.ts` (criar)

## Critérios de Aceite

- [ ] ApplicationsScreen não usa `useEffect` para fetch
- [ ] Loading state aparece durante fetch
- [ ] Empty state aparece quando não há candidaturas
- [ ] Error state aparece em caso de erro (com botão retry)
- [ ] Pull-to-refresh funciona
- [ ] Infinite scroll carrega mais
- [ ] Após candidatar-se, a tela de Applications atualiza automaticamente
- [ ] Badge de status tem cor correta
- [ ] Testes passam

## Como Testar

### Manual
```bash
# 1. Login
# 2. Candidatar-se a uma vaga
# 3. Ir para Applications tab
# 4. Ver a candidatura com status "Pendente"
# 5. Pull-to-refresh
# 6. Verificar que não há flash de loading
# 7. Recarregar app
# 8. Applications ainda aparece
```

### Automatizado
```typescript
test('useMyApplications returns applications from API', async () => {
  server.use(
    rest.get('/v1/applications', (req, res, ctx) =>
      res(ctx.json({
        content: [{ id: 1, status: 'PENDING', jobTitle: 'Dev' }],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 20,
        first: true,
        last: true,
      }))
    )
  );
  
  const { result } = renderHook(() => useMyApplications(), { wrapper });
  
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.pages[0].content[0].jobTitle).toBe('Dev');
});

test('useSubmitApplication invalidates applications', async () => {
  const { result } = renderHook(
    () => ({
      mutation: useSubmitApplication(),
      query: useMyApplications(),
    }),
    { wrapper }
  );
  
  await act(() => result.current.mutation.mutateAsync({ jobId: 1 }));
  
  expect(queryClient.getQueryState(['applications', 'me'])?.isInvalidated).toBe(true);
});
```

## Arquivos Criados/Modificados

- `src/services/api/applicationApi.ts` (modificar)
- `src/hooks/useApplications.ts` (criar)
- `src/services/api/mappers.ts` (modificar — adicionar toApplication)
- `src/types/application.ts` (criar)
- `src/types/index.ts` (modificar — exportar)
- `src/screens/applications/ApplicationsScreen.tsx` (modificar — usar hook)
- `src/screens/job-detail/JobDetailScreen.tsx` (modificar — usar mutation)
- `__tests__/hooks/useApplications.test.ts` (criar)
- `__tests__/services/applicationApi.test.ts` (criar)

## Notas

- `useInfiniteQuery` é melhor que `useQuery` para listas paginadas
- Em caso de erro, mostrar mensagem clara e botão "Tentar novamente"
- O cache do TanStack Query substitui a necessidade de estado local
- Pull-to-refresh = `refetch()` da query (já tem no TanStack Query via `refetch` retornado)
- Para status "REJECTED" e "HIRED", cores devem ser óbvias (vermelho/verde)
