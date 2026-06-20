# TASK-002: RBAC em Endpoints Mutantes

**Prioridade:** 🔴 CRÍTICA
**Estimativa:** 3h
**Dependências:** TASK-001
**Status:** ⬜ Pendente

## Objetivo

Adicionar controle de acesso baseado em role (RBAC) em todos os endpoints mutantes. Garantir que apenas RECRUITER e ADMIN podem criar/editar/deletar recursos, e que qualquer usuário autenticado pode candidatar-se a vagas.

## Escopo

### A. SecurityConfig
**Arquivos:**
- `perfectjob-api/src/main/java/com/perfectjob/config/SecurityConfig.java`

**Ações:**
1. Habilitar `@EnableMethodSecurity` (Spring Security 6)
2. Manter endpoints públicos apenas para **leitura anônima**:
   - GET `/v1/jobs/**`
   - GET `/v1/companies/**`
   - GET `/v1/search/**`
   - `/v1/auth/**` (apenas register e login)
   - `/swagger-ui/**`, `/v3/api-docs/**`
3. Demais endpoints: `authenticated()`

### B. Controllers
**Arquivos:**
- `JobController.java`
- `CompanyController.java`
- `ApplicationController.java`
- `NotificationController.java`

**Ações:**
1. **JobController**:
   - `POST /v1/jobs` → `@PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")`
   - `PATCH /v1/jobs/{id}` → `@PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")`
   - `POST /v1/jobs/{id}/close` → `@PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")`
2. **CompanyController**:
   - `POST /v1/companies` → `@PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")`
   - `PATCH /v1/companies/{id}` → `@PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")`
   - `DELETE /v1/companies/{id}` → `@PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")`
3. **ApplicationController**:
   - `GET /v1/applications` → `@PreAuthorize("isAuthenticated()")`
   - `GET /v1/applications/recent` → `@PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")`
   - `POST /v1/applications` → `@PreAuthorize("isAuthenticated()")`
4. **NotificationController**:
   - `GET /v1/notifications` → `@PreAuthorize("isAuthenticated()")`
   - `PATCH /v1/notifications/{id}/read` → `@PreAuthorize("isAuthenticated()")`

### C. GlobalExceptionHandler
**Arquivos:**
- `GlobalExceptionHandler.java`

**Ações:**
1. Adicionar handler para `AccessDeniedException` → 403
2. Adicionar handler para `AuthenticationException` → 401

### D. AuthService
**Arquivos:**
- `AuthService.java`
- `RegisterRequest.java` (DTO)

**Ações:**
1. Adicionar campo `role` opcional em `RegisterRequest` (default `CANDIDATE`)
2. Permitir `ADMIN` criar usuários com role específica (endpoint separado se necessário)
3. Validar que apenas `ADMIN` pode promover para `RECRUITER` ou `ADMIN`

## Critérios de Aceite

- [ ] `POST /v1/jobs` sem token retorna 401
- [ ] `POST /v1/jobs` com token de CANDIDATE retorna 403
- [ ] `POST /v1/jobs` com token de RECRUITER retorna 200
- [ ] `POST /v1/jobs` com token de ADMIN retorna 200
- [ ] `GET /v1/jobs` sem token retorna 200 (público)
- [ ] `PATCH /v1/companies/{id}` com token de CANDIDATE retorna 403
- [ ] `DELETE /v1/companies/{id}` com token de CANDIDATE retorna 403
- [ ] `POST /v1/applications` com token de CANDIDATE retorna 200
- [ ] `POST /v1/applications` sem token retorna 401
- [ ] 403 retorna body estruturado (`ErrorResponse`)
- [ ] 401 retorna body estruturado

## Como Testar

### Manual
```bash
# 1. Registrar candidato
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Candidato","email":"cand@test.com","password":"123456"}'

# 2. Login candidato
TOKEN_CAND=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cand@test.com","password":"123456"}' | jq -r .accessToken)

# 3. Tentar criar vaga (deve falhar 403)
curl -X POST http://localhost:8080/api/v1/jobs \
  -H "Authorization: Bearer $TOKEN_CAND" \
  -H "Content-Type: application/json" \
  -d '{...}'

# 4. Tentar sem token (deve falhar 401)
curl -X POST http://localhost:8080/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### Automatizado
- Criar `JobControllerSecurityTest` com testes para cada combinação (sem token, candidato, recrutador, admin)
- Validar resposta 401, 403, 200 conforme apropriado
- Mínimo 12 testes (3 endpoints × 4 estados)

## Arquivos Criados/Modificados

- `config/SecurityConfig.java` (modificar)
- `controller/v1/JobController.java` (modificar)
- `controller/v1/CompanyController.java` (modificar)
- `controller/v1/ApplicationController.java` (modificar)
- `controller/v1/NotificationController.java` (modificar)
- `exception/GlobalExceptionHandler.java` (modificar)
- `dto/request/RegisterRequest.java` (modificar)
- `service/AuthService.java` (modificar)
- `test/controller/JobControllerSecurityTest.java` (criar)
- `test/controller/CompanyControllerSecurityTest.java` (criar)
- `test/controller/ApplicationControllerSecurityTest.java` (criar)

## Notas

- `@PreAuthorize` funciona com `ROLE_` prefix automaticamente (Spring Security)
- UserDetails deve retornar `ROLE_CANDIDATE`, `ROLE_RECRUITER`, `ROLE_ADMIN`
- Para casos mais complexos (ownership), usar `@PostAuthorize` ou check no service (TASK-003)
