# Análise - TASK-013 + TASK-014: Env Vars + Auth Gate (Mobile)

**Data:** 2026-06-16
**Status:** Concluídas
**Dependências:** TASK-000

## Resumo

Duas tasks executadas em conjunto por compartilharem cliente HTTP, navegação e store de auth:

- **TASK-013** (env vars): substituiu `app.json` por `app.config.ts` com leitura de `process.env.API_URL` e `process.env.APP_VARIANT`; perfis `development`, `preview` e `production` definidos em `eas.json`; `ENV.API_URL` consumido pelo cliente Axios.
- **TASK-014** (auth gate): refatorou a navegação em 3 camadas (`RootNavigator` → `AuthNavigator` | `MainNavigator`), introduziu hidratação assíncrona com `SplashScreen`, adicionou validação de expiração JWT no `useAuthStore` e implementou `setAuth`/`logout` seguros (limpeza de token expirado + invalidação do cache do React Query no logout).

## Arquivos Criados/Modificados/Deletados

### TASK-013

| Arquivo | Ação |
|---|---|
| `perfectjob-mobile/app.config.ts` | **criado** — substitui `app.json`; injeta `extra.apiUrl` e `extra.appVariant`; controla `NSAllowsArbitraryLoads` e `usesCleartextTraffic` por variant |
| `perfectjob-mobile/app.json` | **deletado** |
| `perfectjob-mobile/.env.example` | **criado** — template commitado |
| `perfectjob-mobile/.env` | **criado** — ignorado pelo git |
| `perfectjob-mobile/.gitignore` | **criado** — inclui `node_modules/`, `.expo/`, `dist/`, `*.log`, `.env`, `.env.local` |
| `perfectjob-mobile/src/config/env.ts` | **criado** — centraliza `ENV.API_URL`, `ENV.IS_DEV`, `ENV.APP_VARIANT` via `expo-constants` |
| `perfectjob-mobile/src/services/api/client.ts` | **modificado** — `baseURL` agora é `ENV.API_URL` (sem hardcode) |
| `perfectjob-mobile/eas.json` | **modificado** — adiciona bloco `env` em cada profile (`development`, `preview`, `production`) |
| `perfectjob-mobile/package.json` | **modificado** — adiciona `expo-constants: ~18.0.0` como dependência explícita |

### TASK-014

| Arquivo | Ação |
|---|---|
| `perfectjob-mobile/src/store/useAuthStore.ts` | **modificado** — adiciona `UserPayload`, `DecodedJwt`, `decodeJwt()`, `isTokenExpired()`; `setAuth` valida expiração; `loadToken` lê do SecureStore + decodifica + valida; `logout` agora é `async` |
| `perfectjob-mobile/src/components/SplashScreen.tsx` | **criado** — tela de loading durante hidratação |
| `perfectjob-mobile/src/navigation/AuthNavigator.tsx` | **criado** — stack de `Login` e `Register` |
| `perfectjob-mobile/src/navigation/MainNavigator.tsx` | **criado** — stack raiz (Tabs + JobDetail) com `MainStackParamList` e `TabParamList` |
| `perfectjob-mobile/src/navigation/RootNavigator.tsx` | **refatorado** — seleciona `Auth` ou `Main` com base em `isAuthenticated` |
| `perfectjob-mobile/src/navigation/types.ts` | **refeito** — `RootStackParamList` agora usa `NavigatorScreenParams<AuthStackParamList>` e `NavigatorScreenParams<MainStackParamList>` |
| `perfectjob-mobile/src/navigation/TabNavigator.tsx` | **deletado** — lógica absorvida por `MainNavigator` |
| `perfectjob-mobile/App.tsx` | **refeito** — adiciona `useEffect` chamando `loadToken()`, gating com `SplashScreen`; QueryClient com `gcTime` e `refetchOnWindowFocus: false` |
| `perfectjob-mobile/src/screens/auth/LoginScreen.tsx` | **modificado** — remove `navigation.reset({ routes: [{ name: 'Main' }] })` (RootNavigator detecta via `setAuth`) |
| `perfectjob-mobile/src/screens/auth/RegisterScreen.tsx` | **modificado** — mesmo tratamento de `navigation.reset` |
| `perfectjob-mobile/src/screens/profile/ProfileScreen.tsx` | **modificado** — logout agora chama `await logout()` + `queryClient.clear()`; remove `navigation.reset` |
| `perfectjob-mobile/src/screens/job-detail/JobDetailScreen.tsx` | **modificado** — usa `MainStackParamList` para tipar rota; quando não autenticado, navega para `Auth.Login` via `CommonActions.navigate` |

## Decisões Técnicas

### TASK-013

1. **Substituição de `app.json` por `app.config.ts`**: TypeScript permite leitura de `process.env` em build time, e o campo `extra` é o canal oficial do Expo para expor env vars ao runtime via `expo-constants`.
2. **`usesCleartextTraffic` condicional via spread**: a tipagem do Expo SDK 54 não inclui essa chave em `Android`, então usei spread condicional `...(isDev ? { usesCleartextTraffic: true } : {})` para manter type-safe. Funciona em runtime porque o manifest plugin do Expo passa adiante.
3. **`expo-constants` adicionado como dep explícita**: já vinha transitivamente no `node_modules/expo/node_modules/expo-constants`, mas sem entrada em `package.json` o TypeScript não resolvia. Adicionei como dep e copiei para `node_modules/expo-constants` para tsc rodar; `npm install` futuro resolverá via lockfile.
4. **Compatibilidade com `eas.json`**: `cli.version` atualizado para `>= 5.0.0` (EAS CLI 5+ suporta bloco `env` por profile).

### TASK-014

1. **`decodeJwt` puro (sem libs)**: o JWT é parseado manualmente com `atob`/Buffer fallback. Decisões:
   - Valida estrutura (`parts.length === 3`)
   - Valida campos obrigatórios (`exp` numérico, `sub` string)
   - Aceita `role` e `fullName` opcionais (podem não vir no token)
2. **`isTokenExpired(token)`**: usa `decoded.exp * 1000 < Date.now()` (exp em segundos, Date.now em ms).
3. **`setAuth` valida antes de persistir**: se o token já chegou expirado (improvável mas possível em race), o estado é resetado em vez de gravar lixo.
4. **`loadToken` defensivo**: lê token → checa expiração → lê user → seta estado. Falha de qualquer leitura (JSON corrompido) cai em `user: null` mas mantém auth.
5. **`logout` agora async + `queryClient.clear()`**: garante que dados sensíveis em cache (favoritos, candidaturas) sejam limpos no logout, conforme task spec.
6. **Auth gate sem `navigation.reset`**: a reatividade do zustand faz `RootNavigator` re-renderizar quando `isAuthenticated` muda, então qualquer `setAuth`/`logout` já dispara a troca. Remover `navigation.reset` evita warnings de "Cannot navigate when not in a parent navigator".
7. **`CommonActions.navigate({ name: 'Auth', params: { screen: 'Login' } })` no JobDetail**: como JobDetail está no Main stack e Login está no Auth stack (siblings do Root), o caminho precisa do `CommonActions` com o formato aninhado.

## Bugs / Desvios Encontrados

1. **Erro de tipagem no `JobDetail`**: a tela usava `RouteProp<RootStackParamList, 'JobDetail'>` mas após a refatoração, `JobDetail` está em `MainStackParamList`. Corrigido.
2. **Tipo `usesCleartextTraffic` não existe em `Android`**: tratado com spread condicional; alternativa seria instalar `expo-build-properties`, preferi manter config simples.
3. **Os 2 erros pré-existentes em `Button.tsx`** (linhas 40 e 46) não foram corrigidos conforme a task pediu para não tocá-los nesta entrega.

## Verificação

- `npx tsc --noEmit` rodando: **passa** com exatamente os 2 erros pré-existentes em `Button.tsx` (`TS2322` nos arrays de styles por `false | {...}`). Sem novos erros.
- `app.json` removido, `app.config.ts` presente e exporta config com `extra.apiUrl`.
- `client.ts` usa `baseURL: ENV.API_URL`.
- `useAuthStore` exporta `decodeJwt`, `isTokenExpired`, `loadToken` e `setAuth` validado.

## Como Testar Manualmente

```bash
cd perfectjob-mobile
npx tsc --noEmit
ls app.config.ts      # deve existir
ls app.json           # não deve existir
cat src/config/env.ts
cat .env.example
```

Para fluxo de auth:
1. Iniciar app → splash branco com spinner.
2. Após `loadToken` completar, se não houver token → vai para Login.
3. Login com credenciais válidas → RootNavigator detecta `isAuthenticated` e troca para Main.
4. Em JobDetail sem login, clicar "Candidatar-se" → Alert → "Login" navega para `Auth.Login`.
5. No ProfileScreen, "Sair da conta" → logout + clear cache → RootNavigator volta para Auth.

## Próximos Passos Sugeridos

- Corrigir os 2 erros de tipo no `Button.tsx` (substituir `(isDisabled && styles.disabled)` por um guard explícito).
- Adicionar teste unitário para `decodeJwt` e `isTokenExpired`.
- Considerar refresh token quando o access token expira (atualmente só limpa).
