# TASK-006: Eliminar N+1 Queries

**Prioridade:** 🟠 ALTA
**Estimativa:** 2h
**Dependências:** TASK-002
**Status:** ⬜ Pendente

## Objetivo

Eliminar queries N+1 em `JobService.toResponse` e `ApplicationService.toResponse`. Carregar Company junto com Job em uma única query.

## Escopo

### A. JobService
**Arquivos:**
- `service/JobService.java`
- `repository/JobRepository.java`

**Ações:**
1. Criar método no repository com `@EntityGraph` ou `JOIN FETCH`:
```java
@EntityGraph(attributePaths = {"company"})
@Query("SELECT j FROM Job j WHERE j.id = :id")
Optional<Job> findByIdWithCompany(@Param("id") Long id);

@EntityGraph(attributePaths = {"company"})
Page<Job> findByStatus(JobStatus status, Pageable pageable);

@EntityGraph(attributePaths = {"company"})
Page<Job> findByCompanyId(Long companyId, Pageable pageable);
```

2. Refatorar `JobService.toResponse`:
   - Receber `Job` já com Company carregada (ou `Job + Company` separados)
   - Não fazer `companyRepository.findById` dentro do loop

3. Refatorar `search`, `findBySlug`, `findActiveJobs` para usar métodos com EntityGraph

4. Criar `JobMapper` (helper estático) para conversão `Job → JobResponse`

### B. ApplicationService
**Arquivos:**
- `service/ApplicationService.java`
- `repository/ApplicationRepository.java`

**Ações:**
1. Criar query que carrega Job + Company + Candidate em uma única query:
```java
@Query("SELECT a FROM Application a " +
       "LEFT JOIN FETCH a.job j " +
       "LEFT JOIN FETCH j.company " +
       "LEFT JOIN FETCH a.candidate " +
       "WHERE a.candidateId = :candidateId")
List<Application> findByCandidateIdWithDetails(@Param("candidateId") Long candidateId);
```

2. Adicionar relacionamento `@ManyToOne` em `Application.job` e `Application.candidate` (ou usar EntityGraph)

3. Refatorar `toResponse` para usar dados já carregados (sem queries adicionais)

4. Criar `ApplicationMapper` (helper estático)

### C. Specification
**Arquivos:**
- `service/JobSpecification.java`

**Ações:**
1. Verificar se Specification precisa de EntityGraph (não é trivial — usar query alternativa se necessário)
2. Considerar criar método dedicado no repository para busca com Specification + Company

### D. Testes
**Arquivos:**
- `test/repository/JobRepositoryN1Test.java` (criar)
- `test/service/JobServiceN1Test.java` (criar)

**Ações:**
1. Contar queries executadas (usar `SHOW SQL` ou `CountingQueryListener`)
2. Validar que busca de 20 jobs executa 1 query (não 21)
3. Validar que busca de 50 applications executa 1 query (não 200+)

## Critérios de Aceite

- [ ] `GET /v1/jobs` com 20 vagas executa ≤ 2 queries (1 para jobs, 1 para companies em batch ou 1 com JOIN)
- [ ] `GET /v1/applications` com 50 applications executa ≤ 2 queries
- [ ] Logs do Hibernate (em dev) mostram redução significativa
- [ ] Testes N+1 passam
- [ ] Nenhuma regressão funcional

## Como Testar

### Manual
```bash
# 1. Ativar SQL logging
# Em application-dev.yml: spring.jpa.show-sql: true

# 2. Buscar vagas
curl -s "http://localhost:8080/api/v1/jobs?size=20" -H "Authorization: Bearer $TOKEN"
# Contar linhas de SELECT no log: deve ser 1-2, não 21+

# 3. Buscar applications
curl -s "http://localhost:8080/api/v1/applications" -H "Authorization: Bearer $TOKEN"
# Contar linhas: deve ser 1, não 50+
```

### Automatizado
```java
@Test
void searchJobs_executesOneQuery() {
    // Arrange: 20 jobs
    // Act
    jobService.search(request, pageable);
    // Assert
    verify(entityManager, times(1)).createQuery(anyString());
}
```

## Arquivos Criados/Modificados

- `service/JobService.java` (modificar)
- `service/ApplicationService.java` (modificar)
- `service/JobSpecification.java` (modificar)
- `repository/JobRepository.java` (modificar)
- `repository/ApplicationRepository.java` (modificar)
- `model/Application.java` (modificar — adicionar relacionamentos JPA)
- Novo: `service/mapper/JobMapper.java`
- Novo: `service/mapper/ApplicationMapper.java`
- `test/repository/JobRepositoryN1Test.java` (criar)
- `test/service/JobServiceN1Test.java` (criar)

## Notas

- `@EntityGraph` é mais limpo que `JOIN FETCH` (declarativo, sem duplicação)
- Cuidado com `MultipleBagFetchException` (não fetch 2+ Lists na mesma query)
- Para testes, contar queries usando `org.hibernate.stat.Statistics` ou `Hypersistence Utils`
- Considerar uso de `@BatchSize` para fallback (carrega sob demanda em batch)
