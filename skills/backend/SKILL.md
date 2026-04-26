# PerfectJob — Skill: Engenharia de Software Backend (Spring Boot)

## Propósito
Esta skill define as melhores práticas, padrões de arquitetura e convenções para desenvolvimento backend com Spring Boot 3.x + Java 21 no projeto PerfectJob.

---

## 1. Stack Tecnológica

### Core
- **Java 21** — Virtual Threads, Pattern Matching, Records, Sealed Classes
- **Spring Boot 3.3+** — Framework principal (monólito modular)
- **Spring Data JPA** — Persistência relacional
- **Spring Security 6.x** — Autenticação/autorização
- **Spring Cache** — Cache com Redis

### Banco de Dados
- **PostgreSQL 16** — Banco relacional principal + busca full-text (tsvector/tsquery + pg_trgm)
- **Redis 7** — Cache, sessões, filas

### Mensageria
- **Spring Events + @Async** — Eventos assíncronos in-process (notificações, analytics)

### Observabilidade
- **Micrometer + Prometheus** — Métricas
- **Logback** — Structured logging (JSON)
- **Sentry** — Crash reporting (produção)

### Documentação
- **OpenAPI 3.1 (springdoc)** — Documentação de API
- **Rest Docs** — Documentação de API com testes

---

## 2. Estrutura de Projeto

```
src/main/java/com/perfectjob/
├── PerfectJobApplication.java
├── config/              # Configurações (Security, CORS, Cache, etc.)
│   ├── SecurityConfig.java
│   ├── CorsConfig.java
│   └── CacheConfig.java
├── controller/          # Controllers REST (camada web)
│   ├── v1/              # Versionamento de API (/api/v1/...)
│   │   ├── JobController.java
│   │   ├── UserController.java
│   │   ├── CompanyController.java
│   │   └── ApplicationController.java
│   └── handler/         # Global exception handler
│       └── GlobalExceptionHandler.java
├── dto/                 # Data Transfer Objects
│   ├── request/         # DTOs de entrada
│   │   ├── CreateJobRequest.java
│   │   ├── SearchJobRequest.java
│   │   └── ApplyJobRequest.java
│   └── response/        # DTOs de saída
│       ├── JobResponse.java
│       ├── JobSearchResponse.java
│       └── PageResponse.java
├── model/               # Entidades JPA / Domain Models
│   ├── Job.java
│   ├── User.java
│   ├── Company.java
│   ├── Application.java
│   └── enums/
│       ├── JobType.java
│       ├── ExperienceLevel.java
│       └── WorkModel.java
├── repository/          # Repositórios Spring Data
│   ├── JobRepository.java
│   ├── UserRepository.java
│   └── CompanyRepository.java
├── service/             # Serviços de negócio (lógica)
│   ├── JobService.java
│   ├── impl/
│   │   └── JobServiceImpl.java
│   ├── UserService.java
│   ├── ApplicationService.java
│   └── SearchService.java
├── mapper/              # Mapeamento DTO <-> Entity
│   ├── JobMapper.java
│   └── UserMapper.java
├── security/            # Segurança
│   ├── JwtProvider.java
│   ├── JwtFilter.java
│   ├── UserDetailsServiceImpl.java
│   └── SecurityUtils.java
├── event/               # Eventos de domínio (DDD)
│   ├── JobPostedEvent.java
│   ├── ApplicationSubmittedEvent.java
│   └── listener/
│       └── JobEventListener.java
├── exception/           # Exceções de domínio customizadas
│   ├── ResourceNotFoundException.java
│   ├── DuplicateApplicationException.java
│   └── UnauthorizedException.java
├── validation/          # Validadores customizados
│   └── JobValidator.java
└── util/                # Utilitários
    ├── SlugUtils.java
    └── DateUtils.java

src/main/resources/
├── application.yml
├── application-dev.yml
├── application-prod.yml
├── db/migration/        # Flyway migrations
│   ├── V1__init_schema.sql
│   └── V2__add_search_indexes.sql
│   └── V3__add_fulltext_vector.sql

src/test/java/com/perfectjob/
├── unit/                # Testes unitários (JUnit 5 + Mockito)
├── integration/         # Testes de integração
├── e2e/                 # Testes E2E (Testcontainers)
└── fixture/             # Fixtures compartilhadas
```

---

## 3. Princípios SOLID e Clean Code

### 3.1 Single Responsibility (SRP)
Cada classe tem uma única razão para mudar.
```java
// RUIM: Controller faz validação, lógica de negócio e persistência
// BOM:
@RestController
public class JobController {
    private final JobService jobService;    // Lógica de negócio
    private final JobMapper jobMapper;      // Mapeamento
    // Controller só orquestra
}
```

### 3.2 Open/Closed (OCP)
Aberto para extensão, fechado para modificação.
```java
// Usar Strategy pattern para lógicas variáveis
public interface MatchingStrategy {
    double calculateMatch(User user, Job job);
}

@Component("skillBased")
public class SkillBasedMatching implements MatchingStrategy { ... }

@Component("experienceBased")
public class ExperienceBasedMatching implements MatchingStrategy { ... }
```

### 3.3 Liskov Substitution (LSP)
Subtipos devem ser substituíveis por seus tipos base.
- Não lance exceções não declaradas no contrato da interface.
- Use `@Validated` e Bean Validation nos parâmetros.

### 3.4 Interface Segregation (ISP)
Interfaces pequenas e focadas.
```java
// RUIM: Interface monolítica
// BOM:
public interface JobSearchable { Page<Job> search(SearchCriteria criteria); }
public interface JobMatchable { List<JobMatch> match(User user); }
public interface JobCrud { Job save(Job job); void delete(Long id); }
```

### 3.5 Dependency Inversion (DIP)
Dependa de abstrações, não de implementações.
```java
// Injeção por interface
@Service
@RequiredArgsConstructor
public class JobServiceImpl implements JobService {
    private final JobRepository jobRepository;  // Interface
    private final SearchService searchService;   // Interface
}
```

---

## 4. Design Patterns Recomendados

### 4.1 Strategy
Para algoritmos intercambiáveis: matching, ranking, notificação.
```java
public interface NotificationStrategy {
    void send(Notification notification);
}

@Component @Profile("email")
public class EmailNotification implements NotificationStrategy { ... }

@Component @Profile("push")
public class PushNotification implements NotificationStrategy { ... }
```

### 4.2 Template Method
Para fluxos com passos fixos e variações.
```java
public abstract class JobPostingTemplate {
    public final Job post(CreateJobRequest request) {
        validate(request);           // Hook
        Job job = enrich(request);   // Hook
        Job saved = save(job);       // Template
        notify(saved);               // Hook
        return saved;
    }
    protected abstract void validate(CreateJobRequest request);
    protected abstract Job enrich(CreateJobRequest request);
}
```

### 4.3 Chain of Responsibility
Para pipelines de validação e processamento.
```java
public interface ApplicationPipelineHandler {
    void handle(Application application, Chain chain);
}

// Handlers: ValidateEligibility, CheckDuplicate, ScoreCandidate, NotifyRecruiter
```

### 4.4 Repository (Spring Data JPA)
```java
@Repository
public interface JobRepository extends JpaRepository<Job, Long>, JpaSpecificationExecutor<Job> {
    Page<Job> findByCompanyIdAndStatus(Long companyId, JobStatus status, Pageable pageable);
    
    @Query("SELECT j FROM Job j WHERE j.expiresAt > :now AND j.status = 'ACTIVE'")
    List<Job> findActiveJobs(LocalDateTime now);
}
```

### 4.5 Specification (Criteria Queries)
Para buscas dinâmicas com filtros compostos.
```java
public class JobSpecification {
    public static Specification<Job> withFilters(JobFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (filter.getWorkModel() != null)
                predicates.add(cb.equal(root.get("workModel"), filter.getWorkModel()));
            if (filter.getMinSalary() != null)
                predicates.add(cb.ge(root.get("salaryMax"), filter.getMinSalary()));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
```

### 4.6 Saga (Orquestração de transações distribuídas)
Para operações que envolvem múltiplos serviços (vaga postada → indexar no ES → enviar notificação).
```java
@Component
public class JobPostingSaga {
    public void execute(Job job) {
        try {
            Job saved = jobRepository.save(job);         // Step 1
            searchService.index(saved);                  // Step 2
            notificationService.notifyCandidates(saved); // Step 3
        } catch (Exception e) {
            compensate(job);  // Rollback logic
            throw e;
        }
    }
}
```

### 4.7 Circuit Breaker (Resilience4j)
```java
@CircuitBreaker(name = "searchService", fallbackMethod = "searchFallback")
public List<JobResponse> search(SearchRequest request) {
    return searchService.search(request);
}

public List<JobResponse> searchFallback(SearchRequest request, Exception e) {
    return jobRepository.findTop50ByOrderByCreatedAtDesc();
}
```

### 4.8 CQRS (Leitura/Escrita separadas — opcional)
```java
// Write side: JPA Entity
@Entity
public class Job { ... }

// Read side: PostgreSQL tsvector (mesmo banco, otimizado para busca)
// Sem necessidade de sincronização — tudo no PostgreSQL
```

---

## 5. Boas Práticas Spring Boot

### 5.1 Configuration Properties
```java
@ConfigurationProperties(prefix = "perfectjob.search")
public record SearchProperties(
    int defaultPageSize,
    int maxPageSize,
    Duration cacheTtl
) { }
```

### 5.2 Bean Validation
```java
public record CreateJobRequest(
    @NotBlank @Size(max = 200) String title,
    @NotNull @Positive Long companyId,
    @NotNull @Valid SalaryRange salary,
    @NotEmpty List<@NotBlank String> skills,
    @NotNull WorkModel workModel,
    @NotNull ExperienceLevel experienceLevel
) { }
```

### 5.3 Exception Handling (Centralizado)
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(NOT_FOUND)
    public ErrorResponse handleNotFound(ResourceNotFoundException ex) {
        return new ErrorResponse("NOT_FOUND", ex.getMessage());
    }
}
```

### 5.4 Paginação Padronizada
```java
public record PageResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages,
    boolean first,
    boolean last
) {
    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(...);
    }
}
```

### 5.5 Cache
```java
@Cacheable(value = "jobs", key = "#id")
public JobResponse findById(Long id) { ... }

@CacheEvict(value = "jobs", key = "#job.id")
public JobResponse update(Job job) { ... }

@Cacheable(value = "trending-skills", unless = "#result.isEmpty()")
public List<String> getTrendingSkills() { ... }
```

### 5.6 Async Processing
```java
@Async("taskExecutor")
@EventListener
public void handleJobPosted(JobPostedEvent event) {
    notificationService.notifyMatchingCandidates(event.getJob());
}
```

### 5.7 Scheduled Tasks
```java
@Scheduled(cron = "0 0 2 * * *")  // 2 AM daily
public void cleanExpiredJobs() {
    jobService.expireOldJobs();
}

@Scheduled(fixedRate = 900_000)  // Every 15 min
public void refreshTrendingSearches() {
    searchService.updateTrendingSearches();
}
```

### 5.8 Rate Limiting
```java
@RateLimiter(name = "apiLimit")
@GetMapping("/api/v1/jobs")
public PageResponse<JobResponse> search(@Valid SearchJobRequest request) { ... }
```

---

## 6. Segurança

### 6.1 JWT Authentication
- Access Token: curta duração (15 min)
- Refresh Token: longa duração (7 dias), rotacionável
- Blacklist de tokens revogados (Redis)

### 6.2 Autorização (RBAC)
```java
@PreAuthorize("hasRole('RECRUITER')")
@PostMapping("/api/v1/jobs")
public JobResponse createJob(@Valid @RequestBody CreateJobRequest request) { ... }

@PreAuthorize("hasRole('CANDIDATE')")
@PostMapping("/api/v1/jobs/{jobId}/apply")
public void apply(@PathVariable Long jobId) { ... }
```

### 6.3 Input Sanitization
- XSS protection via header `X-XSS-Protection`
- SQL Injection prevenção via JPA parameterized queries
- File upload size limits
- Rate limiting por IP e por user

### 6.4 HTTPS
- TLS 1.3 obrigatório em produção
- HSTS habilitado
- CSP headers configurados

---

## 7. Testes

### 7.1 Estrutura de Testes
```
src/test/java/com/perfectjob/
├── unit/                              # ~60% dos testes
│   ├── service/JobServiceTest.java
│   └── controller/JobControllerTest.java
├── integration/                       # ~30% dos testes
│   ├── repository/JobRepositoryTest.java
│   └── api/JobApiTest.java
└── e2e/                               # ~10% dos testes
    └── JobSearchFlowTest.java
```

### 7.2 Dependências de Teste
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>testcontainers</artifactId>       <!-- PostgreSQL, ES, Redis -->
</dependency>
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
</dependency>
<dependency>
    <groupId>com.tngtech.archunit</groupId>
    <artifactId>archunit-junit5</artifactId>      <!-- Testes de arquitetura -->
</dependency>
```

### 7.3 Testes de Arquitetura (ArchUnit)
```java
@Test
void services_should_not_depend_on_controllers() {
    noClasses()
        .that().resideInAPackage("..service..")
        .should().dependOnClassesThat()
        .resideInAPackage("..controller..")
        .check(classes);
}
```

---

## 8. Performance

### 8.1 Database
- Indexes nos campos de busca frequente (title, skills, company_id, status)
- Connection pooling com HikariCP (default Spring Boot)
- Paginação obrigatória em listagens (nunca retornar tudo)
- Use `@BatchSize` para coleções lazy
- Projections/DTOs ao invés de entidades completas quando possível

### 8.2 PostgreSQL Full-Text Search
- Busca de vagas via `tsvector`/`tsquery` com índice GIN (não via JPA LIKE)
- `pg_trgm` para autocomplete e fuzzy matching
- Índices GIN em `search_vector`, `title gin_trgm_ops`, `skills gin_trgm_ops`
- Peso dos campos: title (A=1.0) > skills (B=0.4) > description (C=0.2)

### 8.3 Cache
- Cache de vagas ativas (TTL: 10 min)
- Cache de dados de empresa (TTL: 1 hora)
- Cache de trending skills (TTL: 30 min)
- Cache de sugestões de busca (TTL: 1 hora)

---

## 9. Logging & Monitoramento

### 9.1 Structured Logging (JSON)
```java
@Slf4j
public class JobService {
    public JobResponse create(CreateJobRequest request) {
        log.info("Creating job: companyId={}, title={}", request.companyId(), request.title());
        // ...
        log.info("Job created: id={}", job.getId());
        return response;
    }
}
```

### 9.2 Métricas (Micrometer)
- `perfectjob.jobs.created` (counter)
- `perfectjob.applications.submitted` (counter)
- `perfectjob.search.latency` (timer)
- `perfectjob.matching.score` (gauge)

### 9.3 Health Checks
- `/actuator/health` — Health geral
- `/actuator/health/liveness` — Liveness probe
- `/actuator/health/readiness` — Readiness probe (DB + Redis check)

---

## 10. CI/CD

### 10.1 Pipeline
1. Build + Compile + Checkstyle
2. Unit Tests + Integration Tests
3. Docker Build + Push
4. Deploy (VPS via rsync + docker compose)

### 10.2 Docker
```dockerfile
FROM eclipse-temurin:21-jre-alpine
COPY target/*.jar app.jar
ENTRYPOINT ["java", "-XX:+UseZGC", "-jar", "/app.jar"]
```

---

## 11. Convenções de Código

- **Idioma:** Código em inglês, comentários em inglês
- **Nomeclatura:** camelCase, classes PascalCase, constantes UPPER_SNAKE_CASE
- **DTOs:** Java Records (imutáveis)
- **Services:** Interfaces com uma implementação (testabilidade)
- **Lombok:** `@RequiredArgsConstructor` para DI, `@Slf4j` para logging, `@Getter` sem `@Setter`
- **Immutable First:** Preferir records, `final`, coleções imutáveis
- **Formatação:** Google Java Style Guide
- **Imports:** Sem wildcards (*)
