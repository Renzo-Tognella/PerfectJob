# TASK-024: Formulários com react-hook-form + zod (Admin)

**Prioridade:** MEDIA
**Estimativa:** 2.5h
**Dependências:** TASK-022
**Status:** Pendente

## Objetivo

Substituir validação manual por react-hook-form + zod em todos os formulários. Adicionar validações robustas. Melhorar UX.

## Escopo

### A. Dependências
**Arquivos:**
- `perfectjob-admin/package.json`

**Ações:**
1. Adicionar:
   - `react-hook-form`
   - `zod`
   - `@hookform/resolvers`
2. `npm install`

### B. Schemas
**Arquivos:**
- `src/schemas/auth.ts` (criar)
- `src/schemas/job.ts` (criar)
- `src/schemas/company.ts` (criar)
- `src/schemas/application.ts` (criar)

**Ações:**
1. Schemas zod para cada entidade
2. Tipos inferidos com `z.infer`

### C. LoginPage
**Arquivos:**
- `src/pages/LoginPage.tsx`

**Ações:**
1. Migrar para react-hook-form
2. Validar email e senha
3. Mostrar erros inline
4. Loading no botão

### D. JobFormModal
**Arquivos:**
- `src/pages/JobFormModal.tsx`

**Ações:**
1. Migrar para react-hook-form
2. Validar:
   - title: 3-255 chars
   - description: 50-5000 chars
   - companyId: positive
   - workModel, experienceLevel, jobType, contractType: enum
   - salaryMin, salaryMax: >= 0 e salaryMax >= salaryMin
   - skills: max 20
   - expiresAt: future
3. Skills como tags (não comma-separated)
4. Adicionar Select para enums (com labels PT-BR)
5. Validação ao submeter, não a cada keystroke (UX)

### E. CompaniesPage Form
**Arquivos:**
- `src/pages/CompaniesPage.tsx`

**Ações:**
1. Migrar para react-hook-form
2. Validar:
   - name: 2-255 chars
   - slug: lowercase, números, hífens
   - website: URL válida
   - foundedYear: 1800-2100
3. Gerar slug automaticamente a partir de name (botão)

### F. Tests
**Arquivos:**
- `src/schemas/*.test.ts` (criar)
- `src/pages/LoginPage.test.tsx` (criar)

## Critérios de Aceite

- [ ] Todos os formulários usam react-hook-form
- [ ] Erros são mostrados inline
- [ ] Validações zod bloqueiam submit
- [ ] Mensagens de erro são claras
- [ ] Skills são tags visuais
- [ ] Enums são Selects (não inputs)
- [ ] Salvar funciona após validação

## Como Testar

### Manual
```bash
# 1. Abrir JobFormModal
# 2. Tentar submeter vazio: deve mostrar todos os erros
# 3. Preencher title com 1 char: erro de tamanho mínimo
# 4. salaryMax < salaryMin: erro de range
# 5. expiresAt no passado: erro de data
# 6. Preencher corretamente: submit funciona
```

### Automatizado
```typescript
test('jobSchema rejects empty title', () => {
  const result = jobSchema.safeParse({ title: '', ... });
  expect(result.success).toBe(false);
});

test('jobSchema rejects salaryMax < salaryMin', () => {
  const result = jobSchema.safeParse({
    title: 'Dev',
    salaryMin: 10000,
    salaryMax: 5000,
    ...
  });
  expect(result.success).toBe(false);
});
```

## Arquivos Criados/Modificados

**Criar:**
- `src/schemas/auth.ts`
- `src/schemas/job.ts`
- `src/schemas/company.ts`
- `src/schemas/application.ts`
- `src/schemas/*.test.ts`

**Modificar:**
- `package.json`
- `src/pages/LoginPage.tsx`
- `src/pages/JobFormModal.tsx`
- `src/pages/CompaniesPage.tsx`
- `src/pages/LoginPage.test.tsx` (criar)
