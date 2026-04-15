# Security & LGPD — PerfectJob

> JWT + OAuth2 PKCE, PII encryption, rate limiting, LGPD compliance, mobile security, scraping ethics.

## Description

PerfectJob handles sensitive user data (CPF, email, phone, salary expectations, resumes) and must comply with Brazil's LGPD (Lei Geral de Protecao de Dados). The security architecture covers authentication (JWT + OAuth2), PII encryption at rest and in transit, rate limiting, mobile-specific protections (SecureStore, SSL pinning, biometric), and ethical scraping practices.

## Checklist

1. Issue JWT access tokens (15min TTL) and refresh tokens (30d TTL) via `/auth/login` and `/auth/refresh`
2. Implement OAuth2 PKCE flow for Google, Apple, LinkedIn via `expo-auth-session`
3. Encrypt all PII fields at rest using AES-256-GCM (email, phone, CPF) before storing in DB
4. Hash passwords with bcrypt cost factor 12+ via Spring Security's `BCryptPasswordEncoder`
5. Configure rate limiting per endpoint using Bucket4j: auth=5/min, search=30/min, general=60/min
6. Implement LGPD data export endpoint (Art.18 V) — return all user data as JSON/ZIP
7. Implement LGPD hard delete endpoint (Art.18 II) — cascade delete all user data within 15 days
8. Record granular consent on registration — `lgpd_consent=true`, `consent_date=NOW()`
9. Set up 72-hour breach notification pipeline (email + in-app alert to all affected users)
10. Configure SSL pinning on mobile (public key pins for API domain)
11. Enable biometric auth (expo-local-authentication) for app open and sensitive operations
12. Implement jailbreak/root detection — block app functionality on compromised devices

## Key Rules

- **NEVER** store plaintext PII (email, phone, CPF) in the database — always encrypt with AES-256-GCM
- **NEVER** log sensitive data (passwords, tokens, CPF, PII) — mask or redact in all log output
- **NEVER** commit secrets to version control — use environment variables or Vault
- **NEVER** use HTTP for API communication — HTTPS only with HSTS headers
- **NEVER** return internal error details to clients — use generic error messages
- **NEVER** store tokens in AsyncStorage on mobile — use expo-secure-store exclusively
- **ALWAYS** validate and sanitize all user input on both client and server
- **ALWAYS** set `Secure`, `HttpOnly`, `SameSite=Strict` on cookies (if using cookie auth)
- **ALWAYS** implement CORS with explicit allowed origins — never `*`
- **ALWAYS** rotate encryption keys periodically (quarterly) — support key versioning
- **ALWAYS** audit data access logs quarterly — log who accessed what PII and when
- **ALWAYS** implement soft delete first, then hard delete after LGPD retention period

## Authentication Architecture

```
Login Flow:
┌──────────┐    POST /auth/login     ┌──────────────┐
│  Mobile  │ ──────────────────────→ │ AuthController│
│  App     │                         │              │
│          │ ←────────────────────── │  AuthService │
└──────────┘    {accessToken,        └──────────────┘
                 refreshToken}
                              ↓
                    ┌──────────────────┐
                    │ BCrypt verify    │
                    │ Generate JWT     │
                    │ Encrypt PII      │
                    └──────────────────┘

OAuth2 Flow:
┌──────────┐   PKCE + code     ┌──────────────┐    token+code    ┌──────────────┐
│  Mobile  │ ────────────────→ │ Google/Apple │ ──────────────→  │ AuthController│
│  App     │                   │  /LinkedIn   │                  │              │
│          │ ←──────────────── │              │                  │  OAuth2Service│
└──────────┘   callback URL    └──────────────┘                  └──────────────┘

Token Refresh:
┌──────────┐   POST /auth/refresh   ┌──────────────┐
│  Mobile  │ ─────────────────────→ │ AuthController│
│  (401    │                        │              │
│  interp) │ ←──────────────────── │  AuthService │
└──────────┘   {accessToken,        └──────────────┘
                 refreshToken}
```

## Code Examples

### JWT Configuration (Spring Security 6)

```java
package com.perfectjob.common.config;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.SecurityFilterChain;

import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${perfectjob.security.jwt.private-key}")
    private RSAPrivateKey privateKey;

    @Value("${perfectjob.security.jwt.public-key}")
    private RSAPublicKey publicKey;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/auth/refresh").authenticated()
                .requestMatchers("/actuator/health").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'"))
                .frameOptions(fo -> fo.deny())
            )
            .build();
    }

    @Bean
    public JwtEncoder jwtEncoder() {
        var rsaKey = new RSAKey.Builder(publicKey).privateKey(privateKey).build();
        return new NimbusJwtEncoder(new ImmutableJWKSet<>(new JWKSet(rsaKey)));
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        return NimbusJwtDecoder.withPublicKey(publicKey).build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        var configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
            "https://perfectjob.com.br",
            "exp://localhost:8081"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
```

### PII Encryption Service (AES-256-GCM)

```java
package com.perfectjob.common.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class PiiEncryptionService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    private final SecretKeySpec keySpec;
    private final SecureRandom secureRandom = new SecureRandom();

    public PiiEncryptionService(@Value("${perfectjob.security.encryption.key}") String key) {
        byte[] keyBytes = Base64.getDecoder().decode(key);
        this.keySpec = new SecretKeySpec(keyBytes, "AES");
    }

    public String encrypt(String plaintext) {
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            byte[] combined = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(ciphertext, 0, combined, iv.length, ciphertext.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    public String decrypt(String encryptedBase64) {
        try {
            byte[] combined = Base64.getDecoder().decode(encryptedBase64);

            byte[] iv = new byte[GCM_IV_LENGTH];
            byte[] ciphertext = new byte[combined.length - GCM_IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, GCM_IV_LENGTH);
            System.arraycopy(combined, GCM_IV_LENGTH, ciphertext, 0, ciphertext.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            return new String(cipher.doFinal(ciphertext), java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed", e);
        }
    }
}
```

### Rate Limiter (Bucket4j)

```java
package com.perfectjob.common.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain)
            throws ServletException, IOException {

        String clientId = getClientIdentifier(request);
        Bucket bucket = resolveBucket(clientId, request.getRequestURI());

        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            response.setHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(429);
            response.setHeader("Retry-After",
                String.valueOf(probe.getNanosToWaitForRefill() / 1_000_000_000));
            response.getWriter().write("{\"error\":\"Rate limit exceeded\"}");
        }
    }

    private Bucket resolveBucket(String clientId, String uri) {
        String key = clientId + ":" + getRateLimitTier(uri);
        return buckets.computeIfAbsent(key, k -> createBucket(getRateLimitTier(uri)));
    }

    private String getRateLimitTier(String uri) {
        if (uri.contains("/auth/login")) return "auth";
        if (uri.contains("/auth/register")) return "auth";
        if (uri.contains("/jobs/search")) return "search";
        return "general";
    }

    private Bucket createBucket(String tier) {
        return switch (tier) {
            case "auth" -> Bucket.builder()
                .addLimit(Bandwidth.classic(5, io.github.bucket4j.Refill.intervally(5, Duration.ofMinutes(1))))
                .build();
            case "search" -> Bucket.builder()
                .addLimit(Bandwidth.classic(30, io.github.bucket4j.Refill.intervally(30, Duration.ofMinutes(1))))
                .build();
            default -> Bucket.builder()
                .addLimit(Bandwidth.classic(60, io.github.bucket4j.Refill.intervally(60, Duration.ofMinutes(1))))
                .build();
        };
    }

    private String getClientIdentifier(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null) return "user:" + authHeader.hashCode();
        return "ip:" + request.getRemoteAddr();
    }
}
```

### LGPD Data Export Controller

```java
package com.perfectjob.user.adapter.in;

import com.perfectjob.common.security.PiiEncryptionService;
import com.perfectjob.user.service.LgpdService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/lgpd")
@RequiredArgsConstructor
public class LgpdController {

    private final LgpdService lgpdService;

    @GetMapping("/export")
    public ResponseEntity<ByteArrayResource> exportData(
            @AuthenticationPrincipal Jwt jwt) {
        Long userId = jwt.getClaim("user_id");
        byte[] data = lgpdService.exportUserData(userId);

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=perfectjob-dados-pessoais.json")
            .contentType(MediaType.APPLICATION_JSON)
            .contentLength(data.length)
            .body(new ByteArrayResource(data));
    }

    @DeleteMapping("/delete")
    public ResponseEntity<Void> requestDeletion(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "false") boolean immediate) {
        Long userId = jwt.getClaim("user_id");
        lgpdService.requestDataDeletion(userId, immediate);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/consent")
    public ResponseEntity<Void> recordConsent(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody ConsentRequest request) {
        Long userId = jwt.getClaim("user_id");
        lgpdService.recordConsent(userId, request.purposes());
        return ResponseEntity.ok().build();
    }
}
```

### LGPD Service

```java
package com.perfectjob.user.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.perfectjob.user.domain.port.UserRepository;
import com.perfectjob.resume.domain.port.ResumeRepository;
import com.perfectjob.job.domain.port.JobMatchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class LgpdService {

    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final JobMatchRepository jobMatchRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public byte[] exportUserData(Long userId) {
        var userData = Map.of(
            "user", userRepository.findById(userId),
            "resumes", resumeRepository.findAllByUserId(userId),
            "matches", jobMatchRepository.findAllByUserId(userId),
            "exportDate", LocalDateTime.now().toString(),
            "legalBasis", "Art. 18, V da Lei 13.709/2018 (LGPD)"
        );

        try {
            return objectMapper.writerWithDefaultPrettyPrinter()
                .writeValueAsBytes(userData);
        } catch (Exception e) {
            throw new RuntimeException("Data export failed", e);
        }
    }

    @Transactional
    public void requestDataDeletion(Long userId, boolean immediate) {
        log.info("LGPD deletion requested for user {} (immediate={})", userId, immediate);

        if (immediate) {
            userRepository.hardDelete(userId);
            log.info("Hard delete completed for user {}", userId);
        } else {
            userRepository.scheduleDeletion(userId, LocalDateTime.now().plusDays(15));
            log.info("Soft delete scheduled for user {} in 15 days", userId);
        }
    }

    @Transactional
    public void recordConsent(Long userId, java.util.List<String> purposes) {
        userRepository.updateConsent(userId, true, LocalDateTime.now(), purposes);
    }
}
```

### Mobile Security Checklist

```
┌────────────────────────────────────────────────────────────────┐
│                    MOBILE SECURITY                             │
├──────────────────────┬─────────────────────────────────────────┤
│ Token Storage        │ expo-secure-store (Keychain/Keystore)   │
│ SSL Pinning          │ Certificate pinning on API domain       │
│ Code Obfuscation     │ Hermes bytecode compilation            │
│ Biometric Auth       │ expo-local-authentication (FaceID/Touch)│
│ Jailbreak Detection  │ Check for suspicious paths/files       │
│ Screen Capture       │ Prevent screenshots on sensitive screens│
│ API Communication    │ HTTPS only, certificate validation      │
│ Input Validation     │ Client + server validation             │
│ Log Redaction        │ No PII in console logs                  │
│ App Transport        │ App Transport Security (ATS) enabled    │
└──────────────────────┴─────────────────────────────────────────┘
```

### Scraping Ethics

```
BEFORE scraping any source:
1. Fetch and parse robots.txt
2. Respect Crawl-delay directive
3. Identify restricted paths
4. Document source in ethics register

DURING scraping:
1. Rate limit: max 1 req / 3-8 seconds (randomized)
2. User-Agent: identify as bot with contact info
3. Attribution: always store source + sourceUrl
4. No personal data: only public job listing info

CEASE-AND-DESIST PLAN:
1. Feature flag per source (instant disable)
2. Remove all scraped data from that source within 48h
3. Document removal in audit log
4. Notify legal team
```

## References

- LGPD (Lei 13.709/2018): https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- Spring Security 6: https://docs.spring.io/spring-security/reference/
- JWT Best Practices: https://datatracker.ietf.org/doc/html/rfc8725
- AES-256-GCM: https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf
- Bucket4j: https://bucket4j.com/
- expo-secure-store: https://docs.expo.dev/versions/latest/sdk/securestore/
- expo-local-authentication: https://docs.expo.dev/versions/latest/sdk/local-authentication/
- OWASP Mobile Top 10: https://owasp.org/www-project-mobile-top-10/
