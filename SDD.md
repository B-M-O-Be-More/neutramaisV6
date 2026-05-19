# SDD — Software Design Document (Frontend)

> **Projeto:** [NOME_DO_PROJETO]  
> **Versão do Documento:** 1.0.0  
> **Data de Criação:** [DATA]  
> **Última Atualização:** [DATA]  
> **Autores:** [NOMES]  
> **Status:** [ ] Rascunho | [ ] Em Revisão | [ ] Aprovado | [ ] Em Execução

---

## Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Contexto e Motivação](#2-contexto-e-motivação)
3. [Objetivos e Metas](#3-objetivos-e-metas)
4. [Stakeholders e Usuários](#4-stakeholders-e-usuários)
5. [Arquitetura do Frontend](#5-arquitetura-do-frontend)
6. [Stack Tecnológica](#6-stack-tecnológica)
7. [Estrutura de Diretórios](#7-estrutura-de-diretórios)
8. [Padrões de Código e Convenções](#8-padrões-de-código-e-convenções)
9. [Sistema de Design e Componentes](#9-sistema-de-design-e-componentes)
10. [Gerenciamento de Estado](#10-gerenciamento-de-estado)
11. [Roteamento e Navegação](#11-roteamento-e-navegação)
12. [Integração com API](#12-integração-com-api)
13. [Autenticação e Autorização no Cliente](#13-autenticação-e-autorização-no-cliente)
14. [Formulários e Validações](#14-formulários-e-validações)
15. [Regras de Negócio no Frontend](#15-regras-de-negócio-no-frontend)
16. [Tratamento de Erros](#16-tratamento-de-erros)
17. [Performance e Otimização](#17-performance-e-otimização)
18. [Acessibilidade (A11y)](#18-acessibilidade-a11y)
19. [Internacionalização (i18n)](#19-internacionalização-i18n)
20. [Segurança no Frontend](#20-segurança-no-frontend)
21. [Testes](#21-testes)
22. [Build, Deploy e Ambientes](#22-build-deploy-e-ambientes)
23. [Observabilidade no Frontend](#23-observabilidade-no-frontend)
24. [SEO e Metadados](#24-seo-e-metadados)
25. [Anti-Patterns e O Que NÃO Fazer](#25-anti-patterns-e-o-que-não-fazer)
26. [Decisões Arquiteturais (ADR)](#26-decisões-arquiteturais-adr)
27. [Glossário](#27-glossário)
28. [Workflow GSD — Planejamento, Execução e Revisão](#28-workflow-gsd--planejamento-execução-e-revisão)

---

## 1. Visão Geral do Projeto

### 1.1 Nome do Projeto

> [NOME_DO_PROJETO]

### 1.2 Descrição Curta (1 parágrafo)

> [Descreva a aplicação frontend em 2-3 frases. O que é, para quem serve, qual problema resolve.]

### 1.3 Descrição Completa

> [Descreva detalhadamente a aplicação, seu propósito, o contexto de negócio, as telas principais e a experiência esperada do usuário.]

### 1.4 Tipo de Aplicação

- [ ] SPA (Single Page Application) — renderização client-side
- [ ] SSR (Server-Side Rendering) — renderização no servidor a cada request
- [ ] SSG (Static Site Generation) — páginas estáticas geradas no build
- [ ] ISR (Incremental Static Regeneration) — SSG com revalidação incremental
- [ ] Híbrido — combinação das estratégias acima por rota

**Justificativa da escolha:** [Por que este modelo de renderização para este projeto]

### 1.5 Escopo

**Dentro do escopo:**
- [O que a aplicação FAZ]
- [Telas/funcionalidades incluídas]

**Fora do escopo:**
- [O que a aplicação NÃO faz]
- [Funcionalidades explicitamente excluídas]

### 1.6 Premissas e Restrições

**Premissas:**
- [Ex: usuários têm acesso à internet com banda mínima de [X] Mbps]
- [Ex: suporte a browsers modernos, sem IE11]

**Restrições:**
- [Ex: bundle size máximo de [X] KB para o chunk inicial]
- [Ex: deve funcionar offline para [funcionalidades X] usando Service Worker]

---

## 2. Contexto e Motivação

### 2.1 Problema a Resolver

> [Descreva o problema de UX ou negócio que motivou esta aplicação.]

### 2.2 Solução Proposta

> [Como esta aplicação resolve o problema. Por que esta abordagem.]

### 2.3 Histórico

> [Se for reescrita/evolução de sistema existente, descreva o legado.]

### 2.4 Impacto Esperado

| Métrica | Antes | Meta |
|---------|-------|------|
| [Core Web Vital: LCP] | [Valor atual] | < 2.5s |
| [Taxa de conversão] | [Valor atual] | [Meta] |
| [NPS / CSAT] | [Valor atual] | [Meta] |
| [Taxa de erro no frontend] | [Valor atual] | < 0.1% |

---

## 3. Objetivos e Metas

### 3.1 Objetivos de Negócio

- [ ] [Objetivo mensurável 1]
- [ ] [Objetivo mensurável 2]

### 3.2 Objetivos Técnicos

- [ ] LCP (Largest Contentful Paint) < [X]s
- [ ] FID (First Input Delay) < [X]ms
- [ ] CLS (Cumulative Layout Shift) < [X]
- [ ] TTI (Time to Interactive) < [X]s
- [ ] Lighthouse Score Performance ≥ [X]
- [ ] Lighthouse Score Accessibility ≥ [X]
- [ ] Cobertura de testes ≥ [X]%
- [ ] Bundle inicial < [X] KB (gzipped)

### 3.3 Suporte a Browsers e Dispositivos

| Browser / Dispositivo | Versão Mínima | Nível de Suporte |
|----------------------|---------------|------------------|
| Chrome | Últimas 2 versões | Completo |
| Firefox | Últimas 2 versões | Completo |
| Safari | Últimas 2 versões | Completo |
| Edge | Últimas 2 versões | Completo |
| Mobile Safari (iOS) | iOS [X]+ | Completo |
| Chrome Android | Últimas 2 versões | Completo |
| [Outro] | [Versão] | [Nível] |

**Resoluções de viewport suportadas:**
- Mobile: 320px — 768px
- Tablet: 768px — 1024px
- Desktop: 1024px+
- Desktop wide: 1440px+

---

## 4. Stakeholders e Usuários

### 4.1 Stakeholders

| Papel | Nome/Equipe | Responsabilidade |
|-------|-------------|------------------|
| Product Owner | [Nome] | [Responsabilidade] |
| Tech Lead Frontend | [Nome] | [Responsabilidade] |
| Designer / UX | [Nome] | [Responsabilidade] |

### 4.2 Perfis de Usuário (Personas)

#### Persona: [NOME_PERSONA_1]
- **Papel:** [Ex: Administrador]
- **Nível técnico:** [Alto / Médio / Baixo]
- **Dispositivo principal:** [Desktop / Mobile / Ambos]
- **Necessidades:** [O que precisa fazer na aplicação]
- **Dores atuais:** [Frustrações com sistema atual]
- **Acessos:** [Quais telas e funcionalidades]

#### Persona: [NOME_PERSONA_2]
- **Papel:** [Ex: Usuário final]
- **Nível técnico:** [Alto / Médio / Baixo]
- **Dispositivo principal:** [Desktop / Mobile / Ambos]
- **Necessidades:** [O que precisa fazer]
- **Dores atuais:** [Frustrações]
- **Acessos:** [Quais telas e funcionalidades]

---

## 5. Arquitetura do Frontend

### 5.1 Visão Arquitetural

> [Descreva a abordagem arquitetural: Feature-based, Atomic Design, Domain-Driven, Islands Architecture, etc.]

**Padrão de organização:** [Ex: Feature-based com Atomic Design para componentes base]

**Justificativa:** [Por que este padrão para este projeto]

### 5.2 Diagrama de Alto Nível

```
┌───────────────────────────────────────────────┐
│                  BROWSER                        │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│  │   Pages   │  │Components │  │   State   │  │
│  │ (Routing) │  │  (UI)     │  │Management│  │
│  └─────┬───┘  └─────┬───┘  └─────┬───┘  │
│            │          │          │          │
│            │          ▼          │          │
│            └─────────▶API Layer◄─────┘  │
│                       (Services/  │           │
│                       Hooks)       │           │
└──────────────────────▼───────────────────┘
                         │
                    HTTP/HTTPS
                         │
               ┌─────────▼────────┐
               │  Backend API      │
               └─────────────────┘
```

### 5.3 Camadas da Aplicação

#### Camada de Apresentação (Pages / Views)
- **Responsabilidade:** Composição de componentes, layout de página, conectar estado à UI
- **O que NÃO deve fazer:** Lógica de negócio, chamadas diretas à API, transformações complexas de dados

#### Camada de Componentes
- **Responsabilidade:** Renderizar UI, responder a interações do usuário, emitir eventos para o pai
- **O que NÃO deve fazer:** Chamadas à API, gerenciar estado global, conhecer detalhes de outras páginas

#### Camada de Lógica (Hooks / Stores / Services)
- **Responsabilidade:** Gerenciar estado, orquestrar chamadas à API, transformações de dados
- **O que NÃO deve fazer:** Renderizar JSX/HTML diretamente

#### Camada de API (API Client / Fetchers)
- **Responsabilidade:** Comunicação com backend, serialização/deserialização, tratamento de erros HTTP
- **O que NÃO deve fazer:** Lógica de negócio, manipulação de estado UI

### 5.4 Fluxo de Dados

```
Ação do Usuário
     │
     ▼
[Componente] —emite evento—▶ [Hook/Store]
                                    │
                            (se necessário)
                                    │
                                    ▼
                            [API Service] —HTTP▶ [Backend]
                                    │
                            Atualiza Estado
                                    │
                                    ▼
                     [Re-render dos componentes inscritos]
```

---

## 6. Stack Tecnológica

### 6.1 Core

| Item | Tecnologia | Versão | Justificativa |
|------|-----------|--------|---------------|
| Framework | [Ex: Next.js / React / Vue / Angular / Nuxt] | [Versão] | [Por que] |
| Linguagem | [Ex: TypeScript] | [Ex: 5.x] | [Por que] |
| Package Manager | [Ex: pnpm / npm / yarn] | [Versão] | [Por que] |
| Build Tool | [Ex: Next.js built-in / Vite / Turbopack] | [Versão] | [Por que] |

### 6.2 Estilização

| Item | Tecnologia | Versão | Uso |
|------|-----------|--------|-----|
| CSS Solution | [Ex: Tailwind CSS / CSS Modules / Styled Components / Emotion] | [Versão] | [Abordagem principal] |
| Component Library | [Ex: shadcn/ui / Radix UI / Material UI / N/A] | [Versão] | [Componentes base] |
| Design Tokens | [Ex: CSS Custom Properties / Tailwind config] | — | [Cores, espaçamentos, tipografia] |
| Icones | [Ex: Lucide / Heroicons / Phosphor] | [Versão] | [Biblioteca de ícones] |
| Animações | [Ex: Framer Motion / CSS animations / Auto-animate] | [Versão] | [Onde e como usar] |

### 6.3 Gerenciamento de Estado

| Item | Tecnologia | Versão | Uso |
|------|-----------|--------|-----|
| Estado Global | [Ex: Zustand / Jotai / Redux Toolkit / Pinia / N/A] | [Versão] | [O que vive no estado global] |
| Estado de Servidor | [Ex: TanStack Query / SWR / Apollo / N/A] | [Versão] | [Cache de dados da API] |
| Estado de Formulário | [Ex: React Hook Form / Formik / Vee-Validate] | [Versão] | [Gerenciamento de forms] |

### 6.4 Qualidade e Testes

| Item | Tecnologia | Versão | Uso |
|------|-----------|--------|-----|
| Test Runner | [Ex: Jest / Vitest] | [Versão] | [Testes unitários e integração] |
| Testing Library | [Ex: Testing Library / Vue Test Utils] | [Versão] | [Render e interação com componentes] |
| E2E | [Ex: Playwright / Cypress] | [Versão] | [Testes end-to-end] |
| Linter | [Ex: ESLint + @typescript-eslint] | [Versão] | [Análise estática] |
| Formatter | [Ex: Prettier] | [Versão] | [Formatação de código] |
| Storybook | [Ex: Storybook 8 / N/A] | [Versão] | [Documentação de componentes] |

### 6.5 Monitoramento e Observabilidade

| Item | Tecnologia | Uso |
|------|-----------|-----|
| Error Tracking | [Ex: Sentry / Datadog RUM] | [Captura erros do client-side] |
| Analytics | [Ex: Mixpanel / PostHog / GA4] | [Análise de comportamento] |
| Performance | [Ex: Web Vitals + Analytics] | [Monitoramento de CWV] |

### 6.6 Dependências Principais

```
[Liste as dependências principais com versão]
Ex:
- next: ^15.x
- react: ^19.x
- typescript: ^5.x
- tailwindcss: ^4.x
- @tanstack/react-query: ^5.x
- zod: ^3.x
- react-hook-form: ^7.x
- zustand: ^5.x
```

---

## 7. Estrutura de Diretórios

```
[NOME_DO_PROJETO]/
├── src/ (ou app/ dependendo do framework)
│   ├── app/                         # Rotas e pages (Next.js App Router)
│   │   ├── (auth)/                  # Route group: páginas sem auth
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   ├── (dashboard)/             # Route group: páginas com auth
│   │   │   ├── layout.tsx
│   │   │   └── [feature]/
│   │   ├── api/                     # API routes (BFF se necessário)
│   │   └── layout.tsx
│   ├── features/                    # Features autocontidas
│   │   ├── [feature-1]/
│   │   │   ├── components/          # Componentes específicos da feature
│   │   │   ├── hooks/               # Hooks específicos da feature
│   │   │   ├── services/            # API calls da feature
│   │   │   ├── stores/              # Estado local da feature
│   │   │   ├── types/               # Tipos TypeScript da feature
│   │   │   └── utils/               # Utilitários da feature
│   ├── components/                  # Componentes compartilhados
│   │   ├── ui/                      # Primitivos (Button, Input, Modal)
│   │   ├── layout/                  # Header, Footer, Sidebar, Navigation
│   │   └── common/                  # Componentes comuns (ErrorBoundary, Loading)
│   ├── hooks/                       # Hooks compartilhados
│   ├── services/                    # API client e serviços compartilhados
│   │   ├── api.client.ts            # Instância do cliente HTTP
│   │   └── [recurso].service.ts
│   ├── stores/                      # Estado global compartilhado
│   ├── types/                       # Tipos TypeScript globais
│   │   ├── api.types.ts             # Tipos espelhados da API
│   │   └── index.ts
│   ├── lib/                         # Configurações de bibliotecas
│   │   ├── query-client.ts          # TanStack Query config
│   │   └── [lib].config.ts
│   ├── constants/                   # Constantes globais
│   └── utils/                       # Utilitários globais
├── public/                          # Assets estáticos
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── package.json
├── tsconfig.json
└── [configurações de lint/format/build]
```

**Regras de organização:**
- Cada feature é autocontida; exporta apenas o que outras features precisam
- Componentes em `components/ui/` são "dumb" — sem dependência de estado global
- Features não importam umas das outras diretamente; comunicam via estado global ou props
- Barrel files (`index.ts`) para encapsular exports de cada módulo

---

## 8. Padrões de Código e Convenções

### 8.1 Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|--------|
| Componentes | PascalCase | `UserCard`, `OrderTable` |
| Hooks | camelCase com prefixo `use` | `useAuth`, `useOrderList` |
| Serviços/utils | camelCase | `formatCurrency`, `orderService` |
| Constantes | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Tipos/Interfaces | PascalCase | `User`, `CreateOrderDto` |
| Arquivos de componente | PascalCase | `UserCard.tsx` |
| Arquivos de hook | camelCase | `useAuth.ts` |
| Arquivos de utilitário | camelCase | `formatDate.ts` |
| CSS Classes (Tailwind) | Seguir convenção do Tailwind | `bg-primary`, `text-sm` |
| Variáveis CSS / Design Tokens | kebab-case | `--color-primary`, `--spacing-4` |
| IDs de test | `data-testid` em kebab-case | `data-testid="submit-button"` |

### 8.2 Princípios de Componentes

- **Single Responsibility:** Um componente = uma responsabilidade
- **Composição sobre herança:** Prefer children/slots à herança
- **Props explícitas:** Nunca usar `{...props}` indiscriminadamente
- **Imutabilidade de estado:** Nunca mutar estado diretamente
- **Acessibilidade from the start:** Estrutura semântica, ARIA, keyboard nav desde o início

### 8.3 TypeScript

- `strict: true` em todo o projeto
- Nunca usar `any`; usar `unknown` quando tipo é realmente desconhecido
- Inferir tipos sempre que possível; tipar explícito quando necessário para clareza
- Validar dados externos (API, user input) com schema validator (Zod)
- Nunca fazer type assertion (`as Type`) sem verificar o tipo

```typescript
// PROIBIDO
const data = response.data as User;

// CORRETO
const parsed = UserSchema.safeParse(response.data);
if (!parsed.success) { /* tratar erro */ }
const data = parsed.data;
```

### 8.4 Regras de Commit (Conventional Commits)

```
<type>(<scope>): <description>
```

**Tipos:**
- `feat`: Nova funcionalidade ou tela
- `fix`: Correção de bug
- `refactor`: Refatoração sem mudança de comportamento
- `style`: Mudanças visuais/CSS sem lógica
- `perf`: Melhoria de performance
- `test`: Adição ou correção de testes
- `docs`: Documentação
- `chore`: Manutenção (deps, config)

### 8.5 Branching Strategy

```
main (produção)
  └── develop (integração)
        ├── feature/[ticket]-[descrição]
        ├── fix/[ticket]-[descrição]
        └── refactor/[ticket]-[descrição]
```

### 8.6 Code Review Checklist

- [ ] Componentes são acessíveis (ARIA, tabindex, keyboard nav)
- [ ] Não há lógica de negócio nos componentes de UI
- [ ] Dados externos são validados com schema
- [ ] Loading states, error states e empty states estão implementados
- [ ] Não há chamadas diretas à API nos componentes
- [ ] Nenhum dado sensível (token, senha) exposto no DOM ou console
- [ ] Performance: sem re-renders desnecessários (React.memo, useMemo, useCallback quando justificado)
- [ ] Testes cobrem o caminho feliz e estados de erro

---

## 9. Sistema de Design e Componentes

### 9.1 Design Tokens

> [Defina ou referencie os design tokens do projeto. Tokens são a fonte única de verdade para valores visuais.]

#### Cores

```
Primária: [Cor / token]
Secundária: [Cor / token]
Background: [Cor / token]
Superfície (cards, modals): [Cor / token]
Texto principal: [Cor / token]
Texto secundário: [Cor / token]
Borda: [Cor / token]
Erro: [Cor / token]
Alerta: [Cor / token]
Sucesso: [Cor / token]
Info: [Cor / token]
```

#### Tipografia

```
Fonte principal: [Nome da fonte]
Fonte de código: [Nome da fonte]

Escala tipográfica:
- text-xs:   12px / [line-height]
- text-sm:   14px / [line-height]
- text-base: 16px / [line-height]
- text-lg:   18px / [line-height]
- text-xl:   20px / [line-height]
- text-2xl:  24px / [line-height]
- text-3xl:  30px / [line-height]
- text-4xl:  36px / [line-height]
```

#### Espaçamento

```
Unidade base: 4px
Escala: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128
```

#### Bordas e Sombras

```
Border radius: [Valores usados]
Sombras: [Valores usados]
```

### 9.2 Hierarquia de Componentes

#### Nível 1: Primitivos (Atoms)
> Componentes sem dependência de outros componentes. Totalmente reutilizáveis.

| Componente | Descrição | Variantes |
|------------|-----------|----------|
| `Button` | Botão de ação | primary, secondary, ghost, destructive, sizes |
| `Input` | Campo de texto | com label, com erro, disabled, read-only |
| `Badge` | Rótulo de status | success, warning, error, info |
| `Avatar` | Foto ou iniciais do usuário | sizes, fallback |
| `Spinner` | Indicador de carregamento | sizes |
| `[Componente]` | [Descrição] | [Variantes] |

#### Nível 2: Compostos (Molecules)
> Combinação de primitivos para formar componentes funcionais.

| Componente | Descrição | Usa |
|------------|-----------|-----|
| `FormField` | Label + Input + mensagem de erro | `Input`, texto |
| `SearchBar` | Input com botão de busca | `Input`, `Button` |
| `DataTable` | Tabela com sort/filter/paginação | `Button`, etc. |
| `[Componente]` | [Descrição] | [O que usa] |

#### Nível 3: Organismos (Organisms)
> Componentes complexos que combinam molecules e podem ter lógica própria.

| Componente | Descrição | Lógica |
|------------|-----------|--------|
| `UserForm` | Formulário completo de usuário | validação, submit |
| `[Componente]` | [Descrição] | [Lógica] |

#### Nível 4: Templates / Pages
> Layout e composição das páginas.

### 9.3 Contrato de Componentes

> Todo componente público deve ter seu contrato (props) documentado.

```typescript
// Exemplo de contrato de componente
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  // Acessibilidade
  'aria-label'?: string;
}
```

### 9.4 Estados de Componentes

> Todo componente que renderiza dados deve implementar os seguintes estados:

| Estado | Descrição | Obrigatório |
|--------|-----------|-------------|
| **Loading** | Dados estão sendo carregados | Sim, para dados assíncronos |
| **Empty** | Não há dados para mostrar | Sim, para listas/tabelas |
| **Error** | Falha ao carregar dados | Sim, para dados assíncronos |
| **Success** | Dados carregados com sucesso | Sim (estado default) |
| **Disabled** | Funcionalidade desabilitada | Quando aplicável |

---

## 10. Gerenciamento de Estado

### 10.1 Categorias de Estado

| Categoria | O Que Armazenar | Tecnologia | Exemplo |
|-----------|-----------------|-----------|--------|
| **Estado de UI local** | Estado de dropdown, modal aberto, tab ativa | `useState` | `isMenuOpen` |
| **Estado de formulário** | Valores, erros, estado de submit | React Hook Form | `createUserForm` |
| **Estado de servidor** | Dados da API, cache, invalidação | TanStack Query / SWR | `useUsers()` |
| **Estado global de UI** | Tema, notificações, idioma | Zustand / Context | `themeStore` |
| **Estado de autenticação** | Usuário logado, token | [Store dedicada] | `authStore` |

### 10.2 Regras de Estado

- **Estado local primeiro:** Use `useState` até precisar compartilhar
- **Elevar com moderação:** Elevar estado apenas ao ancestral comum mais próximo
- **Não duplicar estado da API:** TanStack Query já é o cache; não copiar para store global
- **Derivar, não armazenar:** Valores calculados de outros estados não devem ser armazenados separadamente
- **Normalizar quando complex:** Para listas com muitas operações, considerar estrutura normalizada

### 10.3 Estado de Servidor (TanStack Query / SWR)

**Configuração global:**
```typescript
{
  staleTime: [Ex: 5 * 60 * 1000],       // 5 minutos
  gcTime: [Ex: 10 * 60 * 1000],         // 10 minutos
  retry: 2,
  refetchOnWindowFocus: [true/false],
}
```

**Por tipo de dado:**
| Dado | staleTime | gcTime | Invalidação |
|------|-----------|--------|-------------|
| [Dado que muda pouco] | [Ex: 30min] | [Ex: 1h] | [Evento que invalida] |
| [Dado que muda frequentemente] | [Ex: 0] | [Ex: 5min] | [Evento que invalida] |

### 10.4 Estado Global (Zustand / Similar)

**O que colocar no estado global:**
- Informações do usuário autenticado
- Preferências de UI (tema, idioma)
- Notificações/toasts
- [Outros dados verdadeiramente globais]

**O que NÃO colocar no estado global:**
- Dados que poderiam estar no cache do TanStack Query
- Estado de UI local (modal aberto, tab ativa)
- Dados de formulário

---

## 11. Roteamento e Navegação

### 11.1 Estrutura de Rotas

| Rota | Página | Requer Auth | Roles Permitidos | Descrição |
|------|---------|-------------|------------------|-----------|
| `/` | [Página inicial / redirect] | Não | Público | [Descrição] |
| `/login` | Página de login | Não | Público | [Descrição] |
| `/register` | Página de cadastro | Não | Público | [Descrição] |
| `/dashboard` | Dashboard principal | Sim | [Roles] | [Descrição] |
| `/[feature]` | [Descrição] | Sim | [Roles] | [Descrição] |
| `/[feature]/[id]` | [Descrição] | Sim | [Roles] | [Descrição] |
| `*` | Página 404 | Não | Público | Not Found |

### 11.2 Proteção de Rotas

**Fluxo de acesso à rota protegida:**
```
1. Usuário acessa /rota-protegida
2. Middleware/Guard verifica se há sessão válida
3. Se não autenticado: redirect para /login?redirect=/rota-protegida
4. Se autenticado mas sem permissão: redirect para /403 ou /dashboard
5. Se autenticado e com permissão: renderizar página
```

### 11.3 Navegação Programática

- Usar hooks do framework (`useRouter`, `navigate`)
- Nunca usar `window.location.href` exceto para redirects externos
- Preservar query params quando necessário
- Confirmar antes de navegar com dados não salvos em formulários

### 11.4 Deep Links e URL State

> [Quais estados devem ser persistíveis na URL (filtros, paginação, busca) para permitir compartilhamento e bookmark]

| Estado | URL Param | Exemplo | Padrão |
|--------|-----------|---------|--------|
| Página atual | `?page=` | `?page=2` | 1 |
| Filtro ativo | `?status=` | `?status=active` | all |
| Busca | `?q=` | `?q=fulano` | "" |
| [Estado] | [param] | [exemplo] | [padrão] |

---

## 12. Integração com API

### 12.1 Cliente HTTP

**Configuração base:**
```typescript
// Base URL: process.env.NEXT_PUBLIC_API_URL
// Timeout: [X]ms
// Headers padrão: Content-Type, Accept, X-Request-ID
// Interceptors: injetar Authorization, tratar 401 (refresh token)
```

**Interceptors obrigatórios:**
1. **Request:** Injetar Bearer token no header `Authorization`
2. **Request:** Gerar e injetar `X-Request-ID` para correlação
3. **Response:** Capturar 401 e tentar refresh de token
4. **Response:** Capturar erros de rede e transformar em erros tipados
5. **Response:** Logar erros 5xx no sistema de monitoramento

### 12.2 Padrão de Service Functions

```typescript
// Um arquivo por recurso: [recurso].service.ts
// Funções nomeadas por operação
export const userService = {
  list: (params: ListUsersParams) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: CreateUserDto) => api.post('/users', data),
  update: (id: string, data: UpdateUserDto) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};
```

### 12.3 Tipagem de Respostas

- Todos os tipos de resposta da API espelham o schema do backend
- Usar Zod para parsear e validar resposta (não confiar em `as Type`)
- Definir tipos em `types/api.types.ts`
- Gerar tipos automaticamente a partir do OpenAPI spec quando possível

### 12.4 Tratamento de Erros de API

```typescript
// Hierarquia de erros de API tratados no cliente:
NetworkError          // Sem conexão
TimeoutError          // Request expirou
ApiError              // Resposta de erro da API
  AuthError (401)     // Token inválido/expirado
  ForbiddenError (403)
  NotFoundError (404)
  ValidationError (400/422)
  ServerError (5xx)
```

**Regra:** Erros de API devem ser tratados na camada de hook/query, não no componente.

### 12.5 Gerenciamento de Cache e Invalidação

```typescript
// Após criar/atualizar/deletar, invalidar queries relacionadas:
queryClient.invalidateQueries({ queryKey: ['users'] });

// Otimistic updates para melhor UX:
onMutate: async (newData) => {
  await queryClient.cancelQueries({ queryKey: ['users'] });
  const previous = queryClient.getQueryData(['users']);
  queryClient.setQueryData(['users'], (old) => [...old, newData]);
  return { previous };
},
onError: (err, _, context) => {
  queryClient.setQueryData(['users'], context.previous);
},
```

---

## 13. Autenticação e Autorização no Cliente

### 13.1 Fluxo de Autenticação

```
1. Usuário submete credenciais no formulário de login
2. POST /auth/login → access_token + refresh_token
3. Armazenar access_token em [memória / httpOnly cookie]
4. Armazenar refresh_token em [httpOnly cookie (recomendado)]
5. Atualizar estado de auth (user, isAuthenticated)
6. Redirect para /dashboard
7. Cada request inclui Bearer [access_token]
8. Quando access_token expira:
   a. Interceptor captura 401
   b. POST /auth/refresh com refresh_token
   c. Atualiza access_token
   d. Retentar request original
9. Se refresh falhar: logout e redirect para /login
```

### 13.2 Armazenamento de Tokens

| Token | Armazenamento | Justificativa |
|-------|--------------|---------------|
| Access Token | [Ex: Memória (variável JS) / httpOnly cookie] | [Por que] |
| Refresh Token | [Ex: httpOnly Cookie (recomendado)] | [Protegido contra XSS] |

**NUNCA** armazenar tokens em `localStorage` ou `sessionStorage` se a aplicação renderiza conteúdo externo.

### 13.3 Autorização no Cliente

> Autorização real deve ser feita no backend. No frontend, usamos autorização para melhorar UX (esconder elementos que o usuário não pode usar).

**Regras:**
- Elementos de UI inacessíveis devem ser **ocultos**, não apenas desabilitados
- Rotas inacessíveis redirecionam, não apenas mostram erro
- Nunca confiar em permissões do cliente como segurança real
- Verificar permissões baseado nos roles do token JWT (claims)

```typescript
// Hook de permissões
const { can } = usePermissions();
if (can('users:create')) {
  // renderizar botão
}
```

### 13.4 Sessão e Persistência

- Sessão dura até: [Ex: expire do refresh token / até logout ativo]
- Ao recarregar a página: [Ex: tentar refresh silencioso; se falhar, redirecionar para login]
- Logout: limpar todos os tokens, limpar cache do TanStack Query, redirect para /login
- Logout em todas as abas: [Ex: via BroadcastChannel API]

---

## 14. Formulários e Validações

### 14.1 Padrão de Formulários

**Biblioteca:** [React Hook Form / Formik / outra]
**Validação:** Zod schemas (reutilizar schemas do backend quando possível)

```typescript
// Padrão: schema Zod define as regras
const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  // ...
});

// React Hook Form + zodResolver
const form = useForm<CreateUserInput>({
  resolver: zodResolver(createUserSchema),
  defaultValues: { email: '', name: '' },
});
```

### 14.2 Regras de Validação

> Definir validações para cada entidade principal do sistema.

#### Validações de [Entidade/Formulário 1]

| Campo | Tipo | Obrigatório | Regras | Mensagem de Erro |
|-------|------|-------------|--------|------------------|
| `email` | string | Sim | Formato válido, max 255 chars | "Email inválido" |
| `[campo]` | [tipo] | [S/N] | [regras] | "[mensagem]" |

### 14.3 UX de Formulários

**Quando validar:**
- `onBlur`: Validar campo ao perder foco (evitar mensagens prematuras)
- `onSubmit`: Revalidar tudo ao submeter
- Após primeiro submit: validar `onChange` para feedback rápido

**Feedback ao usuário:**
- Erros mostrados abaixo do campo correspondente
- Campo com erro destacado visualmente (borda vermelha)
- Botão de submit desabilitado durante submissão (evitar double submit)
- Loading state durante submit
- Mensagem de sucesso após operação bem-sucedida

**Auto-save (se aplicável):**
- Debounce de [X]ms antes de salvar
- Indicador visual de "salvando..." e "salvo"

---

## 15. Regras de Negócio no Frontend

> Regras de apresentação e UX específicas do frontend. Regras de negócio críticas DEVEM existir no backend.

### 15.1 Regras de Exibição

#### RNF-[001] — [Nome da Regra]
- **Descrição:** [O que a regra define na apresentação]
- **Condição:** [Quando se aplica]
- **Comportamento:** [O que acontece na UI]
- **Exemplo:** [Exemplo concreto]

#### RNF-[002] — [Nome da Regra]
> [Repetir estrutura]

### 15.2 Regras de Formato e Exibição de Dados

| Tipo de Dado | Formato de Exibição | Exemplo |
|-------------|---------------------|--------|
| Moeda (BRL) | R$ [valor] | R$ 1.234,56 |
| Data | [Formato] | DD/MM/YYYY |
| Data e hora | [Formato] | DD/MM/YYYY às HH:mm |
| Telefone | [Formato] | (11) 99999-9999 |
| CPF | [Formato] | XXX.XXX.XXX-XX |
| [Tipo] | [Formato] | [Exemplo] |

### 15.3 Estados de Status

> [Mapeie cada status de entidade para uma exibição visual]

| Status | Cor | Ícone | Label | Descrição para o usuário |
|--------|-----|-------|-------|-------------------------|
| `ACTIVE` | green | ✅ | "Ativo" | [Descrição] |
| `INACTIVE` | gray | ⏸ | "Inativo" | [Descrição] |
| `PENDING` | yellow | ⏳ | "Pendente" | [Descrição] |
| `[STATUS]` | [cor] | [ícone] | [Label] | [Descrição] |

---

## 16. Tratamento de Erros

### 16.1 Error Boundaries

- Implementar Error Boundary global para capturar erros inesperados
- Error Boundaries específicos por seção crítica da página
- Exibir UI de fallback amigável (não stack trace)
- Logar erro no sistema de monitoramento (Sentry, etc.)

### 16.2 Erros de API — Apresentação ao Usuário

| Código HTTP | Mensagem ao Usuário | Ação |
|------------|-------------------|------|
| 400 / 422 | Mensagem do campo específico | Mostrar inline no campo |
| 401 | "Sessão expirada. Faça login novamente." | Redirect para /login |
| 403 | "Você não tem permissão para esta ação." | Toast de erro |
| 404 | "Recurso não encontrado." | Página 404 ou toast |
| 409 | Mensagem específica do conflito | Toast ou inline |
| 429 | "Muitas tentativas. Aguarde [X] segundos." | Toast com countdown |
| 500+ | "Ocorreu um erro. Tente novamente." | Toast + botão retry |
| Rede | "Sem conexão. Verifique sua internet." | Toast persistente |

### 16.3 Mensagens de Erro

**Regras:**
- Mensagens em português, claras e acionáveis
- Não expor detalhes técnicos ao usuário ("database error", "null pointer")
- Oferecer ação quando possível ("Tentar novamente", "Ir para página inicial")
- Tons: informativo para 4xx, empatético para 5xx

---

## 17. Performance e Otimização

### 17.1 Core Web Vitals — Metas

| Métrica | Meta | Ferramenta |
|---------|------|------------|
| LCP (Largest Contentful Paint) | < 2.5s | Lighthouse, CrUX |
| FID / INP (Interaction to Next Paint) | < 200ms | Lighthouse, CrUX |
| CLS (Cumulative Layout Shift) | < 0.1 | Lighthouse, CrUX |
| TTFB (Time to First Byte) | < 600ms | WebPageTest |
| FCP (First Contentful Paint) | < 1.8s | Lighthouse |

### 17.2 Estratégias de Otimização

#### Código
- **Code splitting:** Cada rota é um chunk separado (lazy loading automático)
- **Tree shaking:** Importar apenas o necessário de bibliotecas
- **Bundle analysis:** Analisar bundle periodicamente com `@next/bundle-analyzer`
- **Memoização:** `React.memo`, `useMemo`, `useCallback` apenas quando há problema mensurável

#### Imagens
- Usar componente de imagem otimizado do framework (`next/image`)
- Formatos modernos: WebP / AVIF
- Lazy loading para imagens fora do viewport
- Definição explícita de `width` e `height` para prevenir CLS
- CDN para imagens em produção

#### Fontes
- Hospedar fontes localmente ou usar font-display: swap
- Preload das fontes críticas
- Limitar variants de fonte (pesos e estilos)

#### Requisições
- Prefetch de rotas prováveis (hover em links, viewport)
- Prefetch de queries na navegação
- Debounce em inputs de busca ([Ex: 300ms])
- Throttle em scroll handlers

#### Renderização
- Server Components por padrão; Client Components apenas quando necessário
- Skeleton loaders para prevenir CLS
- Otimistic UI para operações rápidas

### 17.3 Budget de Performance

| Recurso | Limite |
|---------|--------|
| Bundle JS inicial (gzipped) | < [X] KB |
| Bundle CSS inicial (gzipped) | < [X] KB |
| Imagem hero | < [X] KB |
| Total de requests na carga inicial | < [N] |

---

## 18. Acessibilidade (A11y)

### 18.1 Nível de Conformidade

**Meta:** WCAG [2.1 / 2.2] nível [A / AA / AAA]

### 18.2 Requisitos Obrigatórios

#### Estrutura Semântica
- Usar elementos HTML semânticos corretos (`<nav>`, `<main>`, `<header>`, `<footer>`, `<article>`, `<section>`)
- Um único `<h1>` por página; hierárquia de headings lógica (`h1 > h2 > h3`)
- Formulários com `<label>` associado a cada input (via `for`/`htmlFor` ou wrapping)

#### Navegação por Teclado
- Todos os elementos interativos acessíveis via Tab
- Ordem de Tab lógica e visível
- Atalhos de teclado para ações comuns
- Modais trapéiam foco enquanto abertos (focus trap)
- Esc fecha modais e dropdowns

#### ARIA
- `aria-label` em elementos sem texto visível (botões de ícone)
- `aria-describedby` para mensagens de erro em campos
- `aria-live` para conteúdo dinâmico (notificações, atualizações)
- `aria-busy` durante carregamento
- `role` apenas quando HTML semântico não é suficiente

#### Visual
- Contraste mínimo: 4.5:1 para texto normal, 3:1 para texto grande
- Não usar cor como única forma de transmitir informação
- Focus indicator visível em todos os elementos interativos
- Texto redimensionável até 200% sem quebrar layout

### 18.3 Ferramentas de A11y

- **Testes automáticos:** [Ex: axe-core / jest-axe]
- **Testes manuais:** Navegação por teclado, teste com screen reader (VoiceOver, NVDA)
- **Lint:** [Ex: eslint-plugin-jsx-a11y]

---

## 19. Internacionalização (i18n)

### 19.1 Idiomas Suportados

| Idioma | Código | Status | Padrão |
|--------|--------|--------|--------|
| Português (BR) | `pt-BR` | Suportado | Sim |
| [Idioma] | [código] | [status] | Não |

### 19.2 Configuração

**Biblioteca:** [Ex: next-intl / react-i18next / N/A se monolíngue]

**Estrutura de arquivos de tradução:**
```
messages/ (ou locales/)
├── pt-BR/
│   ├── common.json
│   ├── [feature].json
│   └── errors.json
└── en/
    └── ...
```

**Regras:**
- Nunca hardcodar strings de UI no código — sempre usar chaves de tradução
- Formatos de data, hora e moeda via `Intl` API (browser-native)
- Textos de placeholder de imagens e alt texts também devem ser traduzidos

---

## 20. Segurança no Frontend

### 20.1 Prevenção de XSS

- **NUNCA** usar `dangerouslySetInnerHTML` com conteúdo externo sem sanitização
- Sanitizar HTML externo com [Ex: DOMPurify] antes de renderizar
- Content Security Policy (CSP) configurado no servidor
- Nunca usar `eval()` ou `new Function()` com dados externos

### 20.2 Prevenção de CSRF

- Se usando cookies de sessão: CSRF tokens obrigatórios em mutações
- Se usando Bearer tokens: CSRF não é vuln via header injection
- SameSite=Strict ou Lax nos cookies de autenticação

### 20.3 Dados Sensíveis

- **NUNCA** logar dados de formulário de autenticação
- **NUNCA** expor tokens no DOM ou em URLs
- **NUNCA** armazenar dados sensíveis em localStorage sem criptografia
- Limpar dados sensíveis da memória após uso
- Máscaras em campos sensíveis (senha, cartão)

### 20.4 Dependências

- Auditar dependências regularmente (`npm audit`)
- Não usar pacotes abandonados ou com vulnerabilidades conhecidas
- Preferências por bibliotecas com manutenção ativa
- [Snyk / Dependabot] para alertas automáticos

### 20.5 Informações NÃO Exposíveis

| Informação | Risco | Mitigação |
|------------|-------|----------|
| Tokens de API (backend) | Acesso não autorizado | Nunca expor no frontend; usar BFF |
| Strings de conexão | Acesso ao banco | Nunca no frontend |
| Secrets e chaves privadas | Comprometimento total | Nunca no bundle do cliente |
| IDs internos | Enumeration | Usar UUIDs ou slugs |

---

## 21. Testes

### 21.1 Pirâmide de Testes

```
         /\
        /E2E\
       /------\
      / Integ.  \
     /----------\
    /    Unit    \
   /--------------\
```

**Metas de cobertura:**
- Unitários: [Ex: > 70% das funções em utils, hooks, stores]
- Integração: [Ex: todos os componentes com lógica relevante]
- E2E: [Ex: todos os fluxos críticos de negócio]

### 21.2 Testes Unitários

**O que testar:**
- Funções utilitárias (formatters, validators, transformers)
- Hooks customizados com lógica complexa
- Stores de estado (reduções, selectors)
- Schemas de validação (Zod)

### 21.3 Testes de Componente (Integração)

**O que testar:**
- Renderização correta em cada estado (loading, empty, error, success)
- Interações do usuário (click, input, submit)
- Comportamento condicional baseado em props
- Acessibilidade básica (axe-core)

**O que NÃO testar:**
- Detalhes de implementação (nomes de funções internas)
- CSS/estilização específica (testar classe aplicada, não pixel-perfect)

**Padrão:**
```typescript
describe('UserCard', () => {
  it('renders user name and email', () => { ... });
  it('shows loading skeleton when isLoading=true', () => { ... });
  it('calls onEdit when edit button is clicked', () => { ... });
  it('has no accessibility violations', async () => { ... });
});
```

### 21.4 Testes E2E (Playwright / Cypress)

**Fluxos críticos obrigatórios:**
- [ ] Login e logout
- [ ] [Fluxo 1 de negócio]
- [ ] [Fluxo 2 de negócio]
- [ ] [Fluxo de erro: mensagem de validation visível]

**Regras:**
- Usar `data-testid` para seleção, não classes CSS ou texto
- Testes E2E rodam contra ambiente staging (não mock)
- Um teste = um fluxo completo
- Não testar detalhes que testes de componente já cobrem

### 21.5 Visual Regression Testing

**Ferramenta:** [Ex: Chromatic + Storybook / Percy / N/A]
**Quando rodar:** [Ex: a cada PR em componentes de UI]
**Aprovação:** [Ex: manual pelo time de design]

---

## 22. Build, Deploy e Ambientes

### 22.1 Ambientes

| Ambiente | Propósito | URL | Branch | Deploy |
|----------|-----------|-----|--------|--------|
| Development | Dev local | localhost:[PORT] | qualquer | manual (`dev`) |
| Staging | QA e testes | [URL] | develop | automático |
| Production | Usuários finais | [URL] | main | manual com aprovação |

### 22.2 Variáveis de Ambiente

```bash
# Variáveis públicas (expostas ao browser, prefixo NEXT_PUBLIC_)
NEXT_PUBLIC_API_URL=https://api.[dominio]
NEXT_PUBLIC_APP_URL=https://[dominio]
NEXT_PUBLIC_[SERVICO]_KEY=[chave pública]

# Variáveis privadas (apenas server-side)
[SERVICO]_SECRET=[segredo]
```

**Regras:**
- NUNCA colocar secrets em variáveis `NEXT_PUBLIC_*`
- `NEXT_PUBLIC_*` são inlined no bundle — visibles ao usuário

### 22.3 CI/CD Pipeline

```
Push para feature branch:
  1. TypeScript typecheck
  2. ESLint
  3. Testes unitários
  4. Build de verificação

Merge para develop:
  1. TypeScript + ESLint
  2. Testes unitários + integração
  3. Build de produção
  4. Deploy automático → staging
  5. Testes E2E em staging
  6. Notificação de deploy

Merge para main:
  1. Todos os testes
  2. Build de produção
  3. Deploy manual com aprovação → produção
  4. Smoke tests em produção
  5. Monitoramento de CWV e erros por 30 min
```

### 22.4 Otimizações de Build

- Minificação de JS e CSS: automático
- Compresso de assets: gzip / brotli no CDN
- Cache headers para assets estáticos: `Cache-Control: max-age=31536000, immutable`
- Source maps em staging; desabilitado em produção (ou privado)

---

## 23. Observabilidade no Frontend

### 23.1 Error Tracking

**Ferramenta:** [Ex: Sentry]

**O que capturar:**
- Erros JavaScript não tratados
- Erros de API (5xx, timeouts)
- Erros capturados pelo Error Boundary
- Falhas em fluxos críticos (ex: falha no submit de formulário crítico)

**O que NÃO enviar:**
- Dados pessoais do usuário (emails, CPF)
- Tokens de autenticação
- Senhas em qualquer forma

### 23.2 Analytics de Produto

**Ferramenta:** [Ex: Mixpanel / PostHog / GA4]

**Eventos a rastrear:**
| Evento | Quando Disparar | Propriedades |
|--------|----------------|-------------|
| `page_view` | Navegação para nova rota | `path`, `referrer` |
| `[feature]_started` | Usuário inicia fluxo | [propriedades] |
| `[feature]_completed` | Usuário conclui fluxo | [propriedades] |
| `[feature]_failed` | Fluxo falha | `error_code` |
| `[evento]` | [quando] | [propriedades] |

**Privacidade:**
- Não enviar dados pessoais nos eventos
- Respeitar opt-out do usuário
- Configurar data retention adequado

### 23.3 Performance Monitoring

- Coletar Core Web Vitals em produção via [Web Vitals library]
- Reportar para [Analytics / Sentry / Datadog]
- Alertar quando CWV degradar em relação à baseline

---

## 24. SEO e Metadados

### 24.1 Metadados Obrigatórios (por página pública)

```html
<title>[Título da página] | [Nome do Produto]</title>
<meta name="description" content="[Descrição da página - max 160 chars]">
<meta name="robots" content="[index,follow / noindex,nofollow]">
<link rel="canonical" href="[URL canônica]">

<!-- Open Graph -->
<meta property="og:title" content="[Título]">
<meta property="og:description" content="[Descrição]">
<meta property="og:image" content="[URL da imagem 1200x630]">
<meta property="og:url" content="[URL]">
<meta property="og:type" content="website">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="[Título]">
<meta name="twitter:description" content="[Descrição]">
```

### 24.2 Páginas Indexadas vs Não Indexadas

| Tipo de Página | Indexada? | Motivo |
|---------------|-----------|--------|
| Páginas públicas (landing, blog) | Sim | SEO |
| Páginas de autenticadas (dashboard) | Não | Conteúdo privado |
| Páginas de login/register | Não | Não agrega valor de SEO |

### 24.3 Dados Estruturados (Schema.org)

> [Defina se e quais tipos de dados estruturados serão usados]

---

## 25. Anti-Patterns e O Que NÃO Fazer

> Violations devem ser bloqueadas em code review.

### 25.1 Arquitetura e Organização

| ❌ Anti-Pattern | ✅ Alternativa Correta | Impacto |
|----------------|----------------------|--------|
| Lógica de negócio em componentes de UI | Mover para hooks ou services | Testabilidade, reuso |
| Chamar API diretamente no componente | Usar hooks com TanStack Query | Cache, loading states, error handling |
| Estado global para tudo | Estado local + cache de servidor | Over-engineering, bugs |
| Componente que faz tudo (God Component) | Dividir em componentes menores | Manutenibilidade |
| Props drilling profundo (> 3 níveis) | Context ou estado global | Legibilidade |
| Import de feature A dentro de feature B | Extrair para shared/comum | Acoplamento circular |

### 25.2 Performance

| ❌ Anti-Pattern | ✅ Alternativa Correta | Impacto |
|----------------|----------------------|--------|
| Re-renders desnecessários | `React.memo`, `useCallback` com deps corretas | Performance |
| Tudo em Client Components | Server Components por padrão | Bundle maior, pior TTFB |
| Imagens sem otimização | `next/image` ou equivalente | LCP, CLS |
| Importar biblioteca inteira | Importar apenas o necessário | Bundle size |
| Listas longas sem virtualização | React Virtual / TanStack Virtual | Memória, performance de scroll |
| useEffect para derivação de estado | Calcular diretamente no render | Renders extras, bugs |

### 25.3 Segurança

| ❌ Nunca Fazer | Risco |
|----------------|-------|
| `dangerouslySetInnerHTML` com conteúdo externo sem sanitizar | XSS |
| Armazenar token em localStorage sem criptografia | XSS rouba token |
| Expor API keys privadas em variáveis `NEXT_PUBLIC_*` | Vaz. de credenciais |
| Confiar em permissões do cliente como segurança real | Bypass de autorização |
| Logar dados do usuário no console em produção | Vazamento de dados |

### 25.4 UX

| ❌ Anti-Pattern | ✅ Alternativa Correta | Impacto |
|----------------|----------------------|--------|
| Sem loading state | Skeleton / Spinner durante async | UX ruim, CLS |
| Sem empty state | Mensagem e CTA quando sem dados | Usuário confuso |
| Sem error state | Mensagem clara com ação de retry | Usuário perdido |
| Double submit possível | Desabilitar botão durante submit | Dados duplicados |
| Redirecionar sem confirmar dados não salvos | Modal de confirmação | Perda de dados |
| Mensagens de erro técnicas | Mensagens amigáveis e acionáveis | Usuário frustrado |

### 25.5 Comportamentos Proibidos

- A aplicação NUNCA deve: Submeter formulário sem validação client-side
- A aplicação NUNCA deve: Expor dados de outro usuário no DOM
- A aplicação NUNCA deve: Continuar funcionando após logout sem recarregar estado
- A aplicação NUNCA deve: [Comportamento específico proibido]

---

## 26. Decisões Arquiteturais (ADR)

### ADR-001 — [Título da Decisão]

- **Data:** [DATA]
- **Status:** Aceito / Proposto / Depreciado / Substituído por ADR-XXX
- **Contexto:** [Qual problema ou situação levou a esta decisão]
- **Decisão:** [O que foi decidido]
- **Justificativa:** [Por que esta opção foi escolhida]
- **Alternativas consideradas:**
  - [Alternativa 1]: [Por que foi rejeitada]
  - [Alternativa 2]: [Por que foi rejeitada]
- **Consequências:** [Impacto positivo e negativo]

### ADR-002 — [Título]

> [Repetir estrutura]

---

## 27. Glossário

| Termo | Definição |
|-------|-----------|
| [Termo de negócio] | [O que significa neste contexto] |
| SSR | Server-Side Rendering — renderização no servidor a cada request |
| CSR | Client-Side Rendering — renderização no browser |
| SSG | Static Site Generation — páginas geradas no build |
| ISR | Incremental Static Regeneration |
| CWV | Core Web Vitals — métricas de performance do Google |
| a11y | Accessibility (acessibilidade) |
| i18n | Internationalization (internacionalização) |
| BFF | Backend for Frontend — camada de API dedicada ao cliente |
| [Sigla] | [Definição] |

---

## 28. Workflow GSD — Planejamento, Execução e Revisão

> Este sistema utiliza o GSD (Get Shit Done) como metodologia de desenvolvimento.
> Instalar: `npx get-shit-done-cc@latest`

### 28.1 Estrutura de Arquivos GSD

```
.planning/
├── config.json          # Configuração do GSD (mode, modelos, parallelization)
├── PROJECT.md           # Visão geral do projeto
├── REQUIREMENTS.md      # Requisitos funcionais e não-funcionais
├── ROADMAP.md           # Fases e milestones
├── STATE.md             # Estado atual do desenvolvimento
├── CONTEXT.md           # Contexto acumulado de decisões
├── VERIFICATION.md      # Resultados de UAT por fase
└── [fase]-PLAN.md       # Planos por fase
```

### 28.2 Fases do Desenvolvimento

#### Fase 0 — Kickoff
```bash
/gsd-new-project
```
- Definir escopo baseado neste SDD
- Aprovar roadmap
- Configurar `.planning/config.json`
- Configurar Storybook e design system base

#### Fase N — [Nome da Fase]
```bash
/gsd-discuss-phase [N]   # Decisões de implementação
/gsd-plan-phase [N]      # Planejamento detalhado
/gsd-execute-phase [N]   # Execução
/gsd-verify-work [N]     # UAT: testar na UI manualmente
/gsd-ship [N]            # PR da fase
```

### 28.3 Fases Planejadas

| Fase | Nome | Entregáveis | Status |
|------|------|-------------|--------|
| 1 | [Ex: Setup e Design System] | [Config projeto, componentes base, Storybook] | [ ] Pendente |
| 2 | [Ex: Autenticação] | [Telas de login/register, fluxo auth completo] | [ ] Pendente |
| 3 | [Ex: [Feature Principal]] | [Telas, componentes, integração com API] | [ ] Pendente |
| N | [Nome] | [Entregáveis] | [ ] Pendente |

### 28.4 Comandos GSD Mais Úteis para Frontend

| Necessidade | Comando |
|-------------|--------|
| Próximo passo | `/gsd-progress --next` |
| Revisão de UI/UX | `/gsd-ui-review` |
| Fase de UI | `/gsd-ui-phase` |
| Tarefa rápida | `/gsd-quick [descrição]` |
| Debug de bug visual | `/gsd-debug` |
| Auditoria de qualidade | `/gsd-quality` |
| Mapear codebase | `/gsd-map-codebase` |
| Modo autônomo | `/gsd-autonomous` |

### 28.5 Configuração GSD Recomendada

```json
{
  "mode": "interactive",
  "model_profile": "balanced",
  "models": {
    "planning": "claude-sonnet-4-5",
    "research": "claude-haiku-4-5",
    "execution": "claude-sonnet-4-5",
    "verification": "claude-sonnet-4-5"
  },
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true
  },
  "parallelization": {
    "enabled": true,
    "max_agents": 4
  }
}
```

### 28.6 Definition of Done (DoD) — Frontend

Uma fase só é considerada **DONE** quando:
- [ ] Todas as telas da fase estão implementadas
- [ ] Design fiel ao Figma / especificação (conferido manualmente)
- [ ] Todos os estados implementados: loading, empty, error, success
- [ ] Responsvidade verificada (mobile, tablet, desktop)
- [ ] Acessibilidade: sem erros de axe-core, navegação por teclado funciona
- [ ] Testes de componente passando
- [ ] Testes E2E dos fluxos da fase passando
- [ ] TypeScript sem erros (`tsc --noEmit`)
- [ ] ESLint sem erros
- [ ] Lighthouse Score ≥ meta definida
- [ ] `/gsd-verify-work` aprovado
- [ ] PR revisado e aprovado

### 28.7 Checklist de UI Review (`/gsd-ui-review`)

O `/gsd-ui-review` do GSD avalia 6 pilares:
1. **Fidelidade Visual** — Match com design specs
2. **Responsividade** — Funciona em todos os viewports
3. **Estados** — Loading, empty, error, success implementados
4. **Interatividade** — Feedback de hover, focus, click
5. **Acessibilidade** — Sem violações WCAG
6. **Performance** — Sem re-renders desnecessários, bundle razoável

---

## Controle de Versões do Documento

| Versão | Data | Autor | Descrição das Mudanças |
|--------|------|-------|------------------------|
| 1.0.0 | [DATA] | [AUTOR] | Versão inicial |
| [X.Y.Z] | [DATA] | [AUTOR] | [O que mudou] |

---

*Este documento é um artefato vivo. Deve ser atualizado sempre que houver mudanças arquiteturais, novas decisões de design system, ou evoluções nos padrões adotados.*