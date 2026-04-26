# PerfectJob — Skill: Arquitetura de Software

## Propósito
Esta skill define a arquitetura de software do ecossistema PerfectJob, incluindo decisões arquiteturais, padrões de comunicação entre serviços, e estratégia de deploy.

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                                 │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │  React Native     │  │  Web Admin Panel  │                    │
│  │  (iOS / Android)  │  │  (React + Vite)   │                    │
│  └────────┬─────────┘  └────────┬─────────┘                    │
│           │                     │                                │
│           └──────────┬──────────┘                                │
│                      │  HTTPS/TLS                                │
├──────────────────────┼───────────────────────────────────────────┤
│                      │           MONOLITH (Spring Boot)          │
│     ┌────────────────┼────────────────────────┐                  │
│     │        PerfectJob API (Port: 8080)       │                  │
│     │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │                  │
│     │  │  Auth    │ │  Jobs    │ │  Users   │ │                  │
│     │  │  Module  │ │  Module  │ │  Module  │ │   Módulos       │
│     │  └──────────┘ └──────────┘ └──────────┘ │   desacoplados  │
│     │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │   mesmo deploy   │
│     │  │  Search  │ │  Appl.   │ │Companies │ │                  │
│     │  │  Module  │ │  Module  │ │  Module  │ │                  │
│     │  └──────────┘ └──────────┘ └──────────┘ │                  │
│     └─────────────────────────────────────────┘                  │
│           │              │                                       │
├───────────┼──────────────┼───────────────────────────────────────┤
│           │              │           DATA LAYER                  │
│  ┌────────┴────────┐ ┌───┴──────────┐                           │
│  │ PostgreSQL 16   │ │ Redis 7      │                           │
│  │ (DB + Full-Text │ │ (Cache/      │                           │
│  │  Search + pg_trgm)│  Session)     │                           │
│  └─────────────────┘ └──────────────┘                           │
│                                                                   │
│  ┌──────────────────┐                                           │
│  │ S3/MinIO         │  (Currículos, logos)                      │
│  └──────────────────┘                                           │
└───────────────────────────────────────────────────────────────────┘
```

---

## 2. Decisões Arquiteturais (ADRs)

### ADR-001: Monolith-First → Modular Monolith
**Decisão:** Começar como monólito modular (único deploy) com clara separação de módulos, evoluindo para microserviços conforme necessário.
**Motivo:** Reduz complexidade operacional no MVP. Módulos bem definidos permitem extração futura sem rewrite.

### ADR-002: PostgreSQL como fonte única de dados e busca full-text
**Decisão:** PostgreSQL como banco único para dados relacionais e busca full-text via `tsvector`/`tsquery` + `pg_trgm` para fuzzy matching.
**Motivo:** Elimina complexidade de sincronização, reduz infraestrutura (sem container ES), e PostgreSQL full-text é suficiente para o volume do MVP (até ~500k vagas). Elasticsearch pode ser adicionado futuramente se necessário.

### ADR-003: Spring Async para processamento assíncrono (MVP)
**Decisão:** Usar `@Async` + `ApplicationEventPublisher` nativo do Spring para notificações e processamento assíncrono, sem message broker externo.
**Motivo:** Volume de notificações do MVP não justifica RabbitMQ. Spring Async é zero-config, sem container extra. RabbitMQ/Kafka podem ser adicionados quando o volume exigir fila persistente.

### ADR-004: JWT com refresh token rotation
**Decisão:** Access token (15min) + Refresh token (7d, rotating) + httpOnly cookie.
**Motivo:** Balanceia segurança (tokens curtos) com UX (não precisa re-login frequente).

### ADR-005: Cache com Redis (Cache-Aside pattern)
**Decisão:** Aplicação consulta cache primeiro; em cache miss, busca do DB e popula cache.
**Motivo:** Reduz latência de leitura e carga no PostgreSQL para dados frequentemente acessados (vagas ativas, dados de empresa).

### ADR-006: API Versioning via URL path
**Decisão:** `/api/v1/jobs`, `/api/v2/jobs`.
**Motivo:** Explícito, fácil de entender, compatível com todos os clientes.

### ADR-007: Busca full-text nativa no PostgreSQL
**Decisão:** Busca de vagas via PostgreSQL `tsvector`/`tsquery` com índice GIN, `pg_trgm` para autocomplete e fuzzy search.
**Alternativas consideradas:** Elasticsearch (descartado no MVP: complexidade operacional desnecessária para o volume inicial), LIKE/ILIKE (descartado: sem ranking de relevância).

---

## 3. Padrões de Comunicação

### 3.1 Síncrono (REST/HTTP)
- Cliente → Monolith API
- Usado para: CRUD de vagas, candidaturas, perfil, autenticação, busca

### 3.2 Assíncrono (Spring Events)
- `@EventListener` + `@Async` dentro do próprio processo
- Usado para: notificações push, analytics, envio de emails

### 3.3 Eventos de Domínio (in-process)
```
JobPosted → [Notification Service: notifica candidatos com match]
         → [Analytics Service: registra métrica]

ApplicationSubmitted → [Notification Service: notifica recrutador]
                    → [Analytics Service: registra métrica]
```

---

## 4. Estrutura Modular (Monolith Modular)

```
perfectjob-api/
├── perfectjob-core/           # Shared kernel
│   ├── models/                 # Entidades base, enums
│   ├── events/                 # Domain events
│   └── exceptions/             # Exceções de domínio
│
├── perfectjob-auth/            # Módulo de Autenticação
│   ├── controller/
│   ├── service/
│   ├── model/
│   └── security/
│
├── perfectjob-jobs/            # Módulo de Vagas
│   ├── controller/
│   ├── service/
│   ├── model/
│   └── repository/
│
├── perfectjob-search/          # Módulo de Busca (PostgreSQL FTS)
│   ├── controller/
│   ├── service/
│   └── repository/
│
├── perfectjob-users/           # Módulo de Usuários
│   ├── controller/
│   ├── service/
│   ├── model/
│   └── repository/
│
├── perfectjob-companies/       # Módulo de Empresas
│   ├── controller/
│   ├── service/
│   ├── model/
│   └── repository/
│
├── perfectjob-applications/    # Módulo de Candidaturas
│   ├── controller/
│   ├── service/
│   ├── model/
│   └── repository/
│
├── perfectjob-notifications/   # Módulo de Notificações
│   ├── service/
│   └── listener/
│
└── perfectjob-analytics/       # Módulo de Analytics
    ├── controller/
    ├── service/
    └── listener/
```

---

## 5. Database Schema (PostgreSQL)

```sql
-- Users
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,        -- CANDIDATE, RECRUITER, ADMIN
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    bio TEXT,
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies
CREATE TABLE companies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    website VARCHAR(500),
    size VARCHAR(50),
    industry VARCHAR(100),
    founded_year INTEGER,
    rating DECIMAL(2,1) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs
CREATE TABLE jobs (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    benefits TEXT,
    salary_min DECIMAL(10,2),
    salary_max DECIMAL(10,2),
    salary_currency VARCHAR(3) DEFAULT 'BRL',
    work_model VARCHAR(20) NOT NULL,     -- REMOTE, HYBRID, ON_SITE
    experience_level VARCHAR(20) NOT NULL, -- INTERN, JUNIOR, MID, SENIOR, LEAD, SPECIALIST
    job_type VARCHAR(20) NOT NULL,       -- FULL_TIME, PART_TIME, CONTRACT, FREELANCE
    contract_type VARCHAR(20) NOT NULL,  -- CLT, PJ, COOPERATIVE
    location_city VARCHAR(100),
    location_state VARCHAR(50),
    location_country VARCHAR(50) DEFAULT 'Brasil',
    skills TEXT[] NOT NULL DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, CLOSED, DRAFT
    views INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Applications
CREATE TABLE applications (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES jobs(id),
    candidate_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, REVIEWED, INTERVIEW, OFFER, HIRED, REJECTED
    cover_letter TEXT,
    resume_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(job_id, candidate_id)
);

-- Saved Jobs
CREATE TABLE saved_jobs (
    user_id BIGINT NOT NULL REFERENCES users(id),
    job_id BIGINT NOT NULL REFERENCES jobs(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY(user_id, job_id)
);

-- Skills
CREATE TABLE skills (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50)
);

-- Job Skills (join table)
CREATE TABLE job_skills (
    job_id BIGINT REFERENCES jobs(id),
    skill_id BIGINT REFERENCES skills(id),
    PRIMARY KEY(job_id, skill_id)
);

-- PostgreSQL Full-Text Search Indexes
CREATE INDEX idx_jobs_search ON jobs USING GIN(
    to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(company_name, ''))
);
CREATE INDEX idx_jobs_skills ON jobs USING GIN(skills);
CREATE INDEX idx_jobs_created ON jobs(created_at DESC);

-- Trigrams for autocomplete / fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_jobs_title_trgm ON jobs USING GIN(title gin_trgm_ops);
CREATE INDEX idx_jobs_company_trgm ON companies USING GIN(name gin_trgm_ops);
CREATE INDEX idx_skills_name_trgm ON skills USING GIN(name gin_trgm_ops);
```

### 5.2 Busca Full-Text PostgreSQL

**Query nativa com ranking de relevância:**
```java
@Query(value = """
    SELECT j.*, ts_rank(search_vector, query) AS rank
    FROM jobs j,
         plainto_tsquery('portuguese', :keyword) AS query
    WHERE j.status = 'ACTIVE'
      AND j.expires_at > NOW()
      AND j.search_vector @@ query
    ORDER BY rank DESC
    """, nativeQuery = true)
Page<Job> searchFullText(@Param("keyword") String keyword, Pageable pageable);
```

**Autocomplete com pg_trgm:**
```java
@Query("SELECT j.title FROM Job j WHERE j.title ILIKE %:prefix% " +
       "ORDER BY similarity(j.title, :prefix) DESC")
List<String> suggestTitles(@Param("prefix") String prefix, Pageable topN);
```

**Search vector (generated column):**
```sql
ALTER TABLE jobs ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('portuguese', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('portuguese', coalesce(skills_text, '')), 'B') ||
        setweight(to_tsvector('portuguese', coalesce(description, '')), 'C')
    ) STORED;
```

**Pesos:** title (A=1.0) > skills (B=0.4) > description (C=0.2)

---

## 7. Deploy & Infraestrutura (MVP)

### 7.1 Ambiente de Desenvolvimento
```yaml
# docker-compose.yml (dev local)
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

### 7.2 Staging / Produção (MVP)
- **Compute:** 1 VPS (Hetzner, DigitalOcean) ou AWS EC2 t3.medium
- **Database:** PostgreSQL 16 na mesma VPS (migrar para RDS quando necessário)
- **Cache:** Redis na mesma VPS (migrar para ElastiCache quando necessário)
- **Storage:** S3/MinIO para currículos e logos
- **Deploy:** Docker Compose + GitHub Actions (bash script + rsync/scp)

### 7.3 Pós-MVP (escalar quando necessário)
- Kubernetes (EKS/GKE) para orquestração
- RDS PostgreSQL Multi-AZ
- ElastiCache Redis cluster
- RabbitMQ/Kafka para eventos (se volume exigir fila persistente)
- Terraform para IaC

### 7.4 CI/CD Pipeline (MVP)
```
Git Push → Build → Unit Tests → Integration Tests →
  → SAST Scan → Dependency Check →
    → Docker Build → Push to ECR →
      → Deploy Staging → E2E Tests →
        → Approval Gate → Deploy Production (Canary → Full)
```

---

## 8. Non-Functional Requirements

| Requisito | Target |
|-----------|--------|
| Disponibilidade | 99.9% (SLA) |
| Latência API | p95 < 200ms |
| Latência Busca | p95 < 150ms |
| Throughput | 1000 req/s |
| Recuperação (RTO) | < 1 hora |
| Perda de dados (RPO) | < 5 minutos |
| Segurança | OWASP Top 10 compliance |
