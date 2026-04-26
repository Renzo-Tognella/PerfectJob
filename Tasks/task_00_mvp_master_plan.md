# PerfectJob — Plano Mestre de Tasks para MVP

## Visão Geral do MVP

### Escopo do MVP
Plataforma de busca e candidatura de vagas com:
- **Mobile (React Native/Expo):** App para candidatos buscar e candidatar-se a vagas
- **Backend (Spring Boot):** API REST monólito modular + PostgreSQL full-text search
- **Web Admin (React + Vite):** Painel para recrutadores publicarem vagas
- **Infraestrutura:** PostgreSQL + Redis (Docker Compose para dev, VPS única para produção)

### Não incluído no MVP
- Chat entre candidato/recrutador
- Video entrevistas
- IA de matching avançada (fase 2)
- Pagamentos / plano premium
- Aplicativo recrutador mobile

---

## Fase 0: Setup & Fundação

### Task 0.1 — Inicialização do Projeto
**Prioridade:** Crítica | **Estimativa:** 4h | **Dependências:** Nenhuma

- [ ] Criar monorepo com estrutura de diretórios
- [ ] Inicializar projeto Spring Boot 3.3 + Java 21 (`perfectjob-api/`)
- [ ] Inicializar projeto React Native + Expo SDK 52 (`perfectjob-mobile/`)
- [ ] Inicializar projeto React + Vite (`perfectjob-admin/`)
- [ ] Criar `docker-compose.yml` com PostgreSQL 16 + Redis 7
- [ ] Criar `.gitignore`, `.editorconfig`, `README.md`
- [ ] Configurar `pom.xml` com dependências base
- [ ] Configurar `eslint`, `prettier`, `tsconfig` nos projetos frontend
- [ ] Criar scripts de setup: `setup.sh`, `start-dev.sh`

**Arquivos:**
```
PerfectJob/
├── docker-compose.yml
├── README.md
├── .gitignore
├── setup.sh
├── perfectjob-api/          # Spring Boot
│   ├── pom.xml
│   └── src/main/java/com/perfectjob/
├── perfectjob-mobile/       # React Native (Expo)
│   ├── package.json
│   └── app.json
└── perfectjob-admin/        # React + Vite
    ├── package.json
    └── vite.config.ts
```

---

### Task 0.2 — Design System e Tokens
**Prioridade:** Crítica | **Estimativa:** 8h | **Dependências:** Task 0.1

- [ ] Implementar Design Tokens no React Native (`design-system/tokens/`)
- [ ] Implementar Design Tokens CSS no Web Admin (CSS Custom Properties)
- [ ] Criar componentes base do Design System:

**React Native:**
```
src/design-system/components/
├── Button (Primary, Secondary, Accent, Ghost, Icon)
├── Input (Text, Search, Select)
├── Card (JobCard, CategoryCard, CompanyCard)
├── Badge (Level, Model, Match, New)
├── Avatar (User, Company)
├── Modal (Padrão, BottomSheet)
├── Toast (Success, Error, Info)
├── Skeleton (Text, Card, Avatar)
├── Chip (Filter, Skill, Removable)
└── EmptyState
```

**Web Admin (React):**
```
src/components/ui/
├── Button, Input, Card, Badge, Avatar
├── Modal, Toast, Skeleton, Chip, EmptyState
└── Layout (Sidebar, Header, Shell)
```

- [ ] Criar ThemeProvider com suporte Light/Dark
- [ ] Criar ResponsiveProvider com breakpoints
- [ ] Documentar Storybook (web) e showcase screen (mobile)

**Arquivos:**
```
perfectjob-mobile/src/design-system/  (12+ arquivos)
perfectjob-admin/src/components/ui/   (12+ arquivos)
perfectjob-admin/.storybook/          (configuração Storybook)
```

---

## Fase 1: Backend Core

### Task 1.1 — Modelos de Dados e Migrations
**Prioridade:** Crítica | **Estimativa:** 8h | **Dependências:** Task 0.1

- [ ] Criar entidades JPA:
  - `User` (id, email, password_hash, full_name, role, avatar_url, phone, bio, linkedin_url, github_url, created_at, updated_at)
  - `Company` (id, name, slug, description, logo_url, website, size, industry, rating, rating_count)
  - `Job` (id, company_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_currency, work_model, experience_level, job_type, contract_type, location_city, location_state, location_country, skills[], status, views, applications_count, expires_at)
  - `Application` (id, job_id, candidate_id, status, cover_letter, resume_url)
  - `SavedJob` (user_id, job_id)
  - `Skill` (id, name, category)
- [ ] Criar enums: `Role`, `JobStatus`, `WorkModel`, `ExperienceLevel`, `JobType`, `ContractType`, `ApplicationStatus`
- [ ] Criar migrations Flyway:
  - `V1__init_schema.sql` — Todas as tabelas
  - `V2__add_indexes.sql` — Índices de performance
- [ ] Criar Pydantic/Record DTOs: `CreateJobRequest`, `JobResponse`, `JobSearchRequest`, `PageResponse<T>`
- [ ] Criar validações Bean Validation nos DTOs

**Verificação:** `mvn test` — migrations rodam, modelos são criados

---

### Task 1.2 — Segurança: Autenticação e Autorização
**Prioridade:** Crítica | **Estimativa:** 12h | **Dependências:** Task 1.1

- [ ] Implementar Spring Security config
- [ ] Implementar JWT Provider (access token 15min, refresh token 7d)
- [ ] Implementar JWT Filter
- [ ] Implementar UserDetailsService
- [ ] Implementar endpoints de auth:
  - `POST /api/v1/auth/register` — Cadastro candidato
  - `POST /api/v1/auth/register/recruiter` — Cadastro recrutador
  - `POST /api/v1/auth/login` — Login (retorna access + refresh token)
  - `POST /api/v1/auth/refresh` — Refresh token rotation
  - `POST /api/v1/auth/logout` — Invalida refresh token
  - `GET /api/v1/auth/me` — Perfil do usuário logado
- [ ] Implementar RBAC: `ROLE_CANDIDATE`, `ROLE_RECRUITER`, `ROLE_ADMIN`
- [ ] Implementar SecurityUtils (getCurrentUser, hasRole)
- [ ] Configurar CORS, CSRF (stateless), Security Headers
- [ ] Implementar password hashing (bcrypt)

**Verificação:** Testes de auth (login, token refresh, acesso negado sem role)

---

### Task 1.3 — CRUD de Empresas
**Prioridade:** Alta | **Estimativa:** 6h | **Dependências:** Task 1.1, 1.2

- [ ] Criar CompanyRepository
- [ ] Criar CompanyService (CRUD + busca)
- [ ] Criar CompanyController:
  - `GET /api/v1/companies` — Listagem paginada
  - `GET /api/v1/companies/{slug}` — Detalhe da empresa
  - `POST /api/v1/companies` — Criar (RECRUITER ou ADMIN)
  - `PATCH /api/v1/companies/{id}` — Atualizar (dono ou ADMIN)
  - `GET /api/v1/companies/{slug}/jobs` — Vagas da empresa
- [ ] Criar CompanyMapper (Entity ↔ DTO)
- [ ] Testes unitários e de integração

**Verificação:** CRUD de empresas funcional via REST API

---

### Task 1.4 — CRUD de Vagas
**Prioridade:** Crítica | **Estimativa:** 10h | **Dependências:** Task 1.2, 1.3

- [ ] Criar JobRepository com queries avançadas:
  - `findActiveJobs(Pageable)` — Vagas ativas não expiradas
  - `findByCompany(id, status)` — Vagas por empresa
  - `findByFilters(Specification)` — Busca dinâmica
- [ ] Criar JobSpecifications (filtros compostos)
- [ ] Criar JobService:
  - `create(request)` — Publicar vaga
  - `update(id, request)` — Atualizar vaga
  - `close(id)` — Fechar vaga
  - `getBySlug(slug)` — Detalhe da vaga
  - `search(filters)` — Busca paginada (via JPA Specification para MVP inicial)
- [ ] Criar JobController:
  - `GET /api/v1/jobs` — Busca com filtros
  - `GET /api/v1/jobs/{slug}` — Detalhe
  - `POST /api/v1/jobs` — Criar (RECRUITER)
  - `PATCH /api/v1/jobs/{id}` — Atualizar (dono)
  - `POST /api/v1/jobs/{id}/close` — Fechar (dono)
  - `GET /api/v1/jobs/trending` — Trending searches
- [ ] Criar JobMapper
- [ ] Criar JobValidator (regras de negócio)
- [ ] Scheduled task: `@Scheduled` para expirar vagas automaticamente

**Verificação:** CRUD de vagas funcional; busca com filtro por skills, nível, modelo

---

### Task 1.5 — Sistema de Candidaturas
**Prioridade:** Crítica | **Estimativa:** 8h | **Dependências:** Task 1.4

- [ ] Criar ApplicationRepository
- [ ] Criar ApplicationService:
  - `apply(jobId, userId, resume)` — Candidatar-se
  - `withdraw(applicationId)` — Cancelar candidatura
  - `listByCandidate(userId)` — Minhas candidaturas
  - `listByJob(jobId)` — Candidatos da vaga (recrutador)
  - `updateStatus(applicationId, status)` — Atualizar status (recrutador)
- [ ] Criar ApplicationController:
  - `POST /api/v1/jobs/{jobId}/apply` — Candidatar-se
  - `DELETE /api/v1/applications/{id}` — Cancelar
  - `GET /api/v1/applications/mine` — Minhas candidaturas
  - `GET /api/v1/jobs/{jobId}/applications` — Listar candidatos (RECRUITER)
  - `PATCH /api/v1/applications/{id}/status` — Atualizar status (RECRUITER)
- [ ] Upload de currículo (arquivo → S3/local)
- [ ] Validação: não pode candidatar-se 2x à mesma vaga
- [ ] Evento `ApplicationSubmittedEvent` → NotificationService

**Verificação:** Fluxo completo: candidatar-se → recrutador vê → atualiza status

---

### Task 1.6 — Vagas Salvas (Favoritos)
**Prioridade:** Média | **Estimativa:** 4h | **Dependências:** Task 1.4

- [ ] Criar SavedJob Repository
- [ ] Criar endpoints:
  - `POST /api/v1/jobs/{jobId}/save` — Salvar vaga
  - `DELETE /api/v1/jobs/{jobId}/save` — Remover dos salvos
  - `GET /api/v1/saved-jobs` — Listar vagas salvas
- [ ] Retornar `isSaved` no JobResponse quando usuário autenticado

**Verificação:** Salvar/remover vagas; listar vagas salvas

---

### Task 1.7 — Perfil de Usuário
**Prioridade:** Alta | **Estimativa:** 6h | **Dependências:** Task 1.2

- [ ] Criar UserService para gerenciar perfil
- [ ] Criar endpoints:
  - `GET /api/v1/users/me` — Perfil completo
  - `PATCH /api/v1/users/me` — Atualizar perfil
  - `POST /api/v1/users/me/avatar` — Upload avatar
  - `GET /api/v1/users/me/skills` — Minhas skills
  - `PUT /api/v1/users/me/skills` — Atualizar skills
  - `GET /api/v1/users/me/stats` — Estatísticas (candidaturas, salvos)
- [ ] Validação de email único
- [ ] Sanitização de inputs (PII)

**Verificação:** Perfil CRUD funcional; avatar upload; skills gerenciáveis

---

## Fase 2: Busca Full-Text (PostgreSQL)

### Task 2.1 — PostgreSQL Full-Text Search Setup
**Prioridade:** Crítica | **Estimativa:** 6h | **Dependências:** Task 1.4

- [ ] Criar migration `V3__add_fulltext_vector.sql`:
  - Coluna `search_vector tsvector GENERATED ALWAYS AS (...)`
  - Índice GIN em `search_vector`
  - Extensão `pg_trgm` + índices GIN para `title`, `skills`, `companies.name`
- [ ] Criar `JobSearchRepository` com queries nativas:
  - `searchFullText(keyword, pageable)` — `ts_rank` + `tsquery`
  - `searchByTitlePrefix(prefix)` — `pg_trgm` similarity
- [ ] Criar `SearchService`:
  - `search(SearchRequest)` — Busca full-text com ranking de relevância
  - `suggest(prefix)` — Autocomplete via `similarity()` do pg_trgm
  - `trendingTerms(limit)` — Agregação de termos mais buscados (Redis cache)
- [ ] Configurar `tsvector` com pesos por campo:
  - title (A=1.0) > skills (B=0.4) > description (C=0.2)
- [ ] Testar performance com ~100k vagas simuladas (deve ser < 50ms)

**Verificação:** Busca por keyword retorna vagas ordenadas por relevância; autocomplete funcional

---

### Task 2.2 — Endpoints de Busca
**Prioridade:** Crítica | **Estimativa:** 3h | **Dependências:** Task 2.1

- [ ] Criar `SearchController`:
  - `GET /api/v1/search/jobs?q=&work_model=&level=&min_salary=&skills=` — Busca
  - `GET /api/v1/search/suggest?q=` — Autocomplete (mín 2 chars)
  - `GET /api/v1/search/trending` — Trending searches (Redis, TTL 1h)
- [ ] Cache de buscas populares (Redis, TTL 5 min)
- [ ] Rate limiting no endpoint de busca

**Verificação:** Busca com filtros combinados; autocomplete retorna sugestões; trending mostra termos

---

## Fase 3: Notificações (Spring Async)

### Task 3.1 — Sistema de Notificações
**Prioridade:** Média | **Estimativa:** 5h | **Dependências:** Task 1.4, 1.5

- [ ] Criar `NotificationService` (envio + persistência)
- [ ] Tipos de notificação:
  - Candidatura recebida (recrutador)
  - Status atualizado (candidato)
  - Vaga salva expirando (candidato)
- [ ] Canais (MVP):
  - Push notification (Expo Push)
  - Email (Spring Mail + SendGrid — fase 2, placeholder no MVP)
- [ ] Processamento assíncrono: `@Async` + `@EventListener` nos eventos de domínio
- [ ] Criar endpoints:
  - `GET /api/v1/notifications` — Listar notificações
  - `PATCH /api/v1/notifications/{id}/read` — Marcar lida
  - `POST /api/v1/notifications/read-all` — Marcar todas lidas

**Verificação:** Notificações recebidas após ações relevantes; listagem e marcação funcionais

---

## Fase 4: Mobile (React Native)

### Task 4.1 — Setup e Navegação
**Prioridade:** Crítica | **Estimativa:** 6h | **Dependências:** Task 0.1, 0.2

- [ ] Configurar React Navigation:
  - `RootNavigator` (Auth stack vs Main tabs)
  - `TabNavigator` (Home, Search, Saved, Profile)
  - `HomeStack`, `SearchStack`, `ProfileStack`
- [ ] Criar AuthProvider (login persistente)
- [ ] Criar API client (Axios + interceptors + refresh token)
- [ ] Configurar TanStack Query (QueryClientProvider)
- [ ] Configurar Zustand stores (auth, filters, search)
- [ ] Criar telas placeholder com tipagem

**Verificação:** Navegação funcional entre todas as tabs; auth flow (login → main)

---

### Task 4.2 — Tela de Login/Cadastro
**Prioridade:** Crítica | **Estimativa:** 8h | **Dependências:** Task 4.1, Task 1.2

- [ ] LoginScreen:
  - Formulário (email + senha)
  - Validação inline
  - "Esqueci minha senha" link
  - "Criar conta" link
- [ ] RegisterScreen:
  - Formulário (nome, email, senha, confirmar senha)
  - Validação (email format, password strength)
  - Aceitar Termos de Uso
- [ ] Onboarding (3 slides: Encontre vagas, Candidate-se rápido, Acompanhe status)
- [ ] Loading states e tratamento de erros da API
- [ ] KeyboardAvoidingView, scroll em formulários

**Verificação:** Login/cadastro funcional; tokens armazenados; onboarding mostrado apenas 1x

---

### Task 4.3 — Home Screen
**Prioridade:** Crítica | **Estimativa:** 10h | **Dependências:** Task 4.1, Task 1.4, Task 2.2

- [ ] Hero Section:
  - Headline "Encontre a vaga dos seus sonhos"
  - Subheadline "Milhares de oportunidades te esperando"
  - SearchBar com 2 inputs inline: cargo/skill + localização
  - Botão CTA "Buscar Vagas"
- [ ] Trending Searches:
  - Chips horizontais scrollable
  - Cada chip → navega para busca pré-preenchida
- [ ] Categoria Grid (2 colunas):
  - Cards com ícone, nome da categoria, contagem
  - Navega para busca por categoria
- [ ] Featured Jobs:
  - Section header "Vagas em Destaque" + "Ver todas"
  - Horizontal FlatList de JobCards
- [ ] Companies Destaque:
  - Horizontal FlatList de CompanyCards (logo + nome + rating)
- [ ] Bottom CTA: "É uma empresa? Anuncie vagas aqui"

**Verificação:** Home carrega dados reais; busca funcional; cards navegáveis

---

### Task 4.4 — Tela de Busca
**Prioridade:** Crítica | **Estimativa:** 12h | **Dependências:** Task 4.1, Task 1.4, Task 2.2

- [ ] Search Header:
  - Input de busca com autocomplete (API de sugestão pg_trgm)
  - Debounce 300ms antes de disparar busca
  - Botão de filtros
- [ ] Quick Filter Chips (horizontal scroll):
  - Work model, Experience level, "Remoto", "CLT", etc.
- [ ] Results Bar:
  - Count de vagas encontradas
  - Dropdown de ordenação (Mais recentes, Maior salário, Relevância)
- [ ] JobCard List (FlashList):
  - Infinite scroll (fetchNextPage)
  - Pull-to-refresh
  - Skeleton loading na primeira carga
  - EmptyState quando sem resultados
- [ ] Filter Bottom Sheet:
  - Work model (checkboxes)
  - Experience level (checkboxes)
  - Salary range (dual slider)
  - Location (cidade/estado)
  - Skills (multi-select chips)
  - Botões "Aplicar Filtros" / "Limpar"
  - Contador de filtros ativos no botão de filtro
- [ ] JobCard:
  - Logo empresa (esquerda)
  - Título, empresa, localização
  - Salário, modalidade, nível (ícones inline)
  - Descrição truncada (2 linhas)
  - Tags de skills (3 primeiras)
  - Rodapé: time ago + save button (coração) + match % (se logado)
  - Swipe-to-save (gesture)

**Verificação:** Busca funcional com todos os filtros; infinite scroll; pull-to-refresh

---

### Task 4.5 — Detalhe da Vaga
**Prioridade:** Crítica | **Estimativa:** 8h | **Dependências:** Task 4.1, Task 1.4

- [ ] JobDetailScreen:
  - Header com logo, título, empresa, localização
  - Meta badges: Salário, Modalidade, Nível, Tipo, Contrato
  - Status: Publicada há X tempo | Candidatos: N
  - Match % (se logado)
  - Botões: "Candidatar-se" (CTA) + "Salvar" (ícone coração)
- [ ] Seções de conteúdo:
  - Descrição da vaga (texto completo)
  - Responsabilidades (bullet list)
  - Requisitos (bullet list)
  - Diferenciais (bullet list, se existir)
  - Tags de skills
- [ ] Company Card:
  - Logo maior, nome, rating, website, tamanho
  - Link "Ver todas as vagas desta empresa"
- [ ] Vagas Relacionadas (horizontal FlatList)
- [ ] Share button (compartilhar link da vaga)
- [ ] Deep link: `perfectjob://jobs/{slug}`

**Verificação:** Detalhe da vaga carrega e exibe todas as seções; botões funcionais

---

### Task 4.6 — Fluxo de Candidatura
**Prioridade:** Crítica | **Estimativa:** 6h | **Dependências:** Task 4.5, Task 1.5

- [ ] ApplyScreen ou Bottom Sheet:
  - Revisão dos dados do perfil (nome, email, skills)
  - Upload de currículo (PDF, 5MB max)
  - Carta de apresentação (opcional, textarea)
  - Confirmação de candidatura
- [ ] Confirmação:
  - Animação de sucesso
  - Mensagem "Candidatura enviada com sucesso!"
  - Botão "Ver minhas candidaturas"
  - Botão "Continuar buscando"
- [ ] Validações:
  - Não pode candidatar-se sem currículo OU perfil completo
  - Não pode candidatar-se 2x à mesma vaga
  - Vaga deve estar ativa e não expirada

**Verificação:** Candidatura completada; confirmação exibida; candidatura aparece em "Minhas candidaturas"

---

### Task 4.7 — Minhas Candidaturas e Vagas Salvas
**Prioridade:** Alta | **Estimativa:** 6h | **Dependências:** Task 4.5, Task 1.5, Task 1.6

- [ ] ApplicationsScreen:
  - Tabs: "Todas", "Pendentes", "Em andamento", "Finalizadas"
  - Card com status badge colorido
  - Pull-to-refresh
  - EmptyState com ilustração
- [ ] SavedJobsScreen:
  - Grid/List de JobCards salvas
  - Swipe para remover dos salvos
  - EmptyState "Nenhuma vaga salva ainda" + CTA "Explorar vagas"

**Verificação:** Listas carregam dados; filtros por status; remover dos salvos funciona

---

### Task 4.8 — Perfil e Configurações
**Prioridade:** Alta | **Estimativa:** 8h | **Dependências:** Task 4.1, Task 1.7

- [ ] ProfileScreen:
  - Avatar (editável)
  - Nome, email, telefone (editável)
  - Bio (textarea)
  - LinkedIn URL, GitHub URL (editável)
  - Skills (chips adicionáveis/removíveis)
  - Currículo (upload/visualizar)
  - Estatísticas: N candidaturas, N vagas salvas
- [ ] Settings:
  - Tema (Light/Dark/System)
  - Notificações push (toggle)
  - Idioma (PT-BR / EN)
  - Sobre o app (versão, termos, privacidade)
  - Logout
  - Deletar conta (com confirmação)

**Verificação:** Perfil editável; avatar upload; tema muda; logout funcional

---

## Fase 5: Web Admin (Recrutadores)

### Task 5.1 — Setup Admin e Layout
**Prioridade:** Alta | **Estimativa:** 6h | **Dependências:** Task 0.1, 0.2

- [ ] Configurar React + Vite + TypeScript + React Router
- [ ] Criar layout admin:
  - Sidebar (logo, nav links, user info)
  - Header (breadcrumb, ações, avatar)
  - Main content area
- [ ] Configurar API client (Axios, interceptors, auth)
- [ ] Configurar TanStack Query
- [ ] Auth flow (login recrutador → dashboard)
- [ ] Protected routes

**Verificação:** Layout renderiza; navegação sidebar funcional; auth flow

---

### Task 5.2 — Dashboard do Recrutador
**Prioridade:** Alta | **Estimativa:** 8h | **Dependências:** Task 5.1

- [ ] Dashboard:
  - Métricas rápidas: Vagas ativas, Total candidaturas, Candidaturas hoje, Taxa conversão
  - Gráfico: Candidaturas por dia (últimos 30 dias)
  - Lista: Últimas candidaturas recebidas
  - Lista: Vagas com mais candidaturas
- [ ] Meus Dados:
  - Perfil do recrutador
  - Dados da empresa (CRUD)
- [ ] Responsivo (tablet + desktop)

**Verificação:** Dashboard carrega dados reais; métricas corretas

---

### Task 5.3 — CRUD de Vagas (Admin)
**Prioridade:** Crítica | **Estimativa:** 10h | **Dependências:** Task 5.1, Task 1.4

- [ ] Vagas (Lista):
  - Tabela/Grid de vagas com status (Ativa, Fechada, Rascunho)
  - Filtros: status, data
  - Ordenação
  - Ações: Editar, Fechar, Duplicar, Ver candidatos
- [ ] Nova/Editar Vaga (Formulário):
  - Wizard de 3 passos:
    1. Detalhes: Título, descrição, requisitos, diferenciais
    2. Classificação: Work model, experience level, job type, contract type
    3. Info adicional: Salary range, skills (multi-select com autocomplete), location
  - Preview antes de publicar
  - Salvar como rascunho
  - Validação em tempo real
- [ ] Preview da vaga (como candidato vê)
- [ ] Analytics da vaga:
  - Views, applications, CTR

**Verificação:** Criar/editar/fechar vagas; preview funcional; analytics exibidos

---

### Task 5.4 — Gestão de Candidaturas (Admin)
**Prioridade:** Alta | **Estimativa:** 8h | **Dependências:** Task 5.1, Task 1.5

- [ ] Lista de candidatos por vaga:
  - Pipeline/Kanban view (colunas: Pendente, Revisado, Entrevista, Oferta, Contratado, Rejeitado)
  - Drag-and-drop para mudar status
- [ ] Detalhe do candidato:
  - Perfil, skills, currículo (visualizar)
  - Carta de apresentação
  - Timeline de status
  - Ações: Mudar status, Enviar mensagem (fase 2), Agendar entrevista (fase 2)
- [ ] Filtros: status, data, match
- [ ] Exportar CSV

**Verificação:** Kanban funcional; drag-and-drop atualiza status; visualização de currículo

---

## Fase 6: Polish & Lançamento

### Task 6.1 — Testes e Qualidade
**Prioridade:** Crítica | **Estimativa:** 16h | **Dependências:** Todas anteriores

**Backend:**
- [ ] Unit tests: Services, Mappers, Validators (>80% coverage)
- [ ] Integration tests: Controllers, Repositories
- [ ] E2E tests: Fluxo completo com Testcontainers
- [ ] ArchUnit tests (regras de arquitetura)
- [ ] Performance tests: JMeter/K6 para endpoint de busca

**Mobile:**
- [ ] Unit tests: Hooks, Utils, Stores
- [ ] Integration tests: Screens com MSW mock
- [ ] Maestro E2E: Fluxo de busca → detalhe → candidatura
- [ ] Snapshot tests: Componentes do Design System

**Admin:**
- [ ] Unit tests: Components, Hooks
- [ ] Integration tests: Páginas com MSW
- [ ] Playwright E2E: Fluxo recrutador

**Verificação:** CI verde; coverage > 80%; E2E passam

---

### Task 6.2 — Acessibilidade
**Prioridade:** Alta | **Estimativa:** 8h | **Dependências:** Task 6.1

- [ ] Mobile:
  - accessibilityLabel em todos os elementos interativos
  - accessibilityRole correto
  - `accessibilityState` em toggles/selecionados
  - Screen reader test (VoiceOver / TalkBack)
  - Contraste WCAG AA
  - Touch targets ≥ 44pt
- [ ] Admin Web:
  - `aria-*` attributes
  - Keyboard navigation (Tab, Enter, Escape)
  - Focus management em modais
  - Skip-to-content link
  - Screen reader test

**Verificação:** Testes de acessibilidade passam; screen reader navega corretamente

---

### Task 6.3 — Performance e Otimização
**Prioridade:** Alta | **Estimativa:** 12h | **Dependências:** Task 6.1

**Backend:**
- [ ] Database query optimization (EXPLAIN ANALYZE, índices GIN/GiST)
- [ ] Cache tuning (Redis TTLs, cache hit rate > 80%)
- [ ] Connection pool tuning (HikariCP)
- [ ] GZIP compression em responses

**Mobile:**
- [ ] FlashList optimization (estimatedItemSize, getItemType)
- [ ] Image caching (expo-image)
- [ ] Lazy loading de telas não-críticas
- [ ] Bundle size analysis (< 5MB)
- [ ] Frame rate > 55fps em scroll (Flipper/React DevTools)

**Verificação:** p95 < 200ms API, p95 < 150ms busca; bundle size < 5MB

---

### Task 6.4 — CI/CD & Infraestrutura
**Prioridade:** Alta | **Estimativa:** 12h | **Dependências:** Task 6.1

- [ ] GitHub Actions pipeline:
  - Backend: Build → Test → Docker → Deploy VPS
  - Mobile: Lint → Test → TypeScript → EAS Build → Submit
  - Admin: Lint → Test → Build → Deploy Vercel
- [ ] Docker build otimizado (multi-stage)
- [ ] Deploy MVP: script `deploy.sh` (rsync + docker compose)
- [ ] Sentry para crash reporting (mobile + backend)
- [ ] UptimeRobot monitoring

**Verificação:** Pipeline CI passa; deploy staging automático; healthchecks OK

---

### Task 6.5 — Lançamento e Publicação
**Prioridade:** Alta | **Estimativa:** 8h | **Dependências:** Task 6.4

- [ ] App Store Connect (iOS):
  - App metadata, screenshots, descrição
  - Privacy Policy URL
  - App Review submission
- [ ] Google Play Console (Android):
  - App metadata, screenshots, descrição
  - Privacy Policy
  - Closed testing track (se necessário)
- [ ] Landing page (perfectjob.com):
  - Hero, features, download links (App Store / Play Store)
  - SEO (meta tags, sitemap)
- [ ] Analytics: Google Analytics, Firebase
- [ ] Customer support: Email, FAQ page

**Verificação:** App publicado em ambas as stores; landing page no ar

---

## Resumo de Tasks por Fase

| Fase | Tasks | Horas Estimadas | Prioridade |
|------|-------|-----------------|------------|
| **Fase 0:** Setup | 0.1, 0.2 | 12h | Crítica |
| **Fase 1:** Backend Core | 1.1–1.7 | 54h | Crítica |
| **Fase 2:** Busca PostgreSQL | 2.1, 2.2 | 9h | Crítica |
| **Fase 3:** Notificações | 3.1 | 5h | Média |
| **Fase 4:** Mobile | 4.1–4.8 | 64h | Crítica |
| **Fase 5:** Web Admin | 5.1–5.4 | 32h | Alta |
| **Fase 6:** Polish | 6.1–6.5 | 40h | Alta |
| **Total** | **29 tasks** | **~216h** | |

---

## Ordem de Execução Recomendada

```
Fase 0: 0.1 → 0.2
         ↓
Fase 1: 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 + 1.7 (paralelo)
         ↓                          ↓
Fase 2: 2.1 → 2.2                   |
          ↓                          ↓
Fase 3: 3.1                           |
         ↓                          ↓
Fase 4: 4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6 → 4.7 + 4.8 (paralelo)
         ↓
Fase 5: 5.1 → 5.2 → 5.3 + 5.4 (paralelo)
         ↓
Fase 6: 6.1 → 6.2 → 6.3 → 6.4 → 6.5
```

---

## Sprints Sugeridas (2 semanas cada)

| Sprint | Tasks | Entregável |
|--------|-------|------------|
| Sprint 1 | 0.1, 0.2, 1.1, 1.2 | Infra + Auth API |
| Sprint 2 | 1.3, 1.4, 1.5 | CRUD Vagas + Candidaturas |
| Sprint 3 | 1.6, 1.7, 2.1, 2.2 | Perfil + Busca PostgreSQL |
| Sprint 4 | 3.1, 4.1, 4.2 | Notificações + App Auth |
| Sprint 5 | 4.3, 4.4, 4.5 | Home + Busca + Detalhe |
| Sprint 6 | 4.6, 4.7, 4.8 | Candidatura + Perfil App |
| Sprint 7 | 5.1, 5.2, 5.3 | Admin Vagas |
| Sprint 8 | 5.4, 6.1 | Admin Candidaturas + Testes |
| Sprint 9 | 6.2, 6.3, 6.4 | A11y + Perf + Deploy |
**Duração total estimada:** 18 semanas (4.5 meses)

---

## Definição de Pronto (Definition of Done)

- [ ] Código compila sem erros
- [ ] Lint passa (Checkstyle/ESLint)
- [ ] Testes unitários passam (>80% coverage)
- [ ] Testes de integração passam
- [ ] Code review aprovado
- [ ] Documentação de API atualizada (OpenAPI/Swagger)
- [ ] Migrations testadas (up + down)
- [ ] Feature testada em staging
- [ ] Performance check (sem regressão)
- [ ] Acessibilidade verificada
