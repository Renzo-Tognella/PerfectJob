# TASK-011: Stats Corretas e FK Notifications

**Prioridade:** 🟠 ALTA
**Estimativa:** 1.5h
**Dependências:** TASK-007, TASK-010
**Status:** ⬜ Pendente

## Objetivo

Adicionar FK em `notifications.user_id` → `users.id` e implementar stats reais (não hardcoded).

## Escopo

### A. Migration V5
**Arquivos:**
- `db/migration/V5__add_notifications_fk.sql` (criar)

**Ações:**
```sql
-- Adicionar FK (apenas se não existir)
ALTER TABLE notifications
  ADD CONSTRAINT fk_notifications_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Índice para queries por user_id + created_at
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications(user_id, created_at DESC);

-- Backfill de notifications órfãs (sem user_id válido) — deletar
DELETE FROM notifications
WHERE user_id NOT IN (SELECT id FROM users);
```

### B. Stats
**Arquivos:**
- `service/JobService.java` (criar método `getStats`)
- `controller/v1/JobController.java` (já existe `stats`)
- `dto/response/JobStatsResponse.java` (criar)
- `repository/JobRepository.java` (adicionar queries)
- `repository/ApplicationRepository.java` (adicionar queries)

**Ações:**
1. Criar `JobStatsResponse` record:
```java
public record JobStatsResponse(
    long activeJobs,
    long totalApplications,
    long applicationsToday,
    long totalCompanies
) {}
```

2. `JobRepository.countByStatus(JobStatus status)`:
```java
@Query("SELECT COUNT(j) FROM Job j WHERE j.status = :status")
long countByStatus(@Param("status") JobStatus status);
```

3. `ApplicationRepository.countByCreatedAtAfter(LocalDateTime date)`:
```java
@Query("SELECT COUNT(a) FROM Application a WHERE a.createdAt >= :date")
long countByCreatedAtAfter(@Param("date") LocalDateTime date);
```

4. `CompanyRepository.count()` (já existe via JpaRepository)

5. `JobService.getStats()`:
```java
@Transactional(readOnly = true)
@Cacheable(value = "stats", key = "'global'")
public JobStatsResponse getStats() {
    LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
    return new JobStatsResponse(
        jobRepository.countByStatus(JobStatus.ACTIVE),
        applicationRepository.count(),
        applicationRepository.countByCreatedAtAfter(startOfDay),
        companyRepository.count()
    );
}
```

6. Atualizar `JobController.stats` para usar o DTO:
```java
@GetMapping("/stats")
public ResponseEntity<JobStatsResponse> stats() {
    return ResponseEntity.ok(jobService.getStats());
}
```

### C. Admin Dashboard
**Arquivos:**
- `perfectjob-admin/src/pages/Dashboard.tsx`
- `perfectjob-admin/src/services/api/jobApi.ts`

**Ações:**
1. Atualizar tipo `JobStats` para match com novo DTO (incluir `totalCompanies`)
2. Remover hardcoded `0L` para `applicationsToday`
3. Garantir que `Promise.all` trata erros individuais (uma falha não derruba todas)

### D. Testes
**Arquivos:**
- `test/service/JobServiceStatsTest.java` (criar)
- `test/repository/ApplicationRepositoryTest.java` (criar)

**Ações:**
1. Validar que `getStats` retorna números corretos
2. Validar que `applicationsToday` filtra por data
3. Validar que `countByStatus` funciona para cada status

## Critérios de Aceite

- [ ] FK `notifications.user_id` → `users.id` existe
- [ ] `ON DELETE CASCADE` funciona (deletar user deleta notifications)
- [ ] `GET /v1/jobs/stats` retorna dados reais
- [ ] `applicationsToday` reflete candidaturas do dia
- [ ] Admin dashboard mostra stats reais (não zeros)
- [ ] Migration V5 aplica sem erro
- [ ] Testes de stats passam

## Como Testar

### Manual
```bash
# 1. Verificar FK
docker exec perfectjob-postgres psql -U perfectjob -d perfectjob \
  -c "\d notifications"
# Deve mostrar: Foreign-key constraints: "fk_notifications_user" FOREIGN KEY (user_id) REFERENCES users(id)

# 2. Verificar stats
curl -s "http://localhost:8080/api/v1/jobs/stats" | jq
# Deve mostrar números reais, não zeros

# 3. Verificar que admin dashboard mostra stats corretos
# (abrir http://localhost:5173, fazer login, ir para Dashboard)
```

### Automatizado
```java
@Test
void getStats_returnsCorrectCounts() {
    // Arrange: 5 active jobs, 10 total applications, 3 today
    when(jobRepository.countByStatus(JobStatus.ACTIVE)).thenReturn(5L);
    when(applicationRepository.count()).thenReturn(10L);
    when(applicationRepository.countByCreatedAtAfter(any())).thenReturn(3L);
    when(companyRepository.count()).thenReturn(2L);
    
    // Act
    JobStatsResponse stats = jobService.getStats();
    
    // Assert
    assertThat(stats.activeJobs()).isEqualTo(5);
    assertThat(stats.totalApplications()).isEqualTo(10);
    assertThat(stats.applicationsToday()).isEqualTo(3);
    assertThat(stats.totalCompanies()).isEqualTo(2);
}
```

## Arquivos Criados/Modificados

- `db/migration/V5__add_notifications_fk.sql` (criar)
- `dto/response/JobStatsResponse.java` (criar)
- `service/JobService.java` (modificar)
- `controller/v1/JobController.java` (modificar)
- `repository/JobRepository.java` (modificar)
- `repository/ApplicationRepository.java` (modificar)
- `perfectjob-admin/src/services/api/jobApi.ts` (modificar)
- `perfectjob-admin/src/pages/Dashboard.tsx` (modificar)
- `test/service/JobServiceStatsTest.java` (criar)
- `test/repository/ApplicationRepositoryTest.java` (criar)

## Notas

- Cache de stats deve ter TTL curto (1 min) — dados mudam frequentemente
- Considerar invalidar cache de stats quando uma application é criada
- `count()` do Spring Data é mais performático que `findAll().size()`
- Para stats históricas (últimos 7 dias, etc), criar endpoints separados no futuro
