# PerfectJob — Project Overview

## Sobre

**PerfectJob** é uma plataforma inteligente de busca e matching de vagas de emprego, composta por:

- **Mobile App (React Native/Expo):** Aplicativo iOS e Android para candidatos buscarem, salvarem e candidatarem-se a vagas
- **Backend API (Spring Boot 3 + Java 21):** API REST com busca full-text via PostgreSQL (tsvector/tsquery + pg_trgm)
- **Admin Web (React + Vite):** Painel administrativo para recrutadores publicarem e gerenciarem vagas

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Mobile | React Native 0.76, Expo SDK 52, TypeScript |
| Backend | Spring Boot 3.3, Java 21, PostgreSQL 16 |
| Busca | PostgreSQL full-text (tsvector + pg_trgm) |
| Cache | Redis 7 |
| Admin Web | React 19, Vite, TypeScript |
| Infra | Docker Compose (dev/staging), VPS (produção) |
| CI/CD | GitHub Actions |

## Estrutura

```
PerfectJob/
├── README.md
├── docker-compose.yml
├── setup.sh
├── .env.example
├── design-system/                    # Design System completo
│   └── perfectjob-design-system.md
├── skills/                           # Skills de engenharia
│   ├── backend/SKILL.md             # Spring Boot best practices
│   ├── frontend/SKILL.md            # React Native best practices
│   ├── security/SKILL.md            # Segurança
│   ├── architecture/SKILL.md        # Arquitetura
│   ├── design-patterns/SKILL.md    # Design Patterns
│   ├── ui-ux/SKILL.md              # UI/UX Design
│   └── devops/SKILL.md             # DevOps & Infra
├── docs/
│   ├── specs/                       # Design specs
│   └── plans/                       # Implementation plans
├── Tasks/
│   └── task_00_mvp_master_plan.md   # Plano mestre do MVP
├── perfectjob-api/                  # Spring Boot backend
├── perfectjob-mobile/               # React Native mobile
└── perfectjob-admin/                # React admin web
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Java 21+
- Node.js 20+ (with npm)
- Maven (or use `./mvnw` wrapper)

### 1. Start Infrastructure

```bash
./setup.sh
```

Or manually:

```bash
docker compose up -d
```

This starts PostgreSQL 16 and Redis 7.

### 2. Run Backend

```bash
cd perfectjob-api
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

The API will be available at `http://localhost:8080/api`.

### 3. Run Mobile App

```bash
cd perfectjob-mobile
npm install
npx expo start
```

Scan the QR code with the Expo Go app on your phone, or press `i` for iOS simulator / `a` for Android emulator.

### 4. Run Admin Web

```bash
cd perfectjob-admin
npm install
npm run dev
```

The admin panel will be available at `http://localhost:5173` (or another port shown in the terminal).

## API Endpoints

Base URL: `http://localhost:8080/api`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/v1/auth/register` | Register a new user | No |
| POST | `/v1/auth/login` | Authenticate and get JWT | No |
| GET | `/v1/jobs` | Search and list jobs | No |
| GET | `/v1/jobs/{slug}` | Get job details by slug | No |
| POST | `/v1/jobs` | Create a new job | Yes |
| PATCH | `/v1/jobs/{id}` | Update a job | Yes |
| POST | `/v1/jobs/{id}/close` | Close a job posting | Yes |
| GET | `/v1/companies` | List all companies | No |
| GET | `/v1/companies/{slug}` | Get company by slug | No |
| POST | `/v1/companies` | Create a company | Yes |
| PATCH | `/v1/companies/{id}` | Update a company | Yes |
| DELETE | `/v1/companies/{id}` | Delete a company | Yes |
| POST | `/v1/applications` | Submit a job application | Yes |
| GET | `/v1/search/jobs` | Full-text search jobs | No |
| GET | `/v1/search/suggest` | Autocomplete job titles | No |

## Environment Variables

Create a `.env` file in the project root (see `.env.example`):

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_PASSWORD` | PostgreSQL password | `devpass` |
| `JWT_SECRET` | Secret key for JWT signing | `change-me-in-production` |
| `API_URL` | Backend API base URL | `http://localhost:8080/api` |

Backend-specific variables are configured in `perfectjob-api/src/main/resources/application.yml`:

| Variable | Description | Default |
|----------|-------------|---------|
| `SPRING_DATASOURCE_URL` | JDBC URL for PostgreSQL | `jdbc:postgresql://localhost:5432/perfectjob` |
| `SPRING_DATASOURCE_USERNAME` | Database username | `perfectjob` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | `perfectjob` |
| `JWT_SECRET` | JWT signing secret | `perfectjob-default-secret-key-change-me-in-production` |
| `JWT_ACCESS_EXPIRATION` | JWT expiration in milliseconds | `900000` (15 min) |
| `SERVER_PORT` | API server port | `8080` |

## Design System

O design system completo está em `design-system/perfectjob-design-system.md` e inclui:
- **Brand Foundation:** Cores, tipografia, espaçamento, sombras, border-radius
- **Componentes:** Botões, Inputs, Cards, Badges, Modais, Toast, Skeleton, etc.
- **Telas:** Home (print 2), Busca de Vagas (print 1), Detalhe da Vaga
- **Temas:** Light e Dark mode
- **Acessibilidade:** WCAG AA compliance

### Cores Principais
- **Primary:** `#2B5FC2` (Azul profissional)
- **Accent:** `#FF6B35` (Laranja vibrante para CTAs)
- **Success:** `#16A34A` (Verde para match/confirmação)

## MVP Tasks

O plano mestre em `Tasks/task_00_mvp_master_plan.md` contém **29 tasks** organizadas em **6 fases**:

| Fase | Descrição | Horas |
|------|-----------|-------|
| Fase 0 | Setup & Fundação | 12h |
| Fase 1 | Backend Core (Auth, CRUD, Candidaturas) | 54h |
| Fase 2 | Busca PostgreSQL Full-Text | 9h |
| Fase 3 | Notificações (Spring Async) | 5h |
| Fase 4 | Mobile App (React Native) | 64h |
| Fase 5 | Web Admin (React) | 32h |
| Fase 6 | Polish & Lançamento | 40h |

**Total estimado:** ~216 horas (18 semanas / 9 sprints)

## O que NÃO está no MVP (intencionalmente removido)

| Item | Motivo |
|------|--------|
| Elasticsearch | PostgreSQL tsvector + pg_trgm é suficiente para o volume do MVP |
| RabbitMQ | Spring `@Async` + `@EventListener` resolve sem container extra |
| API Gateway / Microserviços | Monólito modular: mais simples, mesmo deploy |
| Kubernetes / Terraform | VPS única + Docker Compose para MVP |
| ELK / Jaeger / SonarQube | Logback JSON + Sentry é suficiente |
| Feature Flags (LaunchDarkly) | Perfis Spring são mais simples para MVP |

## Skills de Engenharia

7 skills documentadas com melhores práticas para cada domínio:

| Skill | Foco |
|-------|------|
| `skills/backend/SKILL.md` | Spring Boot, SOLID, PostgreSQL FTS, Testes |
| `skills/frontend/SKILL.md` | React Native, Expo, Estado, Performance |
| `skills/security/SKILL.md` | Auth, CORS, Sanitization, Threat Model |
| `skills/architecture/SKILL.md` | Monólito Modular, PostgreSQL FTS, DB Schema |
| `skills/design-patterns/SKILL.md` | Catálogo de patterns com exemplos |
| `skills/ui-ux/SKILL.md` | Design principles, User flows, Usability |
| `skills/devops/SKILL.md` | CI/CD, Docker, Deploy simples, Monitoring |
