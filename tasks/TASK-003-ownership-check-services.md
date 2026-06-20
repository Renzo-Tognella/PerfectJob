# TASK-003: Ownership Check nos Services

**Prioridade:** 🔴 CRÍTICA
**Estimativa:** 2.5h
**Dependências:** TASK-002
**Status:** ⬜ Pendente

## Objetivo

Garantir que RECRUITER só pode editar/deletar recursos da sua própria empresa. ADMIN pode tudo. Implementar verificações de ownership no service layer.

## Escopo

### A. Model
**Arquivos:**
- `model/Company.java`
- `model/Job.java`

**Ações:**
1. Adicionar campo `ownerUserId` em `Company` (Long) — usuário que criou a empresa
2. Criar migration V4 para adicionar coluna `owner_user_id` em `companies`
3. Backfill: para empresas existentes, atribuir `owner_user_id = NULL` (será definido em nova ação)

### B. Migration V4
**Arquivos:**
- `db/migration/V4__add_company_owner.sql` (criar)

**Ações:**
```sql
ALTER TABLE companies ADD COLUMN owner_user_id BIGINT;
ALTER TABLE companies ADD CONSTRAINT fk_company_owner
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX idx_companies_owner ON companies(owner_user_id);
```

### C. DTOs
**Arquivos:**
- `CreateCompanyRequest.java`
- `CompanyResponse.java`

**Ações:**
1. `CompanyResponse` deve expor `ownerUserId` (opcional)
2. `CreateCompanyRequest` não precisa de `ownerUserId` (será setado pelo service com usuário logado)

### D. Services
**Arquivos:**
- `CompanyService.java`
- `JobService.java`
- `ApplicationService.java`
- `NotificationService.java`

**Ações:**
1. **CompanyService**:
   - `create`: recebe `currentUserId`, seta `ownerUserId = currentUserId`
   - `update`: valida `currentUser.role == ADMIN || company.ownerUserId == currentUserId`
   - `delete`: valida `currentUser.role == ADMIN || company.ownerUserId == currentUserId`
   - Criar `AccessDeniedException` customizada (ou usar `org.springframework.security.access.AccessDeniedException`)
2. **JobService**:
   - `create`: valida que `companyId` pertence ao usuário (se não ADMIN)
   - `update`: valida `currentUser.role == ADMIN || job.companyId == currentUser.companyId`
   - `closeJob`: mesma validação
3. **ApplicationService**:
   - `submitApplication`: já requer usuário autenticado
   - `getMyApplications`: já filtra por `candidateId`
   - `getRecentApplications`: requer `RECRUITER` ou `ADMIN`
4. **NotificationService**:
   - `markAsRead`: valida que `notification.userId == currentUserId`

### E. Controller Adjustment
**Arquivos:**
- `controller/v1/CompanyController.java`
- `controller/v1/JobController.java`

**Ações:**
1. Injetar `Authentication` ou `Principal` no método
2. Passar `currentUserId` (e `role`) para o service
3. Criar helper `CurrentUserResolver` para evitar duplicação

### F. Helper
**Arquivos:**
- Novo: `security/CurrentUserResolver.java`

**Ações:**
```java
@Component
public class CurrentUserResolver {
    public CurrentUser resolve(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return new CurrentUser(user.getId(), user.getEmail(), user.getRole());
    }
}
```

## Critérios de Aceite

- [ ] RECRUITER A tenta editar empresa de RECRUITER B → 403
- [ ] ADMIN edita empresa de qualquer um → 200
- [ ] RECRUITER A edita sua própria empresa → 200
- [ ] RECRUITER A cria vaga em empresa de RECRUITER B → 403
- [ ] RECRUITER A cria vaga em sua própria empresa → 200
- [ ] ADMIN cria vaga em qualquer empresa → 200
- [ ] CANDIDATE marca notificação de outro usuário como lida → 403
- [ ] User marca sua própria notificação como lida → 200
- [ ] Migration V4 aplica sem erro
- [ ] Empresas existentes continuam funcionando (ownerUserId = null)

## Como Testar

### Manual
```bash
# 1. Criar 2 recrutadores
# 2. Cada um cria sua empresa
# 3. Recrutador A tenta editar empresa de B (deve falhar)
# 4. Admin (criado via seed) edita qualquer empresa (deve passar)
# 5. Candidato A tenta marcar notificação de B como lida (deve falhar)
```

### Automatizado
- `CompanyServiceOwnershipTest`: 4 cenários (admin, owner, other, no-auth)
- `JobServiceOwnershipTest`: 4 cenários
- `NotificationServiceOwnershipTest`: 2 cenários

## Arquivos Criados/Modificados

- `model/Company.java` (modificar)
- `model/Job.java` (modificar)
- `dto/response/CompanyResponse.java` (modificar)
- `service/CompanyService.java` (modificar)
- `service/JobService.java` (modificar)
- `service/ApplicationService.java` (modificar)
- `service/NotificationService.java` (modificar)
- `controller/v1/CompanyController.java` (modificar)
- `controller/v1/JobController.java` (modificar)
- `controller/v1/ApplicationController.java` (modificar)
- `controller/v1/NotificationController.java` (modificar)
- `security/CurrentUserResolver.java` (criar)
- `db/migration/V4__add_company_owner.sql` (criar)
- `test/service/CompanyServiceOwnershipTest.java` (criar)
- `test/service/JobServiceOwnershipTest.java` (criar)
- `test/service/NotificationServiceOwnershipTest.java` (criar)

## Notas

- Não quebrar a API existente — adicionar `ownerUserId` como opcional
- Empresas sem `ownerUserId` (legado) só podem ser editadas por ADMIN
- Para testes, criar 2-3 usuários com diferentes roles via `@WithMockUser` ou programaticamente
