# NeutraMais V6 — Frontend

Frontend web da plataforma **NeutraMais V6** (rede neutra B2B para telecom). Estrutura, libs e arquitetura seguem o padrão BMO (base no `bmo-next-template`), com a convenção de componente em pasta descrita no `SDD.md`.

> Documento de design: ver [`SDD.md`](./SDD.md).

---

## Tecnologias

- Next.js 16 (App Router)
- React 19
- Chakra UI v3
- Framer Motion
- React Hook Form + Yup
- Nookies
- Next Themes
- Tailwind CSS v4 (PostCSS)

---

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

---

## Convenção de componente (obrigatória)

Todo componente é uma **pasta** em `PascalCase` com três arquivos:

```
ComponentName/
 |- component.tsx   # implementação
 |- interface.ts    # tipo das props (ComponentNameProps)
 '- index.ts        # barrel (re-exporta componente e tipo)
```

O único ponto de import externo é o `index.ts` da pasta.

---

## Estrutura de Pastas

```
src/
 |- app/
 |   |- exemplo/         # pagina generica (exemplo)
 |   |- layout.tsx
 |   |- not-found.tsx
 |   |- page.tsx
 |   '- providers.tsx
 |- components/
 |   |- GlobalLoader/    # loader global
 |   |- Layouts/Main/
 |   '- ui/              # provider, color-mode, toaster, tooltip, fonts
 |- contexts/
 |   '- AppContext/      # contexto generico (exemplo)
 |- data/
 |- functions/
 |- hooks/
 |   |- useFetch/
 |   '- useLoading/
 |- interfaces/
 |- providers/
 |- schemas/
 |- server/
 |- themes/
 '- types/
```

---

## Como rodar

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000
