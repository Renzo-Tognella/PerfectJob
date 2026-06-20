# TASK-004: CORS Restrito e JWT Validation

**Prioridade:** 🔴 CRÍTICA
**Estimativa:** 1.5h
**Dependências:** TASK-001
**Status:** ⬜ Pendente

## Objetivo

Restringir CORS a origens específicas (não `*` com credentials) e validar JWT robustamente.

## Escopo

### A. CORS
**Arquivos:**
- `config/SecurityConfig.java`
- `.env.example`

**Ações:**
1. Remover `setAllowedOriginPatterns("*")`
2. Configurar origens específicas via env var: `${ALLOWED_ORIGINS:http://localhost:5173,http://localhost:8081}`
3. Permitir credenciais (cookies) — útil para futuro refresh token
4. Métodos: GET, POST, PATCH, PUT, DELETE, OPTIONS
5. Headers: Authorization, Content-Type, Accept, X-Requested-With
6. Headers expostos: X-Total-Count, X-Page-Number
7. Max-Age: 3600 (cache preflight por 1h)

### B. JWT Provider
**Arquivos:**
- `security/JwtProvider.java`
- `security/JwtFilter.java`

**Ações:**
1. **JwtProvider**:
   - Validar tamanho mínimo do secret (≥ 32 bytes) no `@PostConstruct`
   - Lançar `IllegalStateException` se secret inválido (fail-fast)
   - Validar formato do token antes de parsear
   - Adicionar método `isTokenValid(String token)` que retorna boolean (sem lançar)
   - Tratar `ExpiredJwtException` separadamente
2. **JwtFilter**:
   - Chamar `isTokenValid` em vez de `validateToken` (que lançava exception)
   - Em caso de token inválido/expirado, retornar 401 com body estruturado
   - Adicionar header `WWW-Authenticate: Bearer error="invalid_token"` (RFC 6750)
   - Logar tentativas de token inválido (WARN, com IP)

### C. Handler 401 padronizado
**Arquivos:**
- `exception/GlobalExceptionHandler.java`

**Ações:**
1. Handler para `ExpiredJwtException` → 401 com `error="token_expired"`
2. Handler para `JwtException` genérica → 401 com `error="invalid_token"`
3. Handler para `BadCredentialsException` → 401 (já existe, melhorar mensagem)

### D. Token Blacklist (Opcional — v1 não tem refresh)
Não implementar nesta task. Tokens são stateless e expiram em 15 min. Refresh tokens serão adicionados em task futura.

## Critérios de Aceite

- [ ] `Origin: http://localhost:5173` é aceito pelo CORS
- [ ] `Origin: http://evil.com` é rejeitado pelo CORS
- [ ] Secret < 32 chars na inicialização → erro claro
- [ ] Secret ≥ 32 chars na inicialização → API sobe
- [ ] Token expirado → 401 com `error="token_expired"`
- [ ] Token malformado → 401 com `error="invalid_token"`
- [ ] Token válido → usuário autenticado
- [ ] `WWW-Authenticate` header presente em 401
- [ ] `Vary: Origin` header presente em responses

## Como Testar

### Manual
```bash
# 1. CORS OK
curl -X OPTIONS http://localhost:8080/api/v1/jobs \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -i | grep -i access-control

# 2. CORS rejected
curl -X OPTIONS http://localhost:8080/api/v1/jobs \
  -H "Origin: http://evil.com" \
  -H "Access-Control-Request-Method: POST" \
  -i | grep -i access-control

# 3. JWT expirado
# (usar token gerado com secret diferente ou esperar 15 min)
curl -X GET http://localhost:8080/api/v1/jobs \
  -H "Authorization: Bearer EXPIRED_TOKEN" \
  -i | grep -i www-authenticate
```

### Automatizado
- `SecurityConfigCorsTest`: 2 testes (origem permitida, origem negada)
- `JwtProviderTest`: 6 testes (secret inválido, token válido, expirado, malformado, etc.)
- `JwtFilterTest`: 4 testes

## Arquivos Criados/Modificados

- `config/SecurityConfig.java` (modificar)
- `security/JwtProvider.java` (modificar)
- `security/JwtFilter.java` (modificar)
- `exception/GlobalExceptionHandler.java` (modificar)
- `.env.example` (modificar)
- `test/security/JwtProviderTest.java` (criar)
- `test/security/JwtFilterTest.java` (criar)
- `test/config/SecurityConfigCorsTest.java` (criar)

## Notas

- Para ambientes múltiplos (dev, staging, prod), usar ALLOWED_ORIGINS separado
- Em dev, adicionar localhost:5173 (admin) e localhost:8081 (expo web)
- Em prod, apenas origens HTTPS confiáveis
- `WWW-Authenticate` é RFC 6750 padrão para Bearer tokens
