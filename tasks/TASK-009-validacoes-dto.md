# TASK-009: Validações Bean Validation Completas

**Prioridade:** 🟠 ALTA
**Estimativa:** 1.5h
**Dependências:** TASK-002
**Status:** ⬜ Pendente

## Objetivo

Adicionar validações Bean Validation completas em todos os DTOs. Validar regras de negócio (salaryMin ≤ salaryMax, etc).

## Escopo

### A. CreateJobRequest
**Arquivos:**
- `dto/request/CreateJobRequest.java`

**Ações:**
1. Adicionar `@Size(max = 255)` em `title`
2. Adicionar `@Size(max = 5000)` em `description`, `requirements`, `benefits`
3. Adicionar `@Size(max = 1000)` em `locationCity`, `locationState`
4. Adicionar `@DecimalMin("0.0")` em `salaryMin`, `salaryMax`
5. Adicionar `@Future` em `expiresAt` (não pode ser no passado)
6. Adicionar `@Size(max = 20)` em `skills` (cada skill)
7. Adicionar método de validação customizada `isValidSalaryRange()`
8. Adicionar `@AssertTrue` no método

### B. CreateCompanyRequest
**Arquivos:**
- `dto/request/CreateCompanyRequest.java`

**Ações:**
1. Adicionar `@Size(max = 255)` em `name`
2. Adicionar `@Pattern(regexp = "^[a-z0-9-]+$", message = "slug deve conter apenas letras minúsculas, números e hífens")` em `slug`
3. Adicionar `@Size(max = 5000)` em `description`
4. Adicionar `@Pattern(regexp = "^https?://.*")` em `website`
5. Adicionar `@Min(1800) @Max(2100)` em `foundedYear`
6. Adicionar `@Size(max = 100)` em `industry`
7. Adicionar `@Size(max = 50)` em `size`

### C. RegisterRequest
**Arquivos:**
- `dto/request/RegisterRequest.java`

**Ações:**
1. Adicionar `@Size(min = 2, max = 255)` em `fullName`
2. Manter `@NotBlank @Email` em `email`
3. Adicionar `@Size(min = 8, max = 255)` em `password` (mais seguro que 6)
4. Adicionar `@Pattern(regexp = ".*\\d.*", message = "Senha deve conter pelo menos um número")` em `password` (opcional, decidir)

### D. SubmitApplicationRequest
**Arquivos:**
- `dto/request/SubmitApplicationRequest.java`

**Ações:**
1. Manter `@NotNull` em `jobId`
2. Adicionar `@Size(max = 5000)` em `coverLetter`
3. Adicionar `@Pattern(regexp = "^https?://.*")` em `resumeUrl`
4. Adicionar `@Size(max = 255)` em `resumeUrl`

### E. LoginRequest
**Arquivos:**
- `dto/request/LoginRequest.java`

**Ações:**
1. Manter validações atuais (já estão boas)

### F. SearchJobRequest
**Arquivos:**
- `dto/request/SearchJobRequest.java`

**Ações:**
1. Adicionar `@Size(max = 255)` em `keyword`
2. Adicionar `@DecimalMin("0.0")` em `minSalary`
3. Adicionar `@Size(max = 20)` em `skills`

### G. GlobalExceptionHandler
**Arquivos:**
- `exception/GlobalExceptionHandler.java`

**Ações:**
1. Garantir que `MethodArgumentNotValidException` retorna:
   - 400 Bad Request
   - Body com `details: { field: message }`
   - Lista de TODOS os erros, não apenas o primeiro

### H. Testes
**Arquivos:**
- `test/dto/CreateJobRequestValidationTest.java` (criar)
- `test/dto/CreateCompanyRequestValidationTest.java` (criar)
- `test/dto/RegisterRequestValidationTest.java` (criar)
- `test/dto/SubmitApplicationRequestValidationTest.java` (criar)

**Ações:**
1. Usar `Validator` (Bean Validation) para testar
2. Validar casos positivos e negativos
3. Mínimo 5 testes por DTO

## Critérios de Aceite

- [ ] `salaryMin > salaryMax` retorna 400 com mensagem clara
- [ ] `expiresAt` no passado retorna 400
- [ ] `slug` com caracteres inválidos retorna 400
- [ ] `password` < 8 chars retorna 400
- [ ] `coverLetter` > 5000 chars retorna 400
- [ ] `keyword` > 255 chars retorna 400
- [ ] Todos os erros vêm na resposta (não apenas o primeiro)
- [ ] Testes de validação passam (≥ 20 testes)

## Como Testar

### Manual
```bash
# salaryMax < salaryMin
curl -X POST http://localhost:8080/api/v1/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Dev",
    "companyId": 1,
    "description": "...",
    "workModel": "REMOTE",
    "experienceLevel": "JUNIOR",
    "jobType": "FULL_TIME",
    "contractType": "CLT",
    "salaryMin": 10000,
    "salaryMax": 5000,
    "expiresAt": "2026-12-31T23:59:59"
  }'
# Deve retornar 400 com details: { salaryMax: "salaryMax must be >= salaryMin" }

# slug inválido
curl -X POST http://localhost:8080/api/v1/companies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Corp",
    "slug": "Tech Corp!",
    ...
  }'
# Deve retornar 400 com details: { slug: "slug deve conter apenas letras minúsculas, números e hífens" }
```

### Automatizado
```java
@Test
void createJobRequest_withInvalidSalaryRange_failsValidation() {
    CreateJobRequest req = new CreateJobRequest(
        "Dev", 1L, "desc", null, null, null,
        new BigDecimal("10000"), new BigDecimal("5000"),
        WorkModel.REMOTE, ExperienceLevel.JUNIOR,
        JobType.FULL_TIME, ContractType.CLT,
        "SP", "SP", List.of(),
        LocalDateTime.now().plusDays(30)
    );
    
    Set<ConstraintViolation<CreateJobRequest>> violations = validator.validate(req);
    assertThat(violations).hasSize(1);
    assertThat(violations.iterator().next().getMessage()).contains("salaryMax");
}
```

## Arquivos Criados/Modificados

- `dto/request/CreateJobRequest.java` (modificar)
- `dto/request/CreateCompanyRequest.java` (modificar)
- `dto/request/RegisterRequest.java` (modificar)
- `dto/request/SubmitApplicationRequest.java` (modificar)
- `dto/request/SearchJobRequest.java` (modificar)
- `exception/GlobalExceptionHandler.java` (modificar)
- `test/dto/CreateJobRequestValidationTest.java` (criar)
- `test/dto/CreateCompanyRequestValidationTest.java` (criar)
- `test/dto/RegisterRequestValidationTest.java` (criar)
- `test/dto/SubmitApplicationRequestValidationTest.java` (criar)

## Notas

- `@AssertTrue` no método de validação funciona em records (basta método `is*()` ou `get*()` retornando boolean)
- Mensagens devem ser claras mas em inglês (i18n é trabalho futuro)
- Para regras complexas, considerar criar validador customizado (`@ConstraintValidator`)
- Não validar regras de negócio que dependem de DB (ex: email duplicado) — isso fica no service
