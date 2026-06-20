# TASK-007: Cache Efetivo com Redis

**Prioridade:** 🟠 ALTA
**Estimativa:** 2.5h
**Dependências:** TASK-006
**Status:** ⬜ Pendente

## Objetivo

Implementar cache efetivo em endpoints read-heavy usando Redis. Invalidar cache em mutações.

## Escopo

### A. Configuração
**Arquivos:**
- `pom.xml` (verificar se tem spring-boot-starter-data-redis)
- `config/RedisConfig.java` (criar)
- `application.yml`

**Ações:**
1. Adicionar `spring-boot-starter-data-redis` (já tem Redis rodando)
2. Criar `RedisConfig` com `RedisCacheManager`:
```java
@Configuration
@EnableCaching
public class RedisConfig {
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(5))
            .disableCachingNullValues()
            .serializeValuesWith(SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));
        return RedisCacheManager.builder(factory)
            .cacheDefaults(config)
            .withCacheConfiguration("jobs", config.entryTtl(Duration.ofMinutes(10)))
            .withCacheConfiguration("companies", config.entryTtl(Duration.ofMinutes(30)))
            .withCacheConfiguration("stats", config.entryTtl(Duration.ofMinutes(1)))
            .build();
    }
}
```

3. Adicionar `spring.data.redis.host`, `port` no `application.yml`

### B. JobService
**Arquivos:**
- `service/JobService.java`

**Ações:**
1. Adicionar `@Cacheable(value = "jobs", key = "#slug")` em `findBySlug`
2. Adicionar `@Cacheable(value = "jobs", key = "'featured'")` em `findActiveJobs` (featured)
3. Adicionar `@CacheEvict(value = "jobs", allEntries = true)` em `create`, `update`, `closeJob`
4. Adicionar `@Cacheable(value = "stats")` em `getStats`

### C. CompanyService
**Arquivos:**
- `service/CompanyService.java`

**Ações:**
1. Adicionar `@Cacheable(value = "companies", key = "#slug")` em `findBySlug`
2. Adicionar `@CacheEvict(value = "companies", allEntries = true)` em `create`, `update`, `delete`
3. Adicionar `@Cacheable(value = "companies", key = "'all'")` em `findAll`

### D. Stats
**Arquivos:**
- `controller/v1/JobController.java`
- `service/JobService.java`

**Ações:**
1. Criar método `getStats()` no service que retorna DTO com dados reais:
   - `activeJobs`: `jobRepository.countByStatus(ACTIVE)`
   - `totalApplications`: `applicationRepository.count()`
   - `applicationsToday`: `applicationRepository.countByCreatedAtAfter(today)`
2. Adicionar métodos no repository:
   - `long countByStatus(JobStatus status)`
   - `long countByCreatedAtAfter(LocalDateTime date)`
3. Cachear com TTL curto (1 min)

### E. Cache Aside Pattern
- Reads: checa cache → se miss, busca DB → popula cache
- Writes: atualiza DB → invalida cache
- NUNCA atualizar cache antes do DB (risco de inconsistência)

### F. Testes
**Arquivos:**
- `test/config/RedisConfigTest.java` (criar)
- `test/service/JobServiceCacheTest.java` (criar)

**Ações:**
1. Validar que `findBySlug` é chamado apenas 1x para 2 reads do mesmo slug
2. Validar que `create` invalida o cache
3. Usar `@SpringBootTest` com `Redis` real (ou embedded se houver lib)

## Critérios de Aceite

- [ ] Cache configurado com Redis
- [ ] `GET /v1/jobs/{slug}` cached por 10 min
- [ ] `GET /v1/jobs/featured` cached por 10 min
- [ ] `GET /v1/companies/{slug}` cached por 30 min
- [ ] `POST /v1/jobs` invalida cache de jobs
- [ ] `GET /v1/jobs/stats` retorna dados reais (não hardcoded)
- [ ] `applicationsToday` conta apenas candidaturas de hoje
- [ ] Testes de cache passam
- [ ] Redis é verificado em `docker exec perfectjob-redis redis-cli keys '*'`

## Como Testar

### Manual
```bash
# 1. Verificar Redis vazio
docker exec perfectjob-redis redis-cli keys '*'

# 2. Fazer request
curl -s "http://localhost:8080/api/v1/jobs/featured" > /dev/null

# 3. Verificar cache populado
docker exec perfectjob-redis redis-cli keys '*'
# Deve aparecer: "jobs::featured"

# 4. Criar vaga (deve invalidar)
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login -d '{...}' | jq -r .accessToken)
curl -X POST http://localhost:8080/api/v1/jobs -H "Authorization: Bearer $TOKEN" -d '{...}'

# 5. Verificar cache invalidado
docker exec perfectjob-redis redis-cli keys '*'
# Não deve ter "jobs::" ou "jobs::*" (allEntries=true)
```

### Automatizado
```java
@Test
void findBySlug_usesCacheOnSecondCall() {
    jobService.findBySlug("dev-java");
    jobService.findBySlug("dev-java");
    verify(jobRepository, times(1)).findBySlug("dev-java");
}
```

## Arquivos Criados/Modificados

- `pom.xml` (verificar dep redis)
- `application.yml` (adicionar config redis)
- `config/RedisConfig.java` (criar)
- `service/JobService.java` (adicionar @Cacheable/@CacheEvict)
- `service/CompanyService.java` (adicionar @Cacheable/@CacheEvict)
- `repository/JobRepository.java` (adicionar countByStatus)
- `repository/ApplicationRepository.java` (adicionar countByCreatedAtAfter)
- `test/config/RedisConfigTest.java` (criar)
- `test/service/JobServiceCacheTest.java` (criar)

## Notas

- `spring-boot-starter-data-redis` inclui Lettuce (default) ou Jedis
- TTL deve ser ajustado conforme frequência de mudança
- Cache de listagens (Page) é mais complexo — considerar cachear apenas o primeiro page
- Não cachear dados sensíveis (PII) sem encryption
- Invalidar cache em TODA mutação, não apenas na entidade afetada (overhead aceitável)
