# PerfectJob — Skill: UI/UX Design

## Propósito
Esta skill define os princípios de UI/UX para o projeto PerfectJob, garantindo consistência visual e experiência de usuário de alta qualidade em todas as plataformas (React Native e Web).

---

## 1. Princípios de Design

### 1.1 Clareza
O usuário deve entender o que fazer em qualquer tela em menos de 3 segundos.

- **Hierarquia visual clara:** Título → Subtexto → Ação primária
- **Linguagem direta:** "Candidatar-se" não "Submeter aplicação para análise"
- **Feedback imediato:** Toda ação tem confirmação visual instantânea

### 1.2 Eficiência
Minimizar passos para completar tarefas.

- **Candidatura rápida:** Máximo 2 passos (review + confirmar)
- **Busca inteligente:** Sugestões, autocomplete, histórico
- **Atalhos:** Deslizar para salvar, pull-to-refresh, deep links

### 1.3 Consistência
Mesma coisa, mesmo lugar, mesma forma.

- Design System único (componentes, tokens, patterns)
- Navegação previsível (back sempre volta, tabs são estáveis)
- Terminologia consistente ("Vaga" não "Job" / "Oportunidade" em telas diferentes)

### 1.4 Acessibilidade
Design inclusivo para todos os usuários.

- Contraste WCAG AA (4.5:1 texto normal, 3:1 texto grande)
- Touch targets ≥ 44pt
- Leitores de tela suportados
- Texto escalável (não quebrar layout com fonte grande)

### 1.5 Delight
Pequenos detalhes que encantam.

- Micro-interações (animação de coração ao salvar)
- Feedback tátil (haptic feedback ao aplicar)
- Estados vazios com personalidade
- Transições suaves entre telas

---

## 2. User Flows Principais

### 2.1 Fluxo de Busca e Candidatura
```
Home → Digitar busca → Lista de vagas → Filtrar → Card da vaga →
  Detalhe da vaga → Candidatar-se → Revisar dados → Confirmar →
    Confirmação enviada
```

### 2.2 Fluxo de Cadastro (Candidato)
```
Landing → Criar conta → Preencher perfil → Adicionar skills →
  Upload currículo (opcional) → Preferências de vaga → Home
```

### 2.3 Fluxo de Publicação de Vaga (Recrutador)
```
Dashboard → Nova vaga → Preencher formulário → Preview →
  Revisar → Publicar → Confirmação
```

---

## 3. Wireframes de Referência

### 3.1 Home (Print 2)
Layout de landing page com:
1. **Hero:** Headline + subheadline + search bar dupla (cargo + localização) + CTA
2. **Trending Searches:** Chips horizontais com buscas populares
3. **Categorias:** Grid 4×2 com ícones e contagem de vagas
4. **Vagas em Destaque:** Horizontal scroll de JobCards
5. **Empresas Destaque:** Logos de empresas com nome
6. **Insights Salariais:** Faixas salariais por categoria
7. **CTA Recrutador:** Banner "Anuncie suas vagas"
8. **Footer:** Links institucionais

### 3.2 Busca de Vagas (Print 1)
1. **Search Header:** Input com keyword + localização
2. **Quick Filters:** Chips horizontais (Remoto, Sênior, CLT, etc.)
3. **Results Bar:** Contagem + ordenação
4. **Sidebar (web) / Bottom Sheet (mobile):** Filtros avançados
5. **Job Cards:** Lista vertical com:
   - Logo da empresa (esquerda)
   - Título, empresa, localização
   - Salário, modalidade, nível (ícones + texto)
   - Descrição curta (2 linhas)
   - Tags de skills
   - Rodapé: tempo + salvar + match %
6. **Pagination:** Scroll infinito

---

## 4. Princípios de Design Mobile (iOS + Android)

### 4.1 iOS (Human Interface Guidelines)
- **Navigation Bar:** Título grande (large title) com collapse ao scroll
- **Tab Bar:** Ícones + labels na parte inferior
- **Gestures:** Swipe back (borda esquerda), pull-to-refresh
- **Modal:** Sheet de baixo com handle, dismiss com swipe
- **Haptic Feedback:** `UIImpactFeedbackGenerator` (light, medium, heavy)

### 4.2 Android (Material Design 3)
- **Top App Bar:** Título centralizado ou à esquerda
- **Navigation Bar:** Ícones na parte inferior
- **FAB:** Floating Action Button (ação principal)
- **Back:** Android back button ou gesto (Android 10+)
- **Ripple:** Efeito de toque material

### 4.3 Componentes Nativos vs Customizados
| Componente | Native | Custom (Reanimated) |
|-----------|--------|---------------------|
| Navegação | React Navigation (native) | - |
| Listas | FlashList | - |
| Bottom Sheet | @gorhom/bottom-sheet | - |
| Animações | - | Reanimated 3 |
| Toasts | react-native-toast-message | - |

---

## 5. Micro-Interações

### 5.1 Salvar Vaga (Favorito)
```
Estado: ♡ (outline)
Toque: ♥ (preenchido) + scale bounce + haptic
Animação: 300ms spring, scale 1 → 1.2 → 1
Cor: Primary → Accent (laranja)
```

### 5.2 Candidatura Enviada
```
Toque: Spinner no botão → Checkmark animado → Texto "Enviado!"
Animação: Button muda de cor (primary → success), ícone fade-in
Duração: 1.5s, depois volta ao estado normal
```

### 5.3 Pull-to-Refresh
```
Pull: ícone de seta animado
Release: spinner + dados recarregam
Feedback: Haptic no threshold de pull
```

### 5.4 Empty State → Primeiro Uso
```
Antes: Ilustração + texto "Nenhuma vaga salva"
Ação: Botão "Explorar vagas"
Transição: Fade-in da ilustração
```

### 5.5 Match Score Animation
```
Score: 0% → 95% (animated counter)
Barra de progresso: animada com cor (vermelho → amarelo → verde)
Duração: 1s com easing
```

---

## 6. Loading States

### 6.1 Skeleton Screens (preferido)
Para: Lista de vagas, cards, perfil, detalhes da vaga.
Skeleton com shimmer animation (1.5s loop).

### 6.2 Spinner (casos específicos)
Para: Ações pontuais (login, candidatura, upload).
Spinner no botão da ação (substitui texto).

### 6.3 Progressive Loading
- 1ª carga: 10 vagas
- Scroll: +20 vagas (infinite scroll)
- Imagens: blurhash placeholder → carregamento progressivo

---

## 7. Error States

### 7.1 Erro de Rede
```
┌──────────────────────────┐
│      [Ícone Wi-Fi off]   │
│                          │
│   Sem conexão            │
│   Verifique sua internet │
│   e tente novamente.     │
│                          │
│      [Tentar Novamente]  │
└──────────────────────────┘
```

### 7.2 Erro de Servidor (500)
```
Mensagem: "Algo deu errado. Nossa equipe foi notificada."
Ação: Botão "Tentar novamente"
Fallback: Dados cacheados (se disponíveis) mostrados com banner "Dados podem estar desatualizados"
```

### 7.3 Vaga Expirada / Removida
```
Mensagem: "Esta vaga não está mais disponível."
Ação: Botão "Ver vagas similares"
```

### 7.4 Form Validation
- Erros inline (abaixo do campo, texto vermelho)
- Campo com borda vermelha
- Scroll automático para o primeiro erro
- Mensagens claras: "E-mail inválido" não "Erro de validação 400"

---

## 8. Design Responsivo (Web)

### 8.1 Breakpoints
- **Mobile:** < 768px → layout vertical, bottom sheet para filtros
- **Tablet:** 768-1024px → sidebar colapsável para filtros
- **Desktop:** > 1024px → sidebar fixa + grid de cards 2-3 colunas

### 8.2 Grid System
```
Desktop (12 colunas, 24px gutter)
┌──────────┬─────────────────────────────┐
│ Sidebar  │         Content Area        │
│ 3 cols   │          9 cols             │
│ (280px)  │                              │
└──────────┴─────────────────────────────┘
```

---

## 9. Copywriting & Tom de Voz

### 9.1 Tom
- **Profissional mas amigável:** Nem corporativo frio, nem informal demais
- **Inclusivo:** Linguagem neutra, "pessoa desenvolvedora" não "desenvolvedor"
- **Encorajador:** "Sua vaga ideal está aqui" não "Encontre um emprego"
- **Conciso:** Botões com 1-2 palavras, headlines com 5-8 palavras

### 9.2 Exemplos
| Contexto | Bom | Ruim |
|----------|-----|------|
| Botão CTA | "Candidatar-se" | "Realizar inscrição no processo seletivo" |
| Vazio | "Nenhuma vaga salva ainda" | "0 resultados — query retornou empty set" |
| Erro | "E-mail inválido. Tente novamente." | "Erro 400 — Bad Request" |
| Sucesso | "Candidatura enviada!" | "Status 201 — operação concluída com sucesso" |
| CTA Hero | "Encontre sua próxima vaga" | "Buscar oportunidades de trabalho disponíveis" |

---

## 10. Testes de Usabilidade

### 10.1 Heurísticas de Nielsen (resumo)
1. **Visibilidade do status:** Sempre mostrar o que está acontecendo
2. **Correspondência sistema-mundo real:** Usar linguagem do usuário
3. **Controle e liberdade:** "Desfazer", "Voltar" sempre disponíveis
4. **Consistência e padrões:** Mesmo comportamento em todo o app
5. **Prevenção de erros:** Confirmar antes de ações destrutivas
6. **Reconhecimento vs memorização:** Opções visíveis, não escondidas
7. **Flexibilidade e eficiência:** Atalhos para usuários frequentes
8. **Estética e minimalismo:** Cada elemento deve ter propósito
9. **Ajuda no erro:** Mensagens claras e soluções
10. **Ajuda e documentação:** Busca contextual, onboarding simples

### 10.2 Métricas de UX
- **TTS (Time to Search):** < 3 segundos para primeira busca
- **TTJ (Time to Job Detail):** < 2 cliques/toques
- **TTA (Time to Apply):** < 30 segundos (candidato logado)
- **Abandono de cadastro:** < 30%
- **Satisfação NPS:** > 40 (bom)
