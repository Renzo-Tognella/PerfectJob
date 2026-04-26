# PerfectJob — Skill: Segurança

## Propósito
Esta skill define políticas, práticas e padrões de segurança para o projeto PerfectJob (Spring Boot + React Native).

---

## 1. Princípios Fundamentais

1. **Defense in Depth** — Segurança em múltiplas camadas (rede → aplicação → dados).
2. **Least Privilege** — Cada serviço/usuário tem acesso mínimo necessário.
3. **Secure by Default** — Toda feature deve ser segura sem configuração extra.
4. **Never Trust Input** — Todo input é hostil até prova em contrário.
5. **Fail Securely** — Falhas devem resultar em negação, não bypass.
6. **Keep It Simple** — Complexidade é inimiga da segurança.

---

## 2. Threat Model

### 2.1 Ameaças Identificadas

| Ameaça | Impacto | Probabilidade | Mitigação |
|--------|---------|---------------|-----------|
| SQL Injection | Alto | Baixa | JPA parameterized queries |
| XSS | Médio | Média | Input sanitization, CSP |
| CSRF | Médio | Baixa | SameSite cookies, CSRF tokens |
| JWT Token Theft | Alto | Média | Short-lived tokens, refresh rotation |
| Credential Stuffing | Médio | Alta | Rate limiting, 2FA |
| Insecure Direct Object Reference (IDOR) | Alto | Média | Ownership checks em cada endpoint |
| Sensitive Data Exposure | Alto | Média | Encryption at rest, HTTPS only |
| API Abuse / Scraping | Médio | Alta | Rate limiting per user/IP |
| Broken Access Control | Alto | Média | RBAC + ownership validation |
| Supply Chain Attack | Alto | Baixa | Dependency scanning, lockfiles |

---

## 3. Segurança no Backend (Spring Boot)

### 3.1 Autenticação

```java
// JWT Config
@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/jobs/**").authenticated()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
```

### 3.2 JWT Best Practices
- Access token: 15 minutos de validade
- Refresh token: 7 dias, armazenado no httpOnly cookie
- Refresh rotation: cada uso gera novo refresh token
- Blacklist de tokens revogados (Redis)
- JWK para rotação de chaves

### 3.3 Autorização (RBAC)
```java
@Component
public class JobSecurityGuard {
    public boolean canAccess(User user, Job job) {
        // Admins podem tudo
        if (user.hasRole(Role.ADMIN)) return true;
        // Recruiter só acessa vagas da sua empresa
        if (user.hasRole(Role.RECRUITER)) return job.getCompanyId().equals(user.getCompanyId());
        // Candidate acessa qualquer vaga ativa
        return job.getStatus() == JobStatus.ACTIVE;
    }
}
```

### 3.4 Input Validation
```java
// Bean Validation em todos os DTOs
public record CreateJobRequest(
    @NotBlank @Size(max = 200)
    @SafeHtml  // Custom validator: sem tags HTML
    String title,

    @Size(max = 5000)
    @SafeHtml
    String description,

    @NotNull @Positive
    Long companyId
) { }
```

### 3.5 SQL Injection Prevention
```java
// ✅ CORRETO: Parameterized queries
@Query("SELECT j FROM Job j WHERE j.title LIKE %:keyword%")
List<Job> searchByTitle(@Param("keyword") String keyword);

// ❌ ERRADO: Concatenar strings
// String query = "SELECT * FROM jobs WHERE title LIKE '%" + keyword + "%'";
```

### 3.6 CORS Configuration
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("https://perfectjob.com"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return source;
}
```

### 3.7 Rate Limiting
```yaml
# application.yml
resilience4j.ratelimiter:
  instances:
    apiLimit:
      limitForPeriod: 100
      limitRefreshPeriod: 60s
      timeoutDuration: 0s
    authLimit:
      limitForPeriod: 5
      limitRefreshPeriod: 60s
      timeoutDuration: 0s
```

### 3.8 Security Headers
```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) {
    return http
        .headers(headers -> headers
            .contentSecurityPolicy(csp -> csp.policyDirectives(
                "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
            ))
            .httpStrictTransportSecurity(hsts -> hsts
                .includeSubDomains(true)
                .maxAgeInSeconds(31536000)
            )
            .frameOptions(frame -> frame.deny())
            .xssProtection(xss -> xss
                .headerValue(XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK)
            )
        )
        .build();
}
```

### 3.9 Secrets Management
```yaml
# application-prod.yml — NUNCA commitar secrets
spring:
  datasource:
    password: ${DB_PASSWORD}          # Variável de ambiente
  security:
    jwt:
      secret: ${JWT_SECRET_KEY}       # Vault/Secrets Manager

# Local dev com .env (gitignored)
# .env: DB_PASSWORD=dev_pass
```

### 3.10 Dependency Scanning
```xml
<!-- OWASP Dependency Check -->
<plugin>
    <groupId>org.owasp</groupId>
    <artifactId>dependency-check-maven</artifactId>
    <version>10.0.0</version>
    <configuration>
        <failBuildOnCVSS>7</failBuildOnCVSS>
    </configuration>
</plugin>
```

---

## 4. Segurança no Frontend (React Native)

### 4.1 Secure Storage
```typescript
import * as SecureStore from 'expo-secure-store';

// Tokens no Keychain/Keystore
await SecureStore.setItemAsync('accessToken', token);
const token = await SecureStore.getItemAsync('accessToken');
// NUNCA usar AsyncStorage para dados sensíveis
```

### 4.2 Input Sanitization
```typescript
function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')          // Remove HTML tags
    .replace(/javascript:/gi, '')      // Remove javascript: protocol
    .replace(/on\w+=/gi, '')           // Remove event handlers
    .trim();
}
```

### 4.3 Deep Link Validation
```typescript
const linking = {
  prefixes: ['perfectjob://', 'https://perfectjob.com'],
  config: {
    screens: {
      JobDetail: 'jobs/:jobId',
      // URLs devem ser validadas antes da navegação
    },
  },
};
```

### 4.4 Certificate Pinning
```typescript
// Em app.json para EAS builds
{
  "plugins": [
    [
      "expo-build-properties",
      {
        "ios": {
          "useFrameworks": "static"
        }
      }
    ]
  ],
  "extra": {
    "sslPinning": {
      "domains": ["api.perfectjob.com"],
      "hashes": ["sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="]
    }
  }
}
```

### 4.5 Network Security
- HTTPS exclusivo (bloquear HTTP em release)
- Axios interceptors para refresh token automático
- Timeout configurado (10s default)
- Retry com backoff exponencial

---

## 5. Segurança de Dados

### 5.1 Dados Sensíveis

| Dado | Em Trânsito | Em Repouso |
|------|-------------|------------|
| Senhas | HTTPS + bcrypt hash | bcrypt hash (nunca reversível) |
| Tokens JWT | HTTPS | Encrypted no Keychain |
| Dados Pessoais | HTTPS | PostgreSQL com TDE |
| Currículos (PDF) | HTTPS | S3 com SSE-KMS |
| Logs | TLS | Sem PII, retenção 90 dias |

### 5.2 PII Sanitization
```java
@Component
public class PiiSanitizer {
    private static final Pattern EMAIL = Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
    private static final Pattern PHONE = Pattern.compile("\\(?\\d{2}\\)?\\s?\\d{4,5}-?\\d{4}");
    private static final Pattern CPF = Pattern.compile("\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}");

    public String sanitize(String text) {
        return PHONE.matcher(EMAIL.matcher(CPF.matcher(text).replaceAll("[CPF]"))
            .replaceAll("[EMAIL]"))
            .replaceAll("[PHONE]");
    }
}
```

### 5.3 Encryption
```java
// Dados sensíveis no banco
@Entity
public class User {
    @Convert(converter = AesEncryptor.class)
    private String phone;  // Criptografado em repouso
}
```

---

## 6. Monitoramento & Resposta a Incidentes

### 6.1 Alertas
- Múltiplas falhas de autenticação (brute force)
- Rate limit excedido por IP (scraping)
- Acesso a endpoints admin sem role apropriada
- SQL injection attempts (WAF logs)
- Token reuse detection

### 6.2 Audit Log
```java
@Aspect
@Component
public class AuditAspect {
    @AfterReturning("@annotation(audited)")
    public void audit(JoinPoint jp, Audited audited) {
        User user = SecurityUtils.getCurrentUser();
        log.info("AUDIT: user={}, action={}, resource={}, params={}",
            user.getId(), audited.action(), jp.getSignature(), jp.getArgs());
    }
}
```

### 6.3 Incident Response
| Severidade | Ação |
|-----------|------|
| **Critical** (breach, data leak) | Bloquear acesso, notificar CSIRT, iniciar forense |
| **High** (injection attempt, admin access) | Bloquear IP, logar, alertar |
| **Medium** (rate limit exceed) | Throttle, warn user |
| **Low** (probe, scan) | Log, monitor |

---

## 7. Checklist de Segurança por Feature

Toda nova feature deve passar por este checklist:

- [ ] Autenticação: Endpoint público ou protegido?
- [ ] Autorização: User tem permissão para esta ação?
- [ ] Validação: Inputs validados com Bean Validation/TypeScript?
- [ ] Ownership: User só acessa seus próprios dados?
- [ ] Rate Limiting: Endpoint tem rate limit?
- [ ] SQL Injection: Queries parametrizadas?
- [ ] XSS: Input sanitizado, CSP header?
- [ ] Sensitive Data: Logs/vazamentos de PII?
- [ ] HTTPS: Configurado?
- [ ] Dependency Scan: `npm audit` / `mvn dependency-check` passou?

---

## 8. Ferramentas de Segurança

### Backend
- **SonarQube** — Static code analysis
- **OWASP ZAP** — Penetration testing
- **Dependabot** — Automatic dependency updates
- **Snyk** — Vulnerability scanning + fix PRs
- **Vault** — Secrets management (produção)

### Frontend
- **npm audit / yarn audit** — Package vulnerability scan
- **Expo Doctor** — Sanity checks
- **react-native-safety** — Runtime safety checks

### CI/CD
```yaml
# .github/workflows/security.yml
steps:
  - name: Dependency Check
    run: mvn dependency-check:check
  - name: Secret Scan (Gitleaks)
    run: gitleaks detect --source .
  - name: SAST (SonarQube)
    run: mvn sonar:sonar
  - name: Container Scan (Trivy)
    run: trivy image perfectjob-api:latest
```
