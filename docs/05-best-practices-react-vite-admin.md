# Boas Práticas — React 19 + Vite 6 + Admin Web

> Compilado de fontes oficiais (React docs, Vite docs, TanStack Query, React Router, Tailwind, OWASP) aplicado ao contexto do PerfectJob.

## 1. Arquitetura Recomendada

```
src/
├── components/        # Componentes reutilizáveis
│   ├── ui/            # Primitivos (Button, Input, Modal, Badge, Toast)
│   └── layout/        # Layout shell (Sidebar, Header, MainLayout)
├── pages/             # Telas roteadas
├── services/          # Lógica externa (API, storage, analytics)
│   └── api/           # Clientes HTTP
├── store/             # Estado global (Zustand)
├── hooks/             # Hooks customizados
├── types/             # Tipos centralizados
├── styles/            # Design tokens CSS
├── utils/             # Funções puras (formatadores, validadores)
├── constants/         # Constantes (rotas, enums)
├── routes/            # Configuração de rotas
└── lib/               # Configurações (axios, queryClient)
```

**Princípios:**
- Páginas orquestram hooks + componentes, não fazem fetch direto
- Hooks encapsulam lógica de dados (TanStack Query)
- Componentes são puros e tipados
- Lógica de negócio fica em `services/`, não em componentes

## 2. Variáveis de Ambiente (Vite)

### 2.1 `.env.development` (gitignored)
```env
VITE_API_URL=http://localhost:8080/api
VITE_APP_NAME=PerfectJob Admin (Dev)
```

### 2.2 `.env.production` (gitignored)
```env
VITE_API_URL=https://api.perfectjob.com/api
VITE_APP_NAME=PerfectJob Admin
```

### 2.3 `.env.example` (committed)
```env
VITE_API_URL=http://localhost:8080/api
VITE_APP_NAME=PerfectJob Admin
```

### 2.4 Acesso
```typescript
export const API_URL = import.meta.env.VITE_API_URL;
```

**Regra:** Apenas variáveis prefixadas com `VITE_` são expostas ao client.

## 3. Autenticação

### 3.1 Padrão com Zustand + Persist
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
```

### 3.2 Validação de Token Expirado
```typescript
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // ...
      isAuthenticated: false,
      
      setAuth: (token, user) => {
        if (isTokenExpired(token)) {
          set({ token: null, user: null, isAuthenticated: false });
          return;
        }
        set({ token, user, isAuthenticated: true });
      },
    }),
    // ...
  )
);
```

### 3.3 Protected Route Memoizado
```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
}
```

### 3.4 Redirect 401 via React Router (sem reload)
```typescript
let navigateRef: NavigateFunction | null = null;

export function setNavigateRef(nav: NavigateFunction) {
  navigateRef = nav;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      navigateRef?.('/login', { replace: true });
    }
    return Promise.reject(error);
  }
);
```

## 4. TanStack Query (Server State)

### 4.1 Configuração
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error instanceof AxiosError && error.response?.status >= 400 && error.response?.status < 500) {
          return false;  // não retry em 4xx
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});
```

### 4.2 Hooks
```typescript
export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobApi.getAll(),
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: jobApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-stats'] });
    },
  });
}
```

## 5. Cliente HTTP (Axios)

### 5.1 Setup
```typescript
import axios, { AxiosError } from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      navigateRef?.('/login', { replace: true });
    }
    return Promise.reject(error);
  }
);
```

## 6. Componentes

### 6.1 Button (com Variants)
```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary-500 text-white hover:bg-primary-600',
        secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
        accent: 'bg-accent-500 text-white hover:bg-accent-600',
        ghost: 'hover:bg-neutral-100',
        danger: 'bg-error-500 text-white hover:bg-error-600',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({ className, variant, size, loading, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner className="mr-2" />}
      {children}
    </button>
  );
}
```

### 6.2 Modal Acessível
```typescript
import { Dialog, Transition } from '@headlessui/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-lg bg-white p-6">
            <Dialog.Title className="text-lg font-medium mb-4">{title}</Dialog.Title>
            {children}
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
}
```

### 6.3 Toast
```typescript
// Usar react-hot-toast ou sonner
import { Toaster, toast } from 'sonner';

export { Toaster, toast };

// Uso
toast.success('Vaga criada com sucesso');
toast.error('Erro ao criar vaga');
toast.promise(createJobMutation.mutateAsync(data), {
  loading: 'Criando vaga...',
  success: 'Vaga criada',
  error: 'Erro ao criar',
});
```

## 7. Formulários (react-hook-form + zod)

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const jobSchema = z.object({
  title: z.string().min(3, 'Mínimo 3 caracteres').max(255),
  companyId: z.number().int().positive(),
  description: z.string().min(50, 'Mínimo 50 caracteres'),
  workModel: z.enum(['REMOTE', 'HYBRID', 'ON_SITE']),
  experienceLevel: z.enum(['INTERN', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'SPECIALIST']),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  skills: z.array(z.string()).max(20),
}).refine(
  (data) => !data.salaryMin || !data.salaryMax || data.salaryMax >= data.salaryMin,
  { message: 'salaryMax deve ser >= salaryMin', path: ['salaryMax'] }
);

type JobInput = z.infer<typeof jobSchema>;

export function JobFormModal({ job, onClose }: { job?: Job; onClose: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<JobInput>({
    resolver: zodResolver(jobSchema),
    defaultValues: job ?? { workModel: 'REMOTE', experienceLevel: 'JUNIOR', skills: [] },
  });
  
  const createMutation = useCreateJob();
  
  const onSubmit = handleSubmit(async (data) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Vaga criada');
      onClose();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  });
  
  return (
    <Modal isOpen onClose={onClose} title={job ? 'Editar vaga' : 'Nova vaga'}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input {...register('title')} error={errors.title?.message} label="Título" />
        {/* ... */}
        <Button type="submit" loading={isSubmitting}>Salvar</Button>
      </form>
    </Modal>
  );
}
```

## 8. Roteamento (React Router v7)

### 8.1 Estrutura
```typescript
const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/jobs', element: <JobsPage /> },
      { path: '/companies', element: <CompaniesPage /> },
      { path: '/applications', element: <ApplicationsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
```

### 8.2 Lazy Loading
```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const JobsPage = lazy(() => import('@/pages/JobsPage'));

<Suspense fallback={<PageLoader />}>
  <Routes>...</Routes>
</Suspense>
```

## 9. Performance

### 9.1 Code Splitting
- `React.lazy` + `Suspense` para rotas
- Vendor chunks separados (vite já faz por default)
- Dynamic imports para componentes pesados

### 9.2 Re-renders
- `React.memo` em componentes puros
- `useMemo` para computações caras
- `useCallback` para handlers passados como prop
- Selectors específicos no Zustand

### 9.3 Bundle
- Tree shaking (Vite já faz)
- Evitar lodash (use `lodash-es` ou funções nativas)
- Imagens: WebP, lazy loading, `srcset`

## 10. Segurança

### 10.1 Tokens
- ✅ localStorage é aceitável para admin (CSP, sem XSS)
- ❌ NUNCA localStorage para apps públicos
- Preferir httpOnly cookies quando possível
- Validar expiração do JWT no client

### 10.2 XSS
- React escapa por default
- Evitar `dangerouslySetInnerHTML` (se necessário, sanitize com DOMPurify)
- CSP header no servidor

### 10.3 CSRF
- Como usa JWT em header (não cookie), CSRF não é vetor
- Se usar cookie httpOnly: CSRF token + SameSite=Strict

### 10.4 CORS (server-side)
- Configurar origens específicas (não `*` com credentials)
- Headers expostos: `X-Total-Count`

### 10.5 OWASP Top 10 Web
| Risco | Mitigação |
|---|---|
| A01: Broken Access Control | RBAC no backend + Protected Routes no frontend |
| A02: Cryptographic Failures | HTTPS, JWT seguro |
| A03: Injection | zod validation, escape (React faz) |
| A04: Insecure Design | Threat modeling |
| A05: Security Misconfiguration | CSP, headers, profiles |
| A06: Vulnerable Components | npm audit, Snyk, renovate |
| A07: Identification & Auth Failures | JWT + bcrypt + expiry |
| A08: Software & Data Integrity | Lock files, signed builds |
| A09: Security Logging | Sentry, DataDog |
| A10: Server-Side Request Forgery | Não aplicável (sem fetch externo) |

## 11. Testes

### 11.1 Stack
- **Vitest** (Rápido, compatível com Vite)
- **@testing-library/react** (componentes)
- **MSW** (mock de API)
- **Playwright** (E2E)

### 11.2 Setup
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
});
```

### 11.3 Exemplo
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { JobsPage } from './JobsPage';

const server = setupServer(
  rest.get('/v1/jobs', (req, res, ctx) => 
    res(ctx.json({ content: [{ id: 1, title: 'Dev' }], totalElements: 1 }))
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('renders jobs from API', async () => {
  render(<JobsPage />);
  await waitFor(() => expect(screen.getByText('Dev')).toBeInTheDocument());
});
```

## 12. Acessibilidade

### 12.1 Semântica
- `<button>` para ações, `<a>` para navegação
- `<label htmlFor>` em todos os inputs
- `aria-label` em botões só com ícone
- `aria-live="polite"` em toasts/notificações
- `aria-busy` em loading states
- `role` apenas quando semântico não é possível

### 12.2 Foco
- `:focus-visible` em CSS
- Trap focus em modais
- Restaurar foco ao fechar modal
- Skip link para conteúdo principal

### 12.3 Navegação por Teclado
- Tab order lógico
- Enter/Space em botões
- Esc para fechar modal
- Arrow keys em listas/menus

## 13. Convenções

- **Componentes:** PascalCase, 1 por arquivo
- **Hooks:** `use*`, camelCase
- **Pastas:** kebab-case
- **Constantes:** UPPER_SNAKE_CASE
- **Tipos:** PascalCase, centralizar em `types/`
- **Imports:** Absolutos com alias `@/*`
- **Estilo:** Tailwind (utility-first), `cn()` helper para merge
- **Error handling:** Sempre tipado, ErrorBoundary global

## 14. Build & Deploy

### 14.1 Vite Build
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
});
```

### 14.2 Headers de Segurança
```nginx
# nginx
add_header X-Content-Type-Options nosniff;
add_header X-Frame-Options DENY;
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy strict-origin-when-cross-origin;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.perfectjob.com;";
```

## 15. Referências

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [React Router](https://reactrouter.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/)
- [Headless UI](https://headlessui.com/)
- [OWASP Top 10 Web](https://owasp.org/Top10/)
- [Vitest](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
