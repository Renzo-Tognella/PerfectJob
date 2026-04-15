# React Native Mobile — PerfectJob

> Expo SDK 52, Expo Router v4, Zustand + TanStack Query v5, NativeWind v4, FlashList.

## Description

PerfectJob mobile app is built with Expo managed workflow (SDK 52) for rapid development while maintaining native performance. The architecture uses file-based routing via Expo Router v4, Zustand for client-side state (auth, preferences), and TanStack Query v5 for all server state (jobs, matches, resume). NativeWind v4 provides Tailwind-based styling with native performance. FlashList handles job list rendering with memory efficiency.

**Stack**: Expo SDK 52, Expo Router v4, React Native 0.76, TypeScript 5.6, Zustand 5.x, TanStack Query v5, NativeWind v4, FlashList, Axios, expo-secure-store, expo-auth-session, expo-notifications, react-native-iap.

## Checklist

1. Use Expo Router v4 file-based routing — place screens in `app/` directory
2. Use Zustand stores for client-only state: `useAuthStore`, `usePreferencesStore`
3. Use TanStack Query for ALL server state — never cache API data in Zustand
4. Use NativeWind v4 `className` prop for styling — never inline styles or StyleSheet
5. Use FlashList (not FlatList) for any list rendering > 10 items
6. Configure Axios with token refresh interceptor — 401 → refresh → retry
7. Store tokens in expo-secure-store — NEVER AsyncStorage for sensitive data
8. Implement auth flow: Google + Apple + LinkedIn via expo-auth-session
9. Set up TanStack Query persister for offline support (MMKV storage)
10. Use expo-document-picker for resume file uploads (PDF/DOCX)
11. Configure expo-notifications for job alert push notifications
12. Use expo-local-authentication for biometric auth on app open

## Key Rules

- **NEVER** use FlatList for job lists — always FlashList for performance
- **NEVER** store tokens in AsyncStorage — use expo-secure-store exclusively
- **NEVER** put server state in Zustand — use TanStack Query with proper cache/stale times
- **NEVER** use inline styles — use NativeWind `className` prop
- **NEVER** make API calls in useEffect — use TanStack Query `useQuery` / `useMutation`
- **NEVER** use `any` type — always provide proper TypeScript types
- **ALWAYS** use Expo Router file-based routing — never React Navigation directly
- **ALWAYS** define API response types matching backend DTOs
- **ALWAYS** handle loading, error, and empty states in every screen
- **ALWAYS** use TanStack Query's `select` option for data transformations
- **ALWAYS** configure staleTime and gcTime for each query based on data freshness needs

## Project Structure

```
PerfectJobMobile/
├── app/                          # Expo Router file-based routing
│   ├── _layout.tsx               # Root layout (providers)
│   ├── (auth)/
│   │   ├── _layout.tsx           # Auth stack layout
│   │   ├── login.tsx             # Login screen
│   │   └── register.tsx          # Register screen
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab navigator layout
│   │   ├── index.tsx             # Home / Job Feed
│   │   ├── search.tsx            # Job Search
│   │   ├── matches.tsx           # Job Matches
│   │   ├── resume.tsx            # Resume Management
│   │   └── profile.tsx           # User Profile
│   ├── job/
│   │   └── [id].tsx              # Job Detail (dynamic route)
│   └── +not-found.tsx            # 404 screen
├── src/
│   ├── api/
│   │   ├── client.ts             # Axios instance + interceptors
│   │   ├── auth.ts               # Auth API functions
│   │   ├── jobs.ts               # Job API functions
│   │   ├── resume.ts             # Resume API functions
│   │   └── matching.ts           # Matching API functions
│   ├── stores/
│   │   ├── authStore.ts          # Zustand: tokens, user
│   │   └── preferencesStore.ts   # Zustand: theme, filters
│   ├── hooks/
│   │   ├── useJobs.ts            # TanStack Query hooks for jobs
│   │   ├── useMatches.ts         # TanStack Query hooks for matches
│   │   ├── useResume.ts          # TanStack Query hooks for resume
│   │   └── useAuth.ts            # Auth hook (login/logout/register)
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── LoadingScreen.tsx
│   │   ├── job/
│   │   │   ├── JobCard.tsx       # Job list item
│   │   │   ├── JobDetail.tsx     # Job detail content
│   │   │   ├── SalaryBadge.tsx
│   │   │   └── MatchScoreRing.tsx
│   │   ├── resume/
│   │   │   ├── ResumeUploader.tsx
│   │   │   ├── SkillWeightSlider.tsx
│   │   │   └── SectionCard.tsx
│   │   └── search/
│   │       ├── SearchBar.tsx
│   │       └── FilterChips.tsx
│   ├── types/
│   │   ├── job.ts                # Job, JobSearchResult types
│   │   ├── resume.ts             # Resume, WeightedSkill types
│   │   ├── match.ts              # MatchResult types
│   │   ├── auth.ts               # User, Token types
│   │   └── api.ts                # PaginatedResponse, ApiError types
│   ├── utils/
│   │   ├── formatting.ts         # Salary, date formatting (pt-BR)
│   │   ├── storage.ts            # SecureStore wrapper
│   │   └── constants.ts          # App constants
│   └── providers/
│       ├── QueryProvider.tsx      # TanStack Query + persister
│       ├── AuthProvider.tsx       # Auth state initialization
│       └── ThemeProvider.tsx      # NativeWind theme
├── assets/
│   ├── images/
│   └── fonts/
├── app.json
├── eas.json
├── tsconfig.json
├── babel.config.js
└── package.json
```

## Code Examples

### package.json (key dependencies)

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "react-native": "0.76.6",
    "react": "18.3.1",
    "typescript": "~5.6.0",

    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.62.0",

    "nativewind": "^4.1.0",
    "tailwindcss": "^3.4.0",

    "@shopify/flash-list": "^1.7.0",
    "axios": "^1.7.0",

    "expo-secure-store": "~14.0.0",
    "expo-auth-session": "~6.0.0",
    "expo-crypto": "~14.0.0",
    "expo-document-picker": "~12.0.0",
    "expo-notifications": "~0.29.0",
    "expo-local-authentication": "~15.0.0",
    "expo-constants": "~17.0.0",

    "react-native-iap": "^12.13.0",
    "react-native-mmkv": "^3.1.0"
  },
  "devDependencies": {
    "@types/react": "~18.3.0",
    "jest": "^29.0.0",
    "@testing-library/react-native": "^12.0.0",
    "detox": "^20.0.0"
  }
}
```

### Axios Client with Token Refresh

```typescript
// src/api/client.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../stores/authStore';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token!);
  });
  failedQueue = [];
};

client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return client(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
          refreshToken,
        });

        await SecureStore.setItemAsync('access_token', data.accessToken);
        await SecureStore.setItemAsync('refresh_token', data.refreshToken);

        processQueue(null, data.accessToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        router.replace('/(auth)/login');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default client;
```

### Auth Store (Zustand)

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  plan: 'FREE' | 'PRO';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    set({ user: null, isAuthenticated: false });
  },

  hydrate: async () => {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
      // Validate token and fetch user profile
      set({ isAuthenticated: true });
    }
    set({ isLoading: false });
  },
}));
```

### TanStack Query Hooks

```typescript
// src/hooks/useJobs.ts
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import client from '../api/client';
import type { Job, JobSearchResult, PaginatedResponse } from '../types/job';

export const jobKeys = {
  all: ['jobs'] as const,
  search: (query: string, filters: JobSearchFilters) =>
    ['jobs', 'search', query, filters] as const,
  detail: (id: string) => ['jobs', id] as const,
};

export function useJobSearch(query: string, filters: JobSearchFilters) {
  return useInfiniteQuery({
    queryKey: jobKeys.search(query, filters),
    queryFn: ({ pageParam = 0 }) =>
      client.post<PaginatedResponse<Job>>('/jobs/search', {
        ...filters,
        query,
        page: pageParam,
        size: 20,
      }).then((r) => r.data),
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: query.length > 0,
  });
}

export function useJobDetail(jobId: string) {
  return useQuery({
    queryKey: jobKeys.detail(jobId),
    queryFn: () => client.get<Job>(`/jobs/${jobId}`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    select: (data) => ({
      ...data,
      salaryDisplay: formatSalary(data.salaryMin, data.salaryMax),
      postedAgo: formatRelativeDate(data.postedDate),
    }),
  });
}
```

### Job List Screen with FlashList

```tsx
// app/(tabs)/index.tsx
import { FlashList } from '@shopify/flash-list';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { useJobSearch } from '../../src/hooks/useJobs';
import { JobCard } from '../../src/components/job/JobCard';
import { LoadingScreen } from '../../src/components/ui/LoadingScreen';

export default function HomeScreen() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useJobSearch('desenvolvedor', {});

  if (isLoading) return <LoadingScreen />;

  const jobs = data?.pages.flatMap((page) => page.content) ?? [];

  return (
    <View className="flex-1 bg-white">
      <FlashList
        data={jobs}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            onPress={() => router.push(`/job/${item.id}`)}
          />
        )}
        estimatedItemSize={120}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? <LoadingScreen /> : null
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-8">
            <Text className="text-gray-500 text-center">
              Nenhuma vaga encontrada
            </Text>
          </View>
        }
      />
    </View>
  );
}
```

### Job Card Component (NativeWind)

```tsx
// src/components/job/JobCard.tsx
import { Pressable, Text, View } from 'react-native';
import type { Job } from '../../types/job';

interface JobCardProps {
  job: Job;
  onPress: () => void;
}

export function JobCard({ job, onPress }: JobCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mx-4 my-2 rounded-xl bg-white p-4 shadow-sm border border-gray-100 active:bg-gray-50"
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-3">
          <Text className="text-base font-semibold text-gray-900" numberOfLines={2}>
            {job.title}
          </Text>
          <Text className="text-sm text-gray-600 mt-1">
            {job.companyName}
          </Text>
        </View>
        {job.companyLogoUrl && (
          <Image
            source={{ uri: job.companyLogoUrl }}
            className="w-10 h-10 rounded-lg"
          />
        )}
      </View>

      <View className="flex-row items-center mt-3 gap-2">
        {job.location && (
          <Badge label={job.location} icon="location" variant="default" />
        )}
        {job.isRemote && (
          <Badge label="Remoto" icon="globe" variant="success" />
        )}
        {job.jobType && (
          <Badge label={job.jobType} variant="default" />
        )}
      </View>

      {job.salaryMin && (
        <Text className="text-sm font-medium text-green-700 mt-2">
          R$ {job.salaryMin.toLocaleString('pt-BR')} - R$ {job.salaryMax?.toLocaleString('pt-BR')}
        </Text>
      )}

      <Text className="text-xs text-gray-400 mt-2">
        {timeAgo(job.postedDate)}
      </Text>
    </Pressable>
  );
}
```

### QueryProvider with Offline Persister

```tsx
// src/providers/QueryProvider.tsx
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { MMKV } from 'react-native-mmkv';

const mmkv = new MMKV();

const storage = {
  getItem: (key: string) => mmkv.getString(key) ?? null,
  setItem: (key: string, value: string) => mmkv.set(key, value),
  removeItem: (key: string) => mmkv.delete(key),
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 2,
      networkMode: 'offlineFirst',
    },
  },
});

const persister = createAsyncStoragePersister({ storage });

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 24 * 60 * 60 * 1000 }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
```

### Auth Flow (expo-auth-session)

```typescript
// src/hooks/useAuth.ts
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../stores/authStore';
import client from '../api/client';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

export function useAuth() {
  const { setUser, logout: storeLogout } = useAuthStore();

  const googleLogin = async () => {
    const redirectUrl = AuthSession.makeRedirectUri();
    const authRequest = new AuthSession.AuthRequest({
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!,
      redirectUri: redirectUrl,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    });

    const result = await authRequest.promptAsync(discovery);

    if (result.type === 'success') {
      const { data } = await client.post('/auth/oauth2/callback', {
        provider: 'google',
        code: result.params.code,
        codeVerifier: authRequest.codeVerifier,
        redirectUri: redirectUrl,
      });

      await SecureStore.setItemAsync('access_token', data.accessToken);
      await SecureStore.setItemAsync('refresh_token', data.refreshToken);
      setUser(data.user);
    }
  };

  const login = async (email: string, password: string) => {
    const { data } = await client.post('/auth/login', { email, password });
    await SecureStore.setItemAsync('access_token', data.accessToken);
    await SecureStore.setItemAsync('refresh_token', data.refreshToken);
    setUser(data.user);
  };

  return { login, googleLogin, logout: storeLogout };
}
```

## References

- Expo SDK 52: https://docs.expo.dev/versions/v52.0.0/
- Expo Router v4: https://docs.expo.dev/router/introduction/
- Zustand 5: https://zustand.docs.pmnd.rs/
- TanStack Query v5: https://tanstack.com/query/v5/docs/framework/react/react-native
- NativeWind v4: https://www.nativewind.dev/
- FlashList: https://shopify.github.io/flash-list/
- expo-secure-store: https://docs.expo.dev/versions/latest/sdk/securestore/
- expo-auth-session: https://docs.expo.dev/versions/latest/sdk/auth-session/
- expo-notifications: https://docs.expo.dev/versions/latest/sdk/notifications/
- react-native-iap: https://react-native-iap.dooboolab.com/
