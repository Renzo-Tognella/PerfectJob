# PerfectJob — Design System

## 1. Brand Foundation

### 1.1 Nome do Produto
**PerfectJob** — Plataforma inteligente de busca e matching de vagas.

### 1.2 Slogan
*"A vaga perfeita está a um match de distância."*

### 1.3 Personalidade da Marca
- **Profissional** — Inspira confiança e credibilidade no mercado de trabalho.
- **Acolhedora** — Faz o candidato sentir-se bem-vindo e apoiado.
- **Inteligente** — Usa tecnologia de matching para recomendar as melhores vagas.
- **Moderna** — Interface limpa, rápida e responsiva.
- **Inclusiva** — Design acessível, suporte multilíngue e contraste adequado.

---

## 2. Design Tokens

### 2.1 Paleta de Cores

#### Cores Primárias
| Token | Hex | HSL | Uso |
|-------|-----|-----|-----|
| `--color-primary-900` | `#0A1628` | 220, 60%, 10% | Headers, fundo dark mode |
| `--color-primary-800` | `#0F2240` | 220, 55%, 15% | Sidebar, navegação secundária |
| `--color-primary-700` | `#1A3465` | 220, 50%, 25% | Hover states em componentes dark |
| `--color-primary-600` | `#234B8E` | 220, 48%, 35% | Borda ativa, focus rings |
| `--color-primary-500` | `#2B5FC2` | 220, 55%, 46% | Cor primária principal, botões primários |
| `--color-primary-400` | `#4A7DE0` | 220, 60%, 58% | Hover em botões primários |
| `--color-primary-300` | `#7BA0EB` | 220, 65%, 70% | Links, badges, elementos decorativos |
| `--color-primary-200` | `#B0C7F2` | 220, 65%, 82% | Backgrounds suaves (cards, seções) |
| `--color-primary-100` | `#DCE6FA` | 220, 70%, 92% | Backgrounds muito suaves |
| `--color-primary-50` | `#F0F4FD` | 220, 80%, 97% | Background base em light mode |

#### Cores de Acento (Secundárias)
| Token | Hex | HSL | Uso |
|-------|-----|-----|-----|
| `--color-accent-500` | `#FF6B35` | 16, 100%, 60% | CTA principal, ícones de destaque |
| `--color-accent-400` | `#FF8C63` | 16, 100%, 69% | Hover em CTAs |
| `--color-accent-300` | `#FFAB8F` | 16, 100%, 78% | Backgrounds de acento |
| `--color-accent-100` | `#FFF0EB` | 16, 100%, 96% | Background suave de acento |

#### Cores de Suporte (Semânticas)
| Token | Hex | Uso |
|-------|-----|-----|
| `--color-success` | `#16A34A` | Vagas ativas, confirmações, match high |
| `--color-success-light` | `#DCFCE7` | Background de sucesso |
| `--color-warning` | `#F59E0B` | Pendências, notificações, match médio |
| `--color-warning-light` | `#FEF3C7` | Background de warning |
| `--color-error` | `#DC2626` | Erros, rejeições, vagas encerradas |
| `--color-error-light` | `#FEE2E2` | Background de erro |
| `--color-info` | `#3B82F6` | Informações, tooltips |
| `--color-info-light` | `#DBEAFE` | Background de info |

#### Cores Neutras
| Token | Hex | Uso |
|-------|-----|-----|
| `--color-neutral-900` | `#111827` | Texto principal |
| `--color-neutral-800` | `#1F2937` | Texto secundário |
| `--color-neutral-700` | `#374151` | Texto body, ícones |
| `--color-neutral-600` | `#4B5563` | Texto muted, placeholders |
| `--color-neutral-500` | `#6B7280` | Texto desativado |
| `--color-neutral-400` | `#9CA3AF` | Bordas |
| `--color-neutral-300` | `#D1D5DB` | Bordas suaves |
| `--color-neutral-200` | `#E5E7EB` | Fundo de inputs, cards secondary |
| `--color-neutral-100` | `#F3F4F6` | Fundo de seções alternadas |
| `--color-neutral-50` | `#F9FAFB` | Fundo principal da página |
| `--color-white` | `#FFFFFF` | Fundo de cards, header |
| `--color-black` | `#000000` | Overlays |

### 2.2 Tipografia

#### Família de Fontes
```css
--font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-family-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

#### Escala Tipográfica (Ratio 1.25 — Major Third)
| Token | Size/Line | Peso | Uso |
|-------|-----------|------|-----|
| `--text-display` | 56px / 1.1 | 700 | Hero headline (desktop) |
| `--text-h1` | 40px / 1.2 | 700 | Título de página |
| `--text-h2` | 32px / 1.25 | 600 | Título de seção |
| `--text-h3` | 24px / 1.3 | 600 | Título de card/seção |
| `--text-h4` | 20px / 1.35 | 600 | Subtítulos |
| `--text-h5` | 18px / 1.4 | 500 | Labels de seção |
| `--text-body-lg` | 18px / 1.5 | 400 | Corpo destaque |
| `--text-body` | 16px / 1.5 | 400 | Corpo padrão |
| `--text-body-sm` | 14px / 1.5 | 400 | Corpo pequeno |
| `--text-caption` | 12px / 1.5 | 400 | Legends, captions |
| `--text-overline` | 11px / 1.5 | 600 | Labels ALL CAPS, badges |

#### Pesos de Fonte
```css
--font-weight-light: 300;
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--font-weight-black: 900;
```

### 2.3 Espaçamento (Escala 4px Base)
| Token | Valor | Uso |
|-------|-------|-----|
| `--space-0` | 0px | Sem espaço |
| `--space-1` | 4px | Espaço mínimo (ícone+texto) |
| `--space-2` | 8px | Espaço entre elementos inline |
| `--space-3` | 12px | Espaço entre elementos relacionados |
| `--space-4` | 16px | Padding padrão de componentes |
| `--space-5` | 20px | Espaço entre seções de card |
| `--space-6` | 24px | Padding de card, gap de grid |
| `--space-8` | 32px | Espaço entre seções |
| `--space-10` | 40px | Margem de seção |
| `--space-12` | 48px | Margem de página |
| `--space-16` | 64px | Espaço hero/seção grande |
| `--space-20` | 80px | Seção padding vertical |

### 2.4 Border Radius
| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-none` | 0px | Tabelas, inputs em grupo |
| `--radius-sm` | 4px | Badges, chips, tags |
| `--radius-md` | 8px | Botões, inputs, cards |
| `--radius-lg` | 12px | Cards grandes, modais |
| `--radius-xl` | 16px | Containers principais |
| `--radius-full` | 9999px | Pills, avatares, botões circulares |

### 2.5 Sombras
| Token | Valor | Uso |
|-------|-------|-----|
| `--shadow-none` | none | Sem sombra |
| `--shadow-xs` | 0 1px 2px rgba(0,0,0,0.05) | Inputs, bordas sutis |
| `--shadow-sm` | 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06) | Cards padrão, dropdowns |
| `--shadow-md` | 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06) | Cards com hover, tooltips |
| `--shadow-lg` | 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05) | Modais, dropdowns abertos |
| `--shadow-xl` | 0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04) | Drawers, side panels |
| `--shadow-2xl` | 0 25px 50px rgba(0,0,0,0.25) | Overlays, tooltips complexos |

### 2.6 Transições
```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-spring: 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

### 2.7 Breakpoints
| Token | Largura | Target |
|-------|---------|--------|
| `--bp-xs` | 375px | iPhone SE, celulares pequenos |
| `--bp-sm` | 640px | Celulares padrão |
| `--bp-md` | 768px | Tablets, celulares grandes landscape |
| `--bp-lg` | 1024px | Tablets landscape, laptops pequenos |
| `--bp-xl` | 1280px | Desktops, laptops padrão |
| `--bp-2xl` | 1536px | Desktops grandes |

---

## 3. Componentes

### 3.1 Botões

#### Primary Button
```
Background: --color-primary-500
Text: --color-white
Hover: --color-primary-400 (darken 10%)
Active: --color-primary-600
Disabled: --color-neutral-300 bg, --color-neutral-500 text
Padding: 12px 24px
Border Radius: --radius-md
Font: --text-body, --font-weight-semibold
Height: 48px
```

#### Secondary Button
```
Background: transparent
Border: 1.5px solid --color-primary-500
Text: --color-primary-500
Hover: --color-primary-50 bg
Padding: 12px 24px
Border Radius: --radius-md
Font: --text-body, --font-weight-semibold
Height: 48px
```

#### Accent/CTA Button
```
Background: --color-accent-500
Text: --color-white
Hover: --color-accent-400
Shadow: --shadow-sm
Padding: 14px 32px
Border Radius: --radius-full
Font: --text-body-lg, --font-weight-bold
Height: 52px
```

#### Ghost Button (Text Only)
```
Background: transparent
Text: --color-primary-500
Hover: --color-primary-50 bg
Padding: 8px 16px
Border Radius: --radius-md
Font: --text-body, --font-weight-medium
Min Height: 40px
```

#### Icon Button
```
Background: transparent
Hover: --color-neutral-100 bg
Padding: 8px
Border Radius: --radius-full
Size: 40px × 40px
```

### 3.2 Inputs

#### Text Input
```
Background: --color-white
Border: 1.5px solid --color-neutral-300
Border Radius: --radius-md
Padding: 12px 16px
Font: --text-body
Height: 48px
Focus: Border --color-primary-500, shadow 0 0 0 3px --color-primary-100
Error: Border --color-error
Placeholder: --color-neutral-500
```

#### Search Input (Hero)
```
Background: --color-white
Border: none
Shadow: --shadow-lg
Border Radius: --radius-full
Padding: 16px 24px
Font: --text-body-lg
Height: 60px
Width: 100%
```

#### Select/Dropdown
```
Similar ao Text Input
Ícone chevron-down à direita
Option list com sombra --shadow-lg
Item hover: --color-primary-50 bg
```

#### Chip/Tag
```
Background: --color-primary-50
Text: --color-primary-700
Border Radius: --radius-full
Padding: 4px 12px
Font: --text-caption, --font-weight-medium
Removable: ícone X ao lado
Hover: --color-primary-100 bg
```

### 3.3 Cards

#### Job Card
```
Background: --color-white
Border: 1px solid --color-neutral-200
Border Radius: --radius-lg
Shadow: --shadow-sm
Padding: 24px
Hover: shadow --shadow-md, border --color-primary-300, translateY(-2px)
Transition: --transition-base

Estrutura:
┌─────────────────────────────────────┐
│ [Logo]  Título da Vaga              │
│         Nome da Empresa             │
│                                      │
│ 💰 R$ 5.000 - 8.000  📍 Remoto      │
│ 🏷️ Sênior  ⏰ Full-time            │
│                                      │
│ Descrição curta da vaga (2-3 linhas) │
│                                      │
│ Tags: [React] [TypeScript] [Node]   │
│                                      │
│ Publicada há 2 dias  [❤️ Salvar]    │
└─────────────────────────────────────┘
```

#### Category Card
```
Background: --color-white
Border: 1px solid --color-neutral-200
Border Radius: --radius-lg
Shadow: --shadow-sm
Padding: 24px
Text Align: center
Min Width: 150px
Hover: bg --color-primary-50, border --color-primary-300

Estrutura:
┌──────────────────┐
│    [Ícone 48px]  │
│                  │
│  Tecnologia      │
│  12.450 vagas    │
└──────────────────┘
```

#### Company Card
```
Background: --color-white
Border: 1px solid --color-neutral-200
Border Radius: --radius-lg
Shadow: --shadow-sm
Padding: 24px

Estrutura:
┌─────────────────────────────────────┐
│ [Logo 56px]                         │
│                                     │
│ Nome da Empresa        ⭐ 4.8       │
│ São Paulo, SP                       │
│                                     │
│ 23 vagas abertas  →                │
└─────────────────────────────────────┘
```

### 3.4 Navegação

#### Top Navigation Bar (Web)
```
Background: --color-white
Shadow: --shadow-sm
Height: 72px
Padding: 0 24px
Layout: flex, space-between, align-center

Elementos:
[Logo] [Home] [Vagas] [Empresas] [Salários] [Blog] [Para Empresas] [🔔] [Avatar]
```

#### Bottom Navigation Bar (Mobile)
```
Background: --color-white
Shadow: --shadow-lg (top)
Height: 64px (safe area)
Padding: 0 16px
Layout: flex, space-around

Items (ícone + label):
[🏠 Home] [🔍 Buscar] [❤️ Salvos] [💼 Minhas Vagas] [👤 Perfil]
```

#### Sidebar / Filter Panel (Web)
```
Background: --color-white
Border Right: 1px solid --color-neutral-200
Width: 280px
Scroll: auto
Collapsible on mobile (drawer from left)

Seções:
- Tipo de Vaga (checkboxes)
- Nível de Experiência (checkboxes)
- Faixa Salarial (range slider)
- Localização (input + autocomplete)
- Modalidade (remoto, híbrido, presencial)
- Tecnologias (tags/chips)
```

### 3.5 Search Components

#### Search Bar (Hero/Home)
```
┌──────────────────────────────────────────────────────┐
│  🔍 Cargo, habilidade ou palavra-chave               │
│  📍 Cidade, estado ou "Remoto"                       │
│                                        [🔍 Buscar]   │
└──────────────────────────────────────────────────────┘
Layout: 2 inputs + 1 botão em linha
Border Radius: --radius-full
Shadow: --shadow-lg
```

#### Filter Chips (Quick Filters)
```
Rolagem horizontal de chips:
[🔍 Todos] [🏠 Remoto] [🏢 Híbrido] [🏛️ Presencial]
[⭐ Sênior] [🎯 Pleno] [🌱 Júnior] [🧠 Tech Lead]
```

#### Sort / Results Bar
```
┌──────────────────────────────────────────────────────┐
│  1.845 vagas encontradas                              │
│                                      [Ordenar por ▼]  │
└──────────────────────────────────────────────────────┘
```

### 3.6 Badges & Status

#### Badge de Nível
```
Background: --color-primary-50
Text: --color-primary-700
Border Radius: --radius-sm
Padding: 2px 8px
Font: --text-caption, --font-weight-semibold
```

#### Badge de Modalidade
```
Background: --color-success-light
Text: --color-success
Border Radius: --radius-sm
Padding: 2px 8px
Font: --text-caption, --font-weight-semibold
Ícone: 🏠 Remoto
```

#### Badge de Match (%)
```
Background: linear-gradient(to right, --color-success, --color-accent-500)
Text: --color-white
Border Radius: --radius-full
Padding: 4px 12px
Font: --text-body-sm, --font-weight-bold
```

#### Badge "Novo" (vagas recentes)
```
Background: --color-accent-500
Text: --color-white
Border Radius: --radius-sm
Padding: 2px 6px
Font: --text-caption, --font-weight-bold
Animation: pulse 2s infinite
```

### 3.7 Modais & Diálogos

#### Modal Padrão
```
Background: --color-white
Border Radius: --radius-xl
Shadow: --shadow-2xl
Max Width: 560px
Padding: 24px
Overlay: rgba(0,0,0,0.5), backdrop-filter blur(4px)
Animation: fade-in + scale-in

Estrutura:
┌─────────────────────────────────┐
│ [Ícone] Título          [X]    │
│                                 │
│ Conteúdo do modal              │
│                                 │
│           [Cancelar] [Confirmar]│
└─────────────────────────────────┘
```

#### Bottom Sheet (Mobile)
```
Background: --color-white
Border Radius: --radius-xl (top only)
Shadow: --shadow-2xl
Max Height: 80vh
Handle: 32px barra horizontal no topo
Animation: slide-up 300ms ease-out
```

#### Toast / Snackbar
```
Background: --color-neutral-900
Text: --color-white
Border Radius: --radius-md
Shadow: --shadow-lg
Padding: 12px 16px
Font: --text-body-sm
Position: bottom center (mobile), bottom right (desktop)
Animation: slide-up + fade-in
Auto dismiss: 5s

Variants:
- Success: bg --color-success, ícone ✅
- Error: bg --color-error, ícone ❌
- Info: bg --color-info, ícone ℹ️
```

### 3.8 Avatar & Profile

#### Avatar
```
Size: 40px (sm: 32px, md: 40px, lg: 56px, xl: 96px)
Shape: circle (--radius-full)
Border: 2px solid --color-white, shadow --shadow-sm
Fallback: Iniciais do usuário com bg --color-primary-100, text --color-primary-700
```

#### Company Logo
```
Size: 48px (md), 64px (lg)
Shape: --radius-md
Border: 1px solid --color-neutral-200
Background: --color-neutral-50
```

### 3.9 Loading States

#### Skeleton
```
Background: linear-gradient(90deg, --color-neutral-200 25%, --color-neutral-100 50%, --color-neutral-200 75%)
Animation: shimmer 1.5s infinite
Border Radius: --radius-md
```

Skeleton variants:
- **Text:** height 16px, width variable (80%, 60%, 40%)
- **Title:** height 24px, width 60%
- **Avatar:** circle, 40px
- **Card:** rectangle, full width, height 200px
- **Button:** height 48px, width 160px, border-radius --radius-md

#### Spinner
```
Size: 24px (sm), 32px (md), 48px (lg)
Border: 3px solid --color-neutral-200
Border Top: 3px solid --color-primary-500
Animation: spin 0.8s linear infinite
Border Radius: --radius-full
```

### 3.10 Empty States

```
┌──────────────────────────────────────┐
│                                      │
│         [Ilustração 120px]           │
│                                      │
│  Nenhuma vaga encontrada             │
│  Tente ajustar os filtros ou         │
│  buscar por outro termo.             │
│                                      │
│      [Limpar Filtros]                │
│                                      │
└──────────────────────────────────────┘
Background: --color-neutral-50
Border: 1px dashed --color-neutral-300
Border Radius: --radius-lg
Padding: 40px
Text Align: center
```

---

## 4. Telas Principais

### 4.1 Home Page (Print 2 — Referência)

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo]  Home  Vagas  Empresas  Blog  [Para Empresas] [🔔][A]│ TOP NAV
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │                                                       │   │
│  │      Encontre a vaga dos seus sonhos                  │   │ HERO
│  │      Milhares de oportunidades te esperando           │   │
│  │                                                       │   │
│  │  ┌─────────────────────┐ ┌─────────────────────┐      │   │ SEARCH
│  │  │ 🔍 Cargo, skill...  │ │ 📍 Localização      │ 🔍   │   │ BAR
│  │  └─────────────────────┘ └─────────────────────┘      │   │
│  │                                                       │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  Tags populares: [React] [Python] [DevOps] [UX] [Data] [AI] │ TRENDING
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Categorias em Destaque                                 │ │ CATEGORIES
│  │                                                         │ │
│  │  [💻 Tecnologia] [📊 Dados] [🎨 Design] [📱 Mobile]    │ │
│  │  [🏥 Saúde] [💰 Finanças] [📚 Educação] [🏗️ Eng.]      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Vagas em Destaque                          [Ver todas] │ │
│  │                                                         │ │
│  │  [Job Card 1] [Job Card 2] [Job Card 3] [Job Card 4]   │ │
│  └─────────────────────────────────────────────────────────┘ │ FEATURED
│                                                              │ JOBS
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Empresas Destaque                        [Ver todas]   │ │
│  │                                                         │ │
│  │  [Logo] [Logo] [Logo] [Logo] [Logo] [Logo]             │ │
│  │  Nome   Nome   Nome   Nome   Nome   Nome               │ │ COMPANIES
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Salários por Categoria                                  │ │
│  │                                                         │ │
│  │  Desenvolvedor Senior: R$ 12.000 - 18.000               │ │
│  │  Designer UX: R$ 7.000 - 12.000                         │ │ SALARY
│  │  Data Scientist: R$ 10.000 - 16.000                     │ │ INSIGHTS
│  │  DevOps: R$ 9.000 - 15.000                              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  CTA: É uma empresa? Anuncie suas vagas aqui! [Saiba+]  │ │ RECRUITER
│  └─────────────────────────────────────────────────────────┘ │ CTA
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ [Logo]                                                  │ │
│  │ Sobre · Ajuda · Termos · Privacidade · Contato          │ │ FOOTER
│  │ © 2026 PerfectJob                                       │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Página de Busca de Vagas (Print 1 — Referência)

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo]  Home  Vagas  Empresas  Blog  [Para Empresas] [🔔][A]│ TOP NAV
├───────────────────┬──────────────────────────────────────────┤
│ FILTROS           │ ┌──────────────────────────────────────┐ │
│ (Sidebar)         │ │ 🔍 React Developer    📍 São Paulo   │ │ SEARCH
│                   │ │                                    🔍 │ │ HEADER
│ ☐ Remoto          │ └──────────────────────────────────────┘ │
│ ☐ Híbrido         │                                         │
│ ☐ Presencial      │ [Todos] [Remoto] [Híbrido] [Sênior] ...│ FILTER
│                   │                                         │ CHIPS
│ Nível              │ 1.845 vagas encontradas     [Ordenar ▼] │ COUNT
│ ☐ Estágio         │                                         │
│ ☐ Júnior          │ ┌──────────────────────────────────────┐ │
│ ☐ Pleno           │ │ JOB CARD #1                         │ │
│ ☐ Sênior          │ │ ┌────┐                              │ │
│ ☐ Tech Lead       │ │ │Logo│ Senior React Developer       │ │
│ ☐ Especialista    │ │ │    │ Empresa XYZ · São Paulo, SP  │ │
│                   │ │ └────┘                              │ │
│ Faixa Salarial    │ │ 💰 R$ 12k-18k  📍 Remoto  🏷️ Senior  │ │
│ ○------●------○   │ │                                      │ │
│ R$2k       R$40k  │ │ We are looking for an experienced...│ │
│                   │ │                                      │ │
│ Data Publicação   │ │ [React] [TypeScript] [Next.js] [AWS]│ │
│ ○ Últimas 24h     │ │                                      │ │
│ ○ Última semana   │ │ Publicada há 2h  ❤️ Salvar  ⭐ 95%   │ │
│ ○ Último mês      │ └──────────────────────────────────────┘ │
│ ○ Qualquer data   │                                         │
│                   │ ┌──────────────────────────────────────┐ │
│ Modelo            │ │ JOB CARD #2                         │ │
│ ○ CLT             │ │ ...                                  │ │
│ ○ PJ              │ └──────────────────────────────────────┘ │
│ ○ Freelancer      │                                         │
│ ○ Cooperativa     │ ┌──────────────────────────────────────┐ │
│                   │ │ JOB CARD #3                         │ │
│ Tecnologias       │ │ ...                                  │ │
│ [React] [Node]    │ └──────────────────────────────────────┘ │
│ [Python] [Go]     │                                         │
│ [TypeScript] etc  │ ...mais cards...                        │
│                   │                                         │
│                   │  [1] [2] [3] ... [10]  Próxima →       │ PAGINATION
└───────────────────┴──────────────────────────────────────────┘
```

### 4.3 Detalhe da Vaga

```
┌──────────────────────────────────────────────────────────────┐
│ ← Voltar para vagas                            [❤️] [🔗] [📤] │
├──────────────────────────────────────────────────────────────┤
│ ┌──────┐                                                    │
│ │ Logo │  Senior React Developer                           │
│ │ 64px │  Empresa XYZ · São Paulo, SP                      │
│ └──────┘                                                    │
│                                                              │
│ 💰 R$ 12.000 - 18.000 (CLT)                                 │
│ 📍 Remoto (Brasil)                                          │
│ 🏷️ Sênior · Full-time                                       │
│ 📅 Publicada há 2 horas · Candidatos: 45                    │
│ ⭐ Match: 95%                                                │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [Candidatura Rápida]  [Salvar Vaga]                     │ │ CTAs
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ Descrição da Vaga                                            │
│ ────────────────                                             │
│ We are looking for an experienced React Developer to join   │
│ our team. You will be responsible for building and           │
│ maintaining high-quality web applications...                 │
│                                                              │
│ Responsabilidades                                            │
│ ────────────────                                             │
│ • Desenvolver interfaces usando React e TypeScript           │
│ • Colaborar com times de UX/UI e Backend                    │
│ • Implementar testes automatizados                           │
│ • Participar de code reviews                                 │
│                                                              │
│ Requisitos                                                   │
│ ──────────                                                   │
│ • 5+ anos de experiência com React                           │
│ • Sólido conhecimento em TypeScript                          │
│ • Experiência com Next.js e Node.js                          │
│ • Familiaridade com AWS ou GCP                               │
│                                                              │
│ Diferenciais                                                 │
│ ────────────                                                 │
│ • Experiência com GraphQL                                    │
│ • Contribuições open source                                  │
│ • Conhecimento em micro-frontends                            │
│                                                              │
│ Tags: [React] [TypeScript] [Next.js] [Node.js] [AWS]        │
│                                                              │
│ Sobre a Empresa                                              │
│ ──────────────                                               │
│ A Empresa XYZ é líder em soluções digitais para o mercado   │
│ financeiro. Com mais de 10 anos de experiência...            │
│                                                              │
│ 🌐 empresa-xyz.com.br                                       │
│ 👥 500-1000 funcionários                                     │
│ 📍 São Paulo, SP                                            │
│ ⭐ 4.8 (234 avaliações)                                     │
│                                                              │
│ Vagas Relacionadas                                           │
│ ────────────────                                             │
│ [Card 1] [Card 2] [Card 3]                                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Temas (Light / Dark)

### 5.1 Light Mode (Padrão)
Todos os tokens conforme definidos acima.

### 5.2 Dark Mode
```css
[data-theme="dark"] {
  /* Cores de fundo */
  --bg-primary: #0F172A;          /* Fundo principal */
  --bg-secondary: #1E293B;        /* Fundo de cards */
  --bg-tertiary: #334155;         /* Fundo de inputs, hover */
  --bg-elevated: #1E293B;         /* Modais, dropdowns */

  /* Texto */
  --text-primary: #F1F5F9;
  --text-secondary: #CBD5E1;
  --text-muted: #94A3B8;

  /* Bordas */
  --border-primary: #334155;
  --border-secondary: #475569;

  /* Sombras (adaptadas para dark) */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.4);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.5);
}
```

---

## 6. Acessibilidade

### 6.1 Contraste
- Texto normal vs fundo: ratio mínimo 4.5:1 (WCAG AA)
- Texto grande vs fundo: ratio mínimo 3:1 (WCAG AA)
- Componentes interativos: ratio mínimo 3:1 contra elementos adjacentes

### 6.2 Focus States
```css
:focus-visible {
  outline: 2px solid --color-primary-500;
  outline-offset: 2px;
  border-radius: --radius-md;
}
```

### 6.3 Touch Targets
- Área mínima de toque: 44×44px (iOS HIG)
- Espaçamento mínimo entre touch targets: 8px

### 6.4 Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 6.5 Screen Reader
- Todas imagens têm `alt` descritivo
- Ícones decorativos usam `aria-hidden="true"`
- Estado de elementos interativos via `aria-expanded`, `aria-selected`
- Navegação por landmarks (`<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>`)
- Live regions para conteúdo dinâmico: `aria-live="polite"` para atualizações

---

## 7. Design System no Código

### 7.1 Estrutura de Arquivos (React Native)
```
src/
├── design-system/
│   ├── tokens/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   ├── shadows.ts
│   │   └── index.ts
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.types.ts
│   │   │   ├── Button.styles.ts
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Card/
│   │   ├── Badge/
│   │   ├── Avatar/
│   │   ├── Modal/
│   │   ├── Toast/
│   │   ├── Skeleton/
│   │   ├── Chip/
│   │   ├── EmptyState/
│   │   └── index.ts
│   ├── theme/
│   │   ├── ThemeProvider.tsx
│   │   ├── light.ts
│   │   ├── dark.ts
│   │   └── useTheme.ts
│   └── index.ts
```

### 7.2 Estrutura de Arquivos (Spring Boot — Templates Thymeleaf/Web)
```
src/main/resources/
├── static/
│   ├── css/
│   │   └── design-system.css      /* CSS Custom Properties com todos os tokens */
│   └── js/
├── templates/
│   ├── fragments/
│   │   ├── header.html
│   │   ├── footer.html
│   │   ├── search-bar.html
│   │   ├── job-card.html
│   │   └── empty-state.html
│   └── pages/
│       ├── home.html
│       ├── search.html
│       └── job-detail.html
```

---

## 8. Regras de Uso do Design System

1. **Nunca usar cores diretamente** — sempre via tokens CSS/constantes.
2. **Nunca usar valores mágicos de espaçamento** — usar a escala 4px.
3. **Sempre usar os componentes do DS** — não criar variações ad-hoc.
4. **Tipografia consistente** — usar os tokens de fonte definidos.
5. **Mobile-first** — começar pelo menor breakpoint e expandir.
6. **Testar em ambos os temas** — todo componente deve funcionar em Light e Dark mode.
7. **Acessibilidade primeiro** — contraste, focus, screen reader em todo componente.
8. **Performance** — animações devem rodar a 60fps, respeitar `prefers-reduced-motion`.
