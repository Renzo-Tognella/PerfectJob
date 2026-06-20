# TASK-022: Componentes UI Base (Admin)

**Prioridade:** MEDIA
**Estimativa:** 3h
**Dependências:** TASK-021
**Status:** Pendente

## Objetivo

Criar componentes UI base reutilizáveis no admin. Substituir `alert()`, `window.confirm()`, e botões inline por componentes próprios.

## Escopo

### A. Componentes a Criar
**Arquivos:**

1. `src/components/ui/Button.tsx` (melhorar)
   - Usar `class-variance-authority` (cva) para variants
   - Adicionar `loading` com spinner
   - Adicionar `leftIcon`, `rightIcon`
   - Garantir acessibilidade

2. `src/components/ui/Input.tsx` (criar)
   - Props: `label`, `error`, `hint`, `leftIcon`, `rightIcon`
   - Integrar com `react-hook-form` via `Controller`
   - Acessibilidade

3. `src/components/ui/Textarea.tsx` (criar)
   - Similar a Input, mas multiline

4. `src/components/ui/Select.tsx` (criar)
   - Baseado em Headless UI
   - Props: `options`, `value`, `onChange`, `placeholder`
   - Searchable opcional

5. `src/components/ui/Modal.tsx` (criar)
   - Baseado em Headless UI Dialog
   - Props: `isOpen`, `onClose`, `title`, `size`, `children`
   - Foco trap, ESC para fechar
   - Acessibilidade

6. `src/components/ui/Badge.tsx` (criar)
   - Props: `variant`, `children`
   - Variants: success, warning, error, info, neutral

7. `src/components/ui/Toast.tsx` (criar/usar lib)
   - Usar `sonner` (lib leve e bonita)
   - Helpers: `toast.success`, `toast.error`, `toast.promise`
   - Provider `<Toaster />`

8. `src/components/ui/ConfirmDialog.tsx` (criar)
   - Wrapper de Modal
   - Props: `isOpen`, `onConfirm`, `onCancel`, `title`, `message`, `variant`
   - Substitui `window.confirm`

9. `src/components/ui/Spinner.tsx` (criar)
   - Loading visual

10. `src/components/ui/Card.tsx` (criar)
    - Container estilizado
    - Props: `padding`, `shadow`, `onClick`

11. `src/components/ui/Table.tsx` (criar)
    - Tabela genérica com header, body, row
    - Props: `columns`, `data`, `onRowClick`, `emptyMessage`

12. `src/components/ui/EmptyState.tsx` (criar)
    - Para listas vazias
    - Props: `icon`, `title`, `description`, `action`

### B. Headless UI + clsx
**Arquivos:**
- `perfectjob-admin/package.json`

**Ações:**
1. Adicionar dependências:
   - `@headlessui/react`
   - `class-variance-authority`
   - `clsx`
   - `tailwind-merge`
   - `sonner`
   - `lucide-react` (já tem)
2. `npm install`

### C. cn() helper
**Arquivos:**
- `src/utils/cn.ts` (criar)

**Ações:**
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### D. Substituir alert/confirm
**Arquivos:**
- Todas as páginas

**Ações:**
1. `CompaniesPage` — usar `toast.error` em vez de `alert()`
2. `CompaniesPage` — usar `ConfirmDialog` em vez de `window.confirm` para delete (decidir)
3. `JobsPage` — usar `ConfirmDialog` para "Encerrar vaga" em vez de `window.confirm`
4. `JobFormModal` — usar `toast.error` em vez de `alert()`

### E. Substituir Botões Inline
**Arquivos:**
- Todas as páginas

**Ações:**
1. Substituir `<button className="...">` por `<Button variant="...">`
2. Garantir consistência visual

### F. Tests
**Arquivos:**
- `src/components/ui/Button.test.tsx` (criar)
- `src/components/ui/Input.test.tsx` (criar)
- `src/components/ui/Modal.test.tsx` (criar)

## Critérios de Aceite

- [ ] Todos os componentes UI estão criados
- [ ] `cn()` helper funciona
- [ ] `<Button>` é usado em todas as páginas
- [ ] `<Input>` é usado em todos os formulários
- [ ] `<Modal>` é usado em todos os diálogos
- [ ] `<ConfirmDialog>` substitui `window.confirm`
- [ ] `toast.error` substitui `alert()`
- [ ] Testes de componentes passam

## Como Testar

### Manual
```bash
# 1. Criar vaga → deve mostrar toast de sucesso
# 2. Tentar criar com erro → deve mostrar toast de erro
# 3. Encerrar vaga → deve abrir ConfirmDialog (não window.confirm)
# 4. Visual: todos os botões devem ter visual consistente
# 5. Acessibilidade: navegar com teclado deve funcionar
```

### Automatizado
```typescript
test('Button renders title', () => {
  const { getByText } = render(<Button>Entrar</Button>);
  expect(getByText('Entrar')).toBeInTheDocument();
});

test('Button shows loading state', () => {
  const { getByRole } = render(<Button loading>Entrar</Button>);
  expect(getByRole('status')).toBeInTheDocument();
});

test('Input shows error message', () => {
  const { getByText } = render(<Input error="Campo obrigatório" />);
  expect(getByText('Campo obrigatório')).toBeInTheDocument();
});
```

## Arquivos Criados/Modificados

**Criar:**
- `src/components/ui/Input.tsx`
- `src/components/ui/Textarea.tsx`
- `src/components/ui/Select.tsx`
- `src/components/ui/Modal.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Toast.tsx`
- `src/components/ui/ConfirmDialog.tsx`
- `src/components/ui/Spinner.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Table.tsx`
- `src/components/ui/EmptyState.tsx`
- `src/utils/cn.ts`
- `src/components/ui/*.test.tsx` (testes)

**Modificar:**
- `src/components/ui/Button.tsx` (melhorar com cva)
- `src/pages/Dashboard.tsx` (usar Card, Spinner)
- `src/pages/JobsPage.tsx` (usar Modal, Button, Table, ConfirmDialog)
- `src/pages/CompaniesPage.tsx` (usar Modal, Button, Toast, ConfirmDialog)
- `src/pages/JobFormModal.tsx` (usar Input, Select, Button, Toast)
- `src/pages/LoginPage.tsx` (usar Input, Button, Toast)
- `package.json`

## Notas

- `cva` (class-variance-authority) é o padrão para variants no ecossistema shadcn/ui
- `sonner` é o toast lib mais moderno e leve
- `clsx + tailwind-merge` para merge de classes
- Componentes devem ser agnósticos de dados (não fetch dentro)
- Acessibilidade: Headless UI já resolve (focus trap, ESC, ARIA)
