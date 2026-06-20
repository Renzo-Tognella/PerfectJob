# Problemas de Integração — admin ↔ app ↔ api

> Diagnóstico dos problemas que impedem admin, mobile e api de se conversarem. Cada problema é mapeado para a task que o corrige.

## 1. Resumo Executivo

Os 3 componentes se "conhecem" superficialmente (mesmos endpoints REST, mesmo esquema de auth JWT), mas a integração é frágil em vários pontos:

| Categoria | Severidade | Quantidade |
|---|---|---|
| Configuração de URL | 🔴 Crítico | 2 (mobile + admin) |
| Autenticação e token | 🔴 Crítico | 4+ |
| Autorização (RBAC) | 🔴 Crítico | 6+ endpoints |
| Sincronização de estado | 🟠 Importante | 3 |
| Tipagem compartilhada | 🟠 Importante | 5+ |
| Cache/Performance | 🟡 Médio | 2 |
| UX/Feedback | 🟡 Médio | 4+ |

**Conclusão**: A API está bem desenhada em isolamento, mas mobile e admin foram desenvolvidos "para a API ideal" sem nunca validar a API real. Por isso, ambos têm suposições quebradas e nenhum teste de integração E2E.

---

## 2. Configuração da URL da API

### 2.1 Mobile (`src/services/api/client.ts:5`)
```typescript
baseURL: 'http://localhost:8080/api'
```
- Hardcoded, sem distinção dev/staging/prod
- Não funciona em dispositivo físico (precisa de IP local)
- HTTPS será exigido em Android API 28+ (precisa `usesCleartextTraffic`)
- Sem `expo-constants` para consumir env vars

### 2.2 Admin (`src/services/api/client.ts:4`)
```typescript
baseURL: 'http://localhost:8080/api'
```
- Mesmo problema do mobile
- Vite oferece `import.meta.env.VITE_API_URL` que não está sendo usado
- Sem `.env.development` nem `.env.production`

### 2.3 API (`application.yml`)
```yaml
server.servlet.context-path: /api
```
- OK, mas CORS está permissivo demais (`*` + credentials)
- `JWT_SECRET` está hardcoded (deveria ser `${JWT_SECRET:default}`)

### 2.4 Impacto
- Mudar de ambiente exige rebuild do app mobile (publicação) e do admin
- Em prod, o mobile vai bater em `localhost` que não existe
- Não há fallback se a API estiver offline

### 2.5 Correção (TASK-001)
- Mobile: usar `expo-constants` + `app.config.ts` para env vars por build profile
- Admin: criar `.env.development` e `.env.production`, usar `import.meta.env.VITE_API_URL`
- API: validar `JWT_SECRET` obrigatório via `${JWT_SECRET}` (sem default)

---

## 3. Autenticação e Token

### 3.1 Fluxo esperado
```
[Login] → POST /v1/auth/login → { accessToken, tokenType, user }
[Client] → guarda accessToken em storage seguro
[Request] → Authorization: Bearer <accessToken>
[Server] → JwtFilter valida → SecurityContext carregado → Controller
[401] → Client apaga token → redireciona para Login
```

### 3.2 Problemas identificados

**Mobile (`useAuthStore`):**
- `loadToken()` declarado mas nunca chamado → ao reabrir o app, o user precisa logar de novo
- `App.tsx` não espera hidratação antes de renderizar a árvore → flicker na rota inicial
- `Login` e `Register` estão no mesmo stack que `Main` (não há auth gate)
- `JobDetailScreen` precisa de auth mas não força (mostra modal em vez de redirecionar)
- `ProfileScreen` faz `navigation.reset({ routes: [{ name: 'Login' }] })` mas pode haver rotas no histórico

**Admin (`useAuthStore`):**
- **Dupla persistência**: salva token em `localStorage.token` E no `localStorage.auth-storage.token` (via zustand persist)
- Interceptor de response usa `window.location.href = '/login'` em 401 → força reload completo (perde estado, quebra SPA)
- `ProtectedRoute` chama `loadToken()` em `useEffect` toda vez que a rota monta → race condition
- Sem validação de expiração do token no boot → user "autenticado" com token expirado
- `useEffect` com `loadToken` como dep sem memoização → potencial loop infinito

**API (`SecurityConfig`):**
- CSRF desabilitado (OK para JWT stateless)
- `permitAll` em **TODOS** os endpoints de escrita (`POST /v1/jobs`, `PATCH /v1/jobs/{id}`, `POST /v1/jobs/{id}/close`, `POST /v1/companies`, `PATCH /v1/companies/{id}`, `DELETE /v1/companies/{id}`) → **risco crítico de segurança**
- CORS: `setAllowedOriginPatterns("*")` + `setAllowCredentials(true)` → combinação insegura
- `JwtFilter` não tem rate limiting
- `JwtProvider` usa `getBytes(UTF-8)` que aceita secret curto se a config tiver < 32 chars

### 3.3 Correções (TASK-002 a TASK-005)

| Task | Descrição |
|---|---|
| TASK-002 | Mobile: Auth gate com root navigator condicional, hidratação em App.tsx, fluxo de logout limpo |
| TASK-003 | Admin: Persistência única, validação de token expirado, ProtectedRoute memoizado, redirect via React Router (sem reload) |
| TASK-004 | API: RBAC com `@PreAuthorize`, secret validation, CORS restrito a origens configuradas |
| TASK-005 | API: Filtro de expiração + handler 401 padronizado + testes |

---

## 4. Sincronização de Estado

### 4.1 Invalidação de cache
- **Mobile**: Após `submitApplication` em `JobDetailScreen`, o `ApplicationsScreen` (que NÃO usa TanStack Query) não atualiza → user precisa reabrir a tela
- **Admin**: Após `createJob` ou `updateJob` em `JobFormModal`, o `JobsPage` chama `loadJobs()` manualmente (refetch ad-hoc) → não há invalidação declarativa
- **API**: Sem WebSocket / SSE → notificações em tempo real não chegam ao mobile

### 4.2 Sincronização de token
- Quando o token expira (15 min) → todas as próximas requests retornam 401
- **Mobile**: Interceptor deleta token, mas o app não redireciona para Login (user fica "stuck")
- **Admin**: Interceptor faz `window.location.href = '/login'` (reload pesado)
- **API**: Token não tem refresh → user precisa logar de novo a cada 15 min

### 4.3 Sincronização de schema
- API retorna `JobResponse` com 23 campos (incluindo `companyName` denormalizado)
- **Mobile**: tipo `JobResponse` em `types/job.ts` está alinhado ✅
- **Admin**: tipo `Job` em `services/api/jobApi.ts` tem `id: number` (consistente) ✅
- **API retorna `Page<JobResponse>` ou `JobSearchResponse`?** → Inconsistência entre controllers
  - `JobController.searchJobs` retorna `Page<JobResponse>`
  - `SearchController.searchJobs` retorna `JobSearchResponse` (record custom com `content, page, size, totalElements`)
- **Admin**: `jobApi.getAll` faz fallback `Array | PageResponse` (defensivo contra inconsistência) → expõe o problema

### 4.4 Correções (TASK-006 a TASK-008)
| Task | Descrição |
|---|---|
| TASK-006 | Mobile: Padronizar uso de TanStack Query em todas as listas, invalidação declarativa |
| TASK-007 | Admin: TanStack Query em todas as queries, QueryClient configurado, invalidação declarativa |
| TASK-008 | API: Padronizar respostas paginadas (sempre `Page<T>` do Spring) |

---

## 5. Tipagem e Contrato de API

### 5.1 Inconsistências

| Campo | API (Java) | Mobile (TS) | Admin (TS) |
|---|---|---|---|
| `Job.id` | `Long` | `number` | `number` |
| `Job.companyId` | `Long` | `number` | `number` |
| `JobResponse.companyName` | ✅ presente | ✅ presente | ❌ ausente |
| `Job.workModel` | enum | enum + label | `string` (deveria ser enum) |
| `Job.experienceLevel` | enum | enum + label | `string` |
| `Job.status` | enum | enum + label | `string` |
| `ApplicationResponse.candidateName` | ✅ presente | ❌ não usado | ❌ não usado |
| `JobResponse.salaryCurrency` | ✅ presente (default BRL) | ✅ usado | ❌ ausente no form |
| `User.role` | enum (CANDIDATE/RECRUITER/ADMIN) | ❌ nunca exposto | ❌ nunca exposto |

### 5.2 Enums do backend (Java) vs frontend (TS)
```java
// Backend
public enum WorkModel { REMOTE, HYBRID, ON_SITE }
public enum ExperienceLevel { INTERN, JUNIOR, MID, SENIOR, LEAD, SPECIALIST }
public enum JobType { FULL_TIME, PART_TIME, CONTRACT, FREELANCE }
public enum ContractType { CLT, PJ, COOPERATIVE }
public enum JobStatus { ACTIVE, CLOSED, DRAFT }
public enum Role { CANDIDATE, RECRUITER, ADMIN }
```

- **Mobile** (`types/job.ts`): já tem os enums alinhados ✅
- **Admin** (`jobApi.ts`): `status`, `workModel`, etc. são `string` ⚠️
- Falta arquivo centralizado de tipos compartilhados (idealmente, gerado a partir do OpenAPI)

### 5.3 Contrato de paginação

```java
// Spring Page<T>
{
  content: T[],
  pageable: {...},
  totalElements: number,
  totalPages: number,
  // ...
}
```

- **Mobile** espera `PageResponse<T>` com `{ content, page: { size, number, totalElements, totalPages } }` (estrutura diferente)
- **Admin** espera `PageResponse<T>` com `{ content, page, size, totalElements }` (outra estrutura)
- **API**: retorna `Page<T>` do Spring (que tem `content`, `number`, `size`, `totalElements`, `totalPages`, `pageable`, `last`, `first`, `numberOfElements`, `empty`, `sort`)

→ **Inconsistência total**. Cada frontend fez uma suposição diferente.

### 5.4 Correções (TASK-009, TASK-010)
| Task | Descrição |
|---|---|
| TASK-009 | API: Padronizar `Page<T>` no contrato, gerar OpenAPI client types |
| TASK-010 | Mobile + Admin: Tipos centralizados compartilhados, consumir OpenAPI types |

---

## 6. Performance e Cache

### 6.1 N+1 Queries (API)
- `JobService.toResponse(Job)` faz `companyRepository.findById` para cada job → em lista de 20 jobs = 21 queries
- `ApplicationService.toResponse(Application)` faz 3+ queries por aplicação → em lista de 50 = 200+ queries

### 6.2 Cache desabilitado (API)
- `@EnableCaching` ativo mas zero `@Cacheable` → habilitação órfã
- Endpoints read-heavy (`GET /v1/jobs`, `GET /v1/jobs/featured`, `GET /v1/companies`) não cacheiam

### 6.3 Frontend
- **Mobile**: TanStack Query com `staleTime: 5 min` (razoável), mas sem cache persistente
- **Admin**: QueryClient com defaults ausentes → comportamento `staleTime: 0` (refetch agressivo)

### 6.4 Correções (TASK-011, TASK-012)
| Task | Descrição |
|---|---|
| TASK-011 | API: DTOs com JOIN FETCH ou queries otimizadas, cache efetivo |
| TASK-012 | Mobile + Admin: QueryClient com config adequada, persistência opcional |

---

## 7. UX/Feedback e Resiliência

### 7.1 Mobile
- Sem feedback visual após criar conta → user fica "stuck" no loading
- `Alert.alert` bloqueia thread em Android
- Sem retry automático em falhas de rede
- Sem estado de "vaga fechada" no detalhe (mostra botão "Candidatar-se" mesmo para vagas CLOSED)

### 7.2 Admin
- `alert()` e `window.confirm()` em vez de Modal estilizado
- Sem loading state no botão submit
- Sem ErrorBoundary global → erro de render crasha tudo
- Memory leak: `setState` após fetch sem cleanup

### 7.3 API
- `applicationsToday: 0L` hardcoded em `JobController.stats` → dado falso
- `JobController.updateJob` permite trocar `companyId` sem auditoria
- `ApplicationService.submitApplication` permite candidatar a vaga CLOSED ou DRAFT
- `NotificationService.onApplicationSubmitted` envia para `companyId` (bug conhecido)

### 7.4 Correções (TASK-013, TASK-014, TASK-015)
| Task | Descrição |
|---|---|
| TASK-013 | Mobile: Toast global, validação de vaga fechada, retry em falhas de rede |
| TASK-014 | Admin: Componentes Modal/Toast, ErrorBoundary, cleanup de useEffect |
| TASK-015 | API: Stats corretas, validações de negócio, ownership check, fix do bug de notificação |

---

## 8. Endpoints que o Admin/Mobile Chamam mas API Não Tem (ou Diferem)

| Cliente | Chama | API tem? | Observação |
|---|---|---|---|
| Admin Dashboard | `GET /v1/applications/recent` | ✅ existe | OK |
| Admin Login | `POST /v1/auth/login` | ✅ | OK |
| Admin getMe | `GET /v1/auth/me` | ✅ (mas retorna `AuthResponse` com tokens nulos) | ⚠️ Semantica errada |
| Admin jobStats | `GET /v1/jobs/stats` | ✅ | OK |
| Mobile login | `POST /v1/auth/login` | ✅ | OK |
| Mobile register | `POST /v1/auth/register` | ✅ | OK |
| Mobile jobs | `GET /v1/jobs` | ✅ | OK |
| Mobile job suggest | `GET /v1/jobs/suggest` | ✅ | OK |
| Mobile job featured | `GET /v1/jobs/featured` | ✅ | OK |
| Mobile applications submit | `POST /v1/applications` | ✅ | OK |
| Mobile companies (nunca chamado) | `GET /v1/companies` | ✅ | código morto |
| Mobile saved jobs | — | ❌ não existe | UX mockada |
| Admin applications list | `GET /v1/applications` | ✅ | existe mas não há UI |
| Admin application status update | `PATCH /v1/applications/{id}/status` | ❌ não existe | precisa criar |

### 8.1 Faltam (TASK-016)
- `PATCH /v1/applications/{id}/status` — recrutador aprova/recusa
- `GET /v1/applications/job/{jobId}` — listar candidatos de uma vaga
- Endpoint de "salvar vaga" (favoritos) — `POST /v1/saved-jobs` / `DELETE /v1/saved-jobs/{jobId}` / `GET /v1/saved-jobs`

---

## 9. Resumo de Tasks de Integração

| ID | Escopo | Prioridade |
|---|---|---|
| TASK-001 | Env vars em mobile e admin, secret management no backend | 🔴 |
| TASK-002 | Auth gate mobile | 🔴 |
| TASK-003 | Auth refactor admin (persistência única, expired token) | 🔴 |
| TASK-004 | RBAC no backend | 🔴 |
| TASK-005 | Padronização de erros 401/403 | 🔴 |
| TASK-006 | TanStack Query em todas as listas mobile | 🟠 |
| TASK-007 | TanStack Query em todas as queries admin | 🟠 |
| TASK-008 | Padronizar `Page<T>` no backend | 🟠 |
| TASK-009 | OpenAPI types compartilhados | 🟡 |
| TASK-010 | Tipos centralizados mobile + admin | 🟡 |
| TASK-011 | N+1 fix + cache efetivo backend | 🟠 |
| TASK-012 | QueryClient config mobile + admin | 🟡 |
| TASK-013 | UX mobile (toast, validação, retry) | 🟡 |
| TASK-014 | UX admin (componentes, error boundary) | 🟡 |
| TASK-015 | Validações de negócio backend | 🔴 |
| TASK-016 | Novos endpoints (saved jobs, status update) | 🟠 |
