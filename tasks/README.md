# Plano de Tasks — Integração e Qualidade PerfectJob

> 26 tasks organizadas em 7 fases para corrigir todos os problemas de integração entre admin, app e api, com testes unitários e manuais.

## Legenda de Prioridade

- 🔴 **CRÍTICA**: bloqueia funcionamento ou tem impacto de segurança
- 🟠 **ALTA**: afeta UX, performance ou manutenibilidade
- 🟡 **MÉDIA**: melhoria de qualidade, dívida técnica
- 🟢 **BAIXA**: nice-to-have, polish

## Fases

### Fase 0 — Setup e Auditoria (1 task)
- [TASK-000](./TASK-000-audit-e-preparacao.md): Auditoria completa + setup de ambiente

### Fase 1 — Backend: Segurança e Autorização (5 tasks)
- [TASK-001](./TASK-001-env-vars-e-secret-management.md): Env vars + secret management
- [TASK-002](./TASK-002-rbac-endpoints-mutantes.md): RBAC em endpoints mutantes
- [TASK-003](./TASK-003-ownership-check-services.md): Ownership check nos services
- [TASK-004](./TASK-004-cors-restrito-e-jwt-validation.md): CORS restrito + JWT validation
- [TASK-005](./TASK-005-testes-backend-java-21.md): Compatibilidade Java 21 nos testes

### Fase 2 — Backend: Performance e Qualidade (4 tasks)
- [TASK-006](./TASK-006-n-plus-1-fix.md): Eliminar N+1 queries
- [TASK-007](./TASK-007-cache-efetivo-redis.md): Cache efetivo com Redis
- [TASK-008](./TASK-008-padronizar-paginacao.md): Padronizar contrato de paginação
- [TASK-009](./TASK-009-validacoes-dto.md): Validações Bean Validation completas

### Fase 3 — Backend: Lógica de Negócio (3 tasks)
- [TASK-010](./TASK-010-fix-bug-notifications.md): Corrigir bug NotificationService
- [TASK-011](./TASK-011-stats-correta-e-fk-notifications.md): Stats real + FK notifications
- [TASK-012](./TASK-012-novos-endpoints.md): Endpoints de candidatura e saved jobs

### Fase 4 — Mobile: Auth e Configuração (3 tasks)
- [TASK-013](./TASK-013-env-vars-mobile.md): Env vars no mobile
- [TASK-014](./TASK-014-auth-gate-mobile.md): Auth gate + hidratação
- [TASK-015](./TASK-015-mobile-persistencia-saved-jobs.md): Persistência de saved jobs

### Fase 5 — Mobile: Qualidade (3 tasks)
- [TASK-016](./TASK-016-tanstack-query-applications.md): TanStack Query em applications
- [TASK-017](./TASK-017-formularios-rhf-zod.md): Formulários com react-hook-form + zod
- [TASK-018](./TASK-018-componentes-ui-e-design-system.md): Componentes do design system

### Fase 6 — Admin: Auth e Configuração (3 tasks)
- [TASK-019](./TASK-019-env-vars-admin.md): Env vars no admin
- [TASK-020](./TASK-020-auth-refactor-admin.md): Refatorar auth admin
- [TASK-021](./TASK-021-tanstack-query-admin.md): TanStack Query em todo o admin

### Fase 7 — Admin: Componentes e UX (4 tasks)
- [TASK-022](./TASK-022-componentes-ui-base.md): Componentes UI base (Modal, Input, Toast)
- [TASK-023](./TASK-023-rotas-funcionais-e-layout.md): Rotas funcionais + layout responsivo
- [TASK-024](./TASK-024-formularios-rhf-zod-admin.md): Formulários admin com validação
- [TASK-025](./TASK-025-error-boundary-e-404.md): ErrorBoundary + 404

### Fase 8 — Final (1 task)
- [TASK-026](./TASK-026-teste-integrado-end-to-end.md): Teste integrado E2E

## Status

| Status | Significado |
|---|---|
| ⬜ Pendente | Não iniciada |
| 🟡 Em progresso | Em execução |
| ✅ Concluída | Finalizada com testes passando |
| ⚠️ Bloqueada | Aguardando resolução |
