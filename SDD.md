# SDD — Software Design Document (Frontend)

> **Projeto:** NeutraMais V6 — Frontend
> **Versão do Documento:** 1.0.0
> **Data de Criação:** 2026-05-19
> **Última Atualização:** 2026-05-19
> **Autores:** Pedro Lisboa (BMO)
> **Status:** [x] Rascunho | [ ] Em Revisão | [ ] Aprovado | [ ] Em Execução

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

> **NeutraMais V6** — Frontend Web

### 1.2 Descrição Curta (1 parágrafo)

> Plataforma SaaS B2B de **rede neutra para telecom**: marketplace onde provedores de internet (ISPs) ofertam capacidade/infraestrutura de rede para outros provedores contratarem. Atende três perfis — administradores BMO, provedores-ofertantes e provedores-consumidores — com fluxos de catálogo, contratação, gestão de SLA e billing recorrente.

### 1.3 Descrição Completa

> O NeutraMais conecta provedores de internet (ISPs) em um modelo de rede neutra: um ISP pode disponibilizar sua infraestrutura (rotas, capacidade, PoPs, links) e outros ISPs podem contratar essa capacidade como serviço recorrente. A plataforma centraliza o catálogo de ofertas, o fluxo de contratação, o acompanhamento de SLAs e a cobrança recorrente entre as partes. A V6 é a sexta iteração do produto, focada em modernizar a experiência (UX/Design) sem alterar o backend existente (API REST do V5).
>
> Telas principais previstas:
>
> - Autenticação (login, recuperação de senha)
> - Marketplace de ofertas (busca, filtros, detalhes)
> - Fluxo de contratação (proposta, negociação, assinatura)
> - Dashboard do provedor-ofertante (ofertas, contratos ativos, faturamento recebido)
> - Dashboard do provedor-consumidor (contratos ativos, consumo, faturas)
> - Área administrativa BMO (gestão de provedores, aprovações, suporte)

### 1.4 Tipo de Aplicação

- [ ] SPA (Single Page Application) — renderização client-side
- [ ] SSR (Server-Side Rendering) — renderização no servidor a cada request
- [ ] SSG (Static Site Generation) — páginas estáticas geradas no build
- [ ] ISR (Incremental Static Regeneration) — SSG com revalidação incremental
- [x] Híbrido — combinação das estratégias acima por rota

**Justificativa da escolha:** Next.js 16 com App Router permite escolher a estratégia de renderização por rota. Páginas públicas (landing, login) podem ser SSG/ISR para melhor TTFB e SEO; áreas autenticadas (dashboards, marketplace) usam SSR/CSR com Server Components por padrão, garantindo bundle menor no cliente e melhor segurança (dados sensíveis ficam no servidor).

### 1.5 Escopo

**Dentro do escopo (MVP V6):**

- Autenticação contra API REST do V5 (login, refresh token, logout)
- Marketplace de ofertas de rede com busca e filtros
- Fluxo de contratação fim-a-fim (proposta → assinatura → ativação)
- Dashboards diferenciados por perfil (ofertante, consumidor, admin BMO)
- Gestão de perfil e organização (provedor)
- Visualização de faturas e histórico de cobrança recorrente
- Notificações in-app
- Suporte multi-idioma (pt-BR, en-US, es-ES)

**Fora do escopo:**

- Reescrita ou alterações no backend (API V5 permanece como está)
- Aplicativo móvel nativo (apenas web responsivo)
- Provisionamento técnico real da rede (atribuição de VLANs, rotas BGP) — orquestração fica no backend / sistemas externos
- Faturamento/emissão fiscal (delegado a sistema fiscal existente)
- Suporte a navegadores legados (IE, versões muito antigas)

### 1.6 Premissas e Restrições

**Premissas:**

- Usuários acessam de ambientes corporativos com banda adequada (>10 Mbps)
- Suporte apenas a navegadores modernos (últimas 2 versões de Chrome, Firefox, Safari, Edge)
- Backend V5 (REST) é estável e mantém contrato durante o período de migração
- Tokens de autenticação são JWT com refresh token emitido pela API V5

**Restrições:**

- Bundle JS inicial (gzipped) ≤ 200 KB no chunk principal
- LCP < 2.5s em conexão 4G
- Aplicação deve funcionar em viewport mínimo de 360px (mobile) até 1920px+ (desktop wide)
- Conformidade com WCAG 2.1 nível AA
- Deploy via Docker em infraestrutura Digital Ocean (sem dependência de serviços Vercel-only)

---

## 2. Contexto e Motivação

### 2.1 Problema a Resolver

> A interface do NeutraMais V5 está visualmente e ergonomicamente defasada: padrões de UX antigos, baixa responsividade móvel, fluxos de contratação confusos e inconsistências entre telas. Esse atrito reduz a taxa de conversão de propostas em contratos e gera carga adicional no suporte BMO. O backend (API REST), por outro lado, é estável e atende às regras de negócio adequadamente.

### 2.2 Solução Proposta

> Reescrita completa do frontend usando uma stack moderna (Next.js 16 + Chakra UI v3), priorizando:
>
> - **Design system consistente** baseado em Chakra UI v3 e tokens próprios
> - **Responsividade mobile-first** para uso em campo (técnicos, comerciais)
> - **Fluxos simplificados** de contratação (menos passos, feedback claro)
> - **Performance** via Server Components (Next App Router) e renderização híbrida
> - **Acessibilidade** WCAG 2.1 AA desde o início
>
> O backend V5 (REST) permanece como fonte de verdade e é consumido pelo novo frontend sem alterações de contrato.

### 2.3 Histórico

> O NeutraMais existe há cinco versões anteriores. O V5 está em produção e cobre os principais fluxos de negócio. A reescrita V6 é motivada **exclusivamente** por dívida de UX/design — não há reescrita de backend nem mudança de modelo de dados nesta fase. O frontend V5 e V6 podem coexistir temporariamente durante a migração de usuários.

### 2.4 Impacto Esperado

| Métrica                                 | Antes (V5) | Meta (V6)          |
| --------------------------------------- | ---------- | ------------------ |
| LCP (Largest Contentful Paint)          | a medir    | < 2.5s             |
| INP (Interaction to Next Paint)         | a medir    | < 200ms            |
| CLS (Cumulative Layout Shift)           | a medir    | < 0.1              |
| Taxa de conversão (proposta → contrato) | a medir    | +20% vs V5         |
| NPS / CSAT da plataforma                | a medir    | a definir          |
| Taxa de erro no frontend (Sentry)       | n/a        | < 0.1% das sessões |
| Tickets de suporte por confusão de UX   | a medir    | -30%               |

---

## 3. Objetivos e Metas

### 3.1 Objetivos de Negócio

- [ ] Aumentar conversão de proposta → contrato em ≥ 20% vs V5
- [ ] Reduzir tickets de suporte por confusão de UX em ≥ 30%
- [ ] Habilitar uso mobile (técnicos em campo) — atualmente inviável no V5
- [ ] Suportar 3 idiomas (pt-BR, en-US, es-ES) para expansão regional
- [ ] Reduzir time-to-onboard de novo provedor em ≥ 25%

### 3.2 Objetivos Técnicos

- [ ] LCP (Largest Contentful Paint) < 2.5s (P75 em produção)
- [ ] INP (Interaction to Next Paint) < 200ms (P75)
- [ ] CLS (Cumulative Layout Shift) < 0.1 (P75)
- [ ] TTI (Time to Interactive) < 3.5s
- [ ] Lighthouse Score Performance ≥ 90
- [ ] Lighthouse Score Accessibility ≥ 95
- [ ] Cobertura de testes ≥ 70% em utils/hooks e ≥ 60% global
- [ ] Bundle JS inicial < 200 KB (gzipped, route shell)
- [ ] Zero erros de `tsc --noEmit` e ESLint em CI

### 3.3 Suporte a Browsers e Dispositivos

| Browser / Dispositivo | Versão Mínima     | Nível de Suporte |
| --------------------- | ----------------- | ---------------- |
| Chrome                | Últimas 2 versões | Completo         |
| Firefox               | Últimas 2 versões | Completo         |
| Safari                | Últimas 2 versões | Completo         |
| Edge                  | Últimas 2 versões | Completo         |
| Mobile Safari (iOS)   | iOS 15+           | Completo         |
| Chrome Android        | Últimas 2 versões | Completo         |
| IE / Edge Legacy      | —                 | Não suportado    |

**Resoluções de viewport suportadas:**

- Mobile: 360px — 768px
- Tablet: 768px — 1024px
- Desktop: 1024px — 1440px
- Desktop wide: 1440px+

---

## 4. Stakeholders e Usuários

### 4.1 Stakeholders

| Papel                     | Nome/Equipe  | Responsabilidade                              |
| ------------------------- | ------------ | --------------------------------------------- |
| Product Owner             | [A definir]  | Priorização de backlog, validação de fluxos   |
| Tech Lead Frontend        | Pedro Lisboa | Arquitetura, padrões, code review             |
| Designer / UX             | [A definir]  | Sistema de design, fluxos, prototipação       |
| Tech Lead Backend (V5)    | [A definir]  | Manutenção da API REST, contratos             |
| Stakeholder Comercial BMO | [A definir]  | Validação de regras de negócio do marketplace |

### 4.2 Perfis de Usuário (Personas)

#### Persona: Administrador BMO

- **Papel:** Equipe interna BMO — opera a plataforma, aprova provedores, dá suporte
- **Nível técnico:** Alto
- **Dispositivo principal:** Desktop
- **Necessidades:**
  - Aprovar/recusar cadastros de novos provedores
  - Visualizar e mediar contratos em disputa
  - Consultar métricas globais do marketplace
  - Configurar parâmetros do sistema (taxas, regras, categorias)
- **Dores atuais (V5):** Telas administrativas confusas, falta de filtros avançados, exportações limitadas
- **Acessos:** Área administrativa completa (`/admin/*`), visão read-only sobre todos os perfis

#### Persona: Provedor-Ofertante (ISP que cede capacidade)

- **Papel:** ISP que disponibiliza sua infraestrutura (PoPs, links, capacidade) no marketplace
- **Nível técnico:** Médio-Alto (equipe técnica/comercial do ISP)
- **Dispositivo principal:** Desktop principal; mobile para acompanhar em campo
- **Necessidades:**
  - Cadastrar e publicar ofertas (tipo de serviço, capacidade, região, preço)
  - Acompanhar propostas recebidas e responder
  - Gerenciar contratos ativos e SLA
  - Visualizar faturamento recebido
- **Dores atuais (V5):** Cadastro de oferta lento, falta de visão consolidada de contratos, pouco insight sobre demanda
- **Acessos:** Dashboard do seller (`/seller/*`), marketplace público (read-only)

#### Persona: Provedor-Consumidor (ISP que contrata capacidade)

- **Papel:** ISP que busca contratar capacidade/rotas de outros provedores
- **Nível técnico:** Médio-Alto
- **Dispositivo principal:** Desktop principal; mobile para consultas rápidas
- **Necessidades:**
  - Buscar ofertas no marketplace (filtros por região, capacidade, preço, SLA)
  - Enviar propostas e negociar termos
  - Acompanhar contratos ativos, consumo e faturas
  - Reportar incidentes/abrir tickets
- **Dores atuais (V5):** Busca pouco eficaz, sem comparação lado-a-lado, fluxo de proposta confuso
- **Acessos:** Marketplace (`/marketplace/*`), dashboard do buyer (`/buyer/*`)

---

## 5. Arquitetura do Frontend

### 5.1 Visão Arquitetural

> Arquitetura **Feature-based** sobre o **App Router** do Next.js 16, com componentes UI base organizados de forma compartilhada (não Atomic Design rígido, mas hierarquia primitivos → compostos → orgânicos). Cada feature (`marketplace`, `auth`, `contratos`, `billing`, etc.) é autocontida: agrupa componentes, hooks, services REST, schemas Yup, tipos e contextos.

**Padrão de organização:** Feature-based + hierarquia de componentes compartilhados (`components/ui`, `components/layout`, `components/common`).

**Justificativa:**

- O domínio do NeutraMais tem features bem delimitadas (marketplace, contratação, billing, admin) — feature-based reduz acoplamento e facilita ownership por equipe.
- Atomic Design puro tende a engessar para um produto B2B com componentes específicos de negócio (ex: cards de oferta, tabela de SLA); preferimos hierarquia funcional pragmática.
- App Router do Next 16 alinha bem com features: cada `app/(grupo)/feature/page.tsx` referencia código em `features/feature/`.

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

| Item            | Tecnologia              | Versão             | Justificativa                                                                                                                                                          |
| --------------- | ----------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | Next.js                 | 16.x (canary/beta) | App Router maduro, Server Components, renderização híbrida por rota. Versão em beta aceita conscientemente para aproveitar melhorias recentes (Turbopack, cache APIs). |
| UI Runtime      | React                   | 19.x               | Compatível com Next 16; Server Components, `use()` hook, melhorias de Suspense.                                                                                        |
| Linguagem       | TypeScript              | 5.x                | Tipagem estática obrigatória; `strict: true`.                                                                                                                          |
| Package Manager | pnpm                    | 9.x+               | Mais rápido e econômico em disco; lockfile determinístico.                                                                                                             |
| Build Tool      | Turbopack (via Next 16) | embedded           | Build/dev otimizados; padrão do Next 16.                                                                                                                               |

> **ADR-001:** Uso de Next 16 em canary — ver seção 26.

### 6.2 Estilização

| Item              | Tecnologia                                                 | Versão | Uso                                                                                            |
| ----------------- | ---------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| Component Library | Chakra UI                                                  | v3     | Componentes base acessíveis (Button, Input, Modal, Menu, etc.), com sistema de temas e tokens. |
| CSS Solution      | Chakra UI styled system + Panda CSS (interno do Chakra v3) | —      | Abordagem principal; CSS-in-JS gerado em build, com runtime mínimo.                            |
| Design Tokens     | Chakra theme + tokens próprios da marca                    | —      | Cores, espaçamentos, tipografia, sombras (`theme/tokens.ts`).                                  |
| Ícones            | `lucide-react`                                             | latest | Biblioteca SVG leve; tree-shakeable.                                                           |
| Animações         | CSS / Chakra transitions; Framer Motion sob demanda        | —      | Animações leves via Chakra; Framer Motion apenas onde sequências complexas justificarem.       |

### 6.3 Gerenciamento de Estado

| Item                 | Tecnologia                                | Versão            | Uso                                                                                             |
| -------------------- | ----------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------- |
| Estado Global        | React Context API                         | nativo (React 19) | Contextos dedicados por domínio (`AuthContext`, `OrgContext`, `ToastContext`, `LocaleContext`). |
| Estado de Servidor   | `fetch` nativo + `useState` / `useEffect` | nativo            | Sem cache library. Cada hook de feature encapsula `fetch` + estados de loading/error/data.      |
| Estado de Formulário | React Hook Form                           | 7.x               | Performance superior (uncontrolled), integração nativa com Yup via `@hookform/resolvers`.       |
| Validação            | Yup                                       | latest            | Schemas reutilizáveis para forms e parse de respostas críticas da API.                          |

### 6.4 Qualidade e Testes

| Item            | Tecnologia                                               | Versão | Uso                                                                                   |
| --------------- | -------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------- |
| Test Runner     | Vitest                                                   | latest | Testes unitários e integração; compatível com ESM nativo.                             |
| Testing Library | @testing-library/react                                   | latest | Render e interação com componentes.                                                   |
| E2E             | (a definir — Playwright recomendado para próxima fase)   | —      | Não no MVP; planejado para fase 2+.                                                   |
| Linter          | ESLint + `@typescript-eslint` + `eslint-plugin-jsx-a11y` | latest | Análise estática + regras de a11y.                                                    |
| Formatter       | Prettier                                                 | latest | Formatação automática (pre-commit).                                                   |
| Storybook       | Storybook 8                                              | latest | Documentação visual dos componentes UI; base para testes de regressão visual futuros. |

### 6.5 Monitoramento e Observabilidade

| Item              | Tecnologia                                                | Uso                                                |
| ----------------- | --------------------------------------------------------- | -------------------------------------------------- |
| Error Tracking    | Sentry (a confirmar)                                      | Captura erros JS, erros de fetch, Error Boundaries |
| Analytics         | (a definir — PostHog ou GA4)                              | Eventos de produto, funil de conversão             |
| Performance       | `web-vitals` lib reportando ao endpoint próprio ou Sentry | Coleta de Core Web Vitals em produção              |
| Logs estruturados | console + integração Sentry (breadcrumbs)                 | Contexto de erro em produção                       |

### 6.6 Dependências Principais

```
# Core
- next: ^16.x (canary)
- react: ^19.x
- react-dom: ^19.x
- typescript: ^5.x

# UI
- @chakra-ui/react: ^3.x
- @emotion/react: ^11.x          # peer do Chakra
- lucide-react: latest

# Forms & validação
- react-hook-form: ^7.x
- yup: ^1.x
- @hookform/resolvers: ^3.x

# i18n
- next-intl: ^3.x   (ou similar — ver seção 19)

# Auth (cliente da API V5)
- jose: ^5.x        (decodificar JWT no client quando necessário — sem verificar assinatura)

# Testes
- vitest: latest
- @testing-library/react: latest
- @testing-library/user-event: latest
- @testing-library/jest-dom: latest

# Dev
- eslint, prettier, eslint-plugin-jsx-a11y, @typescript-eslint
- storybook: ^8.x

# Observabilidade (a confirmar)
- @sentry/nextjs: latest
- web-vitals: latest
```

---

## 7. Estrutura de Diretórios

### 7.1 Convenção de componente (obrigatória)

> **Todo componente é uma pasta** nomeada em `PascalCase`, contendo exatamente três arquivos:

```
ComponentName/
├── component.tsx       # implementação do componente (default export)
├── interface.ts        # tipo das props (ComponentNameProps)
└── index.ts            # barrel: re-exporta o componente e o tipo
```

**Exemplo prático — `LoginContent`:**

```
LoginContent/
├── component.tsx
├── interface.ts
└── index.ts
```

```typescript
// LoginContent/interface.ts
export interface LoginContentProps {
  redirectTo?: string;
}

// LoginContent/component.tsx
import type { LoginContentProps } from './interface';

export function LoginContent({ redirectTo }: LoginContentProps) {
  // ...
  return <div>...</div>;
}

// LoginContent/index.ts
export { LoginContent } from './component';
export type { LoginContentProps } from './interface';
```

**Regras:**

- O **único ponto de import externo** é o `index.ts` da pasta: `import { LoginContent } from '@/features/auth/components/LoginContent'`
- `interface.ts` contém apenas tipos relacionados às props/contratos do componente
- Quando o componente precisar de hook, util ou subcomponente próprio, criar `hooks.ts` / `utils.ts` / pasta de subcomponente irmã — todos privados, **não exportados pelo `index.ts`**
- Componentes **nunca são arquivos soltos `.tsx`** — sempre pasta com os três arquivos
- Vale para todos os níveis: `components/ui/*`, `components/layout/*`, `components/common/*`, `features/<feature>/components/*`

### 7.2 Árvore de Diretórios

```
neutramaisV6/
├── src/
│   ├── app/                                 # Rotas Next.js App Router (Next 16)
│   │   ├── (public)/                        # Route group: rotas públicas (sem AuthGuard)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   ├── reset-password/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx                   # PublicShell (centralizado, sem sidebar)
│   │   ├── (app)/                           # Route group: tudo autenticado
│   │   │   ├── layout.tsx                   # AppShell + AuthGuard (sidebar/topbar variam por role)
│   │   │   ├── dashboard/
│   │   │   ├── marketplace/
│   │   │   ├── seller/                      # Acessível só com role 'seller' (renderização condicional)
│   │   │   ├── buyer/                       # Acessível só com role 'buyer'
│   │   │   ├── contracts/
│   │   │   ├── invoices/
│   │   │   ├── notifications/
│   │   │   ├── profile/
│   │   │   └── admin/                       # Acessível só com role 'admin' (renderização condicional)
│   │   │       ├── providers/
│   │   │       ├── users/
│   │   │       └── settings/
│   │   ├── api/                             # Route handlers (BFF: auth, refresh, logout, proxies)
│   │   ├── layout.tsx                       # Root layout (providers globais)
│   │   ├── not-found.tsx
│   │   └── error.tsx                        # Error boundary global
│   │
│   ├── components/                          # Componentes compartilhados (mesmo padrão de pasta)
│   │   ├── ui/                              # Wrappers em torno de Chakra (Button/, Input/, Card/, …)
│   │   │   ├── Button/
│   │   │   │   ├── component.tsx
│   │   │   │   ├── interface.ts
│   │   │   │   └── index.ts
│   │   │   ├── Input/
│   │   │   ├── FormField/
│   │   │   ├── Modal/
│   │   │   └── …
│   │   ├── layout/                          # AppShell/, Sidebar/, Topbar/, Footer/
│   │   └── common/                          # ErrorBoundary/, EmptyState/, LoadingState/, DataTable/
│   │
│   ├── hooks/                               # Hooks compartilhados (useDebounce, useMediaQuery, useUrlState)
│   │
│   ├── services/                            # Cliente HTTP e serviços compartilhados
│   │   ├── api.client.ts                    # Wrapper de fetch (base URL, headers, refresh)
│   │   ├── errors.ts                        # Hierarquia de erros tipados
│   │   └── permissions.ts                   # Helpers de checagem de permissão por role
│   │
│   ├── context/                             # Contextos globais (Theme, Locale, Toast, Auth)
│   │
│   ├── types/                               # Tipos TypeScript globais
│   │   ├── api.types.ts                     # Tipos espelhados da API V5
│   │   ├── domain.ts                        # Tipos de domínio (Provider, Offering, Contract, SLA)
│   │   └── index.ts
│   │
│   ├── lib/                                 # Configurações de bibliotecas externas
│   │   ├── chakra.config.ts                 # Tema customizado Chakra v3
│   │   ├── i18n.config.ts                   # Config next-intl
│   │   └── sentry.config.ts                 # (quando aplicável)
│   │
│   ├── messages/                            # Mensagens i18n (next-intl)
│   │   ├── pt-BR/
│   │   ├── en-US/
│   │   └── es-ES/
│   │
│   ├── constants/                           # Constantes (rotas, roles, status enums, permissions)
│   ├── utils/                               # Utilitários globais (formatCurrency, formatDate, …)
│   └── middleware.ts                        # Next middleware (auth + i18n + redirects)
│
├── public/                                  # Assets estáticos (logos, imagens, fontes locais)
├── tests/
│   ├── unit/                                # Vitest
│   ├── integration/                         # Vitest + Testing Library
│   └── e2e/                                 # (Playwright em fase futura)
│
├── .storybook/                              # Configuração Storybook
├── Dockerfile                               # Imagem para deploy Digital Ocean
├── docker-compose.yml                       # (dev opcional)
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── vitest.config.ts
```

### 7.3 Regras de organização

- Cada **componente** segue o padrão de pasta com `component.tsx` + `interface.ts` + `index.ts` (ver §7.1) — sem exceção
- Cada **feature** é autocontida: exporta apenas via barrels (`index.ts`) o que outras features precisam
- Features **não importam umas das outras diretamente** — comunicam via contextos globais (`AuthContext`, `OrgContext`) ou via props ascendentes
- Componentes em `components/ui/` são "dumb" — sem dependência de contextos de negócio, apenas props
- Wrappers em torno de Chakra UI são preferíveis a usar `@chakra-ui/react` direto nos componentes de feature (encapsula tema e padroniza variantes)
- Schemas Yup, tipos e services **vivem dentro da feature** que os usa primeiro; promove-se a `src/types/` apenas se compartilhado por 2+ features
- `app/api/*` (route handlers) é usado como BFF leve para operações que precisam de token server-side (refresh, logout) e evita expor a API V5 diretamente
- **Sem route group `(admin)`**: toda área autenticada vive em `(app)/*`, incluindo `(app)/admin/*` e `(app)/seller/*` / `(app)/buyer/*`. O acesso e a renderização dessas áreas é controlado por **permissões via role** (ver §13.3), não por segmentação de layout

---

## 8. Padrões de Código e Convenções

### 8.1 Nomenclatura

| Tipo                      | Convenção                       | Exemplo                                         |
| ------------------------- | ------------------------------- | ----------------------------------------------- |
| Componentes (símbolo)     | PascalCase                      | `OfferingCard`, `LoginContent`, `ContractTable` |
| Pasta de componente       | PascalCase, igual ao símbolo    | `LoginContent/`, `OfferingCard/`                |
| Arquivo de implementação  | `component.tsx` (fixo)          | dentro de `LoginContent/`                       |
| Arquivo de interface      | `interface.ts` (fixo)           | exporta `LoginContentProps`                     |
| Arquivo de barrel         | `index.ts` (fixo)               | re-exporta o símbolo e o tipo                   |
| Tipos de props            | PascalCase com sufixo `Props`   | `LoginContentProps`, `OfferingCardProps`        |
| Hooks                     | camelCase com prefixo `use`     | `useAuth`, `useContractList`                    |
| Arquivos de hook          | camelCase, sufixo `.ts`         | `useAuth.ts`                                    |
| Serviços/utils            | camelCase                       | `formatCurrency`, `contractService`             |
| Arquivos de serviço       | camelCase, sufixo `.service.ts` | `auth.service.ts`, `contracts.service.ts`       |
| Arquivos de utilitário    | camelCase                       | `formatDate.ts`                                 |
| Constantes                | UPPER_SNAKE_CASE                | `MAX_FILE_SIZE`, `DEFAULT_PAGE_SIZE`            |
| Tipos/Interfaces (gerais) | PascalCase                      | `Provider`, `CreateContractDto`                 |
| Schemas Yup               | camelCase com sufixo `Schema`   | `loginSchema`, `createContractSchema`           |
| Design tokens (Chakra)    | dot-path no theme               | `colors.brand.primary`, `space.4`               |
| Rotas (URL)               | kebab-case em inglês            | `/forgot-password`, `/seller/offerings`         |
| Diretórios de feature     | lowercase, inglês               | `marketplace/`, `contracts/`, `billing/`        |
| IDs de test               | `data-testid` em kebab-case     | `data-testid="submit-button"`                   |

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
- Validar dados externos (API, user input) com schema validator (**Yup**)
- Nunca fazer type assertion (`as Type`) sem verificar o tipo

```typescript
// PROIBIDO
const data = response.data as Provider;

// CORRETO — valida com Yup antes de usar
try {
  const data = await providerSchema.validate(response.data, {
    abortEarly: false,
  });
  // data tipado via InferType<typeof providerSchema>
} catch (err) {
  // tratar erro (ValidationError do Yup)
}
```

**Tipos de domínio centralizados em `src/types/domain.ts`** quando compartilhados; ficam dentro da feature quando exclusivos.

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
main (produção — protegida, deploy manual)
  └── develop (integração — deploy automático para staging)
        ├── feature/[ticket]-[descrição-curta]
        ├── fix/[ticket]-[descrição-curta]
        └── refactor/[ticket]-[descrição-curta]
```

- Branches de feature partem de `develop`; PR de volta para `develop`
- Merge em `main` apenas via release (cherry-pick ou merge de `develop` → `main` em janela combinada)
- Pre-commit hooks: lint-staged + prettier + tipo-check rápido

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

> Tokens centralizados no tema customizado do Chakra UI v3 em `src/lib/chakra.config.ts`. Fonte única de verdade para todos os valores visuais. **Valores específicos pendentes de definição com o time de Design** — abaixo estão os slots e referências semânticas.

#### Cores

```
[A definir paleta exata com Design BMO]

Slots semânticos (Chakra theme):
- brand.primary       — cor principal da marca BMO/NeutraMais
- brand.secondary     — apoio
- bg.canvas           — background da página
- bg.surface          — cards, modais, painéis
- bg.subtle           — destaques discretos (alternância de linhas, hover)
- text.primary        — texto principal
- text.secondary      — texto auxiliar / labels
- text.muted          — placeholder, disabled
- border.default      — borda padrão
- border.subtle       — divisores discretos
- status.success      — verde semântico
- status.warning      — amarelo/laranja
- status.error        — vermelho
- status.info         — azul informativo
```

Modos suportados: **light** (padrão); dark mode planejado para fase 2.

#### Tipografia

```
Fonte principal: Inter (variável, hospedada localmente via next/font)
Fonte de código: JetBrains Mono (em logs/labels técnicos quando aplicável)

Escala tipográfica (Chakra textStyles):
- xs:   12px / 16px (1.33)
- sm:   14px / 20px (1.43)
- md:   16px / 24px (1.5)     — base de texto
- lg:   18px / 28px (1.56)
- xl:   20px / 28px (1.4)
- 2xl:  24px / 32px (1.33)
- 3xl:  30px / 36px (1.2)
- 4xl:  36px / 40px (1.11)
- 5xl:  48px / 52px (1.08)

Pesos: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
```

#### Espaçamento

```
Unidade base: 4px (Chakra space scale)
Escala: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64
       (multiplicado por 4 → 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128, 160, 192, 256 px)
```

#### Bordas e Sombras

```
Border radius (Chakra radii):
- sm: 4px
- md: 6px      — padrão de botões, inputs
- lg: 8px      — padrão de cards
- xl: 12px     — modais
- full: 9999px

Sombras (Chakra shadows):
- xs: sombra discreta (botões hover)
- sm: cards
- md: dropdowns, popovers
- lg: modais
- xl: overlay de destaque
```

### 9.2 Hierarquia de Componentes

#### Nível 1: Primitivos (UI base)

> Wrappers leves em torno de componentes Chakra v3, padronizando variantes e tema. Vivem em `src/components/ui/`.

| Componente           | Descrição                      | Variantes                                              |
| -------------------- | ------------------------------ | ------------------------------------------------------ |
| `Button`             | Botão de ação                  | primary, secondary, ghost, destructive; sizes sm/md/lg |
| `Input`              | Campo de texto                 | com label, com erro, disabled, read-only               |
| `Select`             | Dropdown de seleção            | single, multi, com busca                               |
| `Textarea`           | Campo de texto multilinha      | com contador, auto-resize                              |
| `Checkbox` / `Radio` | Seleção booleana / única       | sizes                                                  |
| `Switch`             | Toggle on/off                  | sizes                                                  |
| `Badge`              | Rótulo de status               | success, warning, error, info, neutral                 |
| `Avatar`             | Foto ou iniciais do usuário    | sizes, fallback                                        |
| `Spinner`            | Indicador de carregamento      | sizes                                                  |
| `Tooltip`            | Dica contextual                | placement                                              |
| `Tag` / `Chip`       | Marcadores de filtro/categoria | removable                                              |

#### Nível 2: Compostos

> Combinação de primitivos para formar componentes funcionais. Vivem em `src/components/common/`.

| Componente         | Descrição                                      | Usa                                        |
| ------------------ | ---------------------------------------------- | ------------------------------------------ |
| `FormField`        | Label + Input + mensagem de erro + helper text | `Input`, texto                             |
| `SearchBar`        | Input com debounce, ícone e botão limpar       | `Input`, `Button`                          |
| `DataTable`        | Tabela com sort/filter/paginação + estados     | `Button`, `Badge`, `Spinner`, `EmptyState` |
| `EmptyState`       | Estado vazio com ilustração, mensagem e CTA    | `Button`                                   |
| `ErrorState`       | Erro com retry                                 | `Button`                                   |
| `LoadingState`     | Skeleton/spinner customizado por contexto      | `Spinner`                                  |
| `Modal` (wrapper)  | Modal padrão com header, body, footer          | Chakra Dialog                              |
| `Drawer` (wrapper) | Drawer lateral padrão                          | Chakra Drawer                              |
| `Pagination`       | Paginação com tamanho de página                | `Button`                                   |
| `DatePicker`       | Seleção de data com locale                     | input + popover                            |

#### Nível 3: Componentes de Negócio (Feature)

> Componentes complexos com lógica de domínio. Vivem em `src/features/<feature>/components/`.

| Componente            | Feature       | Descrição                                | Lógica                    |
| --------------------- | ------------- | ---------------------------------------- | ------------------------- |
| `LoginForm`           | auth          | Formulário de login completo             | submit, refresh, redirect |
| `OfferingCard`        | marketplace   | Card de oferta no marketplace            | navegação, favoritar      |
| `OfferingDetailPanel` | marketplace   | Detalhe completo de oferta               | dados + CTA contratar     |
| `ContractTimeline`    | contracts     | Linha do tempo de evolução do contrato   | render de status          |
| `ProposalForm`        | marketplace   | Form para enviar proposta de contratação | validação Yup, submit     |
| `InvoiceTable`        | billing       | Tabela de faturas com filtros e download | filtros, exportação       |
| `NotificationsBell`   | notifications | Sino de notificações com dropdown        | polling, contador         |

#### Nível 4: Templates / Pages

> Composição de layouts e features em rotas. Vivem em `src/app/.../page.tsx` ou `layout.tsx`.

| Template      | Uso                                                                         |
| ------------- | --------------------------------------------------------------------------- |
| `AppShell`    | Layout autenticado: Sidebar + Topbar + main                                 |
| `AdminShell`  | Layout admin com navegação específica                                       |
| `PublicShell` | Layout simples para `/login`, `/forgot-password` (logo + main centralizado) |

### 9.3 Contrato de Componentes

> Todo componente público deve ter seu contrato (props) documentado.

```typescript
// Exemplo de contrato de componente
interface ButtonProps {
  variant: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  // Acessibilidade
  "aria-label"?: string;
}
```

### 9.4 Estados de Componentes

> Todo componente que renderiza dados deve implementar os seguintes estados:

| Estado       | Descrição                    | Obrigatório                 |
| ------------ | ---------------------------- | --------------------------- |
| **Loading**  | Dados estão sendo carregados | Sim, para dados assíncronos |
| **Empty**    | Não há dados para mostrar    | Sim, para listas/tabelas    |
| **Error**    | Falha ao carregar dados      | Sim, para dados assíncronos |
| **Success**  | Dados carregados com sucesso | Sim (estado default)        |
| **Disabled** | Funcionalidade desabilitada  | Quando aplicável            |

---

## 10. Gerenciamento de Estado

### 10.1 Categorias de Estado

| Categoria                  | O Que Armazenar                       | Tecnologia                                                           | Exemplo                                           |
| -------------------------- | ------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------- |
| **Estado de UI local**     | Dropdown, modal aberto, tab ativa     | `useState`                                                           | `isMenuOpen`                                      |
| **Estado de formulário**   | Valores, erros, estado de submit      | React Hook Form + Yup                                                | `useForm({ resolver: yupResolver(loginSchema) })` |
| **Estado de servidor**     | Dados da API (loading/error/data)     | `fetch` + `useState` + `useEffect`, encapsulados em hook por feature | `useOfferings()`, `useContractDetail(id)`         |
| **Estado global de UI**    | Tema, idioma, toasts/notificações     | React Context API                                                    | `ThemeContext`, `LocaleContext`, `ToastContext`   |
| **Estado de autenticação** | Usuário logado, claims do JWT, sessão | React Context dedicado                                               | `AuthContext` + `AuthProvider`                    |

### 10.2 Regras de Estado

- **Estado local primeiro:** Use `useState` até precisar compartilhar entre componentes
- **Elevar com moderação:** Elevar apenas ao ancestral comum mais próximo
- **Sem duplicação de dados de API:** Os hooks de fetch são a fonte de verdade da resposta; não copiar para Context
- **Derivar, não armazenar:** Valores calculados de outros estados não devem ser armazenados separadamente
- **Context por domínio:** Um Context por preocupação (Auth, Theme, Toast, Locale) — evita re-render em cascata de um contexto monolítico
- **Estado do servidor permanece efêmero:** sem cache global; ao remontar, refazer fetch. Mitigar com:
  - `revalidate` nativo do Next (Server Components) onde aplicável
  - Hooks de feature com sinalização de "stale" interna (timestamp) se necessário

### 10.3 Padrão de Hook de Fetch (sem lib de cache)

```typescript
// src/features/marketplace/hooks/useOfferings.ts
type State<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

export function useOfferings(params: ListOfferingsParams) {
  const [state, setState] = useState<State<Offering[]>>({ status: "idle" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });

    offeringsService
      .list(params, { signal: controller.signal })
      .then((data) => setState({ status: "success", data }))
      .catch((error) => {
        if (error.name === "AbortError") return;
        setState({ status: "error", error });
      });

    return () => controller.abort();
  }, [JSON.stringify(params)]);

  return state;
}
```

**Regras de hooks de fetch:**

- Sempre suportar `AbortController` para cancelar em unmount/mudança de params
- Retornar uma **discriminated union** (`idle | loading | success | error`) — força tratamento de todos os estados
- Não engolir erros — devolver para o componente decidir como exibir
- Componente consumidor renderiza Loading/Empty/Error/Success states explicitamente

### 10.4 Estado Global (Context API)

**Contextos planejados:**

| Context         | Propósito                    | Dado armazenado                                                         |
| --------------- | ---------------------------- | ----------------------------------------------------------------------- |
| `AuthContext`   | Identidade e sessão          | `user`, `claims`, `isAuthenticated`, `login()`, `logout()`, `refresh()` |
| `ThemeContext`  | Modo claro/escuro (fase 2)   | `mode`, `setMode()`                                                     |
| `LocaleContext` | Idioma ativo                 | `locale` (pt-BR / en-US / es-ES), `setLocale()`                         |
| `ToastContext`  | Notificações temporárias     | `toast({ title, status, ... })`                                         |
| `OrgContext`    | Organização ativa (provedor) | `currentOrg`, `availableOrgs`, `switchOrg()`                            |

**O que colocar no Context global:**

- Identidade do usuário autenticado e claims (`AuthContext`)
- Organização ativa (`OrgContext`) quando usuário pertence a múltiplos provedores
- Preferências de UI (tema, idioma)
- Notificações/toasts globais

**O que NÃO colocar no Context global:**

- Dados de domínio que pertencem a uma feature específica (ofertas, contratos, faturas)
- Estado de UI local (modal aberto, tab ativa)
- Dados de formulário (RHF cuida)

---

## 11. Roteamento e Navegação

### 11.1 Estrutura de Rotas

> Roles definidos: `admin` (BMO), `seller` (provedor-ofertante), `buyer` (provedor-consumidor). Um usuário pode acumular `seller` + `buyer` (provedor que oferta e consome).

| Rota                        | Página                      | Requer Auth | Roles Permitidos                  | Descrição                                                                      |
| --------------------------- | --------------------------- | ----------- | --------------------------------- | ------------------------------------------------------------------------------ |
| `/`                         | Redirect inteligente        | Não         | Público                           | Redireciona para `/login` se anônimo; para dashboard apropriado se autenticado |
| `/login`                    | Login                       | Não         | Público                           | Form de login (email + senha)                                                  |
| `/forgot-password`          | Recuperação de senha        | Não         | Público                           | Solicita reset por email                                                       |
| `/reset-password`           | Definir nova senha          | Não         | Público (com token na query)      | Form com token + nova senha                                                    |
| `/dashboard`                | Dashboard inicial           | Sim         | Todos autenticados                | Visão geral baseada nos roles do usuário                                       |
| `/marketplace`              | Marketplace de ofertas      | Sim         | Todos                             | Listagem com busca/filtros                                                     |
| `/marketplace/[offeringId]` | Detalhe da oferta           | Sim         | Todos                             | Detalhes + CTA de contratação (se buyer)                                       |
| `/seller`                   | Dashboard do seller         | Sim         | seller                            | KPIs de ofertas e contratos ativos                                             |
| `/seller/offerings`         | Minhas ofertas              | Sim         | seller                            | CRUD de ofertas                                                                |
| `/seller/offerings/new`     | Criar oferta                | Sim         | seller                            | Formulário de criação                                                          |
| `/seller/offerings/[id]`    | Editar oferta               | Sim         | seller                            | Edição de oferta existente                                                     |
| `/buyer`                    | Dashboard do buyer          | Sim         | buyer                             | KPIs de contratos ativos e consumo                                             |
| `/contracts`                | Lista de contratos          | Sim         | seller, buyer                     | Contratos como ofertante OU consumidor                                         |
| `/contracts/[id]`           | Detalhe do contrato         | Sim         | seller, buyer (parte no contrato) | Termos, SLA, faturas, ações                                                    |
| `/invoices`                 | Lista de faturas            | Sim         | seller, buyer                     | Histórico de cobrança                                                          |
| `/invoices/[id]`            | Detalhe da fatura           | Sim         | seller, buyer (parte)             | Detalhes + download                                                            |
| `/notifications`            | Central de notificações     | Sim         | Todos                             | Histórico completo                                                             |
| `/profile`                  | Perfil pessoal              | Sim         | Todos                             | Dados do usuário, senha, preferências                                          |
| `/profile/organization`     | Dados da organização        | Sim         | admin da org                      | CNPJ, contato, faturamento                                                     |
| `/admin`                    | Dashboard admin BMO         | Sim         | admin                             | Métricas globais                                                               |
| `/admin/providers`          | Gestão de provedores        | Sim         | admin                             | Aprovações, suspensões                                                         |
| `/admin/users`              | Gestão de usuários          | Sim         | admin                             | Listagem global                                                                |
| `/admin/settings`           | Configurações da plataforma | Sim         | admin                             | Parâmetros gerais                                                              |
| `/403`                      | Sem permissão               | —           | —                                 | Forbidden                                                                      |
| `/404` (catch-all)          | Not Found                   | Não         | Público                           | Página não encontrada                                                          |

### 11.2 Proteção de Rotas

**Fluxo de acesso à rota protegida:**

```
1. Usuário acessa /rota-protegida
2. middleware.ts (Next 16) inspeciona o cookie httpOnly de sessão
3. Se não autenticado: redirect para /login?redirect=/rota-protegida
4. Se autenticado: passa para o layout `(app)`
5. AppShell + AuthGuard (Client Component) verificam claims via AuthContext
6. Páginas/seções com requisito de role específico (admin, seller, buyer)
   verificam permissão internamente e renderizam conteúdo OU redirecionam para /403
```

> **Não há route group `(admin)` separado.** Áreas como `/admin/*`, `/seller/*` e `/buyer/*` ficam todas em `(app)/*` e usam **renderização condicional por permissão** — não há layout dedicado para admin. O controle de acesso vive em:
>
> - `middleware.ts` (autenticado vs anônimo)
> - Hook `usePermissions()` / componente `<RequirePermission>` para roles específicos dentro da página
> - Sidebar/menu filtra itens visíveis com base nos roles do usuário (ver RNF-001)

**Camadas de defesa (defense in depth):**

1. **Middleware Next** — barreira inicial, redireciona anônimos para `/login`
2. **AuthGuard** no layout `(app)` — re-verifica sessão via AuthContext em transições client-side
3. **`<RequirePermission role="admin">`** dentro de páginas que demandam role específico — renderiza children ou redirect para `/403`
4. **Backend (V5)** — fonte real de autorização; o cliente é apenas UX

### 11.3 Navegação Programática

- Usar hooks do Next (`useRouter` de `next/navigation`)
- `<Link>` do Next por padrão (prefetch, preserva scroll)
- Nunca usar `window.location.href` exceto para redirects externos ou logout completo
- Preservar query params relevantes ao navegar (filtros, paginação)
- Confirmar antes de navegar com dados não salvos em formulários (`beforeunload` + modal interno)

### 11.4 Deep Links e URL State

> Estados que devem viver na URL para permitir compartilhamento, bookmark e botão "voltar".

| Estado               | URL Param                       | Exemplo                 | Padrão     |
| -------------------- | ------------------------------- | ----------------------- | ---------- |
| Página atual         | `?page=`                        | `?page=2`               | 1          |
| Tamanho da página    | `?pageSize=`                    | `?pageSize=50`          | 20         |
| Busca                | `?q=`                           | `?q=link%20dedicado`    | ""         |
| Filtro de status     | `?status=`                      | `?status=active`        | all        |
| Filtro de região     | `?region=`                      | `?region=sudeste`       | all        |
| Filtro de capacidade | `?minCapacity=` `?maxCapacity=` | `?minCapacity=1G`       | —          |
| Ordenação            | `?sort=` `?order=`              | `?sort=price&order=asc` | relevance  |
| Tab ativa            | `?tab=`                         | `?tab=invoices`         | (primeira) |

**Padrão de leitura/escrita:** hook `useUrlState(key, defaultValue, parser)` que sincroniza `useState` com `searchParams` do Next.

---

## 12. Integração com API

### 12.1 Cliente HTTP

> Como não usamos lib de cache, mantemos um **wrapper leve em `fetch`** para padronizar base URL, headers, timeout e tratamento de erros. O wrapper expõe métodos `get/post/put/patch/delete` e centraliza o tratamento de 401 (refresh).

**Configuração base:**

```typescript
// src/services/api.client.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
const DEFAULT_TIMEOUT_MS = 30_000;

// Headers padrão: Content-Type, Accept, X-Request-ID (uuid gerado por request)
// Authorization: injetado se houver access token em memória / cookie
```

**Comportamentos obrigatórios do wrapper:**

1. **Request:** injetar `Authorization: Bearer <accessToken>` quando disponível
2. **Request:** gerar e injetar `X-Request-ID` (uuid) para correlação com logs do backend
3. **Request:** suportar `AbortSignal` (cancelamento e timeout)
4. **Response 401:** chamar fluxo de refresh; se sucesso, retentar request original uma vez; se falha, fazer logout
5. **Response erro:** transformar em erro tipado (`NetworkError`, `ApiError`, etc. — ver 12.4)
6. **Response 5xx:** enviar para Sentry (sem dados sensíveis) e propagar erro

### 12.2 Padrão de Service Functions

```typescript
// Um arquivo por recurso, dentro da feature: features/<feature>/services/<resource>.service.ts
// Funções nomeadas por operação

export const offeringsService = {
  list: (params: ListOfferingsParams, opts?: { signal?: AbortSignal }) =>
    api.get<OfferingListResponse>("/offerings", {
      params,
      signal: opts?.signal,
    }),
  getById: (id: string) => api.get<Offering>(`/offerings/${id}`),
  create: (data: CreateOfferingDto) => api.post<Offering>("/offerings", data),
  update: (id: string, data: UpdateOfferingDto) =>
    api.patch<Offering>(`/offerings/${id}`, data),
  delete: (id: string) => api.delete<void>(`/offerings/${id}`),
};
```

**Regras:**

- Serviços não conhecem React (sem hooks, sem state)
- Serviços não tratam erros para o usuário — propagam para o hook chamador
- Cada service mora dentro da feature que o usa primeiro

### 12.3 Tipagem de Respostas

- Tipos de domínio (`Offering`, `Contract`, `Provider`, etc.) ficam em `src/types/domain.ts` ou na feature
- Tipos crus de envelope da API (paginação, metadados) em `src/types/api.types.ts`
- Onde houver risco real de divergência ou input não-confiável, **validar com Yup** antes de retornar para a UI
- **Gerar tipos a partir do OpenAPI spec do V5 quando disponível** (`openapi-typescript`) — evita drift manual; planejado para fase 2

### 12.4 Tratamento de Erros de API

```typescript
// src/services/errors.ts — hierarquia de erros tipados

class AppError extends Error {
  /* base */
}
class NetworkError extends AppError {
  /* sem conexão */
}
class TimeoutError extends AppError {
  /* request expirou */
}
class ApiError extends AppError {
  constructor(
    public status: number,
    public payload: unknown,
  ) {
    super();
  }
}
class AuthError extends ApiError {
  /* 401 */
}
class ForbiddenError extends ApiError {
  /* 403 */
}
class NotFoundError extends ApiError {
  /* 404 */
}
class ValidationError extends ApiError {
  constructor(
    status: number,
    public fields: Record<string, string[]>,
  ) {
    super(status, fields);
  }
}
class ServerError extends ApiError {
  /* 5xx */
}
```

**Regras:**

- Erros de API são tratados na camada de **hook de feature**, não no componente
- Componente decide UI baseado no `state.status === 'error'` e no tipo do erro
- 401 nunca chega ao componente — o wrapper já fez refresh ou logout

### 12.5 Estratégia de "Invalidação" sem cache library

Como não temos cache compartilhado, padrões para manter UI consistente após mutações:

```typescript
// Padrão: trigger explícito de refetch via state local ou ref do hook

// 1. Refetch após mutation (mais simples)
const { refetch } = useContractList();
async function handleArchive(id: string) {
  await contractService.archive(id);
  await refetch();
}

// 2. Atualização otimista local + rollback em erro
const [list, setList] = useState(initial);
async function handleArchive(id: string) {
  const previous = list;
  setList((l) => l.filter((c) => c.id !== id)); // otimista
  try {
    await contractService.archive(id);
  } catch (e) {
    setList(previous); // rollback
    toast({ status: "error", title: "Falha ao arquivar" });
  }
}

// 3. Bus de eventos interno para sincronizar telas
// (apenas quando 1 e 2 forem insuficientes — ex: nova fatura aparece em duas telas)
```

**Quando vier a dor de cache:** revisitar a decisão (ver seção 25 — não há ADR mas é um ponto a monitorar).

---

## 13. Autenticação e Autorização no Cliente

### 13.1 Fluxo de Autenticação

```
1. Usuário submete credenciais no formulário de login (POST /api/auth/login → BFF interno)
2. O route handler do Next chama POST /auth/login da API V5
3. API V5 retorna access_token (JWT, ~15min TTL) + refresh_token (~30 dias TTL)
4. BFF interno seta dois cookies httpOnly + Secure + SameSite=Lax:
     - nm_access  → access_token
     - nm_refresh → refresh_token
5. AuthContext faz fetch a /api/auth/me para popular user + claims
6. Redirect para /dashboard (ou rota de redirect= se vier de rota protegida)
7. Cada request do cliente para /api/* (BFF) usa cookies automaticamente
   O BFF anexa o Bearer ao chamar API V5
8. Quando access_token expira (server detecta 401 ao chamar API V5):
   a. BFF tenta POST /auth/refresh com refresh_token (do cookie)
   b. Se sucesso: atualiza cookies, retenta request original uma vez
   c. Se falha (refresh expirado/revogado): limpa cookies, devolve 401 ao cliente
9. Cliente recebendo 401 do BFF: AuthContext faz logout + redirect /login
```

> **Decisão:** tokens **não trafegam para o JS do cliente**. O acesso à API V5 é mediado pelos route handlers do Next em `app/api/*` (BFF), que leem/escrevem cookies httpOnly. O cliente JS nunca vê o access nem o refresh token.

### 13.2 Armazenamento de Tokens

| Token                             | Armazenamento                                             | Justificativa                                                           |
| --------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------- |
| Access Token                      | Cookie httpOnly + Secure + SameSite=Lax (`nm_access`)     | Inacessível a JS → mitiga XSS; SameSite=Lax permite navegação top-level |
| Refresh Token                     | Cookie httpOnly + Secure + SameSite=Strict (`nm_refresh`) | Mais restritivo; só enviado em mesmo site                               |
| Claims do usuário (não-sensíveis) | Memória do `AuthContext` (populado via `/api/auth/me`)    | UX: nome, foto, roles para renderizar UI                                |

**NUNCA:**

- Armazenar tokens em `localStorage`, `sessionStorage` ou JS-acessível
- Embutir o access_token em URLs, atributos HTML ou logs
- Trafegar refresh_token via header de resposta legível

### 13.3 Autorização no Cliente

> Autorização real é responsabilidade do backend. No frontend, autorização é exclusivamente para **UX** — esconder elementos que o usuário não pode usar.

**Regras:**

- Elementos de UI inacessíveis devem ser **ocultos**, não apenas desabilitados
- Rotas inacessíveis redirecionam para `/403` ou para o dashboard apropriado, sem expor menu
- Nunca confiar em permissões do cliente como segurança real (o backend valida)
- Verificar permissões baseado nos **roles e claims** do JWT, expostos via `AuthContext`

```typescript
// src/features/auth/hooks/usePermissions.ts
const { user } = useAuth();
const can = (permission: Permission) => user?.permissions.includes(permission) ?? false;

// Uso:
{can('offering:create') && <Button>Nova oferta</Button>}
```

### 13.4 Sessão e Persistência

- **Duração da sessão:** até o refresh_token expirar (30 dias) ou logout ativo
- **Recarregar a página:** o middleware do Next inspeciona o cookie `nm_access`; o `AuthContext` consulta `/api/auth/me` no mount para popular dados do usuário; se o token estiver expirado, o BFF tenta refresh transparente
- **Logout:** chama `/api/auth/logout` (BFF revoga refresh no backend V5, apaga cookies), limpa `AuthContext`, redirect para `/login`
- **Logout em múltiplas abas:** `BroadcastChannel('nm-auth')` envia evento `'logout'` → todas as abas escutam e reagem
- **Inatividade:** após X minutos sem atividade (a definir; sugestão 30min), exibir banner "Sessão expirando…"; sem ação → logout forçado

---

## 14. Formulários e Validações

### 14.1 Padrão de Formulários

**Biblioteca:** **React Hook Form** (uncontrolled, performance)
**Validação:** **Yup** schemas via `@hookform/resolvers/yup`
**Componentes:** wrappers em `src/components/ui/` (`FormField`, `Input`, `Select`, etc.) ligados ao RHF via `register`/`Controller`.

```typescript
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// Schema (em features/<feature>/schemas/<form>.schema.ts)
export const loginSchema = yup.object({
  email: yup.string().email("Email inválido").required("Email é obrigatório"),
  password: yup
    .string()
    .min(8, "Mínimo 8 caracteres")
    .required("Senha é obrigatória"),
});

export type LoginInput = yup.InferType<typeof loginSchema>;

// Componente
const form = useForm<LoginInput>({
  resolver: yupResolver(loginSchema),
  defaultValues: { email: "", password: "" },
  mode: "onBlur",
});
```

**Regras:**

- Cada formulário tem seu schema Yup em `features/<feature>/schemas/`
- Reaproveitar `InferType<typeof schema>` como tipo do form — sem dual de tipos
- Mensagens de validação em PT-BR no schema (depois movidas para i18n se necessário)

### 14.2 Regras de Validação

> Validações por entidade/formulário principal. Esta tabela é viva: deve crescer conforme novas telas forem implementadas.

#### Login (`loginSchema`)

| Campo      | Tipo   | Obrigatório | Regras                 | Mensagem                                 |
| ---------- | ------ | ----------- | ---------------------- | ---------------------------------------- |
| `email`    | string | Sim         | formato email, máx 255 | "Email inválido" / "Email é obrigatório" |
| `password` | string | Sim         | mín 8 caracteres       | "Senha deve ter no mínimo 8 caracteres"  |

#### Cadastro de Oferta (`createOfferingSchema`)

| Campo          | Tipo   | Obrigatório | Regras                 | Mensagem                               |
| -------------- | ------ | ----------- | ---------------------- | -------------------------------------- |
| `name`         | string | Sim         | 3–100 caracteres       | "Nome entre 3 e 100 caracteres"        |
| `description`  | string | Sim         | 10–2000 caracteres     | "Descrição entre 10 e 2000 caracteres" |
| `serviceType`  | enum   | Sim         | um dos valores válidos | "Selecione um tipo de serviço"         |
| `regions`      | array  | Sim         | ≥1 região              | "Selecione ao menos uma região"        |
| `capacityMbps` | number | Sim         | > 0                    | "Capacidade deve ser maior que zero"   |
| `priceCents`   | number | Sim         | > 0, máx R$ 999.999,99 | "Valor inválido"                       |
| `sla`          | object | Sim         | uptime%, response time | (validação composta)                   |

#### Proposta de Contratação (`createProposalSchema`)

> [A detalhar com Product Owner]

#### Reset de Senha (`resetPasswordSchema`)

| Campo             | Tipo   | Obrigatório | Regras                       | Mensagem                                   |
| ----------------- | ------ | ----------- | ---------------------------- | ------------------------------------------ |
| `password`        | string | Sim         | mín 8, 1 maiúscula, 1 número | "Senha deve ter 8+, 1 maiúscula, 1 número" |
| `confirmPassword` | string | Sim         | igual a `password`           | "Senhas não conferem"                      |

### 14.3 UX de Formulários

**Quando validar (`mode` do RHF):**

- `onBlur` (padrão) — feedback ao sair do campo
- Após primeiro submit: muda para `onChange` automaticamente (RHF gerencia)

**Feedback ao usuário:**

- Erros abaixo do campo (`FormField` mostra `helperText` em vermelho)
- Borda vermelha no campo com erro (Chakra `invalid` state)
- Botão de submit **desabilitado** durante `isSubmitting` (RHF) — previne double-submit
- Spinner no botão durante submit (`<Button isLoading>`)
- Toast de sucesso após operação bem-sucedida
- Erros 422 do backend mapeados de volta para campos via `form.setError(field, { message })`

**Auto-save (quando aplicável — ex: rascunho de oferta):**

- Debounce de 1000ms após última alteração
- Indicador visual ao lado do título: "salvando…" / "salvo às 14:32" / "erro ao salvar"
- Apenas em formulários longos e onde houver risco de perda de trabalho

---

## 15. Regras de Negócio no Frontend

> Regras de apresentação e UX específicas do frontend. Regras de negócio críticas DEVEM existir no backend.

### 15.1 Regras de Exibição

#### RNF-001 — Visibilidade de menu por role

- **Descrição:** o item de menu só aparece se o usuário tiver pelo menos um role compatível
- **Condição:** sempre, em render do Sidebar/Topbar
- **Comportamento:** itens sem permissão são **omitidos** (não renderizados, não desabilitados)
- **Exemplo:** "Administração" só aparece para `admin`; "Minhas Ofertas" só para `seller`

#### RNF-002 — CTA "Contratar oferta" apenas para buyer

- **Descrição:** o botão de contratação só aparece se o usuário atual for `buyer` (ou `seller`+`buyer`)
- **Condição:** página de detalhe da oferta (`/marketplace/[id]`)
- **Comportamento:** se for apenas `seller` ou `admin`, mostra estado read-only com nota explicativa

#### RNF-003 — Mascaramento de dados sensíveis na listagem

- **Descrição:** dados financeiros completos (CNPJ, conta bancária) só aparecem em telas de detalhe; na listagem usa-se versão mascarada
- **Condição:** componentes de tabela/listagem
- **Comportamento:** CNPJ exibido como `XX.XXX.***/****-XX` na listagem; completo no detalhe (com permissão)

#### RNF-004 — Confirmação de ações destrutivas

- **Descrição:** ações irreversíveis exigem modal de confirmação dupla
- **Condição:** despublicar oferta, cancelar contrato, encerrar assinatura, excluir usuário
- **Comportamento:** modal com texto descritivo + campo de confirmação digitando o nome da entidade (para ações de impacto alto)

#### RNF-005 — Indicador de saúde de SLA em contratos

- **Descrição:** contratos exibem indicador colorido baseado no cumprimento do SLA atual
- **Condição:** lista de contratos e detalhe
- **Comportamento:** verde (dentro do SLA), amarelo (próximo do limite), vermelho (violado nas últimas 24h)

#### RNF-006 — Fuso horário e localização numérica

- **Descrição:** todas as datas/horas são exibidas no fuso do navegador do usuário; números seguem o locale ativo
- **Condição:** sempre
- **Comportamento:** uso de `Intl.DateTimeFormat` e `Intl.NumberFormat` com locale do `LocaleContext`

> Esta lista cresce conforme novas regras forem identificadas. Cada regra novel deve receber ID sequencial (`RNF-NNN`).

### 15.2 Regras de Formato e Exibição de Dados

| Tipo de Dado              | Formato de Exibição (pt-BR) | Exemplo                   |
| ------------------------- | --------------------------- | ------------------------- |
| Moeda (BRL)               | `R$ #.###,##`               | R$ 1.234,56               |
| Data                      | `DD/MM/AAAA`                | 19/05/2026                |
| Data curta                | `DD/MM`                     | 19/05                     |
| Data e hora               | `DD/MM/AAAA HH:mm`          | 19/05/2026 14:32          |
| Data relativa             | "há X tempo" / "em X tempo" | "há 3 dias", "em 2h"      |
| Telefone                  | `(##) #####-####`           | (11) 99999-9999           |
| CNPJ                      | `##.###.###/####-##`        | 12.345.678/0001-90        |
| Capacidade de rede        | valor + unidade             | 100 Mbps, 1 Gbps, 10 Gbps |
| Latência                  | valor + ms                  | 12ms                      |
| Uptime (%)                | `##,##%`                    | 99,95%                    |
| Identificador de contrato | `NM-AAAA-####`              | NM-2026-0042              |

> Em `en-US` e `es-ES` os separadores numéricos e formato de data seguem o locale via `Intl`.

### 15.3 Estados de Status

> Mapeamento canônico de status para apresentação. Cores referenciam tokens do tema (seção 9.1).

#### Status de Oferta

| Status      | Cor (token)    | Label PT    | Descrição                  |
| ----------- | -------------- | ----------- | -------------------------- |
| `DRAFT`     | gray           | "Rascunho"  | Oferta não publicada       |
| `PUBLISHED` | brand.primary  | "Publicada" | Visível no marketplace     |
| `PAUSED`    | status.warning | "Pausada"   | Não recebe novas propostas |
| `ARCHIVED`  | gray.muted     | "Arquivada" | Histórico, não retornável  |

#### Status de Proposta

| Status           | Cor            | Label PT        | Descrição                     |
| ---------------- | -------------- | --------------- | ----------------------------- |
| `SENT`           | status.info    | "Enviada"       | Aguardando resposta do seller |
| `IN_NEGOTIATION` | status.warning | "Em negociação" | Termos sendo ajustados        |
| `ACCEPTED`       | status.success | "Aceita"        | Pronta para virar contrato    |
| `REJECTED`       | status.error   | "Recusada"      | Encerrada sem contrato        |
| `EXPIRED`        | gray           | "Expirada"      | Sem resposta no prazo         |

#### Status de Contrato

| Status               | Cor            | Label PT              | Descrição                            |
| -------------------- | -------------- | --------------------- | ------------------------------------ |
| `PENDING_ACTIVATION` | status.warning | "Aguardando ativação" | Assinado, aguardando provisionamento |
| `ACTIVE`             | status.success | "Ativo"               | Em execução                          |
| `SUSPENDED`          | status.error   | "Suspenso"            | Pausado (inadimplência, SLA crítico) |
| `IN_DISPUTE`         | status.error   | "Em disputa"          | Mediação aberta                      |
| `TERMINATED`         | gray           | "Encerrado"           | Concluído ou cancelado               |

#### Status de Fatura

| Status      | Cor            | Label PT         | Descrição                    |
| ----------- | -------------- | ---------------- | ---------------------------- |
| `OPEN`      | status.info    | "Em aberto"      | Gerada, ainda no prazo       |
| `DUE_SOON`  | status.warning | "Vence em breve" | < 3 dias do vencimento       |
| `OVERDUE`   | status.error   | "Atrasada"       | Vencida sem pagamento        |
| `PAID`      | status.success | "Paga"           | Liquidada                    |
| `CANCELLED` | gray           | "Cancelada"      | Cancelada antes do pagamento |

---

## 16. Tratamento de Erros

### 16.1 Error Boundaries

- **Error Boundary global** via `src/app/error.tsx` (Next App Router) — fallback amigável para qualquer erro não capturado
- **Error Boundaries específicos** por seção crítica: marketplace, dashboards, formulários longos (criar componente `<FeatureErrorBoundary>` em `components/common/`)
- UI de fallback sempre amigável (nunca stack trace ao usuário em produção)
- Ação primária no fallback: "Tentar novamente"
- Ação secundária: "Voltar para o início"
- Logar erro no Sentry com contexto (rota, user_id anonimizado, breadcrumbs)
- Erros em `error.tsx` por rota são logados automaticamente

### 16.2 Erros de API — Apresentação ao Usuário

| Código HTTP | Mensagem ao Usuário                        | Ação                    |
| ----------- | ------------------------------------------ | ----------------------- |
| 400 / 422   | Mensagem do campo específico               | Mostrar inline no campo |
| 401         | "Sessão expirada. Faça login novamente."   | Redirect para /login    |
| 403         | "Você não tem permissão para esta ação."   | Toast de erro           |
| 404         | "Recurso não encontrado."                  | Página 404 ou toast     |
| 409         | Mensagem específica do conflito            | Toast ou inline         |
| 429         | "Muitas tentativas. Aguarde [X] segundos." | Toast com countdown     |
| 500+        | "Ocorreu um erro. Tente novamente."        | Toast + botão retry     |
| Rede        | "Sem conexão. Verifique sua internet."     | Toast persistente       |

### 16.3 Mensagens de Erro

**Regras:**

- Mensagens em português, claras e acionáveis
- Não expor detalhes técnicos ao usuário ("database error", "null pointer")
- Oferecer ação quando possível ("Tentar novamente", "Ir para página inicial")
- Tons: informativo para 4xx, empatético para 5xx

---

## 17. Performance e Otimização

### 17.1 Core Web Vitals — Metas

| Métrica                               | Meta    | Ferramenta       |
| ------------------------------------- | ------- | ---------------- |
| LCP (Largest Contentful Paint)        | < 2.5s  | Lighthouse, CrUX |
| FID / INP (Interaction to Next Paint) | < 200ms | Lighthouse, CrUX |
| CLS (Cumulative Layout Shift)         | < 0.1   | Lighthouse, CrUX |
| TTFB (Time to First Byte)             | < 600ms | WebPageTest      |
| FCP (First Contentful Paint)          | < 1.8s  | Lighthouse       |

### 17.2 Estratégias de Otimização

#### Código

- **Code splitting:** cada rota é um chunk separado (lazy loading automático do App Router)
- **Tree shaking:** importar apenas o necessário (`import { Button } from '@chakra-ui/react'`)
- **`dynamic()`** para componentes pesados e/ou raramente usados (modais grandes, editor rico)
- **Bundle analysis:** `@next/bundle-analyzer` em CI, falha PR se ultrapassar budget (seção 17.3)
- **Memoização:** `React.memo`, `useMemo`, `useCallback` apenas quando há problema mensurável (medir antes)
- **Chakra v3 — apenas componentes em uso:** evitar barrel imports antigos; usar imports diretos quando o linter sugerir

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
- Debounce em inputs de busca (300ms)
- Throttle em scroll handlers

#### Renderização

- Server Components por padrão; Client Components apenas quando necessário
- Skeleton loaders para prevenir CLS
- Otimistic UI para operações rápidas

### 17.3 Budget de Performance

| Recurso                                  | Limite   |
| ---------------------------------------- | -------- |
| Bundle JS inicial (gzipped, route shell) | < 200 KB |
| Bundle CSS inicial (gzipped)             | < 30 KB  |
| Imagem hero (PNG/WebP)                   | < 150 KB |
| Total de requests na carga inicial       | < 30     |
| Tamanho total da página (carga inicial)  | < 1.5 MB |
| Tempo total de boot até interativo (3G)  | < 5s     |

> Monitorar via `@next/bundle-analyzer` em CI e relatório no PR.

---

## 18. Acessibilidade (A11y)

### 18.1 Nível de Conformidade

**Meta:** WCAG 2.1 nível **AA**.

Chakra UI v3 fornece bases sólidas (foco visível, ARIA correto em componentes), mas a equipe é responsável por uso adequado em telas customizadas e cópia adequada.

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

- **Testes automáticos:** `vitest-axe` em testes de componente; auditoria via `@axe-core/playwright` em E2E (fase 2)
- **Testes manuais:** navegação por teclado (Tab/Shift+Tab/Enter/Esc), teste com screen readers (VoiceOver no macOS, NVDA no Windows) antes de cada release maior
- **Lint:** `eslint-plugin-jsx-a11y` em CI; bloqueia PR com violações
- **Storybook a11y addon:** verifica componentes do design system

---

## 19. Internacionalização (i18n)

### 19.1 Idiomas Suportados

| Idioma             | Código  | Status    | Padrão             |
| ------------------ | ------- | --------- | ------------------ |
| Português (Brasil) | `pt-BR` | Suportado | **Sim** (fallback) |
| Inglês (EUA)       | `en-US` | Suportado | Não                |
| Espanhol (Espanha) | `es-ES` | Suportado | Não                |

> Idioma inicial detectado por: 1) preferência do usuário (cookie `nm_locale`), 2) header `Accept-Language`, 3) fallback `pt-BR`.

### 19.2 Configuração

**Biblioteca:** **`next-intl`** (integração nativa com App Router, suporte a Server e Client Components).

**Estrutura de arquivos de tradução:**

```
src/messages/
├── pt-BR/
│   ├── common.json          # textos compartilhados (botões, mensagens genéricas)
│   ├── auth.json            # login, recuperação de senha
│   ├── marketplace.json
│   ├── contracts.json
│   ├── billing.json
│   ├── admin.json
│   └── errors.json          # mensagens de erro de API + validação
├── en-US/
│   └── ... (mesmas chaves)
└── es-ES/
    └── ... (mesmas chaves)
```

**Regras:**

- **Nunca hardcodar strings de UI no código** — sempre via `useTranslations('namespace')`
- Mensagens de validação Yup começam em PT-BR; quando estabilizadas, migram para arquivo de tradução
- Formatos de data, hora, moeda e número via **`Intl` API** com locale do `LocaleContext`
- Alt texts, aria-labels e placeholders também são traduzidos
- Pluralização via ICU MessageFormat (suporte nativo do next-intl)
- Trocar idioma: `LocaleContext.setLocale()` → grava cookie → reload da rota

### 19.3 Roteamento Localizado

> Decisão: **sem prefixo de locale na URL** (`/marketplace`, não `/pt-BR/marketplace`). O locale fica no cookie.
>
> **Justificativa:** o produto é majoritariamente PT-BR; URLs com prefixo poluiriam SEO interno e quebrariam atalhos. Caso futuramente seja necessário URL com locale (ex: para SEO em landings públicas), migrar para `next-intl` com `localePrefix: 'as-needed'`.

---

## 20. Segurança no Frontend

### 20.1 Prevenção de XSS

- **NUNCA** usar `dangerouslySetInnerHTML` com conteúdo externo sem sanitização
- Sanitizar HTML externo com **DOMPurify** antes de renderizar (caso surja necessidade de exibir HTML vindo do backend)
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

- Auditar dependências regularmente (`pnpm audit`)
- Não usar pacotes abandonados ou com vulnerabilidades conhecidas
- Preferência por bibliotecas com manutenção ativa
- **Dependabot** (ou Renovate) para alertas e PRs automáticos de upgrade
- Bloquear merge em PR com vulnerabilidade `high`/`critical` não justificada

### 20.5 Informações NÃO Exposíveis

| Informação                | Risco                 | Mitigação                         |
| ------------------------- | --------------------- | --------------------------------- |
| Tokens de API (backend)   | Acesso não autorizado | Nunca expor no frontend; usar BFF |
| Strings de conexão        | Acesso ao banco       | Nunca no frontend                 |
| Secrets e chaves privadas | Comprometimento total | Nunca no bundle do cliente        |
| IDs internos              | Enumeration           | Usar UUIDs ou slugs               |

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

- Unitários: ≥ 70% das funções em `utils/`, hooks e schemas Yup
- Integração: 100% dos componentes com lógica relevante (forms, dashboards, tabelas) cobertos por ao menos um teste
- E2E: ≥ 1 teste por fluxo crítico (login, criar oferta, contratar, pagar fatura) — **fase 2** (não MVP)

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

### 21.4 Testes E2E

> **Não fazem parte do MVP.** Planejado para fase 2 com Playwright (preferência sobre Cypress por suporte multi-browser e velocidade).

**Fluxos críticos a cobrir (quando implementado):**

- [ ] Login, refresh transparente e logout
- [ ] Buyer cria proposta a partir de oferta no marketplace
- [ ] Seller publica nova oferta
- [ ] Buyer aceita termos e contrato é ativado
- [ ] Visualização e download de fatura
- [ ] Admin BMO aprova provedor pendente

**Regras (para quando implementarmos):**

- Usar `data-testid` para seleção, não classes CSS ou texto
- Testes E2E rodam contra ambiente **staging** (não mock)
- Um teste = um fluxo completo
- Não testar detalhes que testes de componente já cobrem

### 21.5 Visual Regression Testing

**Ferramenta:** Storybook + (a definir: Chromatic, Percy ou Loki).
**Status:** não no MVP. Configurado para a fase 2, após o design system estabilizar.
**Quando rodar:** a cada PR que mexer em `components/ui/*` ou `lib/chakra.config.ts`.
**Aprovação:** manual pelo time de design.

---

## 22. Build, Deploy e Ambientes

### 22.1 Ambientes

| Ambiente    | Propósito                        | URL                                                 | Branch    | Deploy                       |
| ----------- | -------------------------------- | --------------------------------------------------- | --------- | ---------------------------- |
| Development | Dev local                        | http://localhost:3000                               | qualquer  | `pnpm dev`                   |
| Staging     | QA, validação de Design e testes | https://staging.neutramais.bmo.dev.br (a confirmar) | `develop` | automático via CI/CD ao push |
| Production  | Usuários finais                  | https://app.neutramais.bmo.dev.br (a confirmar)     | `main`    | manual com aprovação         |

### 22.2 Variáveis de Ambiente

```bash
# === Públicas (expostas ao browser, prefixo NEXT_PUBLIC_) ===
NEXT_PUBLIC_APP_URL=https://app.neutramais.bmo.dev.br
NEXT_PUBLIC_APP_ENV=production           # development | staging | production
NEXT_PUBLIC_SENTRY_DSN=                  # se Sentry confirmado
NEXT_PUBLIC_ANALYTICS_KEY=               # PostHog/GA4 quando definido

# === Privadas (apenas server-side, NUNCA prefixo NEXT_PUBLIC_) ===
API_V5_URL=https://api.neutramais.bmo.dev.br/v5    # base URL da API V5 (lado servidor)
API_V5_INTERNAL_TOKEN=                              # se houver mTLS/token compartilhado
COOKIE_SECRET=                                      # segredo p/ assinar/decodificar cookies internos
NODE_ENV=production
```

**Regras:**

- NUNCA colocar secrets em variáveis `NEXT_PUBLIC_*`
- Variáveis `NEXT_PUBLIC_*` são **inlined no bundle** — visíveis a qualquer usuário
- Secrets só são lidos por route handlers do Next (`app/api/*`) e Server Components
- `.env.example` mantido no repo; `.env.local` no `.gitignore`

### 22.3 CI/CD Pipeline

> CI executa em **GitHub Actions** (a confirmar); deploy via Docker para Digital Ocean (App Platform ou Droplet com `docker compose`, a definir com infra).

```
Push em feature branch:
  1. pnpm install --frozen-lockfile
  2. pnpm typecheck (tsc --noEmit)
  3. pnpm lint
  4. pnpm test (Vitest, unitários + integração)
  5. pnpm build (verificação de build)

Merge em develop:
  6. Build de imagem Docker
  7. Push para registry (DO Container Registry)
  8. Deploy automático → staging
  9. Smoke test mínimo (health check, login page renderiza)
  10. Notificação no canal Slack/Teams (a confirmar)

Merge em main:
  11. Build de imagem Docker (tag = versão semântica)
  12. Push para registry
  13. Deploy manual com aprovação → produção
  14. Smoke test pós-deploy
  15. Monitoramento de erros (Sentry) e CWV por 30 min
  16. Rollback automático se erro rate > 1% em 5 min (a configurar)
```

### 22.4 Imagem Docker

```dockerfile
# Stage 1: build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Stage 2: runner (next standalone)
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
USER node
CMD ["node", "server.js"]
```

**`next.config.ts`:** `output: 'standalone'` para gerar bundle otimizado para container.

### 22.5 Otimizações de Build

- Minificação de JS e CSS: automático (Turbopack)
- Compressão: gzip/brotli pelo proxy reverso (nginx/DO load balancer)
- Cache headers para assets estáticos: `Cache-Control: public, max-age=31536000, immutable`
- HTML: `Cache-Control: no-store` (sempre buscar)
- Source maps: gerados, **mantidos privados** (apenas para upload ao Sentry); não servidos publicamente em produção

---

## 23. Observabilidade no Frontend

### 23.1 Error Tracking

**Ferramenta:** **Sentry** (a confirmar e provisionar projeto/DSN).

**O que capturar:**

- Erros JavaScript não tratados (`window.onerror`, `unhandledrejection`)
- Erros de API (5xx, timeouts, network failures)
- Erros capturados pelos Error Boundaries (`error.tsx` e `<FeatureErrorBoundary>`)
- Falhas em fluxos críticos (ex: submit de proposta, login, refresh de token)
- Breadcrumbs automáticos de navegação e interações principais

**O que NÃO enviar:**

- Dados pessoais (email, CPF, CNPJ completos) — usar mascaramento via `beforeSend` hook do Sentry
- Tokens de autenticação (filtrar cabeçalhos `Authorization`, cookies `nm_*`)
- Senhas, códigos de reset, payloads de form sensíveis
- Body completo de respostas/requests que possam conter PII

**Configuração:**

- `tracesSampleRate`: 0.1 em produção, 1.0 em staging
- `release` setado por env var no build (versão do commit)
- Upload de source maps no pipeline de deploy

### 23.2 Analytics de Produto

**Ferramenta:** **PostHog** (preferido, self-hostável) ou **GA4** — a definir com Product.

**Eventos a rastrear (catálogo inicial):**

| Evento               | Quando Disparar                     | Propriedades                                    |
| -------------------- | ----------------------------------- | ----------------------------------------------- |
| `page_view`          | Navegação para nova rota            | `path`, `referrer`, `locale`                    |
| `login_attempted`    | Submit do form de login             | (sem credenciais!)                              |
| `login_succeeded`    | Login OK                            | `role`                                          |
| `login_failed`       | Login falha                         | `reason` (auth_invalid, network, etc.)          |
| `marketplace_search` | Busca executada                     | `query`, `filters`, `results_count`             |
| `offering_viewed`    | Detalhe de oferta aberto            | `offering_id`, `seller_id`, `service_type`      |
| `proposal_started`   | Iniciou fluxo de proposta           | `offering_id`                                   |
| `proposal_submitted` | Proposta enviada                    | `offering_id`, `value_cents`, `duration_months` |
| `proposal_failed`    | Falha ao enviar                     | `error_code`                                    |
| `contract_activated` | Contrato ativado (visto pelo buyer) | `contract_id`                                   |
| `invoice_viewed`     | Fatura aberta                       | `invoice_id`, `status`                          |
| `invoice_downloaded` | PDF de fatura baixado               | `invoice_id`                                    |
| `language_changed`   | Usuário troca idioma                | `from`, `to`                                    |

**Privacidade:**

- Nunca enviar PII nos eventos (apenas IDs internos e categorias)
- Banner de consentimento na primeira visita (LGPD)
- Honrar opt-out — armazenar preferência em cookie e desabilitar tracking
- Retention de eventos: 12 meses

### 23.3 Performance Monitoring

- Biblioteca **`web-vitals`** coleta LCP, INP, CLS, TTFB, FCP em produção
- Eventos enviados para o mesmo backend de analytics (PostHog/GA4) e/ou Sentry Performance
- Dashboard com P75 e P95 das CWV por rota
- Alerta no Sentry/PostHog quando CWV de uma rota degrada > 20% vs baseline da semana anterior

---

## 24. SEO e Metadados

### 24.1 Metadados Obrigatórios (por página pública)

```html
<title>[Título da página] | [Nome do Produto]</title>
<meta name="description" content="[Descrição da página - max 160 chars]" />
<meta name="robots" content="[index,follow / noindex,nofollow]" />
<link rel="canonical" href="[URL canônica]" />

<!-- Open Graph -->
<meta property="og:title" content="[Título]" />
<meta property="og:description" content="[Descrição]" />
<meta property="og:image" content="[URL da imagem 1200x630]" />
<meta property="og:url" content="[URL]" />
<meta property="og:type" content="website" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="[Título]" />
<meta name="twitter:description" content="[Descrição]" />
```

### 24.2 Páginas Indexadas vs Não Indexadas

| Tipo de Página                                                 | Indexada?                 | Motivo           |
| -------------------------------------------------------------- | ------------------------- | ---------------- |
| Login (`/login`)                                               | Não (`noindex`)           | Sem valor de SEO |
| Esqueci/Reset senha                                            | Não (`noindex`)           | Idem             |
| Toda área autenticada (`/(app)/*`, inclusive `/(app)/admin/*`) | Não (`noindex, nofollow`) | Conteúdo privado |
| Páginas de marketing/landing (se existirem em futura V6.x)     | Sim                       | SEO de captação  |

> Como a aplicação é majoritariamente atrás de login, SEO é prioridade baixa nesta fase. `robots.txt` bloqueia indexação geral inicialmente.

### 24.3 Dados Estruturados (Schema.org)

> Não aplicável ao MVP — a plataforma é fechada (B2B autenticado). Reavaliar caso surjam landings públicas de marketing.

---

## 25. Anti-Patterns e O Que NÃO Fazer

> Violations devem ser bloqueadas em code review.

### 25.1 Arquitetura e Organização

| ❌ Anti-Pattern                         | ✅ Alternativa Correta           | Impacto                               |
| --------------------------------------- | -------------------------------- | ------------------------------------- |
| Lógica de negócio em componentes de UI  | Mover para hooks ou services     | Testabilidade, reuso                  |
| Chamar API diretamente no componente    | Usar hooks com TanStack Query    | Cache, loading states, error handling |
| Estado global para tudo                 | Estado local + cache de servidor | Over-engineering, bugs                |
| Componente que faz tudo (God Component) | Dividir em componentes menores   | Manutenibilidade                      |
| Props drilling profundo (> 3 níveis)    | Context ou estado global         | Legibilidade                          |
| Import de feature A dentro de feature B | Extrair para shared/comum        | Acoplamento circular                  |

### 25.2 Performance

| ❌ Anti-Pattern                    | ✅ Alternativa Correta                        | Impacto                        |
| ---------------------------------- | --------------------------------------------- | ------------------------------ |
| Re-renders desnecessários          | `React.memo`, `useCallback` com deps corretas | Performance                    |
| Tudo em Client Components          | Server Components por padrão                  | Bundle maior, pior TTFB        |
| Imagens sem otimização             | `next/image` ou equivalente                   | LCP, CLS                       |
| Importar biblioteca inteira        | Importar apenas o necessário                  | Bundle size                    |
| Listas longas sem virtualização    | React Virtual / TanStack Virtual              | Memória, performance de scroll |
| useEffect para derivação de estado | Calcular diretamente no render                | Renders extras, bugs           |

### 25.3 Segurança

| ❌ Nunca Fazer                                               | Risco                 |
| ------------------------------------------------------------ | --------------------- |
| `dangerouslySetInnerHTML` com conteúdo externo sem sanitizar | XSS                   |
| Armazenar token em localStorage sem criptografia             | XSS rouba token       |
| Expor API keys privadas em variáveis `NEXT_PUBLIC_*`         | Vaz. de credenciais   |
| Confiar em permissões do cliente como segurança real         | Bypass de autorização |
| Logar dados do usuário no console em produção                | Vazamento de dados    |

### 25.4 UX

| ❌ Anti-Pattern                             | ✅ Alternativa Correta           | Impacto           |
| ------------------------------------------- | -------------------------------- | ----------------- |
| Sem loading state                           | Skeleton / Spinner durante async | UX ruim, CLS      |
| Sem empty state                             | Mensagem e CTA quando sem dados  | Usuário confuso   |
| Sem error state                             | Mensagem clara com ação de retry | Usuário perdido   |
| Double submit possível                      | Desabilitar botão durante submit | Dados duplicados  |
| Redirecionar sem confirmar dados não salvos | Modal de confirmação             | Perda de dados    |
| Mensagens de erro técnicas                  | Mensagens amigáveis e acionáveis | Usuário frustrado |

### 25.5 Comportamentos Proibidos

- A aplicação NUNCA deve: submeter formulário sem validação client-side via Yup
- A aplicação NUNCA deve: expor dados de outro provedor no DOM (vazamento entre orgs)
- A aplicação NUNCA deve: continuar funcionando após logout sem recarregar estado (limpar AuthContext + reload)
- A aplicação NUNCA deve: armazenar access/refresh tokens em JS-acessível (localStorage, sessionStorage, IndexedDB)
- A aplicação NUNCA deve: chamar a API V5 diretamente do navegador com Bearer no header — sempre via BFF `/api/*`
- A aplicação NUNCA deve: mostrar dados financeiros completos (CNPJ, conta) em telas de listagem (ver RNF-003)
- A aplicação NUNCA deve: enviar dados pessoais (email, CPF, CNPJ) para Sentry ou analytics

---

## 26. Decisões Arquiteturais (ADR)

### ADR-001 — Adoção do Next.js 16 (canary/beta)

- **Data:** 2026-05-19
- **Status:** Aceito
- **Contexto:** O projeto é uma reescrita greenfield do frontend; queremos aproveitar melhorias recentes do App Router, Turbopack estável e novas Cache APIs. Next 16 ainda está em canary/beta no momento da decisão.
- **Decisão:** Usar Next.js 16 mesmo em canary/beta, congelando uma versão específica no `package.json` e atualizando manualmente.
- **Justificativa:**
  - Reescrita é o melhor momento para começar com a versão mais recente — evita upgrade dolorido daqui a 6 meses.
  - Time tem capacidade técnica para lidar com instabilidades pontuais.
  - Backend (V5) é independente; bugs do framework não comprometem a fonte de verdade.
- **Alternativas consideradas:**
  - **Next 15 estável:** mais seguro, mas perderíamos Cache APIs e melhorias do Turbopack que justificariam upgrade prematuro.
  - **Vite + React Router:** SPA pura — perderíamos SSR/RSC, pior SEO/TTFB para landings, e migração futura para SSR seria custosa.
- **Consequências:**
  - **Positivas:** stack moderna, alinhada ao roadmap React 19, bundle menor via RSC, dev experience melhor.
  - **Negativas:** risco de bugs do framework; quebras em minor updates; menos material de referência. Mitigação: pinning de versão, leitura ativa de changelog, dedicar tempo a workarounds quando necessário.

### ADR-002 — Cookies httpOnly via BFF para tokens de auth

- **Data:** 2026-05-19
- **Status:** Aceito
- **Contexto:** A API V5 emite access e refresh tokens (JWT). Precisamos armazená-los de forma segura no cliente Next 16.
- **Decisão:** Tokens vivem exclusivamente em cookies `httpOnly + Secure + SameSite`. O JS do cliente nunca tem acesso. A camada `app/api/*` do Next atua como BFF: recebe cookies, anexa Bearer ao chamar a API V5, lida com refresh.
- **Justificativa:**
  - Mitiga XSS: token inacessível a scripts arbitrários.
  - Mantém arquitetura simples: sem libs de auth externas; aproveita route handlers nativos do Next 16.
  - Compatível com a API V5 atual sem mudanças no backend.
- **Alternativas consideradas:**
  - **Token em memória JS + refresh em cookie httpOnly:** ainda vulnerável a XSS no acesso ao memory store; complexifica refresh transparente em múltiplas abas.
  - **localStorage:** descartado por exposição direta a XSS.
  - **NextAuth.js:** adicionaria abstração desnecessária; nosso caso é OAuth-resource-owner-password simples contra API V5.
- **Consequências:**
  - **Positivas:** segurança forte; arquitetura clara (cliente nunca toca tokens).
  - **Negativas:** todo request à API V5 passa pelo Next (latência extra, ~10–30ms); precisamos garantir que o BFF não vire gargalo. Mitigação: keep-alive na conexão Next ↔ API V5, monitoramento de latência por endpoint.

### ADR-003 — Rotas e código em inglês, UI em PT-BR/EN/ES

- **Data:** 2026-05-19
- **Status:** Aceito
- **Contexto:** Produto é predominantemente PT-BR mas terá EN-US e ES-ES. Precisamos decidir o idioma dos paths/URLs e dos diretórios de feature.
- **Decisão:** Rotas (`/marketplace`, `/contracts`, `/seller`), diretórios (`features/contracts/`), identificadores técnicos em **inglês**; conteúdo visível em PT-BR/EN/ES via i18n.
- **Justificativa:** convenção técnica universal; facilita onboarding de devs estrangeiros futuros; evita ambiguidade com plurais e acentos portugueses em paths.
- **Consequências:** alguma fricção inicial para devs acostumados com paths em PT; documentação (SDD, ADRs) e cópia da UI permanecem em PT-BR.

---

## 27. Glossário

| Termo                   | Definição                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| **NeutraMais**          | Plataforma SaaS B2B da BMO que conecta provedores de internet em modelo de rede neutra             |
| **Rede Neutra**         | Modelo em que infraestrutura (PoPs, capacidade, rotas) é compartilhada entre ISPs via marketplace  |
| **ISP**                 | Internet Service Provider — provedor de internet (cliente do NeutraMais)                           |
| **Provider / Provedor** | Entidade (ISP) cadastrada na plataforma — pode atuar como `seller`, `buyer` ou ambos               |
| **Seller / Ofertante**  | Provider que disponibiliza capacidade/serviço no marketplace                                       |
| **Buyer / Consumidor**  | Provider que contrata capacidade de outro provider                                                 |
| **Admin BMO**           | Operador interno da BMO que aprova provedores e medeia disputas                                    |
| **Offering / Oferta**   | Serviço de rede publicado no marketplace por um seller                                             |
| **Proposal / Proposta** | Manifestação de interesse de contratação enviada pelo buyer ao seller                              |
| **Contract / Contrato** | Acordo formal resultante de uma proposta aceita; gera billing recorrente                           |
| **SLA**                 | Service Level Agreement — métricas de qualidade comprometidas no contrato (uptime, latência, etc.) |
| **PoP**                 | Point of Presence — ponto físico de conexão de rede                                                |
| **V5**                  | Versão anterior em produção do NeutraMais; provê a API REST que o V6 consome                       |
| **V6**                  | Esta reescrita do frontend                                                                         |
| **BFF**                 | Backend for Frontend — camada de API do Next (`app/api/*`) que media a comunicação com a API V5    |
| **App Router**          | Sistema de rotas do Next.js baseado em diretório `app/` (vs. legado `pages/`)                      |
| **RSC**                 | React Server Components — componentes renderizados no servidor sem JS no cliente                   |
| **SSR**                 | Server-Side Rendering — renderização no servidor a cada request                                    |
| **CSR**                 | Client-Side Rendering — renderização no browser                                                    |
| **SSG**                 | Static Site Generation — páginas geradas no build                                                  |
| **ISR**                 | Incremental Static Regeneration                                                                    |
| **CWV**                 | Core Web Vitals — métricas de performance do Google (LCP, INP, CLS)                                |
| **a11y**                | Accessibility (acessibilidade)                                                                     |
| **i18n**                | Internationalization (internacionalização)                                                         |
| **l10n**                | Localization (localização)                                                                         |
| **PII**                 | Personally Identifiable Information — informação pessoal identificável                             |
| **LGPD**                | Lei Geral de Proteção de Dados (Brasil)                                                            |
| **RHF**                 | React Hook Form                                                                                    |
| **DTO**                 | Data Transfer Object — formato de envio/recebimento de dados na API                                |

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

| Fase | Nome                              | Entregáveis                                                                                                                              | Status       |
| ---- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 0    | Kickoff & Setup                   | Repo configurado (Next 16 + Chakra v3 + RHF + Yup + Vitest + Storybook), pipeline CI mínimo, Dockerfile, `.env.example`, ESLint/Prettier | [ ] Pendente |
| 1    | Design System base                | Tokens (cores, tipografia, espaçamentos) + wrappers UI (`Button`, `Input`, `FormField`, `Modal`, `Drawer`, `DataTable`) com Storybook    | [ ] Pendente |
| 2    | Autenticação                      | `/login`, `/forgot-password`, `/reset-password`, AuthContext, BFF de auth, middleware de proteção de rotas                               | [ ] Pendente |
| 3    | Shell aplicação                   | Layouts `(public)` e `(app)`, AppShell (Sidebar + Topbar), navegação, breadcrumbs, `usePermissions` + `<RequirePermission>`              | [ ] Pendente |
| 4    | Marketplace                       | `/marketplace`, busca, filtros, detalhe de oferta, OfferingCard, fluxo de envio de proposta                                              | [ ] Pendente |
| 5    | Dashboards (seller & buyer)       | `/seller`, `/buyer` com KPIs, lista de ofertas/contratos do usuário, atalhos                                                             | [ ] Pendente |
| 6    | Contratos                         | `/contracts`, detalhe, timeline, ações (assinar, suspender, cancelar)                                                                    | [ ] Pendente |
| 7    | Faturamento                       | `/invoices`, detalhe, download de PDF, indicadores de vencimento                                                                         | [ ] Pendente |
| 8    | Notificações                      | `/notifications`, sino no topbar, polling/SSE (a definir)                                                                                | [ ] Pendente |
| 9    | Perfil & Organização              | `/profile`, `/profile/organization`, troca de idioma, preferências                                                                       | [ ] Pendente |
| 10   | Admin BMO                         | `/admin/*` — gestão de provedores, usuários, configurações da plataforma                                                                 | [ ] Pendente |
| 11   | Polimento & lançamento            | Performance audit, a11y audit, smoke E2E, observabilidade, beta com clientes pilotos                                                     | [ ] Pendente |
| 12   | (Pós-MVP) E2E + Visual Regression | Playwright e Chromatic configurados; testes E2E dos fluxos críticos                                                                      | [ ] Pendente |

### 28.4 Comandos GSD Mais Úteis para Frontend

| Necessidade            | Comando                  |
| ---------------------- | ------------------------ |
| Próximo passo          | `/gsd-progress --next`   |
| Revisão de UI/UX       | `/gsd-ui-review`         |
| Fase de UI             | `/gsd-ui-phase`          |
| Tarefa rápida          | `/gsd-quick [descrição]` |
| Debug de bug visual    | `/gsd-debug`             |
| Auditoria de qualidade | `/gsd-quality`           |
| Mapear codebase        | `/gsd-map-codebase`      |
| Modo autônomo          | `/gsd-autonomous`        |

### 28.5 Configuração GSD Recomendada

```json
{
  "mode": "interactive",
  "model_profile": "balanced",
  "models": {
    "planning": "claude-opus-4-7",
    "research": "claude-haiku-4-5",
    "execution": "claude-sonnet-4-6",
    "verification": "claude-sonnet-4-6"
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

| Versão | Data       | Autor              | Descrição das Mudanças                                                                                                                                                                                                                                                                          |
| ------ | ---------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0.0  | 2026-05-19 | Pedro Lisboa (BMO) | Versão inicial — preenchimento completo do SDD a partir do template, com base nas decisões iniciais de stack (Next 16 + Chakra v3 + RHF + Yup + fetch + Context), domínio (rede neutra B2B telecom) e roadmap de fases. Pontos marcados "[A definir]" / "[a confirmar]" para revisão posterior. |

---

_Este documento é um artefato vivo. Deve ser atualizado sempre que houver mudanças arquiteturais, novas decisões de design system, ou evoluções nos padrões adotados._
