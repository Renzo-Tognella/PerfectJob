# TASK-005: Compatibilidade Java 21 nos Testes

**Prioridade:** 🔴 CRÍTICA
**Estimativa:** 1h
**Dependências:** TASK-000
**Status:** ⬜ Pendente

## Objetivo

Resolver incompatibilidade Java 25/Byte Buddy que faz 15 de 16 testes falharem. Forçar uso de Java 21 no Maven (compatível com Spring Boot 3.3).

## Escopo

### A. Ambiente
**Arquivos:**
- `pom.xml`
- `perfectjob-api/.mvn/jvm.config` (criar)
- `start.sh` (verificar)

**Ações:**
1. Criar `.mvn/jvm.config` com `-version:21` para forçar JVM
2. Verificar que `JAVA_HOME` aponta para Java 21
3. Atualizar `start.sh` para garantir uso de Java 21 (não Java 25)
4. Adicionar `<java.version>21</java.version>` no `pom.xml` properties (já tem)
5. Adicionar `<maven.compiler.source>21</maven.compiler.source>` e `<maven.compiler.target>21</maven.compiler.target>`

### B. Test Dependencies
**Arquivos:**
- `pom.xml`

**Ações:**
1. Verificar versões:
   - `spring-boot-starter-test` (vem com JUnit 5, Mockito 5.x)
   - Mockito 5.x requer Byte Buddy 1.14.x
   - Spring Boot 3.3.0 usa Byte Buddy 1.14.12 → suporta até Java 23
2. Se necessário, atualizar para Spring Boot 3.3.5+ (último 3.3.x com Byte Buddy 1.15+)
3. Alternativa: atualizar para Spring Boot 3.4.x (suporta Java 25)
4. Decisão: atualizar para Spring Boot 3.3.5+ (mantém Java 21)

### C. Maven Wrapper
**Arquivos:**
- `.mvn/wrapper/maven-wrapper.properties`

**Ações:**
1. Verificar versão do Maven wrapper (3.9+ recomendado)
2. Atualizar se necessário para suporte Java 21

### D. Testes existentes
**Arquivos:**
- `test/java/com/perfectjob/PerfectJobApplicationTests.java`
- `test/java/com/perfectjob/service/AuthServiceTest.java`
- `test/java/com/perfectjob/controller/AuthControllerTest.java`
- `test/java/com/perfectjob/controller/JobControllerTest.java`
- `test/java/com/perfectjob/controller/ApplicationControllerTest.java`

**Ações:**
1. Rodar todos os testes com Java 21
2. Corrigir falhas que não são de compatibilidade (ex: imports errados, mocks desatualizados)
3. Adicionar testes que faltam (ver TASK-002, TASK-003, TASK-004)

## Critérios de Aceite

- [ ] `java -version` mostra Java 21 (ou 21.x.x)
- [ ] `./mvnw test` executa com Java 21
- [ ] Testes existentes passam (16/16 mínimo)
- [ ] Nenhum teste falha com erro `Java 25 is not supported`
- [ ] Build é reproduzível (mesmo resultado em qualquer máquina com Java 21)

## Como Testar

```bash
# 1. Verificar Java
java -version
# Deve mostrar: openjdk version "21.x.x"

# 2. Se Java 25 estiver ativo, forçar Java 21
export JAVA_HOME=/opt/homebrew/opt/openjdk@21  # macOS Homebrew
# OU
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk  # Linux

# 3. Rodar testes
cd perfectjob-api
./mvnw test

# 4. Verificar resultado
# Deve mostrar: Tests run: 16, Failures: 0, Errors: 0
```

## Arquivos Criados/Modificados

- `pom.xml` (verificar/atualizar Spring Boot version)
- `.mvn/jvm.config` (criar)
- `.mvn/wrapper/maven-wrapper.properties` (verificar)
- `start.sh` (verificar JAVA_HOME)
- `test/...` (corrigir testes quebrados)

## Notas

- A incompatibilidade Java 25/Byte Buddy é conhecida. Soluções:
  1. Usar Java 21 (recomendado para este projeto)
  2. Atualizar Spring Boot para 3.4+ (refactor maior)
  3. Adicionar Byte Buddy manualmente (frágil)
- Para CI/CD, sempre usar Java 21
- Documentar em README que Java 21 é requisito
