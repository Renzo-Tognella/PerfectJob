# TASK-008: Padronizar Contrato de Paginação

**Prioridade:** 🟠 ALTA
**Estimativa:** 1.5h
**Dependências:** TASK-006
**Status:** ⬜ Pendente

## Objetivo

Padronizar TODAS as respostas paginadas como `Page<T>` do Spring (ou DTO custom consistente). Eliminar inconsistências entre controllers.

## Escopo

### A. SearchController
**Arquivos:**
- `controller/v1/SearchController.java`
- `dto/response/JobSearchResponse.java`

**Ações:**
1. Substituir `JobSearchResponse` por `Page<JobResponse>` (retornar `Page<T>` do Spring)
2. Garantir que estrutura é idêntica à de `JobController.searchJobs`
3. Remover `JobSearchResponse` (não usar mais)

### B. JobController
**Arquivos:**
- `controller/v1/JobController.java`

**Ações:**
1. Confirmar que `searchJobs` retorna `Page<JobResponse>`
2. Confirmar que `findActiveJobs` (e variantes) retornam `Page<JobResponse>`

### C. CompanyController
**Arquivos:**
- `controller/v1/CompanyController.java`

**Ações:**
1. Confirmar que `listAll` retorna `Page<CompanyResponse>`

### D. ApplicationController
**Arquivos:**
- `controller/v1/ApplicationController.java`

**Ações:**
1. Padronizar `getMyApplications` para retornar `Page<ApplicationResponse>` (em vez de `List<ApplicationResponse>`)
2. Atualizar service para aceitar paginação

### E. ApplicationService
**Arquivos:**
- `service/ApplicationService.java`

**Ações:**
1. Mudar `getMyApplications(Long candidateId)` para `getMyApplications(Long candidateId, Pageable pageable)`
2. Adicionar método `countByCandidateId(Long candidateId)` para exibir total no mobile

### F. Mobile — Page Response
**Arquivos:**
- `perfectjob-mobile/src/types/page.ts`
- `perfectjob-mobile/src/services/api/*.ts`

**Ações:**
1. Atualizar tipo `PageResponse<T>` para match com Spring:
```typescript
export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: { sorted: boolean; empty: boolean };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  sort: { sorted: boolean; empty: boolean };
  empty: boolean;
}
```

2. Atualizar mappers para usar `data.content` em vez de `data`

### G. Admin — Page Response
**Arquivos:**
- `perfectjob-admin/src/services/api/jobApi.ts`
- `perfectjob-admin/src/services/api/companyApi.ts`

**Ações:**
1. Atualizar `PageResponse<T>` para match com Spring
2. Atualizar `getAll` para retornar `data.content` em vez de `data`
3. Remover fallback `Array | PageResponse` (não é mais necessário)

## Critérios de Aceite

- [ ] Todos os endpoints de lista retornam `Page<T>` com a mesma estrutura
- [ ] `GET /v1/jobs` retorna `Page<JobResponse>` ✅
- [ ] `GET /v1/search/jobs` retorna `Page<JobResponse>` ✅
- [ ] `GET /v1/companies` retorna `Page<CompanyResponse>` ✅
- [ ] `GET /v1/applications` retorna `Page<ApplicationResponse>` ✅
- [ ] `JobSearchResponse` removido
- [ ] Mobile e Admin consomem o novo formato
- [ ] Testes atualizados

## Como Testar

### Manual
```bash
# Verificar estrutura idêntica
curl -s "http://localhost:8080/api/v1/jobs?page=0&size=10" | jq 'keys'
curl -s "http://localhost:8080/api/v1/search/jobs?q=dev&page=0&size=10" | jq 'keys'
curl -s "http://localhost:8080/api/v1/companies?page=0&size=10" | jq 'keys'
# Devem ter as mesmas chaves: content, pageable, totalElements, totalPages, etc.
```

### Automatizado
- `PageContractTest`: testa que 4 endpoints retornam estrutura idêntica
- `ApplicationPaginationTest`: testa paginação

## Arquivos Criados/Modificados

**Backend:**
- `controller/v1/SearchController.java` (modificar)
- `controller/v1/ApplicationController.java` (modificar)
- `dto/response/JobSearchResponse.java` (remover)
- `service/ApplicationService.java` (modificar)
- `test/controller/SearchControllerTest.java` (criar/atualizar)
- `test/controller/ApplicationControllerTest.java` (atualizar)

**Mobile:**
- `types/page.ts` (modificar)
- `services/api/jobApi.ts` (modificar)
- `services/api/companyApi.ts` (modificar)
- `services/api/applicationApi.ts` (modificar)
- `services/api/mappers.ts` (modificar)
- `hooks/useJobs.ts` (modificar)
- `hooks/useApplications.ts` (criar — em TASK-016)

**Admin:**
- `services/api/jobApi.ts` (modificar)
- `services/api/companyApi.ts` (modificar)
- `services/api/applicationApi.ts` (modificar)

## Notas

- `Page<T>` do Spring serializa para JSON com muitas chaves. É verboso mas padronizado.
- Alternativa: criar DTO custom `PagedResponse<T>` com apenas chaves úteis. Mais limpo mas mais código.
- Decisão: usar `Page<T>` do Spring (já tem, é conhecido, frontends se adaptam)
- Para listas pequenas, ainda vale a pena retornar `List<T>` (sem paginação). Aplicar regra: se endpoint pode retornar > 20 itens, paginar.
