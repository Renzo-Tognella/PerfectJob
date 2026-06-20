# TASK-018: Componentes UI e Design System (Mobile)

**Prioridade:** 🟡 MÉDIA
**Estimativa:** 2.5h
**Dependências:** TASK-014
**Status:** ⬜ Pendente

## Objetivo

Criar componentes UI reutilizáveis e garantir que telas usem o design system (não estilos inline/hex hardcoded).

## Escopo

### A. Button (já existe, melhorar)
**Arquivos:**
- `perfectjob-mobile/src/design-system/components/Button.tsx`

**Ações:**
1. Manter a API atual (`variant`, `size`, `loading`, `disabled`)
2. Adicionar suporte a `icon` (left/right)
3. Adicionar `accessibilityRole="button"`, `accessibilityLabel`
4. Garantir que `loading` mostra ActivityIndicator
5. Adicionar `fullWidth` prop

### B. Novos Componentes
**Arquivos a criar:**

1. `src/components/ui/Card.tsx`:
```typescript
export function Card({ children, style, onPress, ...props }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.card, style]} {...props}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}
```

2. `src/components/ui/Badge.tsx`:
```typescript
type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export function Badge({ label, variant = 'neutral', style }: BadgeProps) {
  return <View style={[styles.badge, styles[variant], style]}><Text style={styles.text}>{label}</Text></View>;
}
```

3. `src/components/ui/Toast.tsx` (provider + hook):
```typescript
type ToastType = 'success' | 'error' | 'info' | 'warning';

export function ToastProvider({ children }: { children: ReactNode }) { ... }
export function useToast() {
  return { show: (message: string, type?: ToastType) => void };
}
```

4. `src/components/ui/Avatar.tsx`:
```typescript
export function Avatar({ src, name, size = 40 }: AvatarProps) { ... }
```

5. `src/components/ui/EmptyState.tsx`:
```typescript
export function EmptyState({ icon, title, message, action }: EmptyStateProps) { ... }
```

6. `src/components/ui/Loading.tsx`:
```typescript
export function Loading({ size = 'large', message }: LoadingProps) { ... }
```

### C. Substituir Hex Hardcoded
**Arquivos:**
- `perfectjob-mobile/src/screens/job-detail/JobDetailScreen.tsx:262`

**Ações:**
1. Substituir `'#2B5FC2'` por `colors.primary[500]`
2. Auditar todos os outros usos de hex hardcoded
3. Substituir `Alert.alert` por `Toast` em casos não-críticos

### D. Aplicar Componentes
**Arquivos:**
- Todas as telas que ainda não usam `Button` do design system

**Ações:**
1. Refatorar `LoginScreen` para usar `<Button>` do design system
2. Refatorar `RegisterScreen` para usar `<Button>` do design system
3. Refatorar `JobCard` para usar tokens
4. Refatorar `HomeScreen` para usar `<EmptyState>` quando aplicável
5. Refatorar `ApplicationsScreen` para usar `<Badge>` para status

### E. Remover Código Morto
**Arquivos:**
- `perfectjob-mobile/src/components/shared/PlaceholderScreen.tsx` (retorna null)
- `perfectjob-mobile/src/store/useFilterStore.ts` (nunca usado)

**Ações:**
1. Deletar `PlaceholderScreen.tsx`
2. Deletar `useFilterStore.ts` (ou implementar — decidido: deletar)

### F. Testes
**Arquivos:**
- `__tests__/components/Button.test.tsx` (criar)
- `__tests__/components/Badge.test.tsx` (criar)
- `__tests__/components/Card.test.tsx` (criar)

## Critérios de Aceite

- [ ] `<Button>` é usado em todas as telas (substituindo TouchableOpacity)
- [ ] `<Card>` é usado onde aplicável
- [ ] `<Badge>` é usado para status, contadores
- [ ] `<Toast>` substitui `Alert.alert` em mensagens não-críticas
- [ ] `<EmptyState>` é usado em listas vazias
- [ ] Nenhum hex hardcoded no código de produção
- [ ] Componentes têm testes
- [ ] N+1 código morto removido

## Como Testar

### Manual
```bash
# 1. Visual: app deve ter visual consistente (cores via tokens)
# 2. Tocar em "Salvar vaga" deve mostrar toast (não Alert)
# 3. Tela de Applications vazia deve mostrar EmptyState
# 4. Tela de Saved vazia deve mostrar EmptyState
```

### Automatizado
```typescript
test('Button renders title', () => {
  const { getByText } = render(<Button title="Entrar" onPress={() => {}} />);
  expect(getByText('Entrar')).toBeTruthy();
});

test('Button shows loading spinner when loading', () => {
  const { getByRole, queryByText } = render(<Button title="Entrar" loading onPress={() => {}} />);
  expect(getByRole('progressbar')).toBeTruthy();
  expect(queryByText('Entrar')).toBeFalsy();
});
```

## Arquivos Criados/Modificados

**Criar:**
- `src/components/ui/Card.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Toast.tsx`
- `src/components/ui/Avatar.tsx`
- `src/components/ui/EmptyState.tsx`
- `src/components/ui/Loading.tsx`
- `__tests__/components/Button.test.tsx`
- `__tests__/components/Badge.test.tsx`
- `__tests__/components/Card.test.tsx`

**Modificar:**
- `src/design-system/components/Button.tsx` (melhorar)
- `src/screens/auth/LoginScreen.tsx` (usar design system)
- `src/screens/auth/RegisterScreen.tsx` (usar design system)
- `src/screens/job-detail/JobDetailScreen.tsx` (remover hex hardcoded, usar Toast)
- `src/screens/applications/ApplicationsScreen.tsx` (usar Badge, EmptyState)
- `src/screens/saved-jobs/SavedJobsScreen.tsx` (usar EmptyState)
- `src/screens/home/HomeScreen.tsx` (usar design system)
- `src/components/shared/JobCard.tsx` (usar Card, tokens)

**Deletar:**
- `src/components/shared/PlaceholderScreen.tsx`
- `src/store/useFilterStore.ts`

## Notas

- Toast pode usar `react-native-toast-message` lib OU ser custom (decidir)
- Card pode ser apenas View estilizado, sem libs externas
- Acessibilidade: TODO componente interativo deve ter `accessibilityRole` e `accessibilityLabel`
- Para Toast, considerar usar posição top (iOS) e bottom (Android) — nativo sente melhor
