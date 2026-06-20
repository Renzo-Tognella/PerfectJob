# Análise - TASK-000: Auditoria e Preparação

**Data:** 2026-06-16
**Status:** Concluída com ressalvas
**Tempo:** ~15min

## Ambiente Verificado

| Componente | Versão | Status |
|---|---|---|
| Docker | 28.0.1 | OK (rodando) |
| Node | v20.19.4 | OK |
| Java (Homebrew) | 25.0.2 | Detectado (não 21) |
| PostgreSQL | 16 (docker) | OK |
| Redis | 7 (docker) | OK |

### Containers ativos
- `perfectjob-postgres` (port 5432) - healthy
- `perfectjob-redis` (port 6379) - healthy
- Containers legados: `memory-qdrant`, `memory-neo4j` (de outros projetos, não interferem)

## Descobertas Importantes

### 1. Java 25 vs Java 21

**Achado**: Apenas OpenJDK 25 está instalado, não 21. O Spring Boot 3.3.0 declara Java 21.

**Impacto esperado**: Incompatibilidade de ByteBuddy com Java 25 nos testes.

**Resultado real**: A aplicação SOBE normalmente com Java 25 (Spring Boot 3.3 é compatível com versões superiores). Apenas os testes com Mockito falham — a API de produção funciona.

**Decisão**: Manter Java 25 (instalado) e ajustar testes para contornar (TASK-005). Não exigir instalação de Java 21.

### 2. API funcional
- Build OK
- Sobe em ~3.5s
- Endpoint `/v1/jobs` retorna `Page<T>` corretamente
- Validações Bean Validation funcionam (email inválido retorna 400)
- CORS está permissivo demais (`*` + credentials) — TASK-004
- `/v1/auth/me` retorna 404 quando não autenticado (deveria ser 401) — verificar em TASK-002

### 3. Stats hardcoded
- `applicationsToday: 0` está hardcoded em `JobController.stats`
- Confirmado bug — TASK-011

### 4. CORS
- `Access-Control-Allow-Origin: http://localhost:5173` retornou (origin específica foi aceita)
- Mas config tem `setAllowedOriginPatterns("*")` + `setAllowCredentials(true)` — risco
- TASK-004

### 5. Admin e Mobile
- Admin: `npm install` OK, TypeScript compila sem erros
- Mobile: `npm install` OK, 2 erros TypeScript em `Button.tsx` (pre-existentes)
- 40 vulnerabilidades no mobile (npm audit) — análise posterior

## Ações Tomadas

1. ✅ Subi Docker Compose
2. ✅ Aguardei PostgreSQL e Redis ficarem healthy
3. ✅ Verifiquei Java (25) e Maven (3.9.15)
4. ✅ Subi API com Java 25 — funcionou
5. ✅ Testei 7 endpoints públicos — todos responderam
6. ✅ Instalei deps do admin e mobile
7. ✅ Validei TypeScript (admin OK, mobile com 2 erros pré-existentes)

## Próximas Tasks

Esta task libera:
- **TASK-001**: env vars + secret management (depende desta)
- **TASK-005**: testes backend (depende desta)

## Problemas Não Bloqueantes

1. **Aplicação não testada com Java 21**: vamos seguir com Java 25
2. **Banco vazio**: stats sempre retorna 0; vou popular com seed na TASK-011
3. **Mobile com 2 erros TS**: corrigir em TASK-018
4. **Vulnerabilidades npm**: avaliar separadamente (não bloqueia)

## Critérios de Aceite — Status

- [x] Docker rodando
- [x] PostgreSQL respondendo
- [x] Redis respondendo
- [x] Java disponível (versão 25, ajustável)
- [x] Node 20+ disponível
- [x] Maven wrapper funcional
- [x] API sobe sem erro
- [x] Swagger disponível
- [x] Flyway aplicou migrations (V1, V2, V3)
- [x] Admin compila
- [x] Mobile tem 2 erros TS (pré-existentes, marcados para correção posterior)
- [x] Endpoints públicos respondem
- [x] Nenhum commit foi feito

## Comandos de Verificação Reproduzíveis

```bash
# Ambiente
java -version
docker --version
node --version

# Subir ambiente
./setup.sh

# Verificar infra
docker exec perfectjob-postgres pg_isready
docker exec perfectjob-redis redis-cli ping

# Subir API
cd perfectjob-api && ./mvnw spring-boot:run

# Em outro terminal, verificar:
curl http://localhost:8080/api/v1/jobs
curl http://localhost:8080/api/v1/companies
curl http://localhost:8080/api/swagger-ui.html

# Type check
cd perfectjob-admin && npx tsc --noEmit
cd perfectjob-mobile && npx tsc --noEmit
```

## Conclusão

Ambiente está pronto para iniciar as correções. Decisão de manter Java 25 reduz fricção e evita nova instalação. A API funciona com Java 25; os testes precisam de ajustes (TASK-005).

Nenhuma alteração de código foi feita nesta task. Apenas verificação e setup.
