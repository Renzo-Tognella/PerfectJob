# Análise - TASK-002, TASK-003 (RBAC + Ownership)

**Data:** 2026-06-16
**Status:** Concluídas
**Escopo:** TASK-002 (RBAC em endpoints) + TASK-003 (Ownership check)

## Resumo

| Task | Título | Status |
|---|---|---|
| TASK-002 | RBAC em Endpoints Mutantes | ✅ Concluída |
| TASK-003 | Ownership Check nos Services | ✅ Concluída |

## Baseline vs Depois

| Métrica | Antes | Depois |
|---|---|---|
| Testes totais | 16 | 74 |
| Passaram | 16 | **74** |
| Falharam | 0 | 0 |
| Erros | 0 | **0** |
| Build | ✅ SUCCESS | ✅ SUCCESS |

## Arquivos Modificados / Criados

### TASK-002 (RBAC)
- `perfectjob-api/src/main/java/com/perfectjob/config/SecurityConfig.java` — `@EnableMethodSecurity`, `requestMatchers` granulares (GET públicas + auth), `HttpStatusEntryPoint(401)`, `anonymous` desabilitado
- `perfectjob-api/src/main/java/com/perfectjob/controller/v1/JobController.java` — `@PreAuthorize("hasAnyRole('RECRUITER','ADMIN')")` em POST/PATCH/close
- `perfectjob-api/src/main/java/com/perfectjob/controller/v1/CompanyController.java` — `@PreAuthorize` em POST/PATCH/DELETE
- `perfectjob-api/src/main/java/com/perfectjob/controller/v1/ApplicationController.java` — `@PreAuthorize` em GET/POST/recent, novo endpoint `PATCH /{id}/status`
- `perfectjob-api/src/main/java/com/perfectjob/controller/v1/NotificationController.java` — `@PreAuthorize` em GET/PATCH
- `perfectjob-api/src/main/java/com/perfectjob/exception/GlobalExceptionHandler.java` — `AccessDeniedException` retorna 403 com body `{"status":403,"message":"Access denied","details":{"error":"forbidden"}}`; novo handler `AuthenticationException` → 401
- `perfectjob-api/src/main/java/com/perfectjob/service/AuthService.java` — `@Slf4j` + log de auditoria `AUDIT: user registered id=... email=... role=...`; role default `CANDIDATE` explícito no builder

### TASK-003 (Ownership)
- `perfectjob-api/src/main/java/com/perfectjob/security/CurrentUser.java` — record (id, email, role) com helpers `isAdmin()`, `isRecruiter()`, `isCandidate()`
- `perfectjob-api/src/main/java/com/perfectjob/security/CurrentUserResolver.java` — `@Component` que resolve `Authentication` → `CurrentUser` via `UserRepository`; dois overloads (com `Authentication` e sem — usa `SecurityContextHolder`)
- `perfectjob-api/src/main/java/com/perfectjob/model/Company.java` — campo `ownerUserId` (Lombok @Data cobre getter/setter)
- `perfectjob-api/src/main/resources/db/migration/V4__add_company_owner.sql` — `ALTER TABLE companies ADD COLUMN owner_user_id`, FK para `users(id) ON DELETE SET NULL`, índice
- `perfectjob-api/src/main/java/com/perfectjob/dto/response/CompanyResponse.java` — adicionado `Long ownerUserId`
- `perfectjob-api/src/main/java/com/perfectjob/model/enums/ApplicationStatus.java` — novo enum `PENDING`, `REVIEWING`, `ACCEPTED`, `REJECTED`
- `perfectjob-api/src/main/java/com/perfectjob/service/CompanyService.java` — `create/update/delete` recebem `CurrentUser`; `assertCanModify` verifica ownership (ADMIN sempre passa, outros só se `ownerUserId == currentUser.id()`)
- `perfectjob-api/src/main/java/com/perfecjob/service/JobService.java` — `create/update/closeJob` validam ownership da company do job; `update` valida troca de company também
- `perfectjob-api/src/main/java/com/perfectjob/service/ApplicationService.java` — `getMyApplications(id, pageable, currentUser)` valida `candidateId == currentUser.id()` (ou ADMIN); novo método `updateStatus(applicationId, newStatus, currentUser)` valida ownership do company-owner

### Controllers atualizados para passar `CurrentUser`
- `JobController`, `CompanyController`, `ApplicationController`, `NotificationController` — injetam `CurrentUserResolver` e passam `currentUser` para os services

### Testes criados (TASK-002)
- `perfectjob-api/src/test/java/com/perfectjob/controller/JobControllerSecurityTest.java` — 10 testes (anônimo/candidato/recrutador/admin × POST/PATCH/close)
- `perfectjob-api/src/test/java/com/perfectjob/controller/CompanyControllerSecurityTest.java` — 8 testes
- `perfectjob-api/src/test/java/com/perfectjob/controller/ApplicationControllerSecurityTest.java` — 12 testes (incluindo status update)

### Testes criados (TASK-003)
- `perfectjob-api/src/test/java/com/perfectjob/service/CompanyServiceOwnershipTest.java` — 9 testes (admin/owner/other/no-owner)
- `perfectjob-api/src/test/java/com/perfectjob/service/JobServiceOwnershipTest.java` — 9 testes
- `perfectjob-api/src/test/java/com/perfectjob/service/ApplicationStatusUpdateTest.java` — 3 testes (admin/owner/other)

### Testes ajustados (existentes)
- `JobControllerTest.java` — adicionou `@MockBean CurrentUserResolver`
- `ApplicationControllerTest.java` — reescrito: `@MockBean CurrentUserResolver` mockado para retornar `CurrentUser` em `setUp()`
- `JobServiceCacheTest.java` — chamada de `create` ajustada para 2-arg `(req, admin)`

## Decisões Técnicas

### 1. 401 vs 403 para anônimos
- Default do Spring Security 6 para `anyRequest().authenticated()` é retornar 403 quando um usuário anônimo tenta acessar (porque o `AnonymousAuthenticationFilter` injeta um `AnonymousAuthenticationToken` e o AccessDeniedHandler trata a ausência de role)
- Solução: `.anonymous(AbstractHttpConfigurer::disable)` + `exceptionHandling.authenticationEntryPoint(new HttpStatusEntryPoint(UNAUTHORIZED))` → garante 401 para não autenticados
- 403 permanece para usuários autenticados sem permissão (via `@PreAuthorize` throwing `AccessDeniedException`)

### 2. `CurrentUserResolver` ao invés de `SecurityContextHolder` direto nos services
- Princípio da separação de responsabilidades: services não conhecem Spring Security
- Helper `@Component` com 2 overloads:
  - `resolve(Authentication auth)` — usado em código que já tem o `Authentication` em mão
  - `resolve()` — usado pelos controllers; lê do `SecurityContextHolder`
- `CurrentUser` é um record puro (POJO), não vaza nenhum tipo do Spring Security para os services

### 3. Controllers sem parâmetro `Authentication`
- Originalmente usei `@RequestParam Authentication authentication` mas isso causava NPE em `@WebMvcTest` + `addFilters=false` (o `AuthenticationPrincipalArgumentResolver` não tinha a SecurityContext propagada)
- Solução: controllers chamam `currentUserResolver.resolve()` que lê de `SecurityContextHolder` — funciona em todos os cenários de teste
- `@PreAuthorize` é o gatekeeper de segurança; o resolver só extrai o usuário após o gate

### 4. `@EnableMethodSecurity` no SecurityConfig
- Habilita o proxy AOP que intercepta chamadas a métodos com `@PreAuthorize`
- Sem essa anotação, `@PreAuthorize` é silenciosamente ignorado

### 5. `ApplicationStatus` enum criado
- O model `Application` usava `String status` (default "PENDING")
- Spec pediu enum tipado para `updateStatus(applicationId, ApplicationStatus newStatus, ...)`
- Valores: PENDING, REVIEWING, ACCEPTED, REJECTED

### 6. Testes `@WebMvcTest` vs `@SpringBootTest`
- Tests de negócio (controllers): `@WebMvcTest` + `addFilters = false` (rapidez, isolamento). `@PreAuthorize` é no-op porque `@EnableMethodSecurity` não é carregado. O controller é testado com mocks.
- Tests de RBAC (security): `@SpringBootTest` + `@ActiveProfiles("test")` + `.apply(springSecurity())` para carregar o SecurityConfig completo. Aqui `@PreAuthorize` é respeitado.

### 7. Service `JobService.update` valida troca de company
- O `CreateJobRequest` permite mudar `companyId` no update
- Se o recrutador tenta mover o job para uma company que não é dele → 403
- ADMIN pode mover para qualquer company

## Testes Manuais (todos passaram)

### M1: CANDIDATE tenta criar vaga → 403
```bash
$ curl -X POST http://localhost:8080/api/v1/jobs -H "Authorization: Bearer $TOKEN_CAND" ...
Status: 403
{"status":403,"message":"Access denied","details":{"error":"forbidden"},"error":null,"timestamp":"..."}
```

### M2: CANDIDATE tenta GET /v1/applications/recent → 403
```bash
$ curl -X GET http://localhost:8080/api/v1/applications/recent -H "Authorization: Bearer $TOKEN_CAND"
Status: 403
```

### M3: CANDIDATE tenta criar company → 403
```bash
$ curl -X POST http://localhost:8080/api/v1/companies -H "Authorization: Bearer $TOKEN_CAND" ...
Status: 403
```

### M4: Anônimo em GET público → 200
```bash
$ curl -X GET http://localhost:8080/api/v1/jobs
Status: 200
```

### M5: Anônimo em POST mutante → 401
```bash
$ curl -X POST http://localhost:8080/api/v1/jobs ...
Status: 401
```

### M6: Audit log de registro
```
INFO com.perfectjob.service.AuthService : AUDIT: user registered id=7 email=cand2@test.com role=CANDIDATE
INFO com.perfectjob.service.AuthService : AUDIT: user registered id=8 email=rec2@test.com role=CANDIDATE
```

## Limitações Conhecidas

1. **Não há admin/reclutador seed**: o sistema não cria usuários ADMIN/RECRUITER por padrão. Para criar um, é necessário inserir diretamente no banco ou via script SQL. Isso impossibilitou testar manualmente o fluxo "RECRUITER cria vaga", mas está coberto por testes automatizados (`JobControllerSecurityTest.create_recruiterSucceeds`, `JobServiceOwnershipTest.create_ownerCanCreateJobInOwnCompany`).

2. **JobServiceCacheTest** (já existia, não foi criada por esta task) usa `@Import(JobService.class)` para criar o bean. Funcionou após a atualização do `create(req)` para `create(req, currentUser)`.

3. **`@PreAuthorize` em `apply` (POST /v1/applications)**: a spec lista `POST /` em `isAuthenticated()`. CANDIDATE pode se candidatar. Verificado: CANDIDATE recebe 200, e o serviço valida que `candidateId == currentUser.id()`.

## Conclusão

Todas as tasks (TASK-002 e TASK-003) foram concluídas com sucesso:
- 74 testes passando (16 originais + 58 novos)
- Build SUCCESS
- API continua funcional
- RBAC funciona: anônimos recebem 401 em mutantes, 200 em públicos; usuários autenticados sem role recebem 403 com body estruturado
- Ownership funciona: CANDIDATE não pode criar/editar/deletar resources, RECRUITER só pode editar/deletar recursos da sua company, ADMIN pode tudo
- Audit log em todo registro de usuário
