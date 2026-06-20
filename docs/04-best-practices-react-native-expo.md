# Boas Práticas — React Native + Expo SDK 54

> Compilado de fontes oficiais (Expo docs, React Navigation docs, TanStack Query docs, Axios, OWASP Mobile) aplicado ao contexto do PerfectJob.

## 1. Arquitetura Recomendada

```
src/
├── api/              # Clientes HTTP, types do backend
├── components/       # Componentes reutilizáveis
│   ├── shared/       # Genéricos (Button, Card, etc)
│   └── ui/           # Primitivos (Icon, Input, etc)
├── design-system/    # Tokens, componentes base
├── hooks/            # Hooks de domínio (useAuth, useJobs)
├── navigation/       # Configuração de rotas
├── screens/          # Telas agrupadas por feature
├── services/         # Lógica de negócio compartilhada
├── store/            # Estado global (Zustand)
└── types/            # Tipos compartilhados
```

**Regras:**
- Telas NUNCA fazem `fetch` direto → sempre via hook
- Hooks NUNCA fazem `fetch` direto → sempre via `*Api.ts`
- Componentes NUNCA acessam `localStorage`/`AsyncStorage` direto → via store ou hook

## 2. Variáveis de Ambiente (Expo SDK 54)

### 2.1 `app.config.ts` (preferido sobre `app.json`)
```typescript
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'PerfectJob',
  slug: 'perfectjob',
  extra: {
    apiUrl: process.env.API_URL || 'http://localhost:8080/api',
    eas: {
      projectId: '...',
    },
  },
  ios: {
    bundleIdentifier: 'com.perfectjob.app',
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,  // dev only
      },
    },
  },
  android: {
    package: 'com.perfectjob.app',
    usesCleartextTraffic: true,  // dev only
  },
});
```

### 2.2 `.env` files
```
API_URL=http://localhost:8080/api
API_URL_PREVIEW=https://staging-api.perfectjob.com/api
API_URL_PRODUCTION=https://api.perfectjob.com/api
```

### 2.3 Acesso no código
```typescript
import Constants from 'expo-constants';

export const API_URL = Constants.expoConfig?.extra?.apiUrl;
```

### 2.4 Por profile (EAS)
```json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal" },
    "production": {}
  },
  "submit": {
    "production": {
      "ios": { "ascAppId": "..." },
      "android": { "serviceAccountKeyPath": "..." }
    }
  }
}
```

## 3. Autenticação e Sessão

### 3.1 Fluxo correto
```
[App boot]
  → hidratar SecureStore → useAuthStore.setState({ token, user, isAuthenticated: true })
  → RootNavigator renderiza AuthStack OU MainStack baseado em isAuthenticated

[Login]
  → POST /v1/auth/login → { accessToken, refreshToken?, user }
  → SecureStore.setItemAsync('auth_token', accessToken)
  → useAuthStore.setAuth(token, user)
  → navigation.reset → MainStack

[Token expirado (401)]
  → Interceptor: SecureStore.deleteItemAsync('auth_token')
  → useAuthStore.logout()
  → RootNavigator detecta isAuthenticated=false → AuthStack

[Logout]
  → SecureStore.deleteItemAsync('auth_token')
  → useAuthStore.logout()
  → navigation.reset → AuthStack
```

### 3.2 Auth Gate
```typescript
export function RootNavigator() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainStack} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
```

### 3.3 Hidratação
```typescript
// App.tsx
export default function App() {
  const loadToken = useAuthStore(s => s.loadToken);
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    loadToken().finally(() => setIsReady(true));
  }, []);
  
  if (!isReady) return <SplashScreen />;
  
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  );
}
```

### 3.4 SecureStore vs AsyncStorage
| Dado | Storage |
|---|---|
| Access token, refresh token | `expo-secure-store` (Keychain/EncryptedSharedPreferences) |
| Preferências do user (tema, idioma) | `AsyncStorage` |
| Cache de dados | `AsyncStorage` (com encryption se PII) |
| Saved jobs (favoritos) | `AsyncStorage` (não é PII) |
| Currículo (PDF) | `expo-file-system` + URL do backend |

## 4. TanStack Query (Server State)

### 4.1 Configuração
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,         // 5 min
      gcTime: 30 * 60 * 1000,           // 30 min (era cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

### 4.2 Hooks de domínio
```typescript
export function useApplications() {
  return useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationApi.listMyApplications(),
    staleTime: 60 * 1000,  // 1 min para candidatura
  });
}

export function useSubmitApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: SubmitApplicationRequest) => applicationApi.submit(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
```

### 4.3 Paginação infinita
```typescript
export function useSearchJobs(filters: SearchFilters) {
  return useInfiniteQuery({
    queryKey: ['jobs', 'search', filters],
    queryFn: ({ pageParam = 0 }) => jobApi.search({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) => 
      lastPage.page < lastPage.totalPages - 1 ? lastPage.page + 1 : undefined,
    initialPageParam: 0,
  });
}
```

## 5. Cliente HTTP (Axios)

### 5.1 Setup
```typescript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      // usar store + navigation ref para redirecionar
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
```

### 5.2 Erro tipado
```typescript
export interface ApiError {
  status: number;
  message: string;
  details?: Record<string, string>;
}

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; details?: Record<string, string> } | undefined;
    if (data?.message) return data.message;
    if (data?.details) {
      const first = Object.values(data.details)[0];
      if (first) return first;
    }
    switch (error.response?.status) {
      case 400: return 'Dados inválidos';
      case 401: return 'Não autorizado';
      case 403: return 'Acesso negado';
      case 404: return 'Recurso não encontrado';
      case 409: return 'Conflito';
      case 429: return 'Muitas requisições';
      case 500: return 'Erro no servidor';
    }
  }
  return 'Erro inesperado';
}
```

## 6. Componentes

### 6.1 Design System
- **Tokens centralizados:** colors, spacing, typography
- **Componentes primitivos:** Button, Input, Select, Card, Badge, Icon
- **Componentes de domínio:** JobCard, ApplicationItem, CompanyCard

### 6.2 Padrão
```typescript
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ title, onPress, variant = 'primary', size = 'md', loading, disabled }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, styles[variant], styles[size], disabled && styles.disabled]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? <ActivityIndicator /> : <Text style={styles.text}>{title}</Text>}
    </TouchableOpacity>
  );
}
```

### 6.3 Acessibilidade obrigatória
- `accessibilityLabel` em TODO botão
- `accessibilityRole` (`button`, `link`, `header`, `image`, `text`)
- `accessibilityHint` para ações não-óbvias
- `accessibilityState` para disabled/selected
- `testID` para testes E2E

## 7. Formulários

### 7.1 react-hook-form + zod
```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginInput = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const { control, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });
  
  const onSubmit = handleSubmit(async (data) => {
    await loginMutation.mutateAsync(data);
  });
  
  return (
    <Controller
      control={control}
      name="email"
      render={({ field }) => (
        <Input
          {...field}
          error={errors.email?.message}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      )}
    />
  );
}
```

## 8. Estado Global (Zustand)

### 8.1 Padrão
```typescript
interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  
  setAuth: async (token, user) => {
    await SecureStore.setItemAsync('auth_token', token);
    set({ token, user, isAuthenticated: true });
  },
  
  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    set({ token: null, user: null, isAuthenticated: false });
  },
  
  loadToken: async () => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      // opcional: decodificar JWT para extrair user
      // ou chamar GET /v1/auth/me
      set({ token, isAuthenticated: true });
    }
  },
}));
```

### 8.2 Onde usar
- **Estado do server (cache, mutations):** TanStack Query
- **Estado de UI local (form, modal, tabs):** useState
- **Estado global pequeno (auth, tema, preferências):** Zustand
- **Estado que precisa persistir entre telas:** Zustand + persist middleware

## 9. Navegação

### 9.1 Estrutura recomendada
```
RootStack (Native Stack, headerShown: false)
├── AuthStack
│   ├── Login
│   └── Register
└── MainStack
    ├── MainTabs (Bottom Tabs)
    │   ├── Home
    │   ├── Search
    │   ├── Saved
    │   ├── Applications
    │   └── Profile
    ├── JobDetail
    └── CompanyDetail
```

### 9.2 Tipagem
```typescript
export type RootStackParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainStackParamList> | undefined;
  JobDetail: { slug: string };
  CompanyDetail: { slug: string };
};

export type MainStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
};

export type TabParamList = {
  Home: undefined;
  Search: { query?: string } | undefined;
  Saved: undefined;
  Applications: undefined;
  Profile: undefined;
};
```

### 9.3 Type-safe navigation
```typescript
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'JobDetail'>;

export function JobDetailScreen({ route, navigation }: Props) {
  const { slug } = route.params;
  // ...
  navigation.navigate('CompanyDetail', { slug: 'tech-corp' });
}
```

## 10. Performance

### 10.1 Listas longas
- `FlatList` com `keyExtractor`, `getItemLayout`, `removeClippedSubviews`
- `React.memo` em `JobCard`
- `useCallback` em handlers de lista
- Window size + initial num to render

### 10.2 Imagens
- `expo-image` em vez de `Image` (cache built-in, mais rápido)
- Especificar `width` e `height` para evitar layout shift
- `priority="high"` para imagens above-the-fold

### 10.3 Re-renders
- Evitar `as any` em props
- Usar selectors específicos: `useAuthStore(s => s.user)` em vez de `useAuthStore()`
- `React.memo` em componentes pesados

## 11. Testes

### 11.1 Stack
- **Jest + jest-expo** (já configurado)
- **@testing-library/react-native** para componentes
- **MSW (Mock Service Worker)** para mockar API

### 11.2 Padrão
```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

test('useApplications returns applications on success', async () => {
  server.use(
    rest.get('/v1/applications', (req, res, ctx) => 
      res(ctx.json([{ id: 1, status: 'PENDING' }]))
    )
  );
  
  const { result } = renderHook(() => useApplications(), { wrapper });
  
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toHaveLength(1);
});
```

## 12. Segurança

### 12.1 Storage seguro
- Tokens: `expo-secure-store`
- PII: `expo-secure-store` com `requireAuthentication: true` (biometria)
- Não-PII: `AsyncStorage`

### 12.2 Network
- HTTPS em produção (NUNCA cleartext em prod)
- Certificate pinning para APIs críticas
- Timeout em todas as requests

### 12.3 Input
- Validar no client (UX) E no server (segurança)
- Escapar strings antes de exibir
- `Text` components já escapam; cuidado com `dangerouslySetInnerHTML`

### 12.4 OWASP Mobile Top 10 (resumido)
| Risco | Mitigação |
|---|---|
| M1: Improper Credential Use | SecureStore, não hardcode |
| M2: Inadequate Supply Chain | Verificar deps, lock files |
| M3: Insecure Authentication | JWT + refresh + biometria |
| M4: Insufficient Input/Output | Validação zod, escape |
| M5: Insecure Communication | HTTPS, certificate pinning |
| M6: Inadequate Privacy Controls | Não logar PII |
| M7: Insufficient Binary Protections | Hermes, ProGuard (release) |
| M8: Security Misconfiguration | Profiles separados |
| M9: Insecure Data Storage | SecureStore + encryption |
| M10: Insufficient Cryptography | bcrypt no server, crypto audited libs |

## 13. Deploy

### 13.1 EAS Build
```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "API_URL": "http://localhost:8080/api" }
    },
    "preview": {
      "distribution": "internal",
      "env": { "API_URL": "https://staging-api.perfectjob.com/api" }
    },
    "production": {
      "env": { "API_URL": "https://api.perfectjob.com/api" }
    }
  }
}
```

### 13.2 OTA Updates
- `expo-updates` para correções rápidas (JS only, não native)
- NÃO atualizar native code via OTA
- Code signing obrigatório em prod

## 14. Convenções

- **Componentes:** PascalCase, 1 por arquivo
- **Hooks:** `use*`, camelCase
- **Pastas:** kebab-case
- **Constantes:** UPPER_SNAKE_CASE
- **Tipos:** PascalCase, `interface` para shapes, `type` para unions
- **Imports:** Absolutos com alias `@/*`
- **Estilo:** `StyleSheet.create` no escopo do módulo
- **Async:** Sempre `async/await`, nunca `.then().then()`
- **Error handling:** Sempre tipado (`try/catch` com `unknown`)

## 15. Referências

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [TanStack Query](https://tanstack.com/query/latest/docs/react/overview)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [OWASP Mobile Top 10](https://owasp.org/www-project-mobile-top-10/)
- [Expo Security Best Practices](https://docs.expo.dev/guides/security/)
