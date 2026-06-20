# TASK-000: Auditoria Completa e Preparação

**Prioridade:** 🔴 CRÍTICA
**Estimativa:** 1h
**Dependências:** Nenhuma
**Status:** ⬜ Pendente

## Objetivo

Validar que o ambiente está pronto, infra rodando, e fazer um inventário final antes de começar as correções.

## Escopo

### A. Verificar ambiente
- [ ] Docker rodando (`docker ps`)
- [ ] PostgreSQL respondendo (`docker exec perfectjob-postgres pg_isready`)
- [ ] Redis respondendo (`docker exec perfectjob-redis redis-cli ping`)
- [ ] Java 21 disponível (`java -version`)
- [ ] Node 20+ disponível (`node --version`)
- [ ] Maven wrapper funcional (`./mvnw --version`)

### B. Subir API
- [ ] Limpar processos antigos
- [ ] Subir API com `./mvnw spring-boot:run` em background
- [ ] Verificar que responde em `http://localhost:8080/api/swagger-ui.html`
- [ ] Validar Flyway aplicou migrations (V1, V2, V3)

### C. Subir Admin
- [ ] `npm install` em `perfectjob-admin/`
- [ ] `npm run dev` em background
- [ ] Verificar que carrega em `http://localhost:5173`

### D. Subir Mobile (apenas build check)
- [ ] `npm install` em `perfectjob-mobile/`
- [ ] `npx tsc --noEmit` deve passar (TypeScript válido)
- [ ] `npm run lint` (se ESLint configurado) deve passar

### E. Testes de sanidade
- [ ] `curl http://localhost:8080/api/v1/jobs` retorna array ou página
- [ ] `curl http://localhost:8080/api/v1/companies` retorna array ou página
- [ ] `curl -X POST http://localhost:8080/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"invalid","password":"invalid"}'` retorna 401
- [ ] Admin carrega sem erro 500
- [ ] `npx tsc --noEmit` no mobile e admin passa

## Critérios de Aceite

- [ ] Todos os itens marcados acima
- [ ] Inventário de problemas consolidado (já feito nos docs)
- [ ] Nenhum commit foi feito (regra do usuário)
- [ ] Ambiente pronto para iniciar TASK-001

## Arquivos Afetados

- Nenhum (apenas verificação)

## Como Verificar Manualmente

```bash
# 1. Subir infra
./setup.sh

# 2. Verificar PostgreSQL
docker exec perfectjob-postgres pg_isready -U perfectjob -d perfectjob

# 3. Verificar Redis
docker exec perfectjob-redis redis-cli ping

# 4. Subir API
cd perfectjob-api
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev &
sleep 30
curl -s http://localhost:8080/api/v1/jobs | head -c 200

# 5. Subir Admin
cd ../perfectjob-admin
npm install
npm run dev &
sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173

# 6. Verificar Mobile
cd ../perfectjob-mobile
npm install
npx tsc --noEmit
```

## Notas

- A API pode demorar ~30s para inicializar (Spring + Flyway + JPA)
- O Admin abre automaticamente no browser se for ambiente desktop
- O Mobile não precisa estar rodando para o admin/api funcionarem
- Se algum teste falhar, registre o erro e prossiga (será corrigido em tasks posteriores)
