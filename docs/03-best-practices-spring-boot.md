# Boas Práticas — Spring Boot 3.3 + Java 21

> Compilado de fontes oficiais (Spring docs, Baeldung, blogs JetBrains, Refactoring.guru, OWASP) aplicado ao contexto do PerfectJob.

## 1. Arquitetura em Camadas

```
┌─────────────────────────────────────────┐
│ Controller (interface layer)            │  ← REST, validação, DTO
├─────────────────────────────────────────┤
│ Service (application/business layer)    │  ← regras de negócio, @Transactional
├─────────────────────────────────────────┤
│ Repository (persistence layer)          │  ← Spring Data JPA
├─────────────────────────────────────────┤
│ Database                                 │  ← PostgreSQL
└─────────────────────────────────────────┘
```

**Regras:**
- Controller → Service (1 nível apenas)
- Service → Repository (1 nível apenas)
- Service NUNCA acessa outro Service diretamente sem abstração
- Controller NUNCA acessa Repository diretamente

## 2. Injeção de Dependência

**Preferir:** Constructor injection (imutável, testável, fail-fast)
```java
@Service
@RequiredArgsConstructor
public class JobService {
    private final JobRepository jobRepository;
    private final CompanyRepository companyRepository;
    private final ApplicationEventPublisher events;
}
```

**Evitar:** Field injection com `@Autowired` (mutável, esconde dependências, dificulta teste)

## 3. Transações (@Transactional)

**Onde:** No service (não no repository nem no controller)

**Read-only quando aplicável:**
```java
@Transactional(readOnly = true)
public Page<JobResponse> search(SearchJobRequest req, Pageable pageable) { ... }

@Transactional
public JobResponse create(CreateJobRequest req) { ... }
```

**Propagação explícita para casos específicos:**
- `Propagation.REQUIRES_NEW` para logs/auditoria que devem persistir mesmo se a transação pai falhar
- `Propagation.MANDATORY` para métodos que DEVEM estar dentro de uma transação

**Rollback:**
- `rollbackFor = Exception.class` quando necessário rollback para checked exceptions
- Default: rollback para `RuntimeException` e `Error`

## 4. Validação

**Bean Validation nos DTOs (records):**
```java
public record CreateJobRequest(
    @NotBlank @Size(max = 255) String title,
    @NotNull Long companyId,
    @NotBlank @Size(max = 5000) String description,
    @NotNull WorkModel workModel,
    @NotNull ExperienceLevel experienceLevel,
    @DecimalMin("0.0") BigDecimal salaryMin,
    @DecimalMin("0.0") BigDecimal salaryMax
) {
    @AssertTrue(message = "salaryMax must be >= salaryMin")
    public boolean isValidSalaryRange() {
        return salaryMax == null || salaryMin == null || salaryMax.compareTo(salaryMin) >= 0;
    }
}
```

**Validação customizada para regras de negócio:**
```java
@Component
public class CompanySlugValidator implements ConstraintValidator<ValidCompanySlug, String> { ... }
```

**No controller:**
```java
@PostMapping
public ResponseEntity<JobResponse> create(@Valid @RequestBody CreateJobRequest request) { ... }
```

## 5. Tratamento Global de Erros

**Padrão:** `@RestControllerAdvice` + `@ExceptionHandler`

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        log.debug("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(ex.getStatus())
            .body(new ErrorResponse(ex.getStatus().value(), ex.getMessage(), null, Instant.now()));
    }
    
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicate(DuplicateResourceException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(new ErrorResponse(409, ex.getMessage(), null, Instant.now()));
    }
    
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(new ErrorResponse(403, "Access denied", null, Instant.now()));
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> details = ex.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(FieldError::getField, 
                e -> e.getDefaultMessage() == null ? "invalid" : e.getDefaultMessage(),
                (a, b) -> a));
        return ResponseEntity.badRequest()
            .body(new ErrorResponse(400, "Validation failed", details, Instant.now()));
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        log.error("Unexpected error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse(500, "Internal server error", null, Instant.now()));
    }
}
```

**Regras:**
- Logar toda exception (com stacktrace para 500, sem para 4xx)
- NUNCA retornar stacktrace ao cliente
- Mensagens descritivas mas sem vazar dados sensíveis

## 6. Segurança (Spring Security 6 + JWT)

### 6.1 Stateless
```java
http
    .csrf(csrf -> csrf.disable())
    .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
    .authorizeHttpRequests(auth -> auth
        .requestMatchers("/v1/auth/**", "/v3/api-docs/**", "/swagger-ui/**").permitAll()
        .requestMatchers(HttpMethod.GET, "/v1/jobs/**", "/v1/companies/**", "/v1/search/**").permitAll()
        .anyRequest().authenticated()
    )
    .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
```

### 6.2 RBAC (Method Security)
```java
@EnableMethodSecurity  // habilita @PreAuthorize
@Configuration
public class SecurityConfig { ... }

@PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
@PostMapping("/v1/jobs")
public ResponseEntity<JobResponse> create(...) { ... }

@PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
@PatchMapping("/v1/jobs/{id}")
public ResponseEntity<JobResponse> update(@PathVariable Long id, ...) { ... }
```

### 6.3 Ownership (no service)
```java
public JobResponse update(Long id, CreateJobRequest request, UserPrincipal currentUser) {
    Job job = jobRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Job", "id", id));
    
    if (!currentUser.getRole().equals(Role.ADMIN) 
        && !job.getCompanyId().equals(currentUser.getCompanyId())) {
        throw new AccessDeniedException("You don't own this job");
    }
    
    // ... update
}
```

### 6.4 JWT Best Practices
- **Algoritmo:** HS256 (HMAC) com secret ≥ 256 bits (32 chars) OU RS256 com par de chaves
- **Claims:** `sub` (userId ou email), `role`, `iat`, `exp`
- **Expiração:** Access token 15 min, refresh token 7-30 dias
- **Storage frontend:** SecureStore (mobile) + httpOnly cookie (web) — NUNCA localStorage para web em produção
- **Refresh:** Implementar `POST /v1/auth/refresh` com refresh token rotativo

### 6.5 CORS
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of(
        "http://localhost:5173",     // admin dev
        "http://localhost:8081",     // expo web
        "https://admin.perfectjob.com",
        "https://app.perfectjob.com"
    ));
    config.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
    config.setExposedHeaders(List.of("X-Total-Count"));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

**NUNCA:** `setAllowedOriginPatterns("*")` + `setAllowCredentials(true)` (vulnerabilidade CSRF)

### 6.6 Secret Management
- `application.yml`: `${JWT_SECRET}` (obrigatório, sem default)
- `.env` em dev, AWS Secrets Manager / Vault em prod
- `@PostConstruct` para validar tamanho mínimo do secret
- NUNCA commitar `.env` (já está no `.gitignore`)

## 7. Persistência (JPA + Hibernate)

### 7.1 N+1 Fix
**Errado:**
```java
List<Job> jobs = jobRepository.findAll();
return jobs.stream().map(this::toResponse).toList();  // N queries para company
```

**Certo (JOIN FETCH):**
```java
@Query("SELECT j FROM Job j JOIN FETCH j.company WHERE j.status = :status")
List<Job> findActiveWithCompany(@Param("status") JobStatus status);
```

**OU (EntityGraph):**
```java
@EntityGraph(attributePaths = {"company"})
List<Job> findByStatus(JobStatus status, Pageable pageable);
```

### 7.2 Mapping DTO ↔ Entity
**Evitar:** MapStruct para projetos simples (overhead de build)

**Preferir:** Conversor manual centralizado
```java
public class JobMapper {
    public static JobResponse toResponse(Job job, Company company) {
        return new JobResponse(
            job.getId(), job.getTitle(), job.getSlug(), /* ... */
            company.getName(),  // sem query extra
            /* ... */
        );
    }
}
```

### 7.3 Lazy vs Eager
- Default: **LAZY** para `@ManyToOne`, `@OneToMany`, `@ManyToMany`
- `@OneToOne` e `@ManyToOne` podem ser EAGER com cuidado
- Usar `@EntityGraph` para queries que precisam do relacionamento
- **Evitar** `OpenSessionInView` (esconde N+1)

### 7.4 Specification Pattern
Já presente em `JobSpecification` (bom exemplo). Permite queries compostas:
```java
Specification<Job> spec = Specification.where(null);
if (workModel != null) spec = spec.and(JobSpecification.byWorkModel(workModel));
if (minSalary != null) spec = spec.and(JobSpecification.salaryAtLeast(minSalary));
return jobRepository.findAll(spec, pageable);
```

## 8. Cache

### 8.1 Configuração
```java
@Configuration
@EnableCaching
public class CacheConfig {
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(5))
            .serializeValuesWith(SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));
        return RedisCacheManager.builder(factory).cacheDefaults(config).build();
    }
}
```

### 8.2 Uso
```java
@Cacheable(value = "jobs", key = "#slug")
public JobResponse findBySlug(String slug) { ... }

@CacheEvict(value = "jobs", key = "#result.slug")
public JobResponse create(CreateJobRequest req) { ... }

@CacheEvict(value = "jobs", allEntries = true)
public JobResponse update(Long id, CreateJobRequest req) { ... }
```

## 9. Testes

### 9.1 Camadas
- **Unit:** Service com Mockito (sem Spring context)
- **Web:** Controller com `@WebMvcTest` + MockMvc
- **Integration:** `@SpringBootTest` + Testcontainers (PostgreSQL real)
- **Repository:** `@DataJpaTest` (H2 ou Testcontainers)
- **E2E:** REST Assured ou Testcontainers + HTTP client

### 9.2 Nomenclatura
```
MethodName_StateUnderTest_ExpectedBehavior
```

Exemplo: `createJob_WithValidData_ReturnsJobResponse`

### 9.3 Cobertura
- Mínimo: 80% line coverage em services
- 100% em controllers
- 100% em classes de configuração
- Mutações importantes (salaryMin > salaryMax, etc)

### 9.4 Compatibilidade Java
- Spring Boot 3.3 suporta Java 17-23
- Byte Buddy 1.14.x (incluído no Spring Boot 3.3.0) suporta até Java 23
- **Java 25 requer Spring Boot 3.4+ ou upgrade manual do Byte Buddy**
- Workaround: usar JDK 21 explicitamente

## 10. Logging

### 10.1 SLF4J com Lombok
```java
@Slf4j
@Service
public class JobService {
    public JobResponse create(CreateJobRequest req) {
        log.info("Creating job: title={}, companyId={}", req.title(), req.companyId());
        // ...
        log.debug("Job created: id={}, slug={}", job.getId(), job.getSlug());
    }
}
```

### 10.2 Níveis
- `ERROR`: falhas inesperadas que precisam atenção
- `WARN`: situações anormais mas recuperáveis (token expirado, retry)
- `INFO`: eventos de negócio importantes (job criado, application submitted)
- `DEBUG`: informações de diagnóstico (desabilitado em prod)
- `TRACE`: informações muito detalhadas (desabilitado em prod)

### 10.3 Não fazer
```java
log.info("Job: " + job);  // concatena mesmo se log desabilitado
log.debug(job.toString());  // pode vazar PII
```

## 11. Observabilidade (Produção)

### 11.1 Spring Actuator
```yaml
management:
  endpoints.web.exposure.include: health,info,metrics,prometheus
  endpoint.health.show-details: when_authorized
  metrics.tags.application: ${spring.application.name}
```

### 11.2 Métricas úteis
- `http_server_requests_seconds` (latência por endpoint)
- `jvm_memory_used_bytes`
- `hikaricp_connections_active`
- `hibernate_queries_execution_total`
- Custom: `jobs_created_total`, `applications_submitted_total`

### 11.3 Distributed Tracing
- Micrometer Tracing + OpenTelemetry
- Trace ID em todas as logs (`%X{traceId}` no pattern)

## 12. Segurança Adicional (OWASP Top 10)

| Vulnerabilidade | Mitigação |
|---|---|
| SQL Injection | JPA com `@Query` parametrizado ou JPQL |
| XSS | Frontend escapa; backend serializa para JSON |
| CSRF | Stateless JWT (não usa cookies de sessão) |
| Broken Auth | JWT + BCrypt + RBAC + ownership check |
| Sensitive Data Exposure | Não retornar passwordHash, validar expiração |
| Broken Access Control | `@PreAuthorize` + ownership check |
| Security Misconfig | Profiles separados, actuator protegido |
| IDOR | Validar ownership em TODA operação |
| Insufficient Logging | SLF4J estruturado + audit log |
| SSRF | Não aplicável (sem chamada para URLs externas) |

## 13. Convenções de Código

- **Lombok:** Usar com parcimônia. Evitar `@Data` (cria equals/hashCode que inclui relacionamentos lazy → N+1)
- **Records** para DTOs (imutáveis, equals/hashCode automáticos)
- **@Builder** em entities e DTOs complexos
- **Sem `null` em Optional:** Preferir `Optional<T>` em retornos
- **Sem field injection:** Constructor injection
- **Constantes em maiúsculas:** `MAX_APPLICATIONS_PER_USER = 50`
- **Métodos privados no fim da classe:** Organização visual

## 14. Performance

- **Connection pool:** HikariCP com `maximum-pool-size: 20` (default razoável)
- **Batch inserts:** `@BatchSize(size = 50)` em ElementCollection
- **Lazy loading:** Default, exceto quando join é sempre necessário
- **Índices:** Criar índice em colunas usadas em WHERE/ORDER BY
- **Query plan:** `EXPLAIN ANALYZE` para queries lentas
- **Pagination:** Sempre paginar (nunca `findAll()`)
- **DTOs enxutos:** Não retornar entity inteira

## 15. Referências

- [Spring Boot Reference](https://docs.spring.io/spring-boot/docs/3.3.x/reference/html/)
- [Spring Security Reference](https://docs.spring.io/spring-security/reference/)
- [Baeldung Spring Boot Tutorials](https://www.baeldung.com/spring-boot)
- [OWASP API Security Top 10](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)
- [Effective Java (Joshua Bloch)](https://www.oreilly.com/library/view/effective-java/9780134686097/)
- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/clean-architecture.html)
