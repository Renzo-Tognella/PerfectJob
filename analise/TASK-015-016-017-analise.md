# TASK-015, TASK-016, TASK-017 — Análise e Execução Mobile

**Data**: 2026-06-16
**Escopo**: `perfectjob-mobile/` (React Native + Expo)
**Status**: ✅ Concluído — `npx tsc --noEmit` passa com 0 erros

---

## Visão Geral

Três tasks executadas em sequência, todas no app mobile:

| Task | Tema | Arquivos novos | Arquivos alterados |
|------|------|----------------|--------------------|
| TASK-015 | Persistência de Saved Jobs | 3 | 5 |
| TASK-016 | TanStack Query em Applications | 3 | 4 |
| TASK-017 | react-hook-form + zod nos forms | 4 | 3 |

---

## TASK-015 — Persistência de Saved Jobs

### Arquivos criados

1. **`src/types/savedJob.ts`** — Tipo `SavedJobResponse` espelhando o DTO do backend Spring.

2. **`src/services/api/savedJobApi.ts`** — 4 endpoints: `save`, `unsave`, `list`, `check`. Usa `apiClient` já configurado com interceptor de auth.

3. **`src/hooks/useSavedJobs.ts`** — Três hooks reativos:
   - `useSavedJobs` — `useInfiniteQuery` com paginação Spring (campos `number`/`totalPages` no top-level).
   - `useIsJobSaved(jobId)` — `useQuery` com cache por id.
   - `useToggleSavedJob` — `useMutation` com **optimistic update** (onMutate/onError/onSettled) — interface troca instantaneamente, rollback em caso de erro, e invalida queries relacionadas.

### Arquivos alterados

4. **`src/types/page.ts`** — Refatorado para o formato Spring Boot padrão (`number`, `totalPages`, `size`, `pageable` no top-level). O formato antigo (`page.page.number`) era incompatível com o backend real.

5. **`src/hooks/useJobs.ts`** — Atualizado para usar `page.number` / `page.totalPages` (em vez de `page.page.number`), refletindo o novo shape de `PageResponse`.

6. **`src/components/shared/JobCard.tsx`** — Renomeado prop `saved` → `isSaved` (consistência com o resto do app). Ícone trocado de `favorite`/`favorite-border` para `bookmark`/`bookmark-border` (alinhado ao spec). Adicionados `accessibilityRole="button"` e `accessibilityLabel` em ambos os touchables.

7. **`src/screens/saved-jobs/SavedJobsScreen.tsx`** — Reescrito com TanStack Query:
   - Substituído `useState<Job[]>([])` por `useSavedJobs()`.
   - Loading/empty/error states com retry button.
   - Pull-to-refresh (`RefreshControl`).
   - Infinite scroll (`onEndReached` + `fetchNextPage`).
   - `FlatList` com `JobCard` mapeado via `toJob`.
   - Long-press → confirmação → `toggleSaved.mutate({ isSaved: true })`.
   - Botão de bookmark no card também remove.

8. **Callers do `JobCard`** (todos precisaram do novo prop obrigatório `isSaved`):
   - `src/screens/home/HomeScreen.tsx`
   - `src/screens/home/components/FeaturedJobs.tsx`
   - `src/screens/search/components/JobList.tsx`
   - `src/screens/saved-jobs/SavedJobsScreen.tsx`

9. **`src/screens/job-detail/JobDetailScreen.tsx`** — Adicionado botão de bookmark no header (entre back e título). Resolve slug → id via `useEffect` que observa `useJobDetail`:
   ```typescript
   useEffect(() => {
     if (job) setJobId((job as any).originalId ?? Number(job.id))
   }, [job])
   ```
   Hooks `useIsJobSaved` e `useToggleSavedJob` consomem esse id. Alerts informativos após save/unsave.

---

## TASK-016 — TanStack Query em Applications

### Arquivos criados

1. **`src/types/application.ts`** — Tipos `ApplicationResponse`, `SubmitApplicationRequest` e o union literal `ApplicationStatus = 'PENDING' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED' | 'HIRED'`.

2. **`src/hooks/useApplications.ts`** — Dois hooks:
   - `useMyApplications` — `useInfiniteQuery` paginado.
   - `useSubmitApplication` — `useMutation` que invalida `['applications']` em sucesso.

### Arquivos alterados

3. **`src/services/api/applicationApi.ts`** — Removidos os tipos duplicados (agora re-exporta de `@/types/application`). `listMyApplications(page, size)` agora retorna `PageResponse<ApplicationResponse>` em vez de array simples.

4. **`src/services/api/mappers.ts`** — Adicionado `toApplication(response)` que devolve um `ApplicationView` com:
   - `status` (enum)
   - `statusLabel` (PT-BR: "Pendente", "Em análise", "Aceito", "Recusado", "Contratado")
   - `statusBg` / `statusText` (cores semânticas do design system — `warning`, `info`, `success`, `error`)
   - `createdAtLabel` (data formatada em pt-BR)

5. **`src/screens/applications/ApplicationsScreen.tsx`** — Reescrito com TanStack Query:
   - Removido `useState` + `useEffect` + `try/catch`.
   - `useMyApplications()` com `useInfiniteQuery`.
   - Estados: loading (spinner centralizado), error (com retry), empty, e lista.
   - Pull-to-refresh, infinite scroll, footer com ActivityIndicator em `isFetchingNextPage`.
   - Cards mostram badge colorido via `item.statusBg` / `item.statusText`.
   - Tap no card navega para `JobDetail` com `jobSlug` (que é o id string-safe do job).

6. **`src/screens/job-detail/JobDetailScreen.tsx`** — `handleApply` agora usa `useSubmitApplication`:
   - Loading no botão (`ActivityIndicator`) enquanto `submitApplication.isPending`.
   - Alert de sucesso/erro com `extractErrorMessage` (do `apiClient`).
   - Botão desabilitado durante submit.

---

## TASK-017 — Formulários com react-hook-form + zod

### Deps adicionadas em `package.json`

```json
"@hookform/resolvers": "^5.4.0",
"react-hook-form": "^7.79.0",
"zod": "^4.4.3"
```

`npm install` executado com sucesso (14 pacotes adicionados, 1 removido, 1 alterado).

> **Nota**: `@testing-library/react-native` não foi adicionado — não havia `jest-expo` configurado para rodar, e o spec indicava "pode ser skip".

### Arquivos criados

1. **`src/schemas/auth.ts`** — Schemas zod:
   - `loginSchema`: `email` (válido) + `password` (≥ 8 chars).
   - `registerSchema`: adiciona `fullName` (2-255 chars) + `confirmPassword` (com `.refine` para match).
   - Types inferidos: `LoginInput`, `RegisterInput`.

2. **`src/components/ui/Input.tsx`** — Componente genérico `Input` com `forwardRef`. Props: `label`, `error`, `hint`, `required`. Renderiza label com `*` para required, borda vermelha em erro, e mensagem de erro/hint abaixo.

3. **`src/components/ui/FormField.tsx`** — Wrapper sobre `Input` que integra com `Controller` do react-hook-form. Tipo genérico `T extends FieldValues`. Conecta `value`, `onChangeText`, `onBlur` automaticamente e propaga `error` do `fieldState`.

### Arquivos alterados

4. **`src/screens/auth/LoginScreen.tsx`** — Migrado para `useForm<LoginInput>` com `zodResolver(loginSchema)`, modo `onBlur`. `FormField` para email e senha. Botão submit disabled até `isValid`. Senha toggle (mostrar/ocultar) movido para fora do input como um link abaixo dele. Senha e link "Esqueceu a senha?" mantidos.

5. **`src/screens/auth/RegisterScreen.tsx`** — Mesma abordagem com `registerSchema`. Quatro `FormField` (fullName, email, password, confirmPassword). Submit envia apenas `{ fullName, email, password }` (descarta `confirmPassword` — feito via `register` do `useAuth` que já espera `Omit<RegisterData, 'confirmPassword'>`).

6. **`src/design-system/components/Button.tsx`** — Corrigidos os 2 erros TS pré-existentes:
   - **Linha 40**: `isDisabled && styles.disabled` retornava `false` em runtime, incompatível com `ViewStyle[]`. Trocado por `isDisabled ? styles.disabled : null` e tipo da array para `StyleProp<ViewStyle>[]`.
   - **Linha 46**: Mesma lógica para `TextStyle[]` → `StyleProp<TextStyle>[]`.
   - Adicionados imports `StyleProp` (estava faltando).

---

## Resultado de `npx tsc --noEmit`

```
$ npx tsc --noEmit
(sem output)
```

**Zero erros.** Os 2 erros pré-existentes do `Button.tsx` foram corrigidos.

---

## Bugs e Desvios Encontrados

### 1. `InputProps` precisa ser exportado
**Sintoma**: `Module '"./Input"' declares 'InputProps' locally, but it is not exported.`
**Causa**: A spec definia `interface InputProps extends TextInputProps` (sem `export`), mas o `FormField` precisa importar esse tipo.
**Fix**: Trocado `interface InputProps` → `export interface InputProps` em `Input.tsx:11`.

### 2. `colors.error[500]` não existe
**Sintoma**: `Property '500' does not exist on type '{ readonly light: "#FEE2E2"; readonly DEFAULT: "#EF4444"; readonly dark: "#B91C1C"; }'.`
**Causa**: A spec do `Input.tsx` usava `colors.error[500]`, mas o token `error` no design system só tem `light`, `DEFAULT` e `dark` (sem escala numérica).
**Fix**: Trocado `colors.error[500]` → `colors.error.DEFAULT` em 3 ocorrências (Input.tsx:39, 50, 51).

### 3. PageResponse em formato legado
**Sintoma**: O `page.ts` existente usava `{ content, page: { number, totalPages, ... } }`, incompatível com o Spring Boot real.
**Causa**: Formato legado de uma versão anterior.
**Fix**: Reescrito para o shape Spring padrão (`number`, `totalPages`, `pageable`, etc.). `useJobs.ts` foi atualizado para consumir `page.number` / `page.totalPages`.

### 4. `JobCard` callers precisavam da prop `isSaved`
**Sintoma**: TypeScript error TS2741 em 3 arquivos que usavam `<JobCard ...>` sem o prop.
**Causa**: Renomeei `saved` (opcional) → `isSaved` (obrigatório) conforme spec.
**Fix**: Adicionado `isSaved={false}` em `HomeScreen`, `FeaturedJobs`, `JobList` (e `isSaved` + `onToggleSave` em `SavedJobsScreen`).

### 5. `Button.tsx` — `ViewStyle[]` aceita apenas `ViewStyle`
**Sintoma**: `Type 'false | null' is not assignable to type 'ViewStyle'.`
**Causa**: O spec original (`disabled && styles.disabled` ou `disabled ? styles.disabled : null`) gera `false`/`null` no array, mas `ViewStyle[]` é estrito.
**Fix**: Trocado o tipo do array para `StyleProp<ViewStyle>[]` / `StyleProp<TextStyle>[]` (importado de `react-native`). Esse é o tipo correto usado em `style` props do RN.

### 6. Bookmark icon trocado de favorite para bookmark
**Observação**: O `JobCard` original usava `favorite`/`favorite-border` (MaterialIcons). A spec pediu ícone de bookmark. Trocado para `bookmark`/`bookmark-border`. Não foi necessário adicionar nada ao `design-system/icons.ts` — o componente `Icon` aceita `name` direto.

---

## Deps Adicionadas (resumo)

| Pacote | Versão | Motivo |
|--------|--------|--------|
| `react-hook-form` | ^7.79.0 | Gerenciamento de formulários |
| `zod` | ^4.4.3 | Validação de schema (type-safe) |
| `@hookform/resolvers` | ^5.4.0 | Adapter zod → react-hook-form |

---

## Compatibilidade e Padrões

- **SOLID**: `FormField` é aberto a extensão (genérico sobre `T extends FieldValues`). `mappers.ts` separa DTO (`ApplicationResponse`) de view-model (`ApplicationView`).
- **DRY**: `toApplication` centraliza label/cor de status — antes era um dict inline em `ApplicationsScreen`.
- **KISS**: Hooks pequenos e coesos (`useMyApplications`, `useSubmitApplication`, `useToggleSavedJob`).
- **Clean Architecture**: Tipos em `types/`, transport em `services/api/`, view-models em `mappers.ts`, hooks em `hooks/`, telas em `screens/`.
- **TanStack Query**: Cache por queryKey, optimistic updates, invalidação reativa, paginação infinita consistente.
- **Acessibilidade**: `accessibilityRole="button"` e `accessibilityLabel` em todos os CTAs interativos adicionados/modificados.

---

## Não Executado

Conforme orientação do usuário:
- ❌ Nenhum commit.
- ❌ Nenhum PR.
- ❌ Nenhum push.

Nenhuma dependência foi removida.
