# TASK-023: Rotas Funcionais e Layout Responsivo

**Prioridade:** MEDIA
**Estimativa:** 2.5h
**Dependências:** TASK-021
**Status:** Pendente

## Objetivo

Corrigir rotas quebradas no menu lateral. Implementar página de Candidaturas (admin pode ver candidatos das suas vagas). Adicionar responsividade (sidebar colapsável em mobile).

## Escopo

### A. Novas Rotas
**Arquivos:**
- `perfectjob-admin/src/App.tsx`
- `perfectjob-admin/src/pages/ApplicationsPage.tsx` (criar)
- `perfectjob-admin/src/pages/SettingsPage.tsx` (criar — opcional, decidir)

**Ações:**
1. Adicionar rota `/applications` → `ApplicationsPage`
2. Adicionar rota `/settings` → `SettingsPage` (ou remover do menu)
3. Adicionar rota `*` → `NotFoundPage` (404 customizada)

### B. ApplicationsPage
**Arquivos:**
- `perfectjob-admin/src/pages/ApplicationsPage.tsx` (criar)

**Ações:**
1. Tabela com candidaturas do recrutador
2. Filtros por status, vaga, data
3. Ações: ver detalhes, mudar status
4. Modal de mudança de status

### C. NotFoundPage
**Arquivos:**
- `perfectjob-admin/src/pages/NotFoundPage.tsx` (criar)

**Ações:**
1. Layout simples
2. Mensagem amigável
3. Link para voltar ao Dashboard

### D. Layout Responsivo
**Arquivos:**
- `perfectjob-admin/src/components/Layout.tsx`

**Ações:**
1. Sidebar colapsável em mobile (hamburguer menu)
2. Overlay quando aberto em mobile
3. Fechar sidebar ao navegar em mobile
4. Breakpoint: 768px (md)

### E. Header de Perfil
**Arquivos:**
- `perfectjob-admin/src/components/Layout.tsx`

**Ações:**
1. Mostrar nome do usuário
2. Mostrar role (badge)
3. Avatar (placeholder)
4. Dropdown com "Sair" e "Perfil"

### F. Menu Items
**Arquivos:**
- `perfectjob-admin/src/components/Layout.tsx`

**Ações:**
1. Manter: Dashboard, Vagas, Empresas, Candidaturas
2. Remover: Configurações (ou criar SettingsPage)
3. Adicionar icon para cada item (já tem lucide)

## Critérios de Aceite

- [ ] `/applications` existe e renderiza lista de candidaturas
- [ ] `/settings` renderiza SettingsPage (ou link removido)
- [ ] `/rota-inexistente` renderiza NotFoundPage
- [ ] Em mobile, sidebar vira hamburguer
- [ ] Sidebar fecha ao navegar em mobile
- [ ] Header mostra nome e role do user
- [ ] Dropdown de "Sair" funciona

## Como Testar

### Manual
```bash
# 1. Clicar em "Candidaturas" no menu: deve abrir ApplicationsPage
# 2. Clicar em "Configurações": deve abrir SettingsPage (ou nada)
# 3. Acessar /rota-qualquer: deve mostrar 404
# 4. Em mobile (< 768px): sidebar deve estar oculta por padrão
# 5. Em mobile, abrir sidebar: deve aparecer overlay
# 6. Em mobile, navegar: sidebar deve fechar
```

## Arquivos Criados/Modificados

**Criar:**
- `src/pages/ApplicationsPage.tsx`
- `src/pages/SettingsPage.tsx` (opcional)
- `src/pages/NotFoundPage.tsx`
- `src/hooks/useMediaQuery.ts` (helper)

**Modificar:**
- `src/App.tsx` (adicionar rotas)
- `src/components/Layout.tsx` (responsivo, header de perfil)
