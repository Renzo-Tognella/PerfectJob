# TASK-019: Variáveis de Ambiente no Admin

**Prioridade:** 🔴 CRÍTICA
**Estimativa:** 1h
**Dependências:** TASK-000
**Status:** ⬜ Pendente

## Objetivo

Configurar o admin para usar variáveis de ambiente em vez de URL hardcoded. Permitir diferentes URLs por ambiente.

## Escopo

### A. Env Files
**Arquivos:**
- `perfectjob-admin/.env.example` (criar)
- `perfectjob-admin/.env.development` (criar, gitignored)
- `perfectjob-admin/.env.production` (criar, gitignored)
- `perfectjob-admin/.gitignore` (verificar)

**Ações:**
1. Criar `.env.example`:
```env
VITE_API_URL=http://localhost:8080/api
VITE_APP_NAME=PerfectJob Admin
VITE_ENV=development
```

2. Criar `.env.development`:
```env
VITE_API_URL=http://localhost:8080/api
VITE_APP_NAME=PerfectJob Admin (Dev)
VITE_ENV=development
```

3. Criar `.env.production` (com placeholder):
```env
VITE_API_URL=https://api.perfectjob.com/api
VITE_APP_NAME=PerfectJob Admin
VITE_ENV=production
```

4. Verificar `.gitignore`:
```
.env
.env.local
.env.development
.env.production
.env.*.local

# Manter:
.env.example
```

### B. Configuração TypeScript
**Arquivos:**
- `perfectjob-admin/src/vite-env.d.ts` (criar)

**Ações:**
1. Criar arquivo de tipos:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_ENV: 'development' | 'staging' | 'production';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### C. Config Module
**Arquivos:**
- `perfectjob-admin/src/config/env.ts` (criar)

**Ações:**
1. Criar:
```typescript
export const ENV = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'PerfectJob Admin',
  ENV: import.meta.env.VITE_ENV || 'development',
} as const;

if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
  console.warn('VITE_API_URL is not set in production build');
}
```

### D. API Client
**Arquivos:**
- `perfectjob-admin/src/services/api/client.ts`

**Ações:**
1. Substituir `'http://localhost:8080/api'` por `ENV.API_URL`
2. Logar URL em dev (debug)

### E. HTML
**Arquivos:**
- `perfectjob-admin/index.html`

**Ações:**
1. Mudar `<html lang="en">` para `lang="pt-BR"`
2. Atualizar `<title>` para usar nome do app:
```html
<title>PerfectJob Admin</title>
```

### F. Testes
**Arquivos:**
- `perfectjob-admin/src/config/env.test.ts` (criar)

**Ações:**
1. Validar que `ENV.API_URL` é setado
2. Validar fallback

## Critérios de Aceite

- [ ] `.env.example` está commitado
- [ ] `.env.development` e `.env.production` estão no `.gitignore`
- [ ] `client.ts` usa `ENV.API_URL`
- [ ] Mudar `.env.development` e reiniciar dev server muda URL usada
- [ ] Build de produção usa `.env.production`
- [ ] TypeScript reconhece `import.meta.env` (autocomplete funciona)
- [ ] `<html lang="pt-BR">` está correto

## Como Testar

### Manual
```bash
# 1. Verificar .env.example
cat perfectjob-admin/.env.example

# 2. Verificar .gitignore
cat perfectjob-admin/.gitignore | grep .env

# 3. Dev server
cd perfectjob-admin
npm run dev
# Verificar no console que a URL é a do .env.development

# 4. Mudar .env.development
echo "VITE_API_URL=http://192.168.1.10:8080/api" > .env.development
# Reiniciar dev server
# Verificar que URL mudou

# 5. Build de produção
npm run build
# Verificar que o bundle tem a URL de produção
grep -r "VITE_API_URL" dist/
```

### Automatizado
```typescript
import { ENV } from './env';

test('ENV.API_URL is set', () => {
  expect(ENV.API_URL).toBeTruthy();
});
```

## Arquivos Criados/Modificados

- `.env.example` (criar)
- `.env.development` (criar)
- `.env.production` (criar)
- `.gitignore` (verificar)
- `src/vite-env.d.ts` (criar)
- `src/config/env.ts` (criar)
- `src/services/api/client.ts` (modificar)
- `index.html` (modificar)
- `src/config/env.test.ts` (criar)

## Notas

- Vite expõe apenas vars com prefixo `VITE_` no client
- Variáveis são embutidas no bundle em build time (não runtime)
- Em produção, a URL fica visível no bundle (esperado — é URL pública, não secret)
- Para secrets reais, usar backend proxy OU EAS Secrets (mobile)
- `.env.production` é substituído em cada deploy por env real
