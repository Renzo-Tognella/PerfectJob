# TASK-020: Refatorar Auth do Admin

**Prioridade:** CRÍTICA
**Estimativa:** 3h
**Dependências:** TASK-019
**Status:** Pendente

## Objetivo

Eliminar dupla persistência de token. Validar expiração. Corrigir ProtectedRoute (sem reload, sem race condition). Implementar redirect via React Router (não window.location).

## Escopo

### A. Store Unificado
**Arquivos:**
- `perfectjob-admin/src/store/useAuthStore.ts`

**Ações:**
1. Remover `localStorage.setItem('token', token)` em `setAuth` (deixar só o `persist` do Zustand)
2. Adicionar função utilitária para decodificar JWT
3. Modificar `setAuth` para validar expiração
4. Garantir que `partialize` salva só `token` e `user`
5. Adicionar `hasPermission(role)` helper

### B. Migration Helper
**Arquivos:**
- `perfectjob-admin/src/store/useAuthStore.ts`

**Ações:**
1. Detectar token antigo em `localStorage.getItem('token')`
2. Migrar para o formato novo (zustand persist)
3. Limpar chave antiga

### C. ProtectedRoute Corrigido
**Arquivos:**
- `perfectjob-admin/src/App.tsx`

**Ações:**
1. Remover `useEffect` com `loadToken` (race condition)
2. Usar apenas `useAuthStore(s => s.isAuthenticated)`
3. Renderizar `Navigate` quando deslogado
4. Passar `state.from` no location state

### D. Auth Initializer
**Arquivos:**
- `perfectjob-admin/src/main.tsx`

**Ações:**
1. Chamar `migrateLegacyToken()` no boot
2. Mostrar splash/loading se necessário

### E. 401 Handler via React Router
**Arquivos:**
- `perfectjob-admin/src/services/api/client.ts`
- `perfectjob-admin/src/lib/navigationRef.ts` (criar)
- `perfectjob-admin/src/App.tsx`

**Ações:**
1. Criar `navigationRef` para navegação fora de componentes
2. Substituir `window.location.href = '/login'` por `navigateRef('/login')`
3. Não força reload

### F. LoginPage
**Arquivos:**
- `perfectjob-admin/src/pages/LoginPage.tsx`

**Ações:**
1. Tratar `state.from` para voltar para a rota original
2. Mostrar mensagem do backend em caso de erro (não hardcoded)
3. Loading no botão durante submit

## Critérios de Aceite

- [ ] `localStorage` tem apenas 1 chave de token (`auth-storage`)
- [ ] Token expirado não autentica o user
- [ ] 401 redireciona para `/login` sem reload completo
- [ ] Após login, volta para a rota original (não sempre `/`)
- [ ] Não há race condition no boot
- [ ] Erro do backend é mostrado ao user

## Como Testar

### Manual
```bash
# 1. Login
# 2. Verificar localStorage: deve ter 1 chave "auth-storage", não "token"
# 3. Expirar token (manualmente, editando localStorage)
# 4. Refresh: deve ir para /login
# 5. Tentar acessar rota protegida deslogado: deve redirecionar (não reload)
# 6. Login com erro: deve mostrar mensagem do backend
```

### Automatizado
- Teste de store: token expirado não autentica
- Teste de store: persistência única
- Teste de ProtectedRoute: redireciona sem auth

## Arquivos Criados/Modificados

- `src/store/useAuthStore.ts` (modificar)
- `src/lib/navigationRef.ts` (criar)
- `src/services/api/client.ts` (modificar)
- `src/App.tsx` (modificar)
- `src/main.tsx` (modificar)
- `src/pages/LoginPage.tsx` (modificar)
- `src/store/useAuthStore.test.ts` (criar)
- `src/App.test.tsx` (criar)
