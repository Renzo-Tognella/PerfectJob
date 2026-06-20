# TASK-001: Variáveis de Ambiente e Secret Management

**Prioridade:** 🔴 CRÍTICA
**Estimativa:** 1.5h
**Dependências:** TASK-000
**Status:** ⬜ Pendente

## Objetivo

Eliminar valores hardcoded (URLs, secrets, senhas) das 3 aplicações. Centralizar configuração via env vars.

## Escopo

### A. API (Backend)
**Arquivos:**
- `perfectjob-api/src/main/resources/application.yml`
- `perfectjob-api/src/main/resources/application-dev.yml`
- `perfectjob-api/src/main/resources/application-test.yml`
- Novo: `.env.example` (atualizar)

**Ações:**
1. Mover `jwt.secret` para `${JWT_SECRET}` (sem default)
2. Mover `datasource.password` para `${DB_PASSWORD:perfectjob}`
3. Mover `datasource.username` para `${DB_USER:perfectjob}`
4. Mover `datasource.url` para `${DB_URL:jdbc:postgresql://localhost:5432/perfectjob}`
5. Adicionar `@PostConstruct` em `JwtProvider` para validar tamanho mínimo do secret (≥ 32 chars)
6. Documentar todas as vars em `.env.example`

### B. Mobile
**Arquivos:**
- `perfectjob-mobile/app.json` → renomear para `app.config.ts`
- `perfectjob-mobile/.env.example` (criar)
- `perfectjob-mobile/src/services/api/client.ts`

**Ações:**
1. Criar `app.config.ts` que consome `process.env.API_URL` com fallback
2. Adicionar `extra.apiUrl` na config Expo
3. Atualizar `client.ts` para usar `Constants.expoConfig?.extra?.apiUrl`
4. Configurar `ios.infoPlist.NSAppTransportSecurity` para HTTPS em prod
5. Configurar `android.usesCleartextTraffic` para true em dev, false em prod
6. Adicionar `expo-constants` se necessário

### C. Admin
**Arquivos:**
- `perfectjob-admin/.env.example` (criar)
- `perfectjob-admin/.env.development` (criar, gitignored)
- `perfectjob-admin/.env.production` (criar, gitignored)
- `perfectjob-admin/src/services/api/client.ts`
- `perfectjob-admin/.gitignore` (verificar)

**Ações:**
1. Criar `.env.example` com `VITE_API_URL`
2. Criar `.env.development` com URL local
3. Criar `.env.production` com placeholder
4. Atualizar `client.ts` para usar `import.meta.env.VITE_API_URL`
5. Garantir que `.env*` está no `.gitignore` (apenas `.env.example` é commitado)

### D. Docker Compose
**Arquivos:**
- `docker-compose.yml`
- `.env.example`

**Ações:**
1. Usar `env_file: .env` no docker-compose para PostgreSQL
2. Garantir compatibilidade

## Critérios de Aceite

- [ ] Nenhum valor hardcoded de URL, secret ou senha no código
- [ ] `JWT_SECRET` falha startup se não fornecido (ou se < 32 chars)
- [ ] `.env.example` na raiz documenta todas as vars
- [ ] Mobile usa `Constants.expoConfig.extra.apiUrl`
- [ ] Admin usa `import.meta.env.VITE_API_URL`
- [ ] `git status` mostra apenas `.env.example` (não `.env`)
- [ ] API continua subindo sem erro com `.env` configurado
- [ ] Admin continua subindo e aponta para o backend correto

## Como Testar

### Manual
```bash
# 1. Sem JWT_SECRET, API deve falhar
cd perfectjob-api
unset JWT_SECRET
./mvnw spring-boot:run
# Deve falhar com mensagem clara

# 2. Com JWT_SECRET válido
echo "JWT_SECRET=$(openssl rand -base64 48)" > ../.env
./mvnw spring-boot:run
# Deve subir normalmente

# 3. Verificar mobile
cd ../perfectjob-mobile
cat app.config.ts | grep apiUrl  # deve mostrar a config

# 4. Verificar admin
cd ../perfectjob-admin
cat .env.development
cat src/services/api/client.ts  # deve usar import.meta.env
npm run dev  # deve carregar com URL correta
```

### Automatizado (a ser criado em TASK-005)
- Teste de carga sem `JWT_SECRET` deve falhar
- Teste de carga com `JWT_SECRET` < 32 chars deve falhar
- Teste de carga com `JWT_SECRET` ≥ 32 chars deve passar

## Notas

- Variáveis sensíveis (JWT_SECRET, DB_PASSWORD) NUNCA devem ter default em prod
- Manter defaults em DEV para DX (Developer Experience)
- Documentar em `.env.example` todas as vars com descrição e exemplo
