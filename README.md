# neatsprint-web

NeatSprint web application — Next.js 15 App Router, TypeScript strict, Tailwind CSS 4.

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>. The API defaults to the gateway at
`http://localhost:8000/api/v1`.

## Verify

```bash
npm run typecheck
npm test
npm run build
```

## Structure

```text
src/
├── app/                 routes (dashboard, design system)
├── components/          app shell, theme toggle, ui primitives
├── lib/                 api client, utils
└── styles (globals.css) design tokens
```

## Conventions

- Tokens only — no raw hex values in components (`docs/UI_UX_DESIGN.md`).
- Server state via TanStack Query from M1; local UI state via Zustand.
- Tokens never touch `localStorage`; session uses httpOnly cookies via the BFF.
- Every screen needs loading, empty, error and permission-denied states.
- Accessibility is part of done: labels, focus, keyboard paths, contrast.

## Milestone state (M0)

The shell and tokens exist. Navigation entries for later milestones are visibly disabled rather
than broken. ESLint is intentionally deferred to M1; `tsc`, Vitest and `next build` gate M0.
