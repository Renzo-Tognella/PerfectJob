# TASK-012: Novos Endpoints (Saved Jobs e Status Update)

**Prioridade:** 🟠 ALTA
**Estimativa:** 3h
**Dependências:** TASK-003, TASK-006
**Status:** ⬜ Pendente

## Objetivo

Adicionar endpoints faltantes: gestão de status de candidatura, favoritos (saved jobs), e listagem de candidatos por vaga.

## Escopo

### A. Saved Jobs (Favoritos)
**Arquivos:**
- `model/SavedJob.java` (criar — já existe tabela `saved_jobs` em V1)
- `repository/SavedJobRepository.java` (criar)
- `dto/request/SaveJobRequest.java` (criar)
- `dto/response/SavedJobResponse.java` (criar)
- `service/SavedJobService.java` (criar)
- `controller/v1/SavedJobController.java` (criar)

**Ações:**
1. Verificar/criar entity `SavedJob`:
   - `id`, `userId`, `jobId`, `createdAt`
   - Constraint UNIQUE em `(userId, jobId)`

2. Repository:
   - `findByUserId(Long userId, Pageable pageable)` → `Page<SavedJob>`
   - `existsByUserIdAndJobId(Long userId, Long jobId)` → `boolean`
   - `deleteByUserIdAndJobId(Long userId, Long jobId)`

3. Service:
   - `saveJob(Long userId, Long jobId)` — idempotente
   - `unsaveJob(Long userId, Long jobId)`
   - `getMySavedJobs(Long userId, Pageable pageable)` → `Page<JobResponse>` (com JOIN para Job)
   - `isSaved(Long userId, Long jobId)` → boolean (para o mobile saber se coração está preenchido)

4. Controller:
```java
@RestController
@RequestMapping("/v1/saved-jobs")
public class SavedJobController {
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SavedJobResponse> save(@Valid @RequestBody SaveJobRequest request) { ... }
    
    @DeleteMapping("/{jobId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> unsave(@PathVariable Long jobId) { ... }
    
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<JobResponse>> list(Pageable pageable) { ... }
    
    @GetMapping("/{jobId}/check")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Boolean>> check(@PathVariable Long jobId) { ... }
}
```

### B. Application Status Update
**Arquivos:**
- `dto/request/UpdateApplicationStatusRequest.java` (criar)
- `service/ApplicationService.java` (modificar)
- `controller/v1/ApplicationController.java` (modificar)

**Ações:**
1. Criar DTO:
```java
public record UpdateApplicationStatusRequest(
    @NotNull ApplicationStatus status
) {}
```

2. Criar enum `ApplicationStatus` (se não existir):
   - `PENDING`, `REVIEWING`, `ACCEPTED`, `REJECTED`, `HIRED`

3. Service:
```java
@Transactional
public ApplicationResponse updateStatus(Long applicationId, ApplicationStatus newStatus, UserPrincipal currentUser) {
    Application app = applicationRepository.findById(applicationId)
        .orElseThrow(() -> new ResourceNotFoundException("Application", "id", applicationId));
    
    // Ownership check: recrutador da empresa ou admin
    Job job = jobRepository.findById(app.getJobId())
        .orElseThrow(() -> new ResourceNotFoundException("Job", "id", app.getJobId()));
    Company company = companyRepository.findById(job.getCompanyId())
        .orElseThrow(() -> new ResourceNotFoundException("Company", "id", job.getCompanyId()));
    
    if (!currentUser.getRole().equals(Role.ADMIN) 
        && !company.getOwnerUserId().equals(currentUser.getId())) {
        throw new AccessDeniedException("You don't own this job's applications");
    }
    
    app.setStatus(newStatus.name());
    return ApplicationMapper.toResponse(applicationRepository.save(app), job, company, /*candidate*/);
}
```

4. Controller:
```java
@PatchMapping("/{id}/status")
@PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")
public ResponseEntity<ApplicationResponse> updateStatus(
    @PathVariable Long id, 
    @Valid @RequestBody UpdateApplicationStatusRequest request
) { ... }
```

5. **Notificação ao candidato**: quando status muda, criar notificação para o candidato:
```java
notificationService.notifyApplicationStatusChange(candidateId, jobTitle, newStatus);
```

### C. Listagem de Candidatos por Vaga
**Arquivos:**
- `repository/ApplicationRepository.java` (modificar)
- `service/ApplicationService.java` (modificar)
- `controller/v1/ApplicationController.java` (modificar)

**Ações:**
1. Repository:
```java
Page<Application> findByJobId(Long jobId, Pageable pageable);
```

2. Service:
```java
public Page<ApplicationResponse> getApplicationsByJob(Long jobId, Pageable pageable, UserPrincipal currentUser) {
    // ownership check (mesmo do updateStatus)
    // ...
    return applicationRepository.findByJobId(jobId, pageable)
        .map(app -> /* ... */);
}
```

3. Controller:
```java
@GetMapping("/job/{jobId}")
@PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")
public ResponseEntity<Page<ApplicationResponse>> byJob(
    @PathVariable Long jobId, 
    Pageable pageable
) { ... }
```

### D. Testes
**Arquivos:**
- `test/service/SavedJobServiceTest.java` (criar)
- `test/service/ApplicationStatusUpdateTest.java` (criar)
- `test/controller/SavedJobControllerTest.java` (criar)
- `test/controller/ApplicationStatusControllerTest.java` (criar)

## Critérios de Aceite

- [ ] `POST /v1/saved-jobs` salva vaga para o usuário autenticado
- [ ] `GET /v1/saved-jobs` lista vagas salvas do usuário
- [ ] `DELETE /v1/saved-jobs/{jobId}` remove dos salvos
- [ ] `GET /v1/saved-jobs/{jobId}/check` retorna `{saved: true|false}`
- [ ] `PATCH /v1/applications/{id}/status` atualiza status (apenas owner ou admin)
- [ ] `GET /v1/applications/job/{jobId}` lista candidatos da vaga (apenas owner ou admin)
- [ ] Mudança de status gera notificação para o candidato
- [ ] Testes de permissão passam

## Como Testar

### Manual
```bash
# 1. Salvar vaga
curl -X POST http://localhost:8080/api/v1/saved-jobs \
  -H "Authorization: Bearer $TOKEN_CAND" \
  -H "Content-Type: application/json" \
  -d '{"jobId": 1}'

# 2. Listar salvos
curl -s "http://localhost:8080/api/v1/saved-jobs" \
  -H "Authorization: Bearer $TOKEN_CAND" | jq '.content[].title'

# 3. Atualizar status (como recrutador)
curl -X PATCH "http://localhost:8080/api/v1/applications/1/status" \
  -H "Authorization: Bearer $TOKEN_RECRUITER" \
  -H "Content-Type: application/json" \
  -d '{"status": "ACCEPTED"}'

# 4. Verificar notificação do candidato
docker exec perfectjob-postgres psql -U perfectjob -d perfectjob \
  -c "SELECT user_id, title, type FROM notifications WHERE type = 'APPLICATION_STATUS_CHANGED';"
```

### Automatizado
```java
@Test
void updateStatus_asJobOwner_updatesAndNotifies() {
    // Arrange
    Long applicationId = 1L;
    UserPrincipal owner = new UserPrincipal(99L, "owner@test", Role.RECRUITER);
    when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(application));
    when(jobRepository.findById(any())).thenReturn(Optional.of(job));
    when(companyRepository.findById(any())).thenReturn(Optional.of(companyWithOwner99));
    
    // Act
    applicationService.updateStatus(applicationId, ApplicationStatus.ACCEPTED, owner);
    
    // Assert
    assertThat(application.getStatus()).isEqualTo("ACCEPTED");
    verify(notificationService).notifyApplicationStatusChange(any(), any(), eq(ApplicationStatus.ACCEPTED));
}

@Test
void updateStatus_asDifferentRecruiter_throwsAccessDenied() {
    UserPrincipal otherRecruiter = new UserPrincipal(100L, "other@test", Role.RECRUITER);
    
    assertThatThrownBy(() -> applicationService.updateStatus(applicationId, ApplicationStatus.ACCEPTED, otherRecruiter))
        .isInstanceOf(AccessDeniedException.class);
}
```

## Arquivos Criados/Modificados

**Backend:**
- `model/SavedJob.java` (criar/verificar)
- `model/enums/ApplicationStatus.java` (criar)
- `model/Application.java` (modificar — usar enum)
- `repository/SavedJobRepository.java` (criar)
- `repository/ApplicationRepository.java` (modificar)
- `service/SavedJobService.java` (criar)
- `service/ApplicationService.java` (modificar)
- `service/NotificationService.java` (modificar)
- `controller/v1/SavedJobController.java` (criar)
- `controller/v1/ApplicationController.java` (modificar)
- `dto/request/SaveJobRequest.java` (criar)
- `dto/request/UpdateApplicationStatusRequest.java` (criar)
- `dto/response/SavedJobResponse.java` (criar)
- `test/...` (criar)

**Mobile (consumir novos endpoints):**
- `services/api/savedJobApi.ts` (criar)
- `services/api/applicationApi.ts` (modificar)
- `hooks/useSavedJobs.ts` (criar)
- `hooks/useJobActions.ts` (criar)
- `screens/saved-jobs/SavedJobsScreen.tsx` (modificar)
- `screens/job-detail/JobDetailScreen.tsx` (modificar — botão salvar)

**Admin (consumir):**
- `services/api/applicationApi.ts` (criar)
- `pages/ApplicationsPage.tsx` (criar)
- `pages/JobsPage.tsx` (modificar — botão "Ver Candidatos")
- `components/ApplicationStatusUpdateModal.tsx` (criar)

## Notas

- SavedJob deve ter UNIQUE constraint em `(user_id, job_id)` para evitar duplicatas
- Mobile deve usar `useQuery` para `check` ao entrar na tela de detalhe
- Admin pode querer filtros (status, data) na listagem de candidatos
- Considerar usar WebSocket/SSE para atualização de status em tempo real (futuro)
