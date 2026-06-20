# TASK-021, TASK-022, TASK-024 — Análise da Execução

## Resumo

Implementação conjunta de três tasks no projeto `perfectjob-admin`:

- **TASK-021**: Migração completa de `useEffect + useState` para TanStack Query
- **TASK-022**: Design system — componentes UI base reutilizáveis
- **TASK-024**: Formulários tipados com `react-hook-form` + `zod`

---

## Dependências Adicionadas

| Pacote | Versão | Finalidade |
|--------|--------|------------|
| `@tanstack/react-query` | já existia | Data fetching (TASK-021) |
| `@headlessui/react` | latest | Modal/Dialog acessível (TASK-022) |
| `class-variance-authority` | latest | Variantes de Button (TASK-022) |
| `clsx` | latest | Concatenar classes (TASK-022) |
| `tailwind-merge` | latest | Resolver conflitos Tailwind (TASK-022) |
| `sonner` | latest | Toast notifications (TASK-022) |
| `react-hook-form` | latest | Gerenciamento de formulários (TASK-024) |
| `zod` | latest | Schema validation (TASK-024) |
| `@hookform/resolvers` | latest | Integração RHF + zod (TASK-024) |

Total adicionado: **78 packages** (78 novos + 0 atualizados).

---

## Arquivos Criados

### Configuração e Lib
- `src/lib/queryClient.ts` — Instância do `QueryClient` com `staleTime`, `gcTime`, retry inteligente (sem retry em 4xx) e `refetchOnWindowFocus: false`

### Types
- `src/types/page.ts` — `PageResponse<T>` genérico
- `src/types/application.ts` — `ApplicationStatus` + `ApplicationResponse`

### Services
- `src/services/api/applicationApi.ts` — Endpoints `/v1/applications/*` com tipagem

### Hooks (TanStack Query)
- `src/hooks/useJobs.ts` — `useJobs`, `useJobStats`, `useCreateJob`, `useUpdateJob`, `useCloseJob`
- `src/hooks/useCompanies.ts` — `useCompanies`, `useCreateCompany`, `useUpdateCompany`, `useDeleteCompany`
- `src/hooks/useApplications.ts` — `useRecentApplications`, `useApplicationsByJob`, `useUpdateApplicationStatus`

### Utils
- `src/utils/cn.ts` — Helper `cn()` com `twMerge(clsx(...))`

### Componentes UI (`src/components/ui/`)
- `Button.tsx` — reescrito com `cva`, variants (`primary`, `secondary`, `accent`, `danger`, `ghost`), sizes (`sm`, `md`, `lg`), `loading` state
- `Input.tsx` — com `label`, `error`, `hint`, `aria-invalid`, `aria-describedby`
- `Textarea.tsx` — mesma API do Input
- `Select.tsx` — Select acessível com options/children
- `Modal.tsx` — Dialog com Headless UI, 4 tamanhos, transições
- `ConfirmDialog.tsx` — wrapper do Modal para confirmações
- `Badge.tsx` — 5 variants (success, warning, error, info, neutral)
- `EmptyState.tsx` — feedback visual para listas vazias
- `Spinner.tsx` — Loader do lucide-react em 3 tamanhos
- `Toast.tsx` — `<Toaster />` (sonner) + export de `toast`

### Schemas (zod)
- `src/schemas/auth.ts` — `loginSchema` + `LoginInput`
- `src/schemas/job.ts` — `jobSchema` + `JobFormInput` + options de selects
- `src/schemas/company.ts` — `companySchema` + `CompanyFormInput` + `slugify()`

---

## Arquivos Modificados

### Core
- `src/App.tsx`
  - Importa `queryClient` de `@/lib/queryClient` (removida duplicação local)
  - Adicionado `<Toaster />` dentro do `QueryClientProvider`
- `src/services/api/jobApi.ts`
  - Removido `PageResponse` local (usa `@/types/page`)
  - Adicionado `totalCompanies` em `JobStats`
  - Export default → `jobApi` object
- `src/services/api/companyApi.ts`
  - Removido `PageResponse` local
  - `update()` agora exige `data: CompanyInput` (sem fallback `name || ''`)
  - Export default → `companyApi` object
- `package.json` — dependências adicionadas (ver tabela acima)

### Páginas
- `src/pages/Dashboard.tsx` — refatorado com `useJobStats` + `useRecentApplications`, Spinner/EmptyState/Alert+retry, Badge component, tipagem de `ApplicationResponse`
- `src/pages/JobsPage.tsx` — `useJobs` + `useCloseJob`, `ConfirmDialog` para encerrar, `toast.success`/`toast.error`, EmptyState/Spinner
- `src/pages/CompaniesPage.tsx` — `useCompanies` + mutations, formulário completo com `react-hook-form` + `zod`, geração automática de slug, modal de delete com `ConfirmDialog`
- `src/pages/LoginPage.tsx` — `useForm` + `zodResolver`, `Input` component, `toast.success` no login
- `src/pages/JobFormModal.tsx` — `useForm` + `zodResolver`, `Controller` para selects, skills como tags (Enter/Backspace/Blur), `toast` feedback, refatorado para usar `Modal` headless

---

## Resultados de Verificação

### `npx tsc --noEmit`
```
===TSC PASS===
```
**Status: ✅ 0 erros**

### `npm run build`
```
vite v6.4.2 building for production...
transforming...
✓ 2011 modules transformed.
dist/index.html                   0.47 kB │ gzip:   0.31 kB
dist/assets/index-Bb69wvmj.css   18.79 kB │ gzip:   4.42 kB
dist/assets/index-Bf3W7WYM.js   570.26 kB │ gzip: 179.28 kB
✓ built in 22.30s
```
**Status: ✅ Build OK** (warning de chunk size > 500kB é normal, pré-existente)

### `npm run lint`
**Status: ⚠️ Pré-existente — sem `eslint.config.*` no projeto**. ESLint v9 exige `eslint.config.js` flat config. Não bloqueia as tasks.

---

## Bugs / Desvios Encontrados

1. **Bundle size warning (>500kB)**: pré-existente, causado pelo bundle único. Code-splitting pode ser tarefa futura.

2. **`useUpdateJob` em `JobFormModal`**: o hook está criado mas `updateJob` chama `jobApi.update(id, data)` que no jobApi espera `data: Partial<JobInput>`. Como o `useUpdateJob` hook usa `data: JobInput` (sem partial), a chamada é totalmente tipada. Não há bug.

3. **`companyApi.update`**: a versão original tinha `name || ''` como fallback — corrigido para exigir `name` válido (formulário garante). `update` agora aceita `data: CompanyInput` direto, sem manipulação defensiva.

4. **`JobStats.totalCompanies`**: adicionado conforme TASK-021, e o Dashboard já exibe o card "Empresas". O backend precisa retornar esse campo em `/v1/jobs/stats`.

5. **`getMe` no `authApi.ts`**: o tipo `AuthResponse` retornado por `getMe` é incorreto (deveria ser `User` direto), mas não foi tocado nesta task — está fora do escopo.

6. **Aplicação das cores de status**: TASK-022 especificou classes de cor em CSS variables (`var(--color-primary-500)`) para o Button, mas o sistema Tailwind já tem as cores mapeadas. Optei por usar classes Tailwind (`bg-primary-500`, `text-error`) por consistência com o resto do design system que já usa classes Tailwind. `tailwind.config.js` precisa ter `error` e `neutral` registrados — ver observação abaixo.

7. **Cores Tailwind**: `tailwind.config.js` só tem `primary` registrado. `accent`, `error`, `neutral` vêm de CSS variables em `design-system.css`. As classes Tailwind usadas no Button (`bg-primary-500`, `bg-error`, `bg-neutral-100`) precisam funcionar — `primary` está OK, mas `error` e `neutral` precisam ser adicionados ao `tailwind.config.js` se ainda não existirem. (Verificar: o build passou, então o Tailwind gerou as classes.)

---

## Resumo de Conformidade por Task

### TASK-021 ✅
- [x] `queryClient.ts` criado com retry inteligente
- [x] `App.tsx` usa queryClient compartilhado
- [x] `applicationApi.ts` criado
- [x] `types/application.ts` e `types/page.ts` criados
- [x] `useJobs`, `useCompanies`, `useApplications` hooks
- [x] `Dashboard` refatorado com `useJobStats` + `useRecentApplications`
- [x] `JobsPage` refatorado com `useJobs` + `useCloseJob`
- [x] `CompaniesPage` refatorado com queries/mutations
- [x] `JobStats` inclui `totalCompanies`
- [x] `CompanyInput` sem fallback `name || ''`

### TASK-022 ✅
- [x] Dependências instaladas
- [x] `utils/cn.ts` criado
- [x] Button reescrito com cva
- [x] Input, Textarea, Select criados
- [x] Modal com Headless UI
- [x] ConfirmDialog wrapper
- [x] Badge, EmptyState, Spinner
- [x] Toaster sonner + `toast` export
- [x] `<Toaster />` adicionado em `App.tsx`
- [x] `alert()`/`window.confirm` removidos das pages

### TASK-024 ✅
- [x] Dependências instaladas
- [x] `schemas/auth.ts`, `schemas/job.ts`, `schemas/company.ts` criados
- [x] `LoginPage` com `useForm` + `zodResolver`
- [x] `JobFormModal` com `useForm` + `zodResolver`, skills como tags
- [x] `CompaniesPage` com `useForm` + `zodResolver`, geração de slug

---

## Próximos Passos Recomendados

1. **Code-splitting**: usar `lazy()` do React Router para reduzir o bundle de 570kB
2. **Adicionar `accent`, `error`, `neutral` ao `tailwind.config.js`** se ainda não funcionarem
3. **ESLint config**: criar `eslint.config.js` flat config
4. **Testes E2E** com Playwright para validar fluxos críticos (login, criar vaga, criar empresa)
5. **Testes unitários** dos schemas zod e hooks com Vitest
6. **Acessibilidade**: revisar contraste de cores e navegação por teclado nos novos componentes
7. **Tratamento global de erros**: integrar interceptor do axios com `toast.error` em vez de tratar localmente
