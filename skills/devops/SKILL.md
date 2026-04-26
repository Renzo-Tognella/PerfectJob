# PerfectJob — Skill: DevOps & Infraestrutura

## Propósito
Esta skill define as práticas de DevOps, CI/CD, infraestrutura como código, monitoramento e operações para o projeto PerfectJob.

---

## 1. Ambiente de Desenvolvimento

### 1.1 Docker Compose (dev local)
```yaml
# docker-compose.yml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: perfectjob-db
    environment:
      POSTGRES_DB: perfectjob
      POSTGRES_USER: perfectjob
      POSTGRES_PASSWORD: devpass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U perfectjob"]
      interval: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: perfectjob-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

### 1.2 Setup Script
```bash
#!/bin/bash
# setup.sh — Configura ambiente de desenvolvimento

# Inicia infraestrutura
docker compose up -d
echo "Aguardando serviços..." && sleep 15

# Cria banco
docker compose exec -T postgres psql -U perfectjob -c "
  CREATE TABLE IF NOT EXISTS migrations (version VARCHAR PRIMARY KEY);
"

# Inicia API
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

---

## 2. Pipeline CI/CD

### 2.1 GitHub Actions — API (Backend)
```yaml
# .github/workflows/api-ci.yml
name: API CI/CD

on:
  push:
    branches: [main, develop]
    paths: ['perfectjob-api/**']
  pull_request:
    paths: ['perfectjob-api/**']

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env: { POSTGRES_DB: test, POSTGRES_USER: test, POSTGRES_PASSWORD: test }
        ports: ['5432:5432']

    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with: { java-version: '21', distribution: 'temurin', cache: 'maven' }

      - name: Cache Maven
        uses: actions/cache@v4
        with:
          path: ~/.m2
          key: maven-${{ hashFiles('**/pom.xml') }}

      - name: Build & Test
        run: mvn verify -pl perfectjob-api
        env:
          SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/test

      - name: Checkstyle
        run: mvn checkstyle:check -pl perfectjob-api

  docker-build-and-push:
    needs: build-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker Image
        run: |
          cd perfectjob-api
          ./mvnw spring-boot:build-image \
            -Dspring-boot.build-image.imageName=ghcr.io/${{ github.repository }}/api

      - name: Push to GHCR
        run: |
          echo ${{ secrets.GHCR_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker push ghcr.io/${{ github.repository }}/api:latest
```

### 2.2 GitHub Actions — Mobile (React Native / Expo)
```yaml
# .github/workflows/mobile-ci.yml
name: Mobile CI/CD

on:
  push:
    branches: [main, develop]
    paths: ['perfectjob-mobile/**']
  pull_request:
    paths: ['perfectjob-mobile/**']

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm', cache-dependency-path: perfectjob-mobile/package-lock.json }

      - run: npm ci
        working-directory: perfectjob-mobile

      - name: TypeScript Check
        run: npx tsc --noEmit
        working-directory: perfectjob-mobile

      - name: Lint
        run: npm run lint
        working-directory: perfectjob-mobile

      - name: Unit Tests
        run: npm test -- --coverage
        working-directory: perfectjob-mobile

      - name: Upload Coverage
        uses: codecov/codecov-action@v4

  eas-build:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm', cache-dependency-path: perfectjob-mobile/package-lock.json }
      - run: npm ci
        working-directory: perfectjob-mobile

      - name: EAS Build (Preview)
        run: npx eas build --platform all --profile preview --non-interactive
        working-directory: perfectjob-mobile
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

      - name: EAS Submit
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        run: npx eas submit --platform all --latest --non-interactive
        working-directory: perfectjob-mobile
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

---

## 3. Dockerfile Otimizado

### 3.1 API (Spring Boot)
```dockerfile
# Multi-stage build
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B
COPY src src
RUN ./mvnw package -DskipTests

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S app -G app
USER app
WORKDIR /app
COPY --from=builder /workspace/target/*.jar app.jar
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", \
  "-XX:+UseZGC", \
  "-XX:MaxRAMPercentage=75", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
```

### 3.2 Mobile (Expo — OTA Updates)
```bash
# Não precisa de Docker para mobile (Expo gerencia builds nativos)
# Mas para web admin:
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

---

## 4. Deploy MVP

### 4.1 Docker Compose (Staging/Produção)
```yaml
# docker-compose.prod.yml
services:
  api:
    image: ghcr.io/perfectjob/api:latest
    ports: ["8080:8080"]
    environment:
      SPRING_PROFILES_ACTIVE: prod
      DB_URL: jdbc:postgresql://postgres:5432/perfectjob
    depends_on: [postgres, redis]
  postgres:
    image: postgres:16-alpine
    volumes: [pgdata:/var/lib/postgresql/data]
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
  redis:
    image: redis:7-alpine
volumes:
  pgdata:
```

### 4.2 Deploy Script (simples, MVP)
```bash
#!/bin/bash
# deploy.sh — Deploy via SSH + rsync para VPS única
rsync -avz docker-compose.prod.yml user@vps:/app/
ssh user@vps "cd /app && docker compose pull && docker compose up -d"
```

### 4.3 Pós-MVP (quando necessário)
- Kubernetes (EKS/GKE) com HPA
- Terraform para infraestrutura como código
- CI/CD mais completo (canary deploy, blue/green)
- Monitoramento avançado (Grafana, ELK)

---

## 5. Monitoramento (MVP)

### 5.1 Stack Simples
- **Métricas:** Micrometer → `/actuator/prometheus` (scraped pelo Prometheus na VPS)
- **Logs:** Logback JSON no stdout → `docker logs` + arquivo rotativo
- **Alertas:** Sentry (crash reporting backend + mobile)
- **Uptime:** Healthcheck endpoint + UptimeRobot (gratuito)

### 5.2 Health Checks
- `/actuator/health` — Health geral
- `/actuator/health/liveness` — Liveness probe
- `/actuator/health/readiness` — Readiness (DB + Redis check)

---

## 6. Estratégia de Deploy
| Ambiente | Objetivo | Atualização | Acesso |
|----------|----------|-------------|--------|
| **dev** | Desenvolvimento local | Hot reload | Devs |
| **staging** | Testes de integração | A cada merge na develop | QA, Devs |
| **production** | Usuários finais | Approval gate | Público |

### 7.2 Estratégia de Deploy (MVP)
1. **Rolling restart:** `docker compose up -d` (zero-downtime com healthcheck)
2. **Rollback:** `docker compose up -d` com tag de imagem anterior
3. **Rollback automático** se healthcheck falhar (Docker restart policy)

### 7.3 Deploy MVP

---

## 8. Backup (MVP Simples)

- **PostgreSQL:** `pg_dump` cron job diário, rsync para S3/backup server
- **Redis:** RDB snapshot a cada hora
- **Retenção:** 7 dias (MVP), evoluir para 30 dias com RDS

---

## 9. Segurança DevOps

### 9.1 Secrets Management
- **Desenvolvimento:** `.env` (gitignored)
- **CI/CD:** GitHub Secrets
- **Produção:** AWS Secrets Manager / HashiCorp Vault

### 9.2 Container Security
```dockerfile
# Usar imagens não-root
USER appuser

# Scan de vulnerabilidades
# docker scan perfectjob-api:latest
# trivy image perfectjob-api:latest
```

### 9.3 Git Hooks
```bash
# .git/hooks/pre-commit
#!/bin/bash
# Não commitar secrets
if gitleaks detect --source . --verbose; then
  echo "✅ No secrets found"
else
  echo "❌ Secrets detected! Commit blocked."
  exit 1
fi
```
