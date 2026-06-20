# TASK-013: Variáveis de Ambiente no Mobile

**Prioridade:** 🔴 CRÍTICA
**Estimativa:** 1.5h
**Dependências:** TASK-000
**Status:** ⬜ Pendente

## Objetivo

Configurar o mobile para usar variáveis de ambiente em vez de URL hardcoded. Permitir diferentes URLs por build profile (development, preview, production).

## Escopo

### A. Configuração Expo
**Arquivos:**
- `perfectjob-mobile/app.json` → renomear/mover para `app.config.ts`
- `perfectjob-mobile/.env.example` (criar)
- `perfectjob-mobile/eas.json` (modificar)

**Ações:**
1. Criar `app.config.ts`:
```typescript
import { ExpoConfig, ConfigContext } from 'expo/config';

const apiUrl = process.env.API_URL || 'http://localhost:8080/api';
const isDev = process.env.APP_VARIANT === 'development';

const config: ExpoConfig = {
  name: 'PerfectJob',
  slug: 'perfectjob',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: 'com.perfectjob.app',
    supportsTablet: true,
    infoPlist: {
      NSAppTransportSecurity: isDev
        ? { NSAllowsArbitraryLoads: true }
        : {},
    },
  },
  android: {
    package: 'com.perfectjob.app',
    adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png' },
    usesCleartextTraffic: isDev,
  },
  plugins: ['expo-secure-store'],
  extra: {
    apiUrl,
    eas: { projectId: '...' },
  },
};

export default config;
```

2. Criar `.env.example`:
```env
API_URL=http://localhost:8080/api
APP_VARIANT=development
```

3. Atualizar `eas.json`:
```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "API_URL": "http://localhost:8080/api", "APP_VARIANT": "development" }
    },
    "preview": {
      "distribution": "internal",
      "env": { "API_URL": "https://staging-api.perfectjob.com/api", "APP_VARIANT": "preview" }
    },
    "production": {
      "env": { "API_URL": "https://api.perfectjob.com/api", "APP_VARIANT": "production" }
    }
  }
}
```

### B. API Client
**Arquivos:**
- `perfectjob-mobile/src/services/api/client.ts`
- `perfectjob-mobile/src/config/env.ts` (criar)

**Ações:**
1. Criar `src/config/env.ts`:
```typescript
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const ENV = {
  API_URL: extra.apiUrl ?? 'http://localhost:8080/api',
  IS_DEV: __DEV__,
  APP_VARIANT: extra.appVariant ?? 'development',
} as const;
```

2. Atualizar `client.ts`:
```typescript
import { ENV } from '@/config/env';

export const apiClient = axios.create({
  baseURL: ENV.API_URL,
  timeout: 15000,
  // ...
});
```

### C. Validação
**Arquivos:**
- `perfectjob-mobile/src/config/env.ts`

**Ações:**
1. Adicionar função `validateEnv()` que valida que `API_URL` é uma URL válida
2. Logar URL no console em DEV (apenas)

### D. Testes
**Arquivos:**
- `perfectjob-mobile/src/config/env.test.ts` (criar)

**Ações:**
1. Mockar `expo-constants` para testar diferentes `extra`
2. Validar que `API_URL` é usado corretamente

## Critérios de Aceite

- [ ] `app.json` não existe mais (substituído por `app.config.ts`)
- [ ] `extra.apiUrl` é populado via env var
- [ ] `process.env.API_URL` é consumido no build
- [ ] Mudar `API_URL` no `.env` muda a URL usada pelo app
- [ ] Em produção, `usesCleartextTraffic = false` e `NSAllowsArbitraryLoads = false`
- [ ] Em dev, `usesCleartextTraffic = true`
- [ ] `.env.example` documenta todas as vars
- [ ] App continua funcionando localmente (apontando para localhost:8080/api)
- [ ] Testes de env passam

## Como Testar

### Manual
```bash
# 1. Verificar que app.config.ts existe
ls perfectjob-mobile/app.config.ts

# 2. Verificar config
cat perfectjob-mobile/app.config.ts | grep apiUrl

# 3. Build dev (com env)
cd perfectjob-mobile
echo "API_URL=http://192.168.1.10:8080/api" > .env
npx expo start --clear

# 4. Verificar que app usa nova URL
# (no log de DEV ou via debugging)
```

### Automatizado
```typescript
import { ENV } from '@/config/env';

test('ENV.API_URL is set from extra', () => {
  expect(ENV.API_URL).toBe('http://localhost:8080/api');
});
```

## Arquivos Criados/Modificados

- `app.json` (renomear/deletar)
- `app.config.ts` (criar)
- `.env.example` (criar)
- `eas.json` (modificar)
- `src/config/env.ts` (criar)
- `src/services/api/client.ts` (modificar)
- `src/config/env.test.ts` (criar)
- `.gitignore` (verificar que `.env` está ignorado)

## Notas

- `expo-constants` é peer dependency do Expo SDK, já vem incluído
- Variáveis de ambiente em Expo são lidas em tempo de build, não runtime
- Para mudar URL sem rebuild, é preciso rebuild (esperado para nativo)
- Em EAS Build, as env vars são passadas por `--env` ou `eas.json:build.<profile>.env`
- HTTPS é obrigatório em produção (Google Play e App Store rejeitam cleartext)
