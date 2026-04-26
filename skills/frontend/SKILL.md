# PerfectJob — Skill: Engenharia de Software Frontend (React Native)

## Propósito
Esta skill define as melhores práticas, padrões de arquitetura e convenções para desenvolvimento mobile com React Native no projeto PerfectJob.

---

## 1. Stack Tecnológica

### Core
- **React Native 0.76+** — Framework mobile
- **TypeScript 5.5+** — Tipagem estática
- **Expo SDK 52+** — Toolchain gerenciada
- **React 19** — Biblioteca de UI

### Navegação
- **React Navigation 7** — Stack, Tab, Drawer navigators
- **React Navigation Native Stack** — Navegação nativa

### Estado & API
- **TanStack Query (React Query) v5** — Server state, cache, mutations
- **Zustand** — Client state (filtros, preferências, UI)
- **Axios** — HTTP client com interceptors

### Estilização
- **StyleSheet + Design Tokens** — CSS-in-JS nativo
- **Reanimated 3** — Animações de alta performance
- **Gesture Handler 2** — Gestos nativos

### Qualidade
- **Jest + React Native Testing Library** — Testes unitários/integração
- **ESLint + Prettier** — Linting e formatação
- **Maestro** — Testes E2E

### Performance & Monitoramento
- **React Native Performance** — Profiling
- **FlashList (Shopify)** — Listas performáticas
- **react-native-mmkv** — Storage rápido

---

## 2. Estrutura de Projeto

```
src/
├── app/                        # Configuração da aplicação
│   ├── App.tsx                 # Entry point
│   ├── Providers.tsx           # QueryClient, Theme, Navigation
│   └── ErrorBoundary.tsx
├── navigation/                 # Configuração de navegação
│   ├── RootNavigator.tsx
│   ├── TabNavigator.tsx
│   ├── HomeStack.tsx
│   ├── SearchStack.tsx
│   └── ProfileStack.tsx
├── screens/                    # Telas (pages)
│   ├── home/
│   │   ├── HomeScreen.tsx
│   │   └── components/
│   │       ├── HeroSection.tsx
│   │       ├── CategoryGrid.tsx
│   │       └── FeaturedJobs.tsx
│   ├── search/
│   │   ├── SearchScreen.tsx
│   │   └── components/
│   │       ├── SearchBar.tsx
│   │       ├── FilterSheet.tsx
│   │       ├── JobCard.tsx
│   │       └── SortSelector.tsx
│   ├── job-detail/
│   │   ├── JobDetailScreen.tsx
│   │   └── components/
│   │       ├── JobHeader.tsx
│   │       ├── JobDescription.tsx
│   │       └── ApplyButton.tsx
│   ├── saved-jobs/
│   │   └── SavedJobsScreen.tsx
│   ├── applications/
│   │   └── ApplicationsScreen.tsx
│   └── profile/
│       ├── ProfileScreen.tsx
│       └── components/
│           ├── ProfileHeader.tsx
│           └── SettingsSection.tsx
├── components/                 # Componentes compartilhados
│   ├── ui/                     # Design System Components
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   ├── Badge/
│   │   ├── Avatar/
│   │   ├── Modal/
│   │   ├── Toast/
│   │   ├── Chip/
│   │   ├── Skeleton/
│   │   └── EmptyState/
│   └── shared/                 # Componentes de domínio
│       ├── JobCard.tsx
│       ├── CompanyLogo.tsx
│       ├── SalaryRange.tsx
│       └── SkillTags.tsx
├── hooks/                      # Custom hooks
│   ├── useJobs.ts
│   ├── useSearch.ts
│   ├── useSavedJobs.ts
│   ├── useApply.ts
│   ├── useDebounce.ts
│   └── useTheme.ts
├── services/                   # API & lógica externa
│   ├── api/
│   │   ├── client.ts           # Axios instance + interceptors
│   │   ├── jobApi.ts
│   │   ├── userApi.ts
│   │   └── companyApi.ts
│   └── query-keys.ts           # Centralized query keys
├── store/                      # Estado global (Zustand)
│   ├── useFilterStore.ts
│   ├── useSearchStore.ts
│   └── useAuthStore.ts
├── design-system/              # Design Tokens & Theme
│   ├── tokens/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── shadows.ts
│   ├── theme/
│   │   ├── ThemeProvider.tsx
│   │   ├── light.ts
│   │   └── dark.ts
│   └── utils/
│       └── responsive.ts       # useResponsive, scale, etc.
├── types/                      # Tipos TypeScript
│   ├── job.ts
│   ├── user.ts
│   ├── company.ts
│   ├── api.ts                  # Request/Response types
│   └── navigation.ts           # Navigation param types
├── utils/                      # Utilitários
│   ├── format.ts               # Formatação (data, salário)
│   ├── validation.ts           # Validação de formulários
│   ├── analytics.ts            # Tracking
│   └── constants.ts
└── assets/                     # Recursos estáticos
    ├── images/
    ├── icons/
    └── fonts/
```

---

## 3. Princípios de UI/UX Mobile

### 3.1 Mobile-First
- Design começando pela menor tela (iPhone SE: 375pt)
- Touch targets mínimos de 44pt (Apple HIG)
- Layout responsivo com `useWindowDimensions()`
- Safe areas respeitadas (`SafeAreaView`, `useSafeAreaInsets`)

### 3.2 Performance
- **FlashList** para listas longas (vagas, resultados de busca)
- **Reanimated** para animações (evitar JS thread)
- **Image** com cache e lazy loading (`expo-image`)
- Memoização: `React.memo`, `useMemo`, `useCallback`
- Code splitting por screen (`React.lazy`)

### 3.3 Gestão de Estado
```
┌──────────────────────────────────────────────────┐
│              QUERY CLIENT (TanStack)              │ State de servidor
│    Cache, deduplication, background refetch      │
├──────────────────────────────────────────────────┤
│              ZUSTAND STORES                      │ State de cliente
│    Filtros, tema, preferências, auth             │
├──────────────────────────────────────────────────┤
│              LOCAL STATE (useState)              │ State de componente
│    Form inputs, modals abertos, animações        │
└──────────────────────────────────────────────────┘
```

### 3.4 Navegação
```typescript
// Tipagem forte para navegação
type RootStackParamList = {
  Main: undefined;
  JobDetail: { jobId: string };
  Company: { companyId: string };
};

// useNavigation/useRoute sempre tipados
const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
```

---

## 4. Design Patterns React Native

### 4.1 Compound Components
```tsx
// Card com subcomponentes
<JobCard>
  <JobCard.Header logo={logo} title={title} company={company} />
  <JobCard.Meta salary={salary} location={location} model={model} />
  <JobCard.Description text={description} />
  <JobCard.Tags skills={skills} />
  <JobCard.Footer onSave={onSave} postedAt={postedAt} />
</JobCard>
```

### 4.2 Render Props
```tsx
<QueryLoader query={useJob(id)} loading={<Skeleton />} error={<ErrorState />}>
  {(job) => <JobDetailScreen job={job} />}
</QueryLoader>
```

### 4.3 Custom Hooks (Separation of Concerns)
```typescript
// useJobs.ts — Toda lógica de busca de vagas
function useSearchJobs(filters: JobFilters) {
  return useInfiniteQuery({
    queryKey: ['jobs', 'search', filters],
    queryFn: ({ pageParam = 0 }) => jobApi.search({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) => lastPage.last ? undefined : lastPage.page + 1,
  });
}
```

### 4.4 Container/Presentational
```tsx
// Container: lógica de estado e dados
function JobListContainer() {
  const filters = useFilterStore();
  const { data, fetchNextPage } = useSearchJobs(filters);
  return <JobList jobs={data?.pages.flatMap(p => p.content)} onEndReached={fetchNextPage} />;
}

// Presentational: apenas renderização
const JobList = React.memo(({ jobs, onEndReached }: Props) => (
  <FlashList data={jobs} renderItem={renderJobCard} onEndReached={onEndReached} />
));
```

### 4.5 Observer (Event Emitter)
```typescript
// Para comunicação entre telas desacopladas
EventEmitter.emit('jobSaved', { jobId: '123' });

// Em outra tela:
useEffect(() => {
  const sub = EventEmitter.on('jobSaved', handleJobSaved);
  return () => sub.remove();
}, []);
```

---

## 5. Boas Práticas React Native

### 5.1 API Client
```typescript
const apiClient = axios.create({
  baseURL: Config.API_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // Tenta refresh token, se falhar → logout
      await refreshTokenOrLogout();
    }
    return Promise.reject(error);
  }
);
```

### 5.2 Query Keys Centralizadas
```typescript
export const queryKeys = {
  jobs: {
    all: ['jobs'] as const,
    search: (filters: JobFilters) => ['jobs', 'search', filters] as const,
    detail: (id: string) => ['jobs', 'detail', id] as const,
    featured: () => ['jobs', 'featured'] as const,
  },
  companies: {
    all: ['companies'] as const,
    detail: (id: string) => ['companies', 'detail', id] as const,
  },
  user: {
    profile: () => ['user', 'profile'] as const,
    savedJobs: () => ['user', 'saved-jobs'] as const,
    applications: () => ['user', 'applications'] as const,
  },
};
```

### 5.3 Otimistic Updates
```typescript
const saveJob = useMutation({
  mutationFn: (jobId: string) => jobApi.save(jobId),
  onMutate: async (jobId) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.user.savedJobs() });
    const previous = queryClient.getQueryData(queryKeys.user.savedJobs());
    queryClient.setQueryData(queryKeys.user.savedJobs(), (old) => [...old, jobId]);
    return { previous };
  },
  onError: (_err, _jobId, context) => {
    queryClient.setQueryData(queryKeys.user.savedJobs(), context?.previous);
  },
});
```

### 5.4 Infinite Scroll
```typescript
function useInfiniteJobs(filters: JobFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.jobs.search(filters),
    queryFn: ({ pageParam = 0 }) => jobApi.search({ ...filters, page: pageParam, size: 20 }),
    getNextPageParam: (lastPage) => lastPage.last ? undefined : lastPage.page + 1,
    staleTime: 5 * 60 * 1000,  // 5 min
  });
}
```

### 5.5 Error Boundary
```tsx
class AppErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    analytics.trackError(error, info);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}
```

### 5.6 Image Loading
```tsx
import { Image } from 'expo-image';

<Image
  source={{ uri: companyLogo }}
  style={styles.logo}
  contentFit="cover"
  placeholder={{ blurhash }}  // Low-quality preview
  transition={200}
  cachePolicy="memory-disk"
/>
```

---

## 6. Testes

### 6.1 Estrutura
```
src/__tests__/
├── unit/                   # Testes unitários (hooks, utils, stores)
│   ├── hooks/
│   │   └── useSearch.test.ts
│   └── utils/
│       └── format.test.ts
├── integration/            # Testes de integração (screens + API mock)
│   ├── screens/
│   │   ├── HomeScreen.test.tsx
│   │   └── SearchScreen.test.tsx
│   └── components/
│       └── JobCard.test.tsx
├── e2e/                    # Maestro tests (UI flows)
│   └── search-flow.yaml
└── setup.ts                # Jest setup (mocks globais)
```

### 6.2 Exemplo de Teste de Tela
```tsx
test('SearchScreen renders jobs and handles filters', async () => {
  mockJobApi.search.mockResolvedValue(mockJobPage);

  render(<SearchScreen />, { wrapper: TestWrapper });

  // Loading state
  expect(screen.getByTestId('search-skeleton')).toBeTruthy();

  // Jobs renderizados
  await waitFor(() => {
    expect(screen.getByText('Senior React Developer')).toBeTruthy();
  });

  // Ação: aplicar filtro
  fireEvent.press(screen.getByText('Remoto'));
  expect(mockJobApi.search).toHaveBeenCalledWith(
    expect.objectContaining({ workModel: 'REMOTE' })
  );
});
```

---

## 7. Segurança

- **Storage seguro:** `react-native-mmkv` com encryption key
- **Tokens:** Access/Refresh armazenados no Keychain/Keystore via `expo-secure-store`
- **Network Security:** Certificate pinning com `react-native-ssl-pinning`
- **Deep Links:** Validação de URLs de deep link (não abrir qualquer URL)
- **Sensitive data:** Nunca logar PII ou tokens
- **Code obfuscation:** `react-native-obfuscating-transformer` (release)

---

## 8. Acessibilidade

```tsx
// Labels para leitores de tela
<Button
  title="Candidatar-se"
  accessibilityLabel="Candidatar-se à vaga de Senior React Developer"
  accessibilityHint="Envia sua candidatura para esta vaga"
/>

// Roles semânticas
<View accessibilityRole="header">...</View>
<View accessibilityRole="button" onPress={handlePress}>...</View>

// Estados
<TouchableOpacity accessibilityState={{ selected: isSaved }}>...</TouchableOpacity>
```

---

## 9. Build & Deploy

### 9.1 EAS Build (Expo)
```json
{
  "build": {
    "development": { "developmentClient": true },
    "preview": { "distribution": "internal" },
    "production": { "autoIncrement": true }
  }
}
```

### 9.2 OTA Updates
```bash
eas update --channel production --message "Fix: Ajuste no card de vagas"
```

### 9.3 Environment Config
```typescript
const Config = {
  API_URL: process.env.EXPO_PUBLIC_API_URL!,
  ENV: process.env.EXPO_PUBLIC_ENV || 'development',
  SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
};
```

---

## 10. Convenções de Código

- **Idioma:** Código em inglês, interface do usuário em português
- **Nomeclatura:** camelCase, componentes PascalCase, constantes UPPER_SNAKE_CASE
- **Imports:** Agrupados (React → RN → libs → internos → tipos → estilos)
- **Componentes:** Funcionais com hooks, `React.memo()` em componentes puros
- **Estilos:** `StyleSheet.create()` sempre (performance), arquivos separados `.styles.ts`
- **Tipagem:** Strict mode TypeScript, sem `any`, preferir inferência
- **Hooks:** Lógica extraída para hooks customizados (screen component < 150 linhas)
