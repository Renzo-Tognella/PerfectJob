# Documentação Técnica — PerfectJob

Documentos de referência, padrões de design, boas práticas e plano de execução do projeto.

## Índice

### Análise Arquitetural

1. **[Design Patterns e Arquitetura](./01-design-patterns-and-architecture.md)** — Padrões identificados nas 3 camadas, gaps arquiteturais, padrões a aplicar, princípios SOLID, convenções de código, métricas de qualidade alvo.

2. **[Problemas de Integração admin ↔ app ↔ api](./02-integration-problems.md)** — Diagnóstico completo dos problemas que impedem as 3 aplicações de se conversarem (configuração de URL, autenticação, autorização, sincronização, tipagem, performance, UX).

### Boas Práticas por Tecnologia

3. **[Boas Práticas Spring Boot 3.3 + Java 21](./03-best-practices-spring-boot.md)** — Arquitetura em camadas, injeção de dependência, transações, validação, tratamento de erros, segurança (Spring Security 6 + JWT), JPA, cache, testes, logging, observabilidade, segurança OWASP.

4. **[Boas Práticas React Native + Expo SDK 54](./04-best-practices-react-native-expo.md)** — Arquitetura recomendada, env vars, autenticação e sessão, TanStack Query, Axios, componentes, formulários (react-hook-form + zod), Zustand, navegação, performance, testes, segurança OWASP Mobile.

5. **[Boas Práticas React 19 + Vite 6](./05-best-practices-react-vite-admin.md)** — Arquitetura recomendada, env vars, autenticação, TanStack Query, Axios, componentes (Button, Modal, Toast), formulários, roteamento, performance, segurança OWASP Web, testes, acessibilidade.

### Plano de Execução

6. **[Tasks](./../tasks/README.md)** — Lista de tasks para corrigir todos os problemas, com escopo, arquivos afetados, critérios de aceite e dependências.

7. **[Análise por Task](./../analise/README.md)** — Documentação do que foi feito e testado em cada task.

## Stack Resumido

| Camada | Tecnologia | Versão |
|---|---|---|
| Mobile | React Native + Expo + TypeScript | SDK 54 / RN 0.81 |
| API | Spring Boot + Java | 3.3 / 21 |
| Banco | PostgreSQL | 16 |
| Cache | Redis | 7 (declarado, sem uso efetivo) |
| Busca | tsvector + pg_trgm | nativas |
| Admin | React + Vite + TypeScript + Tailwind | 19 / 6 / 5.5 / 3.4 |
| Auth | JWT (HS256) | 15 min |
| Migrações | Flyway | 9.x |

## Padrões Centrais

- **Backend:** Repository → Service → Controller com DTOs (Java records), Bean Validation, Global Exception Handler, Specification Pattern para queries, Flyway para migrações, Spring Security 6 stateless.
- **Mobile:** Services → Hooks (TanStack Query) → Screens, com Zustand para client state, expo-secure-store para tokens, design tokens centralizados, mappers DTO→UI.
- **Admin:** Pages → Hooks (TanStack Query) → API Services, com Zustand para auth, localStorage (única persistência), Tailwind + CSS variables para tokens.
