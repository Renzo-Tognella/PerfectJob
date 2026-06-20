# TASK-017: Formulários com react-hook-form + zod (Mobile)

**Prioridade:** 🟠 ALTA
**Estimativa:** 2.5h
**Dependências:** TASK-014
**Status:** ⬜ Pendente

## Objetivo

Substituir `useState` para campos de formulário por `react-hook-form`. Adicionar validação com `zod`. Melhorar UX (erros inline, loading state).

## Escopo

### A. Dependências
**Arquivos:**
- `perfectjob-mobile/package.json`

**Ações:**
1. Adicionar:
   - `react-hook-form`
   - `zod`
   - `@hookform/resolvers`
   - `@testing-library/react-native` (se não tem)
2. Rodar `npm install`

### B. Schemas
**Arquivos:**
- `perfectjob-mobile/src/schemas/auth.ts` (criar)
- `perfectjob-mobile/src/schemas/job.ts` (criar) — para filtros de busca

**Ações:**
1. Schemas zod:
```typescript
// auth.ts
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Mínimo 2 caracteres').max(255, 'Máximo 255 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
```

### C. Componentes de Form
**Arquivos:**
- `perfectjob-mobile/src/components/ui/Input.tsx` (criar)
- `perfectjob-mobile/src/components/ui/FormField.tsx` (criar)

**Ações:**
1. `Input` — wrapper genérico com label, error, hint:
```typescript
interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(({ label, error, hint, required, ...props }, ref) => (
  <View>
    {label && <Text>{label}{required && ' *'}</Text>}
    <TextInput ref={ref} {...props} accessibilityLabel={label} />
    {error && <Text style={styles.error}>{error}</Text>}
    {hint && !error && <Text style={styles.hint}>{hint}</Text>}
  </View>
));
```

2. `FormField` — wrapper que conecta com Controller:
```typescript
interface FormFieldProps<T> {
  control: Control<T>;
  name: keyof T;
  label?: string;
  required?: boolean;
  // ...
}

export function FormField<T>({ control, name, label, required, ...inputProps }: FormFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name as string}
      render={({ field, fieldState: { error } }) => (
        <Input
          label={label}
          required={required}
          error={error?.message}
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          {...inputProps}
        />
      )}
    />
  );
}
```

### D. LoginScreen
**Arquivos:**
- `perfectjob-mobile/src/screens/auth/LoginScreen.tsx`

**Ações:**
1. Substituir `useState` por `useForm`
2. Usar `zodResolver(loginSchema)`
3. Mostrar erros inline
4. Loading no botão durante submit
5. Submeter via `useLogin()`

### E. RegisterScreen
**Arquivos:**
- `perfectjob-mobile/src/screens/auth/RegisterScreen.tsx`

**Ações:**
1. Mesma migração
2. Garantir que `confirmPassword` é validado
3. Enviar apenas `fullName`, `email`, `password` (não `confirmPassword`)

### F. Tests
**Arquivos:**
- `__tests__/schemas/auth.test.ts` (criar)
- `__tests__/screens/LoginScreen.test.tsx` (criar)

## Critérios de Aceite

- [ ] LoginScreen usa react-hook-form
- [ ] RegisterScreen usa react-hook-form
- [ ] Email inválido mostra erro inline
- [ ] Senha < 8 chars mostra erro inline
- [ ] Senhas diferentes em Register mostram erro
- [ ] Botão fica disabled durante submit
- [ ] Erros são acessíveis (accessibilityLabel inclui erro)
- [ ] Testes de schema passam
- [ ] Testes de componente passam

## Como Testar

### Manual
```bash
# 1. Abrir Login
# 2. Tentar submeter com email vazio → erro inline
# 3. Tentar com email "abc" (sem @) → erro inline
# 4. Tentar com senha "123" → erro inline
# 5. Preencher corretamente → submit funciona
# 6. Abrir Register
# 7. Senhas diferentes → erro
```

### Automatizado
```typescript
test('loginSchema rejects invalid email', () => {
  const result = loginSchema.safeParse({ email: 'invalid', password: '12345678' });
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.errors[0].path).toContain('email');
  }
});

test('registerSchema rejects mismatched passwords', () => {
  const result = registerSchema.safeParse({
    fullName: 'John',
    email: 'john@test.com',
    password: '12345678',
    confirmPassword: '87654321',
  });
  expect(result.success).toBe(false);
});
```

## Arquivos Criados/Modificados

- `package.json` (modificar — adicionar deps)
- `src/schemas/auth.ts` (criar)
- `src/components/ui/Input.tsx` (criar)
- `src/components/ui/FormField.tsx` (criar)
- `src/screens/auth/LoginScreen.tsx` (modificar)
- `src/screens/auth/RegisterScreen.tsx` (modificar)
- `__tests__/schemas/auth.test.ts` (criar)
- `__tests__/screens/LoginScreen.test.tsx` (criar)
- `__tests__/components/Input.test.tsx` (criar)

## Notas

- react-hook-form é performático (menos re-renders que formik)
- zod gera tipos TypeScript automaticamente (`z.infer`)
- Validação no client é UX, no server é segurança (sempre validar nos 2)
- Para checkbox/select, criar wrappers específicos
- Não esquecer `accessibilityLabel` em TODOS os inputs
- Para erros, considerar cor vermelha + ícone de aviso
