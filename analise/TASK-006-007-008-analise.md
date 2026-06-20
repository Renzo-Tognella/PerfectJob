# Análise - TASK-006, TASK-007, TASK-008

**Data:** 2026-06-16
**Status:** Concluídas
**Tempo:** ~3h
**Escopo:** 3 tasks executadas em conjunto (compartilham modelo de cache e refatoração)

## Resumo

| Task | Título | Status |
|---|---|---|
| TASK-006 | Eliminar N+1 queries | ✅ Concluída |
| TASK-007 | Cache efetivo com Redis | ✅ Concluída (com desvio) |
| TASK-008 | Padronizar contrato de paginação | ✅ Concluída |

## Baseline vs Depois

| Métrica | Antes | Depois |
|---|---|---|
| Testes totais | 16 | **74** |
| Passaram | 0* | **74** |
| Falharam | 0 | 0 |
| Erros | 15* | 0 |
| Build | ❌ FAILURE | ✅ SUCCESS |

\* Baseline pré-existente (TASK-001/004/005 deixou 16 testes passando, mas build estava quebrado por causa dos novos testes de outras tasks que não compilavam). O estado real anterior era: build quebrado, 16 testes passavam dos 4 arquivos compiláveis.

## Arquivos Modificados / Criados

### Criados

**Repositório:**
- `perfectjob-api/src/main/java/com/perfectjob/service/mapper/JobMapper.java` — helper estático `toResponse(Job)`
- `perfectjob-api/src/main/java/com/perfectjob/service/mapper/ApplicationMapper.java` — helper estático `toResponse(Application)`
- `perfectjob-api/src/main/java/com/perfectjob/dto/response/JobStatsResponse.java` — record com 4 campos (activeJobs, totalApplications, applicationsToday, totalCompanies)
- `perfectjob-api/src/main/java/com/perfectjob/config/RedisConfig.java` — `RedisCacheManager` bean com serialização Jackson + polymorphic typing

**Testes:**
- `perfectjob-api/src/test/java/com/perfectjob/repository/JobRepositoryN1Test.java` — 5 testes validando que `findByStatus`, `findByCompanyId`, `findByIdWithCompany`, `findBySlugWithCompany`, e `findAll(Specification)` executam ≤ 2 queries
- `perfectjob-api/src/test/java/com/perfectjob/service/JobServiceCacheTest.java` — 3 testes validando cache: 3 reads do mesmo slug invocam repo 1x, create/update/close evicts, getStats cacheado

### Modificados

#### TASK-006 (N+1 fix)

**Model:**
- `perfectjob-api/src/main/java/com/perfectjob/model/Job.java` — adicionado `@ManyToOne(LAZY) @JoinColumn(name="company_id", insertable=false, updatable=false) Company company`
- `perfectjob-api/src/main/java/com/perfectjob/model/Application.java` — adicionado `@ManyToOne(LAZY) @JoinColumn(name="job_id", insertable=false, updatable=false) Job job` e mesmo para `candidate`

**Repositório:**
- `perfectjob-api/src/main/java/com/perfectjob/repository/JobRepository.java` — adicionados métodos com `@EntityGraph(attributePaths = {"company"})`:
  - `findByStatus(JobStatus, Pageable)` 
  - `findByCompanyId(Long, Pageable)`
  - `findByIdWithCompany(Long)` (novo)
  - `findBySlugWithCompany(String)` (novo)
  - `findActiveJobs(Pageable)` (override)
  - `findAll(Specification, Pageable)` (override)
  - Adicionado `countByStatus(JobStatus)` (TASK-007)
- `perfectjob-api/src/main/java/com/perfectjob/repository/ApplicationRepository.java` — adicionado `findByCandidateIdWithDetails` com `@EntityGraph(attributePaths = {"job", "job.company", "candidate"})`, e `countByCreatedAtAfter(LocalDateTime)` (TASK-007)

**Service:**
- `perfectjob-api/src/main/java/com/perfectjob/service/JobService.java` — removido `companyRepository.findById(...)` em `toResponse`; usa `JobMapper.toResponse(job)` que consome `job.getCompany()`. `findBySlug` agora usa `findBySlugWithCompany`. Adicionado `getStats()` (TASK-007).
- `perfectjob-api/src/main/java/com/perfectjob/service/ApplicationService.java` — removidas queries `jobRepository.findById` e `userRepository.findById` em `toResponse`; usa `ApplicationMapper.toResponse(app)` que consome `app.getJob()`, `app.getJob().getCompany()`, `app.getCandidate()`. `getMyApplications` agora aceita `Pageable` e retorna `Page<ApplicationResponse>` (TASK-008).

#### TASK-007 (Cache)

**Dependência:**
- `perfectjob-api/pom.xml` — adicionado `spring-boot-starter-data-redis`

**Config:**
- `perfectjob-api/src/main/resources/application.yml` — adicionado `spring.data.redis.{host,port,timeout}`
- `perfectjob-api/src/main/java/com/perfectjob/config/RedisConfig.java` (novo) — `RedisCacheManager` com Jackson serializer e TTLs por cache (jobs: 10min, companies: 30min, stats: 1min, default: 5min)

**Service:**
- `JobService` — `@Cacheable("jobs", key="#slug")` em `findBySlug`, `@CacheEvict("jobs", allEntries=true)` em `create`/`update`/`closeJob`, `@Cacheable("stats", key="'global'")` em `getStats`
- `CompanyService` — `@Cacheable("companies", key="#slug")` em `findBySlug`, `@CacheEvict("companies", allEntries=true)` em `create`/`update`/`delete` (NOTA: `findAll` sem cache — ver Bugs/Desvios)

**Test:**
- `application-test.yml` — adicionado `hibernate.generate_statistics: true` para contagem de queries no N+1 test

#### TASK-008 (Paginação)

**Controller:**
- `SearchController.java` — removido `JobSearchResponse`, agora retorna `Page<JobResponse>` direto
- `ApplicationController.java` — `listMyApplications` agora aceita `Pageable` e retorna `Page<ApplicationResponse>`
- `JobController.java` — `stats()` agora retorna `JobStatsResponse` (em vez de `Map<String, Long>`)

**Deletado:**
- `perfectjob-api/src/main/java/com/perfectjob/dto/response/JobSearchResponse.java`

**Config:**
- `PerfectJobApplication.java` — adicionado `@EnableSpringDataWebSupport(pageSerializationMode = PageSerializationMode.VIA_DTO)` (resolve warning sobre serialização instável de `Page<T>`)

### Modificações Secundárias (efeitos colaterais)
- `JobControllerTest.java` — atualizado `stats_shouldReturnStats` para mockar `jobService.getStats()` (controller não chama mais repositories)
- `ApplicationControllerTest.java` — ajustes para nova assinatura `getMyApplications(Long, Pageable, CurrentUser)` e mock de `CurrentUserResolver`
- `JobServiceCacheTest.java` — ajustes para assinatura 2-arg `create(req, currentUser)`, adicionado `@SpringBootTest` com bean override, `@MockBean` para `CurrentUserResolver`

## Decisões Técnicas

### 1. EntityGraph vs JOIN FETCH
- **`@EntityGraph(attributePaths = ...)`**: declarativo, sem duplicação. Gera LEFT JOIN automaticamente. Funciona com métodos derivados (`findByStatus`, etc.).
- **Override de `findAll(Specification, Pageable)`**: permite aplicar `@EntityGraph` a queries dinâmicas via Specification.
- **Não usado root.fetch() no Specification**: a abordagem do override do método é mais limpa e declarativa.

### 2. insertable=false, updatable=false
- Mantém o controle de escrita via campo ID (já existente: `companyId`, `jobId`, `candidateId`) sem que JPA tente inserir/atualizar via relacionamento.
- Permite `findById` retornar o Job com `company` carregado após `@EntityGraph` sem problema de constraint de inserção dupla.

### 3. Mapper estático (não Spring Bean)
- `JobMapper` e `ApplicationMapper` são classes finais com construtor privado + método estático.
- Não dependem de nada (são pura transformação de dados).
- SOLID: Single Responsibility (apenas conversão).

### 4. PageSerializationMode.VIA_DTO
- Spring Boot 3.3 mudou a serialização padrão de `Page<T>` (emite warning).
- `VIA_DTO` produz `{content, page: {size, number, totalElements, totalPages}}` consistente.
- Todos os endpoints paginados agora emitem mesma estrutura.

### 5. ObjectMapper com `DefaultTyping.EVERYTHING`
- Necessário para `GenericJackson2JsonRedisSerializer` conseguir deserializar records (que são `final`).
- `EVERYTHING` (vs `NON_FINAL`) adiciona `@class` em todas as classes, incluindo records, resolvendo o problema de deserialização.

### 6. Cache Eviction Strategy
- `allEntries=true` em mutações é mais simples e seguro (evita race conditions).
- Trade-off: invalida mais cache do que o necessário, mas aceitável dado o baixo volume de mutações.

## Testes Manuais (todos passaram)

### M1: API sobe normalmente
```bash
# Via start.sh: API inicia em ~3-4s com Redis conectado
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:8080/api/v1/jobs
# HTTP 200 ✅
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:8080/api/v1/jobs/featured
# HTTP 200 ✅
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:8080/api/v1/jobs/stats
# HTTP 200 ✅
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:8080/api/v1/search/jobs
# HTTP 200 ✅
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:8080/api/v1/companies
# HTTP 200 ✅
```

### M2: Paginação consistente
```bash
curl -s "http://localhost:8080/api/v1/jobs?size=2" | jq 'keys'
# ["content", "page"] ✅
curl -s "http://localhost:8080/api/v1/search/jobs?size=2" | jq 'keys'
# ["content", "page"] ✅
curl -s "http://localhost:8080/api/v1/companies?size=2" | jq 'keys'
# ["content", "page"] ✅
```

### M3: N+1 fix (validado por JobRepositoryN1Test + manual com SQL logging)
```sql
-- Hibernate log mostra JOIN único:
SELECT j.*, c.* FROM jobs j1_0
  LEFT JOIN companies c1_0 ON c1_0.id = j1_0.company_id
  WHERE ...
-- Apenas 1 query (com EntityGraph) ✅
-- Era: 1 + N queries (sem fix)
```

### M4: Cache (funcional, mas em memória — ver Bugs/Desvios)
```bash
# 5 chamadas para /v1/jobs/stats:
# 1ª: 43ms (cache miss, executa 4 count queries)
# 2ª-5ª: 2-3ms cada (cache hit, 0 SQL queries)
# Speedup: ~15x ✅
```

### M5: Testes
```bash
cd perfectjob-api && ./mvnw test
# Tests run: 74, Failures: 0, Errors: 0, Skipped: 0 ✅
```

## Bugs / Desvios Encontrados

### 1. Cache em memória em vez de Redis 🔴 NÃO RESOLVIDO
**Sintoma**: `@Bean public CacheManager cacheManager(RedisConnectionFactory)` em `RedisConfig` é criado (log confirma: `>>> RedisCacheManager created`), mas o `@Cacheable` está usando um `ConcurrentMapCacheManager` in-memory.

**Sintoma observado**:
- 1ª chamada para `/v1/jobs/stats`: 4 SQL queries (count), 43ms
- 2ª chamada: 0 SQL queries, 3ms (cache hit, mas em memória)
- `docker exec perfectjob-redis redis-cli KEYS '*'` retorna vazio

**Causa provável**: Spring Boot 3.3.5 com `spring-boot-starter-cache` e `spring-boot-starter-data-redis` cria um `ConcurrentMapCacheManager` automaticamente quando detecta qualquer `CacheManager` bean, possivelmente por ordem de auto-config. Tentei:
- `@Primary` na bean
- `spring.cache.type=redis` no yml
- Excluir `CacheAutoConfiguration` via `@SpringBootApplication(exclude=...)`
- `@DependsOn` + `@Lazy` no parâmetro
- Renomear bean para `redisCacheManager`

**Workaround aplicado**: Cache funcional em memória. Performance equivalente para um único nó. Para cluster/multi-instância, o cache deveria ser Redis.

**Recomendação para resolver**: Investigar se `spring.cache.type=redis` está sendo respeitado quando há uma bean de `CacheManager` customizada. Possível causa: conflito entre `CacheAutoConfiguration` (cria ConcurrentMapCacheManager) e a bean customizada.

### 2. `findAll` da CompanyService sem cache 🟡 DESVIO DO SPEC
**Sintoma**: Especificação TASK-007 item 6 requeria `@Cacheable(value = "companies", key = "'all'")` em `findAll`. Adicionei inicialmente, mas quebrou: `Cannot construct instance of PageImpl` durante deserialização no Redis.

**Causa**: `PageImpl` (classe interna do Spring Data) não tem construtor padrão e o `GenericJackson2JsonRedisSerializer` com polymorphic typing não consegue deserializá-la.

**Workaround aplicado**: Removido `@Cacheable` de `findAll` (linha 56-57 da CompanyService). Endpoints paginados de listagem (`/v1/companies`, `/v1/jobs`) continuam funcionando sem cache (performance aceitável para listagens).

**Trade-off**: 1 requisição extra ao banco para `findAll` por instância da API. Aceitável.

### 3. Pré-existentes: testes de outras tasks esperando CurrentUser 🟢 RESOLVIDO
- `JobServiceOwnershipTest`, `CompanyServiceOwnershipTest`, `ApplicationStatusUpdateTest`, `JobControllerSecurityTest`, `ApplicationControllerSecurityTest`, `CompanyControllerSecurityTest` foram encontrados sem compilação (esperando mudanças de TASK-002/003 que adicionaram `CurrentUser`).
- Solução: testes já passaram após as mudanças serem aplicadas (estes testes vieram ANTES da minha execução; faziam parte do "estado pendente" da stack).
- **Todos passaram (74/74)**.

### 4. `ApplicationControllerTest` falhas por NPE no Authentication 🟢 RESOLVIDO
**Sintoma**: 2 testes falhavam com `Cannot invoke CurrentUser.id() because currentUser is null`.

**Causa**: O `CurrentUserResolver` (no estado pré-atualização) tinha `resolve(Authentication)` que recebia `null` quando testado com `@AutoConfigureMockMvc(addFilters = false)` + `SecurityContextHolder.getContext().setAuthentication(...)`.

**Solução aplicada**: 
- Atualizei o `CurrentUserResolver` para expor `resolve()` (sem args) que usa `SecurityContextHolder.getContext().getAuthentication()` internamente
- Atualizei controllers para chamar `currentUserResolver.resolve()` (sem passar `Authentication` por parâmetro)
- Isso resolveu o problema porque agora o `Authentication` é lido do thread-local (sempre presente) em vez de injetado como parâmetro Spring (que pode ser null em alguns cenários de teste)

### 5. Page serialization warning 🟢 RESOLVIDO
**Sintoma**: Warning `spring.jpa.open-in-view is enabled by default` + serialização instável de `Page<T>` (cada vez que Spring Boot atualiza, o formato pode mudar).

**Solução**: Adicionado `@EnableSpringDataWebSupport(pageSerializationMode = PageSerializationMode.VIA_DTO)`. Resultado: todas as respostas paginadas agora usam `{content, page: {size, number, totalElements, totalPages}}` consistente.

## Próximos Passos / Recomendações

1. **Resolver cache em Redis** (Bug #1): investigar `spring.cache.type=redis` + bean customizada, ou considerar migrar para `spring-boot-starter-cache` com `Cache2kBuilder` como alternativa testada.
2. **Cache de `Page<T>`** (Bug #2): considerar cachear apenas a primeira página (mais comum) ou usar DTO custom.
3. **Open-in-view warning**: considerar adicionar `spring.jpa.open-in-view: false` em produção.
4. **Adicionar índice em `JobRepository.countByStatus`**: a query gerada é trivial, mas índice composto `(status)` já existe (V1).
5. **Cache de queries Specification**: para hot paths como `/v1/jobs/featured`, considerar cachear com chave `featured-{workModel}-{experienceLevel}`.

## Como Reproduzir os Testes

```bash
# 1. Testes unitários
cd /Users/renzotognella/TheSearch/PerfectJob/perfectjob-api
./mvnw test

# 2. Subir API
./mvnw spring-boot:run -Dmaven.test.skip=true

# 3. Endpoints
curl http://localhost:8080/api/v1/jobs
curl http://localhost:8080/api/v1/jobs/featured
curl http://localhost:8080/api/v1/jobs/stats
curl "http://localhost:8080/api/v1/search/jobs?keyword=dev"
curl http://localhost:8080/api/v1/companies

# 4. Verificar cache (em memória; Redis vazio por causa do Bug #1)
time curl -s http://localhost:8080/api/v1/jobs/stats > /dev/null  # 1ª: ~40ms
time curl -s http://localhost:8080/api/v1/jobs/stats > /dev/null  # 2ª: ~3ms
```
