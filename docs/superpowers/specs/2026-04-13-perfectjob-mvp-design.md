# PerfectJob — Design Doc

**Data:** 2026-04-13
**Status:** Aprovado
**Escopo:** MVP completo (8-12 semanas)

---

## Visão Geral

App de busca de empregos para o mercado brasileiro. Faz scraping de vagas em múltiplas fontes, o usuário insere currículo via upload ou formulário, atribui pesos (1-5) às competências, e o sistema faz matching via embeddings + scoring estruturado.

**Mercado:** Brasil
**Plataformas:** iOS + Android (App Store + Play Store)
**Monetização:** Freemium (gratuito com limites + Premium R$19,90/mês ou R$149,90/ano)

---

## Stack Técnico

### Backend
- Java 21 + Spring Boot 3.4+ (virtual threads habilitados)
- PostgreSQL 17 com pgvector (dados + embeddings em um DB)
- Flyway para migrations, HikariCP para connection pooling
- Playwright Java (scraping JS-heavy) + Jsoup (HTML estático)
- Apache PDFBox 3.0 + Apache POI 5.4 (parsing de currículos)
- Gradle Kotlin DSL
- Spring Security 6 + JWT (jjwt 0.12) + OAuth2 (Google, Apple, LinkedIn)
- Bucket4j (rate limiting), MapStruct (DTO mapping)

### LLM & Embeddings
- **LLM (geração):** OpenRouter + MiniMax2.7 para extração de skills, parsing de currículo, explicabilidade de matches
- **Embeddings:** Cohere embed-multilingual-v3.0 (1024 dims) — melhor para PT-BR, custo ~$1/mês
- Embedding assimétrico: vagas = `search_document`, currículos = `search_query`

### Frontend
- Expo SDK 52 (managed workflow)
- Expo Router v4 (file-based routing, deep linking)
- Zustand (client state) + TanStack Query v5 (server state)
- NativeWind v4 + componentes customizados
- react-native-reanimated + Moti (animações)
- FlashList (listas performáticas)
- Axios com interceptors (token refresh)
- expo-secure-store (tokens), react-native-iap (assinaturas)

### Infra & Deploy
- 1x EC2 t4g.small (Docker Compose: api + postgres + pgvector)
- S3 para currículos
- Caffeine cache (in-memory, sem Redis por enquanto)
- GitHub Actions (CI/CD backend), EAS Build + Update (mobile)
- Sentry (erros), PostHog (analytics), Spring Actuator (health/metrics)
- **Custo mensal: ~$9.25**

---

## Arquitetura

### Monolito Modular (Hexagonal por Feature)

```
com.perfectjob/
├── common/          (config, exceptions, security, utils)
├── auth/            (login, OAuth2, JWT)
├── user/            (perfil, preferências, LGPD endpoints)
├── job/             (vagas, busca, favoritos)
├── scraping/        (orchestrator, scrapers por fonte)
├── resume/          (upload, parsing, extração de skills)
└── matching/        (embeddings, scoring, matching)
```

Cada módulo: `controller/ → service/ → repository/ → model/`, DTOs separados das entidades.

### Matching Engine

**Scoring híbrido: 55% embedding + 45% campos estruturados**

Per-section embedding com pesos:
- Skills: 0.40
- Experiência: 0.35
- Educação: 0.15
- Resumo: 0.10

Campos estruturados:
- Skills obrigatórias/desejáveis: 0.30
- Nível de experiência: 0.20
- Salário: 0.15
- Localização: 0.15
- Idiomas: 0.10
- Anos de experiência: 0.10

**User weights:** Skills com peso 1-5 repetidas proporcionalmente no texto do embedding, amplificando as competências mais fortes.

**Pipeline:**
1. ANN filter (pgvector cosine, top-200 com filtros estruturados)
2. Re-rank (per-section scoring + structured scoring, top-20)
3. MiniMax2.7 gera explicações legíveis para top-5

---

## Modelo de Dados

### User
id, nome, email (AES-256-GCM), senha (bcrypt), telefone, localização, foto, auth_provider (GOOGLE/APPLE/LINKEDIN/EMAIL), premium, created_at

### Resume
id, user_id (FK), arquivo_s3_url, texto_extraído, skills (JSONB), experiência (JSONB), educação (JSONB), resumo, embedding vector(1024), é_ativo, created_at

### WeightedSkill
id, resume_id (FK), nome, peso (1-5), anos_experiência

### Job
id, fonte (LINKEDIN/INDEED/CATHO/GLASSDOOR/INFOJOBS/GUPY), id_externo, título, empresa, localização, salário_min, salário_max, descrição, requisitos_obrigatórios (TEXT[]), requisitos_desejáveis (TEXT[]), nível (JUNIOR/PLENO/SENIOR), tipo_contrato, url_origem, metadados (JSONB), embedding vector(1024), status (ATIVA/EXPIRADA/DUPLICADA), scraped_at, expires_at

### ScrapingTask
id, fonte, status (PENDENTE/EXECUTANDO/CONCLUÍDA/FALHOU), vagas_encontradas, vagas_novas, vagas_duplicadas, erro_mensagem, started_at, completed_at

### JobMatch
id, resume_id (FK), job_id (FK), score_geral, score_embedding, score_estruturado, detalhes (JSONB), status (SALVA/IGNORADA/APLICADA), created_at

### Favorite
id, user_id (FK), job_id (FK), created_at

### Subscription
id, user_id (FK), plataforma (IOS/ANDROID), product_id, status (ATIVA/EXPIRADA/CANCELADA), expires_at

---

## APIs

```
Auth:
  POST   /api/v1/auth/register
  POST   /api/v1/auth/login          → { accessToken, refreshToken }
  POST   /api/v1/auth/refresh        → { accessToken }
  POST   /api/v1/auth/logout
  POST   /api/v1/auth/google
  POST   /api/v1/auth/apple
  POST   /api/v1/auth/linkedin

Jobs:
  GET    /api/v1/jobs                 → paginado com filtros
  GET    /api/v1/jobs/{id}            → detalhe com match score
  GET    /api/v1/jobs/search?q=...&location=...&level=...

Resumes:
  POST   /api/v1/resumes/upload       → multipart (PDF/DOCX)
  GET    /api/v1/resumes              → lista do usuário
  GET    /api/v1/resumes/{id}         → detalhe com skills extraídas
  PUT    /api/v1/resumes/{id}/skills  → atualiza pesos (1-5)
  DELETE /api/v1/resumes/{id}

Matching:
  POST   /api/v1/matching/{resumeId}/jobs     → top-20 vagas
  GET    /api/v1/matching/{resumeId}/job/{jobId} → detalhe com explicabilidade
  POST   /api/v1/matching/feedback            → "apliquei" | "ignorei"

Favorites:
  POST   /api/v1/favorites/{jobId}
  DELETE /api/v1/favorites/{jobId}
  GET    /api/v1/favorites           → lista paginada

User:
  GET    /api/v1/users/me
  PUT    /api/v1/users/me
  DELETE /api/v1/users/me            → LGPD: hard delete 30 dias
  GET    /api/v1/users/me/export     → exportar dados (LGPD Art. 18)

Subscriptions:
  POST   /api/v1/subscriptions/validate
  GET    /api/v1/subscriptions/status
```

---

## Pipeline de Scraping

### Fontes & Métodos

| Fonte | Método | Frequência | Anti-Bot |
|-------|--------|------------|----------|
| LinkedIn | Playwright | 2h | UA rotation, delays 3-8s |
| Indeed | Playwright | 2h | Rate limit 2 req/s |
| Catho | Playwright | 4h | Login se necessário |
| Glassdoor | Jsoup | 4h | Rate limit 2 req/s |
| InfoJobs | Jsoup / API | 2h | API se disponível |
| GUPY | API pública (GraphQL) | 2h | Token-based |

### Fluxo
1. ScrapingOrchestrator (@Scheduled a cada 2h) dispara virtual threads por fonte
2. Scraper baixa HTML via Playwright/Jsoup
3. Parser extrai dados estruturados (título, empresa, skills, salário)
4. Deduplicação: hash(url) + embedding similarity >90%
5. Salva Job no PostgreSQL
6. Gera embedding via Cohere (batch até 96)
7. Upsert embedding no pgvector
8. ScrapingTask atualiza métricas
9. Circuit breaker por fonte (50%+ falhas em 10 tentativas → pausa)

### Extração de Skills
- MiniMax2.7 (via OpenRouter) para extrair skills estruturadas da descrição bruta
- Batch process: descrições novas enviadas em batch após scraping cycle
- Fallback: regex com dicionário de skills técnicas

---

## Mobile App

### Navegação (Expo Router v4)

```
app/
├── (auth)/
│   ├── login.tsx
│   ├── signup.tsx
│   └── onboarding.tsx (3 etapas: upload → confirmar skills → dar pesos)
├── (tabs)/
│   ├── index.tsx         HOME — Feed com match score
│   ├── search.tsx        BUSCA — Filtros avançados
│   ├── favorites.tsx     FAVORITOS
│   ├── applications.tsx  APLICAÇÕES
│   └── profile.tsx       PERFIL + Premium
├── job/[id].tsx          DETALHE + match breakdown
├── job/[id]/apply.tsx    APLICAR
├── resume/upload.tsx     UPLOAD
├── resume/edit-skills.tsx EDITAR PESOS
├── premium.tsx           PAYWALL
└── modal/match-score.tsx DETALHE SCORE
```

### Freemium

| Free | Premium (R$19,90/mês | R$149,90/ano) |
|------|------------------------------------------|
| 50 vagas/dia | Ilimitado |
| 3 match scores/dia | Ilimitado |
| Filtros básicos | Filtros avançados (salário, nível, tipo) |
| 1 currículo | Até 3 currículos |
| — | Destaque match alto |
| — | Insights de salário |
| — | Resume AI optimization |

### Onboarding
1. Login/Signup (Google, Apple, LinkedIn ou email)
2. Upload currículo (PDF/DOCX) ou formulário estruturado
3. MiniMax2.7 extrai skills, experiência, educação → gera embedding
4. App mostra skills extraídas → usuário confirma/edita
5. Usuário dá pesos 1-5 → recalcula embedding ponderado
6. Primeiro match → top-20 vagas rankeadas

### Push Notifications
- Nova vaga com match >80%
- Resposta de aplicação
- Vagas salvas expirando

### Offline
- TanStack Query persister (AsyncStorage) → cache 24h
- Favoritos offline com queue de sync

---

## Segurança & LGPD

### Autenticação
- JWT: access 15min (memória) + refresh 30 dias (SecureStore/Keychain)
- Refresh hasheado no DB, rotacionado a cada uso
- OAuth2 PKCE para Google, Apple, LinkedIn
- Apple Sign-In obrigatório (App Store)
- Rate limiting: login 10/min/IP, register 5/min/IP

### Proteção de Dados
- PII criptografado AES-256-GCM: email, telefone, CPF, endereço, salário
- Senha: bcrypt cost 12+
- Logs: máscara automática de PII
- S3: server-side encryption
- DB: encryption at rest + SSL in transit

### LGPD
- Art. 6: coleta mínima
- Art. 18 II: DELETE /users/me — hard delete 30 dias
- Art. 18 V: GET /users/me/export — exportação JSON
- Consentimento granular (toggles por tipo de dado)
- DPO designado + contato na privacy policy
- Retenção: inativos 2 anos → notificar → deletar

### Mobile
- expo-secure-store (Keychain/EncryptedSharedPreferences)
- Hermes bytecompilation
- SSL pinning
- Biometria para operações sensíveis
- Jailbreak detection → logout

### Scraping Ética
- Verificar robots.txt (crawler-commons)
- Rate limit 1 req/3-10s por domínio
- Atribuir fonte + link original
- Nunca reproduzir texto completo
- Prioridade: APIs oficiais > RSS > scraping
- Cease-and-desist: parar 48h, remover dados

---

## Infra & Deploy

### MVP (simplificado)
- 1x EC2 t4g.small — Docker Compose (api + postgres + pgvector)
- S3 para currículos
- Caffeine cache (in-memory)
- GitHub Actions: test → build → SCP → systemd restart
- EAS Build + Update (mobile)

### Observabilidade
- Sentry (free) — erros backend + mobile
- PostHog (free) — analytics LGPD-compliant
- Spring Actuator — /health + /metrics
- Structured logging JSON → stdout (CloudWatch)

### Custo
| Recurso | Custo/mês |
|---------|-----------|
| EC2 t4g.small | ~$8 |
| S3 | ~$0.25 |
| Cohere embeddings | ~$1 |
| Sentry + PostHog | $0 |
| **Total** | **~$9.25/mês** |

### Evolução
- 1K+ DAU → RDS + ECS + Redis
- 50K+ vagas → Qdrant
- 10K+ DAU → Aurora Serverless + auto-scaling
