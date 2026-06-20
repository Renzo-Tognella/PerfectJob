# Design Patterns e Arquitetura — PerfectJob

> Documento de referência com os padrões arquiteturais identificados, gaps em relação ao que deveria existir, e um guia de padrões a aplicar nas correções.

## 1. Visão Geral Arquitetural

O PerfectJob é um monorepo com 3 aplicações que se comunicam via HTTP/REST:

```
┌──────────────────────┐         ┌──────────────────────┐
│  perfectjob-mobile   │ ──────► │                      │
│  (React Native/Expo) │  HTTP   │                      │
│  - Candidato busca   │  REST   │   perfectjob-api     │
│  - Aplica vagas      │ ◄────── │   (Spring Boot 3.3)  │
└──────────────────────┘  JSON   │   - JWT auth         │
                                │   - JPA + PostgreSQL │
┌──────────────────────┐         │   - Full-text search │
│  perfectjob-admin    │ ──────► │   - Cache (abstraído)│
│  (React 19 + Vite)   │  HTTP   │                      │
│  - Recrutador CRUD   │ ◄────── │                      │
└──────────────────────┘         └──────────────────────┘
                                            │
                                ┌───────────┴───────────┐
                                ▼                       ▼
                       ┌──────────────┐        ┌──────────────┐
                       │ PostgreSQL16 │        │   Redis 7    │
                       │  + tsvector  │        │  (sem uso)   │
                       └──────────────┘        └──────────────┘
```

**Camadas atuais:**

| Camada | Mobile | Admin | API |
|---|---|---|---|
| Apresentação | React Native screens + design tokens | React pages + Tailwind | Controllers REST |
| Estado/Hooks | Zustand + TanStack Query | Zustand (parcial) + useState | Services |
| API Client | Axios + interceptors | Axios + interceptors | — |
| Persistência | expo-secure-store | localStorage | PostgreSQL via JPA |
| Tipagem | TypeScript strict | TypeScript strict | Java 21 records + entities |

---

## 2. Padrões de Design Identificados (já presentes)

### 2.1 Backend (Spring Boot)

| Padrão | Onde | Estado |
|---|---|---|
| **Repository** | `repository/*` | ✅ Correto (5 interfaces) |
| **Service Layer** | `service/*` | ✅ Correto (5 services) |
| **DTO + Java Records** | `dto/request/*`, `dto/response/*` | ✅ Correto, imutável |
| **Builder (Lombok)** | Entities | ✅ Aplicado |
| **Specification Pattern** | `JobSpecification` + `JpaSpecificationExecutor` | ✅ Bem aplicado |
| **Event-Driven (Observer)** | `event/*` + `@EventListener` | ✅ Presente |
| **Async Processing** | `@EnableAsync` + `@Async` | ⚠️ Ativo mas tem bug |
| **Cache (abstraído)** | `@EnableCaching` | ❌ Habilitado mas não usado (código morto) |
| **Global Exception Handler** | `@RestControllerAdvice` | ✅ Presente |
| **Stateless Auth (JWT)** | `JwtProvider` + `JwtFilter` | ✅ Funcional, mas secret hardcoded |
| **BCrypt hashing** | `SecurityConfig` | ✅ Correto |
| **Full-Text Search** | `tsvector` + `ts_rank` + GIN | ✅ Bem implementado |
| **Trigrama Search** | `pg_trgm` | ✅ Bom para autocomplete |
| **ElementCollection** | `Job.skills` | ⚠️ Dessincronizado com array `text[]` |
| **Flyway Migrations** | V1, V2, V3 | ✅ Versionado |
| **OpenAPI/Swagger** | `springdoc-openapi-starter-webmvc-ui` | ✅ Documentação viva |
| **API Versioning** | `/v1/...` no path | ✅ Padrão correto |

### 2.2 Mobile (React Native/Expo)

| Padrão | Onde | Estado |
|---|---|---|
| **Camadas (services → hooks → screens)** | Estrutura de pastas | ✅ Bem definido |
| **Design Tokens centralizados** | `src/design-system/tokens/` | ✅ Bom, mas com hex hardcoded em `JobDetailScreen` |
| **Mappers DTO→UI** | `services/api/mappers.ts` | ✅ Bom, traduz enums do backend |
| **Token Storage Seguro** | `expo-secure-store` | ✅ Correto |
| **Server state cache** | TanStack Query | ✅ Bem usado em jobs, ❌ ausente em applications |
| **Soft delete / UX feedback** | `Alert.alert` | ⚠️ Funciona mas prefere-se Toast |
| **Componentização presentational** | `HomeScreen` → subcomponentes | ✅ Bom |
| **StyleSheet.create por componente** | — | ⚠️ Sem shared styles (duplicação) |

### 2.3 Admin (React 19 + Vite)

| Padrão | Onde | Estado |
|---|---|---|
| **Container/Presentational parcial** | Páginas | ⚠️ Mistura fetch e render |
| **Feature-based folders** | `pages/`, `services/api/`, `store/` | ✅ Boa separação |
| **Repository pattern (API services)** | `services/api/*Api.ts` | ✅ Simula repositories |
| **Global state via zustand** | Auth | ✅ Correto |
| **Persist + localStorage híbrido** | `useAuthStore` | ❌ Dupla persistência (bug) |
| **CSS-in-Tailwind** | Tudo via classes | ✅ Consistente |
| **CSS Variables para design tokens** | `design-system.css` | ❌ Ignorado pelo resto |
| **Lucide React para ícones** | `Layout`, pages | ✅ Consistente |
| **Modais controlados por state local** | `JobFormModal` | ⚠️ Sem portal, sem contexto |
| **Error Boundary** | — | ❌ Inexistente |
| **Lazy Loading** | — | ❌ Imports eager |

---

## 3. Gaps Arquiteturais (o que falta)

### 3.1 Em todas as camadas

1. **Variáveis de ambiente** — Nenhuma das 3 aplicações tem `.env` files nem consome env vars. API URL está hardcoded em mobile e admin.
2. **Camada de Configuração** — Falta centralização de configurações (frontend) e secrets management (backend).
3. **Validação de Input** — DTOs do backend têm validações parciais. Forms do mobile/admin têm validação zero no client.
4. **Error Boundary / Tratamento de Erro Global** — Apenas o backend tem `@RestControllerAdvice`. Frontend trata erro caso a caso.
5. **Logging estruturado** — Backend loga pouco. Frontend quase não loga.
6. **Cobertura de testes** — Backend: 1/16 passa (Java 25 incompatível). Mobile e Admin: 0 testes.
7. **CI/CD** — Inexistente.
8. **Acessibilidade (a11y)** — Zero `accessibilityLabel`, `aria-label`, navegação por teclado.
9. **Internacionalização (i18n)** — Strings hardcoded em PT-BR.
10. **Documentação viva** — Swagger no backend existe, mas mobile e admin não documentam seus serviços.

### 3.2 Backend específico

1. **Autorização baseada em role (RBAC)** — Todos os endpoints mutantes são públicos.
2. **Ownership check** — Nenhum service valida se o usuário é dono do recurso.
3. **Versionamento de contrato** — Sem `application/vnd.perfectjob.v1+json` (usa path).
4. **Cache efetivo** — `@EnableCaching` mas sem `@Cacheable` em lugar nenhum.
5. **Métricas/Observabilidade** — Sem Micrometer, sem actuator exposto.
6. **Auditoria** — Sem `@CreatedBy`, `@LastModifiedBy`.
7. **Rate Limiting** — Sem Bucket4j, sem resilience4j.
8. **Documentação de modelo** — Sem diagramas ER, sem javadoc.
9. **Constraint de unicidade** — `applications(job_id, candidate_id)` não existe.
10. **N+1 queries** — `toResponse` em `ApplicationService` e `JobService` faz queries inline.
11. **FK de `notifications.user_id` → `users.id`** — Faltando na V2.
12. **Bug intencional** — `NotificationService` usa `companyId` como `userId` (TODO).

### 3.3 Mobile específico

1. **Auth Guard** — Não existe. `Main` é a tela inicial sempre.
2. **Hidratação de token no boot** — `useAuthStore.loadToken()` declarado mas nunca chamado.
3. **Persistência de saved jobs** — `useState<Job[]>([])` local, sempre vazio.
4. **Validação de formulários** — Só `trim()`, sem formato de email, sem requisitos de senha.
5. **Componentes UI reutilizáveis** — `<Button>` definido mas não usado.
6. **Notificações push** — Sino na Home é decorativo.
7. **Upload de currículo** — `onPress={() => {}}` no Profile.
8. **Tratamento de deep links** — Inexistente.
9. **Pull-to-refresh** — Só no Search, falta nas outras listas.
10. **Comportamento offline** — Sem fila de retry, sem cache offline.

### 3.4 Admin específico

1. **TanStack Query instalado mas não usado** — Todas as queries são manuais com `useEffect`.
2. **Rotas quebradas no menu** — `/applications` e `/settings` no `Layout` não existem como `Route`.
3. **Endpoints de Candidaturas** — Dashboard chama `/v1/applications/recent` inline; não há tela de gestão.
4. **Componentes reutilizáveis** — `<Button>` definido mas não usado. Falta `Modal`, `Input`, `Select`, `Badge`, `Table`, `Toast`.
5. **Confirmação de ações destrutivas** — `window.confirm()` em vez de componente próprio.
6. **Responsividade** — Sidebar fixa 240px, sem colapso mobile.
7. **Acessibilidade** — Zero `aria-label`, navegação por teclado ruim.
8. **404 page** — `*` redireciona para `/` silenciosamente.
9. **Validação de formulários** — Apenas `required` HTML.
10. **Sanitização de HTML** — Sem `DOMPurify` (embora sem dangerouslySetInnerHTML, é boa prática).

---

## 4. Padrões a Aplicar nas Correções

### 4.1 Backend

- **RBAC com `@PreAuthorize`** em todos os endpoints mutantes
- **Ownership check** no service (não no controller)
- **Cache efetivo com `@Cacheable` em read-heavy, `@CacheEvict` em mutações**
- **Token blacklist** para logout seguro (ou expirações curtas + refresh tokens)
- **Testes com Testcontainers** (PostgreSQL real) para integração
- **Actuator + Micrometer** para observabilidade
- **Bean Validation customizado** para regras de negócio (e.g. `salaryMin <= salaryMax`)
- **MapStruct ou conversor manual centralizado** para DTO ↔ Entity (evitar N+1)
- **Specification customizada** para queries complexas (já tem um bom exemplo em `JobSpecification`)
- **Saga Pattern** para operações multi-repository com rollback
- **Circuit Breaker** com Resilience4j em integrações externas (futuro)

### 4.2 Mobile

- **Auth gate com root navigator condicional** (renderiza AuthStack ou MainStack baseado em `isAuthenticated`)
- **Hidratação de token em `App.tsx` antes de renderizar**
- **TanStack Query em todas as listas** (applications, savedJobs)
- **Persistência de saved jobs com AsyncStorage** + sincronização
- **Form library** (react-hook-form + zod) para validação
- **Componentes do design system** usados consistentemente
- **Toast/Banner global** em vez de `Alert.alert` para mensagens não-críticas
- **AsyncStorage para dados não-sensíveis** + SecureStore para tokens
- **Code splitting** (expo-router lazy routes)

### 4.3 Admin

- **TanStack Query em todas as queries** com `QueryClient` configurado (staleTime, retry, etc.)
- **Componentes UI base** (Modal, Input, Select, Badge, Table, Toast) compartilhados
- **Confirmação de ações via Modal** em vez de `window.confirm()`
- **Variáveis de ambiente** via `import.meta.env.VITE_API_URL`
- **Persistência única de token** (remover localStorage manual, manter só zustand persist)
- **Validação com zod + react-hook-form**
- **Layout responsivo** (sidebar colapsável, drawer no mobile)
- **Error Boundary global** envolvendo o app
- **Rotas funcionais** — remover links quebrados do menu
- **Tipos centralizados em `src/types/`**

---

## 5. Princípios SOLID a Observar

| Princípio | Onde aplicar | Como |
|---|---|---|
| **S** Single Responsibility | Services e Componentes | Cada service/componente tem 1 razão para mudar |
| **O** Open/Closed | Specifications, Strategies | JobSpecification permite novas buscas sem modificar código existente |
| **L** Liskov Substitution | Herança de entidades | UserDetails customizado deve funcionar onde UserDetails é esperado |
| **I** Interface Segregation | DTOs separados por contexto | AuthResponse ≠ UserProfileResponse |
| **D** Dependency Inversion | Services dependem de abstrações (Repository) | ✅ Já aplicado no backend. Falta no frontend. |

### Outros princípios

- **DRY**: Centralizar mapeamento DTO↔Entity, tokens de design, constantes de chave de storage.
- **KISS**: Componentes simples, sem overengineering (e.g. `PlaceholderScreen` que retorna `null` deve ser removido).
- **YAGNI**: Não criar abstrações especulativas.
- **Clean Architecture**:
  - **Domain**: Entities, Value Objects
  - **Application**: Services, Use Cases
  - **Infrastructure**: Repositories, External Services
  - **Interface**: Controllers, DTOs
- **Clean Code**:
  - Nomes descritivos (evitar abreviações)
  - Funções pequenas (≤ 20 linhas ideal)
  - Sem comentários redundantes
  - Sem código morto
  - Tratamento de erro explícito
  - Logs significativos

---

## 6. Convenções de Código

### 6.1 Backend (Java 21 + Spring Boot 3.3)

- **Pacotes**: `com.perfectjob.{layer}` (config, controller, dto, event, exception, model, repository, security, service)
- **Controllers**: `*Controller` em `controller/v1/`
- **Services**: `*Service` (interface + impl quando relevante)
- **Repositories**: `*Repository` (Spring Data interface)
- **Entities**: Singular, sem sufixo (User, Job, Company)
- **DTOs Request**: `*Request` (Java record)
- **DTOs Response**: `*Response` (Java record)
- **Lombok**: `@Builder`, `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`
- **Validação**: `jakarta.validation.constraints.*` nos DTOs
- **Logs**: SLF4J via Lombok `@Slf4j`
- **Transações**: `@Transactional` no service (não no controller)

### 6.2 Mobile (TypeScript + React Native)

- **Pastas**: `src/{components,design-system,hooks,navigation,screens,services,store,types}`
- **Screens**: `PascalCase + Screen.tsx` em `src/screens/{feature}/`
- **Components**: `PascalCase.tsx` em `src/components/{category}/`
- **Hooks**: `use{CamelCase}.ts` em `src/hooks/`
- **Services**: `{feature}Api.ts` em `src/services/api/`
- **Types**: PascalCase, em `src/types/`
- **Constantes**: `UPPER_SNAKE_CASE`
- **Imports**: Absolutos com alias `@/*`
- **Estilo**: StyleSheet.create no escopo do módulo, design tokens para cores/spacing/typography
- **Estado global**: Zustand (client state) + TanStack Query (server state)
- **Async**: `async/await` (nunca `.then` chains aninhados)

### 6.3 Admin (TypeScript + React + Vite)

- **Pastas**: `src/{components,pages,services,store,styles,types,hooks}`
- **Pages**: `PascalCasePage.tsx` em `src/pages/`
- **Components**: `PascalCase.tsx` em `src/components/{category}/`
- **API**: `{feature}Api.ts` em `src/services/api/`
- **Tipos**: Centralizar em `src/types/` (criar pasta)
- **Estilo**: Tailwind + design tokens via CSS variables
- **Estado global**: Zustand (client state) + TanStack Query (server state) — padronizar
- **Validação**: zod + react-hook-form

---

## 7. Métricas de Qualidade Alvo

| Métrica | Antes | Depois (meta) |
|---|---|---|
| Cobertura de testes backend | 1/16 (6%) | ≥ 80% |
| Cobertura de testes mobile | 0% | ≥ 60% (services, hooks, mappers) |
| Cobertura de testes admin | 0% | ≥ 50% (componentes, hooks, services) |
| Endpoints públicos indevidos | 6 | 0 (apenas leitura anônima) |
| `System.out.println` / `console.log` | muitos | 0 (usar logger) |
| Código morto | muito | 0 |
| Componentes UI não usados | 4+ | 0 (ou documentados) |
| N+1 queries | 2 críticas | 0 |
| Bugs críticos de segurança | 5+ | 0 |
| Variáveis hardcoded | 3+ | 0 (todas em env) |
| Tipos `any` no mobile | vários | 0 |
| Memory leaks (setState após unmount) | vários | 0 |
