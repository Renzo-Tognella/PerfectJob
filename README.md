# PerfectJob

Plataforma de busca e criação de currículos para as vagas de emprego, desenvolvida como projeto academico.

**Autores:** Gustavo Machado e Renzo Tognella

---

## Sobre o Projeto

O PerfectJob e uma plataforma composta por tres aplicacoes:

- **Aplicativo Mobile** (React Native / Expo) - Interface para candidatos buscarem e se criarem melhores curriculos para as vagas
- **API REST** (Spring Boot 3 / Java 21) - Backend com autenticacao JWT e busca full-text via PostgreSQL
- **Painel Administrativo Web** (React / Vite) - Interface para admins publicarem e gerenciarem vagas e a Interface de controle do Sistema

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

## Pre-requisitos

Antes de tudo, instale:

| O que | Versao | Para que serve | Download |
|---|---|---|---|
| **Docker Desktop** | ultima | roda Postgres, Redis e (opcionalmente) a API | https://www.docker.com/products/docker-desktop/ |
| **Node.js** | 20 ou superior | build do mobile (Expo) e do admin (Vite) | https://nodejs.org/ |
| **Java JDK** | 21 (opcional) | rodar a API direto na sua maquina. Se nao tiver, a API sobe via Docker automaticamente | https://adoptium.net/ |
| **Expo Go** (celular) | ultima | testar o app no celular fisico | https://expo.dev/client |

> **Java 21 eh opcional.** O `start.sh` detecta automaticamente e, se voce nao tiver, sobe a API dentro de um container Docker.

> **Sobre Mac com Apple Silicon:** o Docker Desktop funciona normalmente. O script detecta o IP da sua rede Wi-Fi para que o celular fisico alcance a API.

---

## Quick start (3 passos)

```bash
git clone <url-do-repo> PerfectJob
cd PerfectJob

./setup.sh         # cria .env, sobe Postgres+Redis, instala deps do mobile/admin

./start.sh         # sobe API + mobile (Expo) + admin
```

Depois edite o arquivo `.env` que foi criado e preencha `OPENROUTER_API_KEY`:

```bash
# pegue sua chave em https://openrouter.ai/keys
echo 'OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxx' >> .env
```


Apos editar o `.env`:

```bash
./start.sh
```

Acesse:

| Servico | URL |
|---|---|
| API REST | http://localhost:8080/api |
| Swagger | http://localhost:8080/api/swagger-ui.html |
| Admin Web | http://localhost:5173 |
| Metro/Expo (celular) | `exp://SEU_IP_DA_LAN:8081` |

Para parar tudo:

```bash
./stop.sh
```

---

## Como Rodar o Projeto

### Opcao A - Automatico (recomendado)

Um unico comando sobe **tudo**: PostgreSQL, Redis, API, app mobile (Expo) e admin.

```bash
./start.sh
```

O script:
- cria o `.env` a partir do `.env.example` se voce ainda nao tiver um;
- detecta o **IP da sua rede (LAN)** e configura o app mobile para apontar para ele
  (escreve `perfectjob-mobile/.env`), para funcionar em **celular fisico**;
- usa o **Java do host** se houver Java 21+, senao roda a API **via Docker** (sem precisar instalar JDK);
- sobe o **Expo em modo `--offline`** (evita o erro 500 de modo nao-interativo/tunnel);
- aplica as migrations do banco automaticamente (Flyway);
- verifica conflitos de porta (por exemplo, Postgres do Homebrew ocupando 5432).

Ao final ele imprime os enderecos. No celular, abra o **Expo Go** e aponte para
`exp://SEU_IP_DA_LAN:8081` (o celular precisa estar na **mesma rede Wi-Fi** do computador).

Para parar tudo:

```bash
./stop.sh
```

### Opcao B - Manual (pra debugar parte por parte)

**1. Infraestrutura (PostgreSQL + Redis):**

```bash
docker compose up -d postgres redis
```

**2. Backend (API):**

```bash
cd perfectjob-api
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev   # requer Java 21 no host
```

Sem Java no host, rode via Docker:

```bash
docker run --rm -p 8080:8080 --add-host=host.docker.internal:host-gateway \
  -e DB_URL=jdbc:postgresql://host.docker.internal:5432/perfectjob \
  -e DB_USER=perfectjob -e DB_PASSWORD=perfectjob -e REDIS_HOST=host.docker.internal \
  -e TECTONIC_PATH=/usr/local/bin/tectonic \
  -e PERFECTJOB_RESUME_STORAGE_DIR=/app/data/resumes \
  -e OPENROUTER_API_KEY -e OPENROUTER_MODEL -e OPENROUTER_BASE_URL \
  -v "$PWD/perfectjob-api":/app -w /app \
  maven:3.9-eclipse-temurin-21 bash /app/scripts/docker-api-entrypoint.sh
```

A API fica em `http://localhost:8080/api` (Swagger em `/swagger-ui.html`).

**3. App Mobile (Expo):**

```bash
cd perfectjob-mobile
npm install
echo "API_URL=http://SEU_IP_DA_LAN:8080/api" > .env
npx expo start --offline
```

Abra o **Expo Go** e aponte para `exp://SEU_IP_DA_LAN:8081`.

**4. Painel Admin (Vite):**

```bash
cd perfectjob-admin
npm install
npm run dev
```

O painel fica em `http://localhost:5173`.

---

## Solucao de problemas


### Como ver os logs

```bash
# API (no container Docker)
docker logs -f --tail 50 perfectjob-api

# API (rodando direto no host)
tail -f /tmp/perfectjob-api.log

# Mobile / Expo
tail -f /tmp/perfectjob-mobile.log

# Admin
tail -f /tmp/perfectjob-admin.log
```

---

## Endpoints da API

**URL base:** `http://localhost:8080/api`

| Metodo | Endpoint | Descricao | Autenticacao |
|--------|----------|-----------|--------------|
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
| POST | `/v1/resumes` | Gerar curriculo sob medida (requer `OPENROUTER_API_KEY`) | Sim |
| GET | `/v1/resumes/{id}/pdf` | Download do PDF gerado | Sim |
| POST | `/v1/admin/ingestion/run` | Importar vagas de APIs externas | Sim (ADMIN) |

---

## Variaveis de Ambiente

Criar um arquivo `.env` na raiz do projeto (ver `.env.example`):

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `DB_PASSWORD` | Senha do PostgreSQL | `perfectjob` |
| `JWT_SECRET` | Chave de assinatura JWT (>= 32 chars) | `change-me-...` |
| `API_URL` | URL base da API | `http://localhost:8080/api` |
| `OPENROUTER_API_KEY` | Chave do OpenRouter (geracao de curriculo) | vazio |
| `OPENROUTER_MODEL` | Modelo LLM usado | `deepseek/deepseek-chat` |
| `OPENROUTER_BASE_URL` | Endpoint do provider | `https://openrouter.ai/api/v1` |
| `INGESTION_ENABLED` | Liga o scraping agendado de vagas externas | `false` |
| `INGESTION_LIMIT` | Vagas importadas por fonte a cada execucao | `50` |
| `INGESTION_CRON` | Expressao cron do agendamento | `0 0 */6 * * *` |

---

## Funcionalidades

### Candidato (Mobile)
- Busca de vagas por palavra-chave, modelo de trabalho e nivel de experiencia
- Filtros avancados com busca full-text
- Salvamento de vagas favoritas
- Perfil completo: titulo, localizacao, anos de experiencia, competencias, experiencias e formacao
- **Analise de curriculo:** envio de PDF que extrai automaticamente competencias, experiencias, formacao e contatos para o perfil
- **Geracao de curriculo sob medida:** usa LLM para adaptar o perfil a uma vaga especifica e gera PDF (requer `OPENROUTER_API_KEY`)
- Skills em alta e empresas em destaque vindas do backend (sem dados mockados)
- Notificacoes

### Recrutador (Painel Web)
- Dashboard com estatisticas
- CRUD completo de vagas
- CRUD completo de empresas
- Listagem de curriculos gerados pelos candidatos para as vagas publicadas

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