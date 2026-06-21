# PerfectJob

Plataforma de busca e candidatura a vagas de emprego, desenvolvida como projeto academico.

**Autores:** Gustavo Machado e Renzo Tognella

---

## Sobre o Projeto

O PerfectJob e uma plataforma composta por tres aplicacoes:

- **Aplicativo Mobile** (React Native / Expo) - Interface para candidatos buscarem e se candidatarem a vagas
- **API REST** (Spring Boot 3 / Java 21) - Backend com autenticacao JWT e busca full-text via PostgreSQL
- **Painel Administrativo Web** (React / Vite) - Interface para recrutadores publicarem e gerenciarem vagas e a Interface de controle dos administradores do sistema

---

## Tecnologias Utilizadas

| Camada | Tecnologia |
|--------|-----------|
| Mobile | React Native, Expo SDK 54, TypeScript |
| Backend | Spring Boot 3.3, Java 21, Maven |
| Banco de Dados | PostgreSQL 16 |
| Cache | Redis 7 |
| Busca | PostgreSQL full-text (tsvector + pg_trgm) |
| Admin Web | React 19, Vite, TypeScript, Tailwind CSS |
| Autenticacao | JWT (stateless) |
| Infraestrutura | Docker Compose |

---

## Estrutura do Projeto

```
PerfectJob/
├── docker-compose.yml
├── setup.sh
├── .env.example
├── output/pdf/
│   ├── manual-do-usuario.pdf
│   └── manual-do-desenvolvedor.pdf
├── perfectjob-api/          # Backend Spring Boot
│   ├── pom.xml
│   └── src/main/java/com/perfectjob/
│       ├── config/
│       ├── controller/v1/
│       ├── dto/
│       ├── event/
│       ├── exception/
│       ├── model/
│       ├── repository/
│       └── service/
├── perfectjob-mobile/       # App React Native / Expo
│   ├── App.tsx
│   └── src/
│       ├── navigation/
│       ├── screens/
│       ├── hooks/
│       └── services/
└── perfectjob-admin/        # Painel Web React / Vite
    └── src/
        ├── App.tsx
        └── pages/
```

---

## Como Rodar o Projeto

### Pre-requisitos

- **Docker e Docker Compose** (obrigatorio)
- **Node.js 20+ com npm** (obrigatorio - app mobile e admin)
- **Java 21** (opcional) - se nao tiver Java no host, a API sobe automaticamente
  via container Docker. Para o celular, instale o **Expo Go**.

### Opcao A - Automatico (recomendado)

Um unico comando sobe **tudo**: PostgreSQL, Redis, API, app mobile (Expo) e admin.

```bash
./start.sh
```

O script:
- detecta o **IP da sua rede (LAN)** e configura o app mobile para apontar para ele
  (escreve `perfectjob-mobile/.env`), para funcionar em **celular fisico**;
- usa o **Java do host** se houver Java 21+, senao roda a API **via Docker** (sem precisar instalar JDK);
- sobe o **Expo em modo `--offline`** (evita o erro 500 de modo nao-interativo/tunnel);
- aplica as migrations do banco automaticamente (Flyway).

Ao final ele imprime os enderecos. No celular, abra o **Expo Go** e aponte para
`exp://SEU_IP_DA_LAN:8081` (o celular precisa estar na **mesma rede Wi-Fi** do computador).

Para parar tudo:

```bash
./stop.sh
```

### Opcao B - Manual

**1. Infraestrutura (PostgreSQL + Redis):**

```bash
docker compose up -d postgres redis
```

**2. Backend (API):**

```bash
cd perfectjob-api
./mvnw spring-boot:run            # requer Java 21 no host
```

Sem Java no host, rode via Docker:

```bash
docker run --rm -p 8080:8080 --add-host=host.docker.internal:host-gateway \
  -e DB_URL=jdbc:postgresql://host.docker.internal:5432/perfectjob \
  -e DB_USER=perfectjob -e DB_PASSWORD=perfectjob -e REDIS_HOST=host.docker.internal \
  -v "$PWD/perfectjob-api":/app -w /app \
  maven:3.9-eclipse-temurin-21 mvn spring-boot:run
```

A API fica em `http://localhost:8080/api` (Swagger em `/swagger-ui.html`).

**3. App Mobile (Expo):**

```bash
cd perfectjob-mobile
npm install
echo "API_URL=http://SEU_IP_DA_LAN:8080/api" > .env   # IP da LAN p/ celular fisico
npx expo start --offline                               # --offline evita erro 500
```

Abra o **Expo Go** e aponte para `exp://SEU_IP_DA_LAN:8081`.

**4. Painel Admin (Vite):**

```bash
cd perfectjob-admin
npm install
npm run dev
```

O painel fica em `http://localhost:5173`.

### Solucao de problemas

- **Expo Go: "There was a problem... HTTP 500 ... non-interactive mode"** — o Metro
  precisa rodar em `npx expo start --offline`. O `./start.sh` ja faz isso.
- **App abre mas da "erro inesperado" / login nao funciona** — o bundle esta com
  `localhost` em vez do IP da LAN. `localhost` no celular = o proprio celular.
  Garanta `API_URL=http://SEU_IP:8080/api` no `.env` e **force o reload** no Expo Go
  (mate o app e reabra). O `./start.sh` configura o IP automaticamente.
- **API nao sobe por falta de Java** — use o `./start.sh` (cai para Docker) ou o
  comando Docker da Opcao B.

---

## Endpoints da API

**URL base:** `http://localhost:8080/api`

| Metodo | Endpoint | Descricao | Autenticacao |
|--------|----------|-----------|-------------|
| POST | `/v1/auth/register` | Registrar usuario | Nao |
| POST | `/v1/auth/login` | Login (retorna JWT) | Nao |
| GET | `/v1/jobs` | Listar/buscar vagas | Nao |
| GET | `/v1/jobs/{slug}` | Detalhes da vaga | Nao |
| POST | `/v1/jobs` | Criar vaga | Sim |
| PATCH | `/v1/jobs/{id}` | Atualizar vaga | Sim |
| POST | `/v1/jobs/{id}/close` | Fechar vaga | Sim |
| GET | `/v1/companies` | Listar empresas | Nao |
| GET | `/v1/companies/{slug}` | Detalhes da empresa | Nao |
| POST | `/v1/companies` | Criar empresa | Sim |
| PATCH | `/v1/companies/{id}` | Atualizar empresa | Sim |
| DELETE | `/v1/companies/{id}` | Remover empresa | Sim |
| POST | `/v1/applications` | Enviar candidatura | Sim |
| GET | `/v1/search/jobs` | Busca full-text | Nao |
| GET | `/v1/search/suggest` | Autocompletar titulos | Nao |
| GET | `/v1/notifications` | Listar notificacoes | Sim |
| PATCH | `/v1/notifications/{id}/read` | Marcar como lida | Sim |
| GET | `/v1/jobs/trending-skills` | Skills mais requisitadas (com contagem) | Nao |
| GET | `/v1/profile/me` | Perfil completo do candidato | Sim |
| PATCH | `/v1/profile/me` | Atualizar perfil (campos, skills, experiencias) | Sim |
| POST | `/v1/profile/me/resume` | Enviar e analisar curriculo (PDF/TXT) | Sim |
| POST | `/v1/admin/ingestion/run` | Importar vagas de APIs externas | Sim (ADMIN) |

---

## Variaveis de Ambiente

Criar um arquivo `.env` na raiz do projeto (ver `.env.example`):

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `DB_PASSWORD` | Senha do PostgreSQL | `devpass` |
| `JWT_SECRET` | Chave de assinatura JWT | `change-me-in-production` |
| `API_URL` | URL base da API | `http://localhost:8080/api` |
| `INGESTION_ENABLED` | Liga o scraping agendado de vagas externas | `false` |
| `INGESTION_LIMIT` | Vagas importadas por fonte a cada execucao | `50` |
| `INGESTION_CRON` | Expressao cron do agendamento | `0 0 */6 * * *` |

---

## Funcionalidades

### Candidato (Mobile)
- Busca de vagas por palavra-chave, modelo de trabalho e nivel de experiencia
- Filtros avancados com busca full-text
- Candidatura a vagas
- Salvamento de vagas favoritas
- Acompanhamento de status das candidaturas (Pendente, Em analise, Recusado, Contratado)
- Perfil completo: titulo, localizacao, anos de experiencia, competencias, experiencias e formacao
- **Analise de curriculo:** envio de PDF que extrai automaticamente competencias, experiencias, formacao e contatos para o perfil
- Skills em alta e empresas em destaque vindas do backend (sem dados mockados)
- Notificacoes

### Recrutador (Painel Web)
- Dashboard com estatisticas
- CRUD completo de vagas
- CRUD completo de empresas
- Acompanhamento de candidaturas recebidas

### Ingestao de vagas (Webscraping via API)
- Importacao automatica de vagas a partir de APIs publicas gratuitas (Remotive e Arbeitnow)
- Os dados externos sao normalizados e gravados exatamente no schema da tabela `jobs` (com deduplicacao por `source` + `external_id`)
- Execucao agendada (configuravel via `INGESTION_*`) ou manual por um admin via `POST /v1/admin/ingestion/run`

### Analise de curriculo (CV Analyzer)
- Servico que extrai de um curriculo (PDF/texto) competencias, experiencias profissionais, formacao academica e contatos
- Suporta curriculos em portugues e ingles; os dados alimentam o perfil do candidato

---

## Cores do Design

- **Primaria:** `#2B5FC2`
- **Accent:** `#FF6B35`
- **Sucesso:** `#16A34A`
