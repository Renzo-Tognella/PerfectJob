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

- Docker e Docker Compose
- Java 21+
- Node.js 20+ com npm
- Maven (ou usar o wrapper `./mvnw`)

### 1. Subir a infraestrutura

```bash
./setup.sh
```

Ou manualmente:

```bash
docker compose up -d
```

Isso sobe o PostgreSQL 16 (porta 5432) e o Redis 7 (porta 6379).

### 2. Rodar o Backend

```bash
cd perfectjob-api
./mvnw spring-boot:run
```

A API fica disponivel em `http://localhost:8080/api`.

### 3. Rodar o App Mobile

```bash
cd perfectjob-mobile
npm install
npx expo start
```

Escanear o QR Code com o app Expo Go no celular.

### 4. Rodar o Painel Admin

```bash
cd perfectjob-admin
npm install
npm run dev
```

O painel fica disponivel em `http://localhost:5173`.

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

---

## Variaveis de Ambiente

Criar um arquivo `.env` na raiz do projeto (ver `.env.example`):

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `DB_PASSWORD` | Senha do PostgreSQL | `devpass` |
| `JWT_SECRET` | Chave de assinatura JWT | `change-me-in-production` |
| `API_URL` | URL base da API | `http://localhost:8080/api` |

---

## Funcionalidades

### Candidato (Mobile)
- Busca de vagas por palavra-chave, modelo de trabalho e nivel de experiencia
- Filtros avancados com busca full-text
- Candidatura a vagas
- Salvamento de vagas favoritas
- Acompanhamento de status das candidaturas (Pendente, Em analise, Recusado, Contratado)
- Perfil com habilidades e curriculo
- Notificacoes

### Recrutador (Painel Web)
- Dashboard com estatisticas
- CRUD completo de vagas
- CRUD completo de empresas
- Acompanhamento de candidaturas recebidas

---

## Cores do Design

- **Primaria:** `#2B5FC2`
- **Accent:** `#FF6B35`
- **Sucesso:** `#16A34A`
