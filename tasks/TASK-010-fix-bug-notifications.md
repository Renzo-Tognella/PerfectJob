# TASK-010: Corrigir Bug do NotificationService

**Prioridade:** 🔴 CRÍTICA
**Estimativa:** 1.5h
**Dependências:** TASK-003
**Status:** ⬜ Pendente

## Objetivo

Corrigir o bug onde `NotificationService` salva `companyId` como `userId` da notificação. Garantir que notificação vai para o dono da empresa.

## Escopo

### A. Investigar
**Arquivos:**
- `service/NotificationService.java`
- `service/ApplicationService.java`
- `event/ApplicationSubmittedEvent.java`

**Ações:**
1. Confirmar bug: `NotificationService.onApplicationSubmitted` usa `job.getCompanyId()` como `userId`
2. Resultado: notificação vai para o ID da empresa (que é diferente do user_id)
3. Causa: Company não tem `ownerUserId` (será adicionado em TASK-003)

### B. Aplicar Correção
**Arquivos:**
- `service/ApplicationService.java`
- `event/ApplicationSubmittedEvent.java`
- `service/NotificationService.java`

**Ações:**
1. **ApplicationService**:
   - No método `submitApplication`, após criar application, buscar `Company` para obter `ownerUserId`
   - Criar evento `ApplicationSubmittedEvent` com `companyOwnerUserId` (não `companyId`)

2. **ApplicationSubmittedEvent**:
   - Adicionar campo `companyOwnerUserId: Long`
   - Manter `companyId` para contexto (se necessário)

3. **NotificationService**:
   - `onApplicationSubmitted` usa `event.getCompanyOwnerUserId()` em vez de `job.getCompanyId()`
   - Se `ownerUserId` for null (empresa legada), criar notificação para todos os ADMINs OU não criar notificação (decidir)

### C. Decisão sobre Empresas Legadas
**Opção A**: Não criar notificação (silencioso — recrutador não fica sabendo)
**Opção B**: Notificar todos os ADMINs (centralizado)
**Opção C**: Adicionar tela admin para "assumir" empresa legada

**Escolha**: Opção A (não criar) + log de aviso. Migração para atribuir owner em massa é trabalho futuro.

### D. Notificação para o Candidato
**Adicional**: Além de notificar o recrutador, também notificar o candidato que a candidatura foi enviada.

**Arquivos:**
- `service/ApplicationService.java`
- `service/NotificationService.java`

**Ações:**
1. Após criar application, criar notificação para o candidato também
2. Tipo: "APPLICATION_SUBMITTED", mensagem: "Sua candidatura para {jobTitle} foi enviada"

### E. Testes
**Arquivos:**
- `test/service/NotificationServiceTest.java` (criar/atualizar)

**Ações:**
1. Testar que `onApplicationSubmitted` cria notificação para `ownerUserId` correto
2. Testar que NÃO cria notificação para `companyId` (regressão)
3. Testar com empresa sem `ownerUserId` (deve pular e logar)
4. Testar que candidato também recebe notificação

## Critérios de Aceite

- [ ] Notificação de "nova candidatura" vai para o `ownerUserId` da empresa (não `companyId`)
- [ ] Candidato recebe notificação de "candidatura enviada"
- [ ] Empresa sem `ownerUserId` não gera notificação para o dono (log de aviso)
- [ ] Teste de regressão passa: notificação NÃO vai para `companyId`
- [ ] Teste novo: notificação VAI para `ownerUserId`
- [ ] Logs estruturados

## Como Testar

### Manual
```bash
# 1. Setup: admin cria recrutador R1
# 2. R1 cria empresa E1 (ownerUserId = R1.id)
# 3. R1 cria vaga J1 em E1
# 4. Candidato C1 se candidata a J1
# 5. Verificar banco:
docker exec perfectjob-postgres psql -U perfectjob -d perfectjob \
  -c "SELECT id, user_id, title, type FROM notifications ORDER BY created_at DESC LIMIT 5;"
# Deve haver 2 notificações:
# - user_id = R1.id, title = "Nova candidatura", type = "APPLICATION_RECEIVED"
# - user_id = C1.id, title = "Candidatura enviada", type = "APPLICATION_SUBMITTED"
```

### Automatizado
```java
@Test
void onApplicationSubmitted_createsNotificationForCompanyOwner() {
    // Arrange
    Long companyId = 1L;
    Long ownerUserId = 99L;  // DIFFERENT from companyId
    Company company = new Company();
    company.setId(companyId);
    company.setOwnerUserId(ownerUserId);
    
    ApplicationSubmittedEvent event = new ApplicationSubmittedEvent(
        applicationId, jobId, candidateId, companyId, ownerUserId, "Dev Java"
    );
    
    // Act
    notificationService.onApplicationSubmitted(event);
    
    // Assert
    ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
    verify(notificationRepository).save(captor.capture());
    assertThat(captor.getValue().getUserId()).isEqualTo(ownerUserId);
    assertThat(captor.getValue().getUserId()).isNotEqualTo(companyId);
}
```

## Arquivos Criados/Modificados

- `service/ApplicationService.java` (modificar)
- `service/NotificationService.java` (modificar)
- `event/ApplicationSubmittedEvent.java` (modificar)
- `test/service/NotificationServiceTest.java` (criar/atualizar)

## Notas

- Esta task depende de TASK-003 (que adiciona `ownerUserId` em Company)
- A solução real seria notificar via WebSocket/SSE, mas isso está fora do escopo
- Notificações são armazenadas em `notifications` table — candidato pode listar via `GET /v1/notifications`
- Garantir que a notificação é criada DENTRO da mesma transação da application (ou usar evento transacional)
