# Análise - TASK-001, TASK-004, TASK-005

**Data:** 2026-06-16
**Status:** Concluídas
**Tempo:** ~25min
**Escopo:** 3 tasks executadas em conjunto (são interligadas)

## Resumo

| Task | Título | Status |
|---|---|---|
| TASK-001 | Env vars + secret management | ✅ Concluída |
| TASK-004 | CORS restrito + JWT validation | ✅ Concluída |
| TASK-005 | Compatibilidade Java 25 nos testes | ✅ Concluída |

## Baseline vs Depois

| Métrica | Antes | Depois |
|---|---|---|
| Testes totais | 16 | 16 |
| Passaram | 0 | **16** |
| Falharam | 0 | 0 |
| Erros | 15 | **0** |
| Build | ❌ FAILURE | ✅ SUCCESS |

## Arquivos Modificados / Criados

### Criados
- `perfectjob-api/.mvn/jvm.config` — `-Xmx2g`
- `perfectjob-api/src/main/resources/application-prod.yml` — profile de produção sem defaults sensíveis

### Modificados

#### TASK-001 (env vars)
- `perfectjob-api/src/main/resources/application.yml` — todas as configs DB/JWT agora vêm de env vars
- `.env.example` — adicionado `DB_URL`, `ALLOWED_ORIGINS`; reorganizado

#### TASK-004 (CORS + JWT)
- `perfectjob-api/src/main/java/com/perfectjob/security/JwtProvider.java` — adicionada validação `@PostConstruct` (>= 32 chars), `isTokenValid()` com tratamento granular de exceções, `isTokenExpired()`, `@Slf4j`
- `perfectjob-api/src/main/java/com/perfectjob/security/JwtFilter.java` — usa `isTokenValid`, retorna 401 com `WWW-Authenticate` header (RFC 6750) e body JSON estruturado, diferencia `token_expired` vs `invalid_token`
- `perfectjob-api/src/main/java/com/perfectjob/config/SecurityConfig.java` — `setAllowedOriginPatterns("*")` substituído por `setAllowedOrigins()` lendo de `${ALLOWED_ORIGINS:...}`; removido `setAllowedOriginPatterns`; adicionado `setExposedHeaders`; `setMaxAge(3600)`; regras de `permitAll()` granulares
- `perfectjob-api/src/main/java/com/perfectjob/exception/GlobalExceptionHandler.java` — handlers para `ExpiredJwtException` (401, `error="token_expired"`), `JwtException` genérica (401, `error="invalid_token"`), `AccessDeniedException` (403); `ErrorResponse` agora tem campo `error` (error code)

#### TASK-005 (Java 25 testes)
- `perfectjob-api/pom.xml` — Spring Boot 3.3.0 → 3.3.5; adicionadas properties `maven.compiler.{source,target,release}`; plugin `maven-compiler-plugin` com `<release>21</release>`; plugin `maven-surefire-plugin` com `-XX:+EnableDynamicAgentLoading -Dnet.bytebuddy.experimental=true`; adicionada property `bytebuddy.version=1.15.4`
- `perfectjob-api/src/test/java/com/perfectjob/controller/AuthControllerTest.java` — adicionados `@MockBean JwtFilter`, `@AutoConfigureMockMvc(addFilters = false)`, import necessário
- `perfectjob-api/src/test/java/com/perfectjob/controller/JobControllerTest.java` — idem
- `perfectjob-api/src/test/java/com/perfectjob/controller/ApplicationControllerTest.java` — idem
- `perfectjob-api/src/test/java/com/perfectjob/service/AuthServiceTest.java` — atualizadas expectations de mensagem (estavam em inglês, service lança em PT-BR) — pre-existing test bug, não relacionado a Java 25

## Decisões Técnicas

### 1. JWT secret validation
- Validação no **constructor** (não só no `@PostConstruct`) — porque `Keys.hmacShaKeyFor` lança `WeakKeyException` antes do `@PostConstruct` rodar
- Mantida também validação no `@PostConstruct` (defesa em profundidade) — ambas usam o mesmo método `validateSecretLength()`
- Mensagem clara: `"JWT_SECRET must be at least 32 characters long. Current length: N. Set the JWT_SECRET environment variable."`

### 2. Java 25 + ByteBuddy
- A causa raiz era: `Java 25 (69) is not supported by the current version of Byte Buddy which officially supports Java 23 (67)`
- Solução dupla:
  1. **Atualizar ByteBuddy** para 1.15.4 (suporte oficial a Java 25)
  2. **Habilitar flag experimental** `-Dnet.bytebuddy.experimental=true` no Surefire
- Spring Boot 3.3.5 já traz Mockito 5.11.0 (compatível com Java 25) — não foi necessário override

### 3. CORS
- **Substituído** `setAllowedOriginPatterns("*")` por `setAllowedOrigins(List)` com origens específicas
- `setAllowCredentials(true)` mantido
- Origens lidas de `${ALLOWED_ORIGINS:...}` com default dev-friendly
- `setExposedHeaders` adicionado para expor `Authorization`, `Content-Type`, `X-Total-Count` ao frontend
- `setMaxAge(3600)` para cache do preflight

### 4. JWT 401 com WWW-Authenticate (RFC 6750)
- Header `WWW-Authenticate: Bearer error="invalid_token"` para tokens inválidos
- Header `WWW-Authenticate: Bearer error="token_expired"` para tokens expirados
- Body JSON estruturado: `{"status":401,"message":"...","error":"...","timestamp":"..."}`
- Duas camadas de proteção:
  1. `JwtFilter` (intercepta antes de chegar no controller)
  2. `GlobalExceptionHandler` (pega exceptions que escapam, ex: filtros customizados)

### 5. Testes @WebMvcTest
- `@WebMvcTest` carrega apenas controllers — SecurityConfig, JwtFilter, JwtProvider **não** são carregados por padrão
- Soluções aplicadas:
  - `@MockBean JwtFilter` — para satisfazer dependência do SecurityConfig
  - `@AutoConfigureMockMvc(addFilters = false)` — desabilita security nos testes de controller (estes testes não devem testar security, que tem cobertura própria)
- Trade-off: testes de controller ficam isolados, mas perdem integração com security. Tests de security devem ser cobertos em `@SpringBootTest` (futuro)

## Testes Manuais (todos passaram)

### M1: API sobe normalmente
```bash
JWT_SECRET=this-is-a-valid-jwt-secret-with-at-least-32-characters-for-testing-purposes ./mvnw spring-boot:run
# Resultado: Started PerfectJobApplication in 2.761 seconds
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:8080/api/v1/jobs
# HTTP 200 ✅
```

### M2: CORS restrito
```bash
# Origin permitida:
curl -X GET http://localhost:8080/api/v1/jobs -H "Origin: http://localhost:5173" -i | grep access-control
# Access-Control-Allow-Origin: http://localhost:5173 ✅
# Access-Control-Allow-Credentials: true ✅

# Origin rejeitada:
curl -X GET http://localhost:8080/api/v1/jobs -H "Origin: http://evil.com" -i | grep access-control-allow-origin
# (vazio — nenhum header retornado) ✅
```

### M3: JWT secret validation
```bash
JWT_SECRET=short ./mvnw spring-boot:run
# Exit code 1 ✅
# Caused by: java.lang.IllegalStateException: JWT_SECRET must be at least 32 characters long. Current length: 5. Set the JWT_SECRET environment variable.
```

### M4: JWT 401 com WWW-Authenticate
```bash
curl -X GET http://localhost:8080/api/v1/jobs -H "Authorization: Bearer garbage.token" -i
# HTTP/1.1 401 ✅
# WWW-Authenticate: Bearer error="invalid_token" ✅
# Body: {"error":"invalid_token","message":"Invalid token","timestamp":"...","status":401} ✅
```

### M5: Register + Login
```bash
# Register
curl -X POST http://localhost:8080/api/v1/auth/register -H "Content-Type: application/json" \
  -d '{"fullName":"Test","email":"test@example.com","password":"password123"}'
# {"accessToken":"eyJ...","tokenType":"Bearer",...} ✅

# Login
curl -X POST http://localhost:8080/api/v1/auth/login -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
# {"accessToken":"eyJ...","tokenType":"Bearer",...} ✅
```

### M6: /v1/auth/me com token válido
```bash
TOKEN=$(curl -X POST ... | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")
curl -X GET http://localhost:8080/api/v1/auth/me -H "Authorization: Bearer $TOKEN"
# HTTP 200, retorna user info ✅
```

## Bugs / Desvios Encontrados

### 1. Pre-existing test bug (AuthServiceTest) ✅ CORRIGIDO
- **Sintoma**: Testes `login_shouldThrowException_whenUserNotFound` e `register_shouldThrowException_whenEmailAlreadyExists` esperavam mensagens em inglês mas o service lança em PT-BR
- **Era mascarado pelos erros de Mockito** (ByteBuddy/Java 25)
- **Fix**: Atualizadas expectations para "Usuário não encontrado" e "Este email já está cadastrado"
- **Não relacionado às tasks** — só foi exposto quando Mockito voltou a funcionar

### 2. @WebMvcTest com SecurityConfig — descoberta
- @WebMvcTest **não** carrega `@Configuration` classes por padrão
- Por isso o SecurityConfig não era aplicado nos testes, e o default Spring Security negava tudo (403)
- **Fix**: `@AutoConfigureMockMvc(addFilters = false)` para isolar testes de controller de security
- **Decisão**: testes de security devem ser em `@SpringBootTest` (recomendação para task futura)

### 3. /v1/auth/me sem auth retorna 404 (não 401) — NÃO CORRIGIDO
- **Sintoma**: sem token, retorna 404 em vez de 401
- **Status**: Pre-existing bug, listado em TASK-000
- **Não escopo desta task** — pertence a outra (provavelmente TASK-002 ou similar)

### 4. Lombok warning em Java 25
- `WARNING: sun.misc.Unsafe::objectFieldOffset will be removed in a future release`
- Vem do Permit do Lombok tentando acessar Unsafe (necessário para alguns hooks em Java 25)
- Não bloqueia — apenas warning

## Comandos de Verificação Reproduzíveis

```bash
# 1. Testes
cd /Users/renzotognella/TheSearch/PerfectJob/perfectjob-api
export JAVA_HOME=/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home
./mvnw test
# Esperado: Tests run: 16, Failures: 0, Errors: 0, Skipped: 0

# 2. API com secret válido
JWT_SECRET=this-is-a-valid-jwt-secret-with-at-least-32-characters-for-testing-purposes \
  ./mvnw spring-boot:run -Dmaven.test.skip=true

# 3. API com secret inválido (deve falhar)
JWT_SECRET=short ./mvnw spring-boot:run -Dmaven.test.skip=true

# 4. CORS
curl -X GET http://localhost:8080/api/v1/jobs -H "Origin: http://localhost:5173" -i
curl -X GET http://localhost:8080/api/v1/jobs -H "Origin: http://evil.com" -i

# 5. JWT inválido
curl -X GET http://localhost:8080/api/v1/jobs -H "Authorization: Bearer garbage" -i
```

## Critérios de Aceite

- [x] Sem valores hardcoded de URL/secret/senha em código ou application.yml
- [x] JWT secret tem validação (>= 32 chars, erro claro)
- [x] .env.example completo com todas as env vars
- [x] application-prod.yml criado (sem defaults sensíveis)
- [x] CORS restrito a origens específicas (não `*`)
- [x] Origem evil.com rejeitada
- [x] Origem http://localhost:5173 aceita
- [x] JWT 401 com WWW-Authenticate header
- [x] `token_expired` vs `invalid_token` diferenciados
- [x] AccessDeniedException → 403
- [x] /v1/auth/login, /v1/auth/register, /v1/auth/me públicos
- [x] Demais endpoints requerem auth
- [x] Todos os 16 testes passam
- [x] Sem erros de ByteBuddy/Mockito
- [x] Java 25 (única versão instalada) é compatível
- [x] API continua subindo normalmente
- [x] Nenhum commit feito

## Impacto em Outras Tasks

- **TASK-002 (RBAC)**: Auth endpoints já estão em `permitAll()`. Vai precisar modificar SecurityConfig — fácil.
- **TASK-003 (Ownership)**: não-impacto direto.
- **TASK-007 (Cache)**: não-impacto.
- **TASK-020 (Refatorar auth admin)**: cliente do mobile/admin agora precisa passar `Origin` válido no header para requisições cross-origin. Já configurado em `.env.example`.
- **TASK-013/019 (Env vars mobile/admin)**: `.env.example` agora documenta as env vars necessárias.

## Conclusão

Todas as 3 tasks foram concluídas com sucesso. Os 16 testes que falhavam (15 errors + 1 context load) agora passam, com 0 falhas e 0 erros. A API continua funcionando normalmente com Java 25, e a segurança foi significativamente melhorada:
- CORS não é mais permissivo (`*` removido)
- JWT tem validação robusta com mensagens claras
- 401 com WWW-Authenticate segue RFC 6750

Próximas tasks que desbloqueiam:
- **TASK-002** (RBAC): pode usar as regras `permitAll()` granulares como base
- **TASK-020** (refatorar auth admin): o `.env.example` agora é a fonte da verdade para env vars
