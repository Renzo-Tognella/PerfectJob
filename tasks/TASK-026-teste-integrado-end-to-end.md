# TASK-026: Teste Integrado End-to-End

**Prioridade:** CRITICA
**Estimativa:** 4h
**Dependências:** TASK-001 a TASK-025
**Status:** Pendente

## Objetivo

Validar que admin, app e api estão completamente integrados. Testar fluxos completos: candidato se cadastra, busca vagas, candidata; recrutador cria empresa, cria vaga, vê candidato, aprova.

## Escopo

### A. Testes de Integração Backend
**Arquivos:**
- `test/integration/AuthFlowIntegrationTest.java` (criar)
- `test/integration/JobFlowIntegrationTest.java` (criar)
- `test/integration/ApplicationFlowIntegrationTest.java` (criar)

**Ações:**
1. Usar `@SpringBootTest` com H2 ou Testcontainers
2. Testar fluxo completo:
   - Register candidate → Login → Buscar jobs → Candidatar-se → Listar applications
   - Register recruiter → Login → Criar empresa → Criar vaga → Listar jobs criados
   - Recruiter atualizar status da application → Candidate ver notificação

### B. Testes Manuais (Script)
**Arquivos:**
- `test/manual/test-flow.sh` (criar)
- `test/manual/test-admin-flow.sh` (criar)
- `test/manual/test-mobile-flow.sh` (criar)

**Ações:**
1. Script bash que automatiza os testes manuais
2. Usa `curl` + `jq`
3. Cobre:
   - Health check
   - Auth (register, login, me)
   - Jobs (CRUD, search, featured)
   - Companies (CRUD)
   - Applications (submit, list, status update)
   - Saved Jobs (save, unsave, list)
   - Notifications
   - CORS
   - Error handling (400, 401, 403, 404, 409, 500)

### C. Testes do Admin
**Arquivos:**
- Manual via Playwright (opcional) ou scripts
- `test/manual/test-admin-e2e.md` (criar)

**Ações:**
1. Criar script que:
   - Abre admin
   - Faz login
   - Navega para Dashboard (verifica stats)
   - Vai para Jobs (verifica lista)
   - Cria vaga
   - Vai para Companies (cria empresa)
   - Vai para Applications (ver lista)

### D. Testes do Mobile
**Arquivos:**
- Manual via Expo Go + screenshots
- `test/manual/test-mobile-e2e.md` (criar)

**Ações:**
1. Script que:
   - Instala deps
   - Inicia Metro
   - Documenta fluxo manual:
     - Abrir app
     - Fazer login
     - Buscar vaga
     - Ver detalhe
     - Favoritar
     - Candidatar-se
     - Ver candidaturas

### E. Validação Final
**Arquivos:**
- `test/manual/final-checklist.md` (criar)

**Ações:**
1. Checklist de validação cobrindo:
   - Todas as 3 aplicações sobem sem erro
   - Integração admin-app-api funciona
   - Auth funciona
   - CRUD funciona
   - Validações funcionam
   - Erros são tratados
   - Performance aceitável
   - Acessibilidade básica
   - Sem warnings de console
   - Sem código morto

## Critérios de Aceite

- [ ] Todos os fluxos end-to-end passam
- [ ] Backend: testes de integração 100% verdes
- [ ] Admin: fluxo manual documentado e executado
- [ ] Mobile: fluxo manual documentado e executado
- [ ] Nenhum 500 não-tratado
- [ ] Nenhum warning de console em produção
- [ ] Performance: listagens < 500ms
- [ ] README atualizado com instruções de teste

## Como Testar

### Backend (Automatizado)
```bash
cd perfectjob-api
./mvnw test
# Deve mostrar: Tests run: X, Failures: 0, Errors: 0
```

### Integração Manual
```bash
bash test/manual/test-flow.sh
# Deve mostrar: ✓ All tests passed
```

### Admin Manual
```bash
# 1. Subir admin
cd perfectjob-admin && npm run dev

# 2. Abrir http://localhost:5173
# 3. Seguir test/manual/test-admin-e2e.md
```

### Mobile Manual
```bash
# 1. Subir mobile
cd perfectjob-mobile && npx expo start

# 2. Escanear QR com Expo Go
# 3. Seguir test/manual/test-mobile-e2e.md
```

## Arquivos Criados/Modificados

**Criar:**
- `test/integration/AuthFlowIntegrationTest.java`
- `test/integration/JobFlowIntegrationTest.java`
- `test/integration/ApplicationFlowIntegrationTest.java`
- `test/manual/test-flow.sh`
- `test/manual/test-admin-flow.sh`
- `test/manual/test-mobile-flow.sh`
- `test/manual/test-admin-e2e.md`
- `test/manual/test-mobile-e2e.md`
- `test/manual/final-checklist.md`

**Modificar:**
- `README.md` (atualizar com instruções de teste)

## Notas

- Esta é a task final — todas as outras devem estar concluídas
- Se algum teste falhar, identificar a task que deveria ter resolvido
- Documentar todos os bugs encontrados durante os testes em uma seção "Problemas Conhecidos"
- Não commitar até que 100% dos testes passem
