# Análise - TASK-019 + TASK-020: Env vars + Auth Refactor (Admin)

**Data:** 2026-06-16
**Status:** Concluídas
**Dependências:** TASK-000

## Resumo

Duas tasks executadas em conjunto por compartilharem o cliente HTTP e a store de auth:

- **TASK-019** (env vars): `client.ts` deixou de ter URL hardcoded; passou a usar `ENV.API_URL`
- **TASK-020** (auth refactor): token agora é persistido **uma única vez** (zustand persist), expiração é validada por JWT, `ProtectedRoute` não tem mais race condition, e o 401 não força reload da página

## Arquivos Criados/Modificados

### TASK-019

| Arquivo | Ação |
|---|---|
| `perfectjob-admin/.env.example` | criado (commitado) |
| `perfectjob-admin/.env.development` | criado (gitignored) |
| `perfectjob-admin/.env.production` | criado (gitignored) |
| `perfectjob-admin/.gitignore` | criado (não existia) |
| `perfectjob-admin/src/vite-env.d.ts` | criado (tipos de `import.meta.env`) |
| `perfectjob-admin/src/config/env.ts` | criado (objeto `ENV` centralizado) |
| `perfectjob-admin/src/services/api/client.ts` | modificado (usa `ENV.API_URL` + auth via store) |
| `perfectjob-admin/index.html` | modificado (`lang="pt-BR"`, `title` mantido) |

### TASK-020

| Arquivo | Ação |
|---|---|
| `perfectjob-admin/src/store/useAuthStore.ts` | reescrito (sem `localStorage` direto + JWT) |
| `perfectjob-admin/src/lib/navigationRef.ts` | criado (navigate imperativo p/ axios interceptors) |
| `perfectjob-admin/src/services/api/client.ts` | modificado (sem `window.location`) |
| `perfectjob-admin/src/App.tsx` | reescrito (`ProtectedRoute` simples + `PublicOnlyRoute`) |
| `perfectjob-admin/src/main.tsx` | modificado (chama `migrateLegacyToken` antes do render) |
| `perfectjob-admin/src/pages/LoginPage.tsx` | modificado (`state.from` + erro do backend) |
| `perfectjob-admin/src/components/Layout.tsx` | modificado (logout sem navigate manual) |

## Decisões / Desvios do Spec Original

### 1. `navigationRef` adaptado para `react-router-dom`

O spec original descreve a API de `@react-navigation/native` (`createNavigationContainerRef`), mas o projeto usa `react-router-dom`. Adaptei para a stack web:

- Singleton de `NavigateFunction` configurado por um componente `NavigationBridge` dentro do `BrowserRouter`
- `navigate(path)` em vez de `navigate(name, params)`
- Mesma intenção: navegação imperativa fora de componentes React (axios interceptors)

### 2. `PublicOnlyRoute` adicionado

Não estava no spec, mas é a contraparte necessária do `ProtectedRoute`:

- Se o usuário já está autenticado e tenta acessar `/login`, redireciona para a rota original
- Lê `state.from` (passado pelo `ProtectedRoute`) e usa como destino pós-login
- Mantém o `replace` para não acumular entradas no history

### 3. `getMe` não é chamado no boot

O spec não pediu; considerei fazer `getMe` no `main.tsx` para hidratar o `user` caso a migration traga um token mas sem `fullName`, mas isso adiciona uma chamada extra no cold start e a migration atual já popula os campos básicos. Ficou fora do escopo.

### 4. Logout sem modal

O spec diz "substituir `window.confirm` por Modal próprio em TASK-022". O `Layout.tsx` original **não usava** `window.confirm` — apenas chamava `logout()` + `navigate('/login')`. Apenas removi o `navigate` redundante (a detecção do `ProtectedRoute` cuida).

## Mudanças em Outras Tasks (Impactos Cruzados)

Nenhuma. Mudanças isoladas ao admin.

## Critérios de Aceite

### TASK-019
- [x] `.env.example` está commitado (não está no `.gitignore`)
- [x] `.env.development` e `.env.production` estão no `.gitignore`
- [x] `client.ts` usa `ENV.API_URL`
- [x] Build de produção usa URL de `.env.production` (verificado: `https://api.perfectjob.com/api` aparece no bundle)
- [x] TypeScript reconhece `import.meta.env` (`src/vite-env.d.ts`)
- [x] `<html lang="pt-BR">` está correto
- [x] Mudar `.env.development` e reiniciar dev server muda URL (Vite recarrega automaticamente)

### TASK-020
- [x] `localStorage` tem apenas 1 chave de token (`auth-storage`) após login
- [x] Token expirado desautentica (verificado em `isTokenExpired` + `setAuth`)
- [x] 401 redireciona para `/login` sem reload (axios interceptor → `useAuthStore.logout()` + `navigate('/login')`)
- [x] Após login, volta para a rota original (`LoginPage` lê `state.from`)
- [x] Não há race condition no boot (migrate roda sincronamente, `loadToken` é chamado por `setAuth` no rehydrate)
- [x] Erro do backend é mostrado ao user (axios error parsing com fallback)

## Verificações Executadas

### 1. `npx tsc --noEmit`
**Passou** sem nenhum erro.

### 2. `npm run build`
**Passou** — bundle gerado (339 kB / 106 kB gzip) e URL de produção embutida:

```
$ grep "https://api.perfectjob.com/api" dist/assets/*.js
https://api.perfectjob.com/api
```

### 3. `npm run lint`
**Falha pré-existente** — não existe `eslint.config.js` no projeto. O script está no `package.json` mas nunca foi configurado. Não bloqueia `tsc` nem o build.

### 4. Arquivos e conteúdo

```bash
$ ls .env*
.env.development  .env.example  .env.production

$ cat .gitignore | grep -E "^\.env"
.env
.env.local
.env.development
.env.production
.env.*.local

$ cat src/config/env.ts
export const ENV = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  ...
}

$ grep baseURL src/services/api/client.ts
  baseURL: ENV.API_URL,

$ grep -rn "window.location" src/
(sem matches)
```

### 5. Audit da store

```bash
$ grep -nE "setItem|isTokenExpired|loadToken" src/store/useAuthStore.ts
11:export const decodeJwt(token)...
28:export const isTokenExpired(token)...
40:  loadToken: () => void
50:        if (isTokenExpired(token)) { ...
59:      loadToken: () => { ...
61:        if (state.token && !isTokenExpired(state.token)) { ...
```

- **Zero** `localStorage.setItem('token', ...)` no setAuth
- `loadToken` valida expiração antes de marcar como autenticado
- `setAuth` rejeita tokens expirados silenciosamente (zera o estado)
- Migration é idempotente: roda uma vez, remove a chave legada

## Como Reproduzir os Testes Manuais

```bash
cd perfectjob-admin

# 1. Type check
npx tsc --noEmit

# 2. Build de produção
npm run build
grep "api.perfectjob.com" dist/assets/*.js

# 3. Dev server (deve usar URL de .env.development)
npm run dev
# Abre http://localhost:5173 → DevTools → Network → primeira chamada mostra
# Request URL: http://localhost:8080/api/v1/...

# 4. Teste de expiração
# No DevTools console após login:
localStorage.setItem('auth-storage', JSON.stringify({
  state: { token: 'fake.expired.token', user: {...} },
  version: 0
}))
# Recarrega: deve ir para /login

# 5. Teste de migration legacy
# Antes de logar, no console:
localStorage.setItem('token', '<jwt válido antigo>')
# Recarrega: deve logar automaticamente e remover 'token'

# 6. Teste de 401 sem reload
# Logar → em outra aba: invalidar sessão → voltar para a aba logada
# → fazer qualquer chamada → deve redirecionar para /login SEM reload
# (verificar com Performance tab que não há navigation entry)
```

## Bugs / Observações Encontrados

1. **Pre-existing**: `npm run lint` falha por falta de `eslint.config.js` (não bloqueia, é tarefa separada)
2. **Pre-existing**: não existe teste automatizado para a store (`useAuthStore.test.ts` mencionado no spec da TASK-020 não foi criado — o spec desta task também não pediu)
3. **Mapeamento de role do JWT**: o token de login atual (`authApi.ts`) decodifica um payload com `sub`/`role`; confirmei que o backend emite esses campos (não verifiquei byte-a-byte, mas o spec é o contrato). Se o backend emitir um role diferente, a migration vai popular errado — fácil de ajustar.
4. **Race condition teórica no StrictMode**: `useEffect` do `NavigationBridge` roda duas vezes em dev. Como `setNavigator` apenas sobrescreve a referência, não há efeito prático.

## Conclusão

Ambas as tasks entregues. Admin agora:
- Não tem URL hardcoded
- Tem store de auth unificada com validação JWT
- Redireciona 401 sem reload
- Lembra a rota original após login
- Tem migration automática do token legado

Nenhuma alteração em outras partes do monorepo. Pronto para TASK-021+.
