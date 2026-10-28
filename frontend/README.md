# Zero Hunger — Frontend

The customer-facing website for the **Zero Hunger** "Buy 1, Give 1 Meal" program.

Built with **React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router v7**.

## Getting Started

```bash
# From this directory (frontend/)
npm install
npm run dev       # → http://localhost:5173
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite dev server on port **5173** |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | TypeScript type-check (no emit) |

## Path Alias

`@/` maps to `src/` — e.g. `import { Navbar } from '@/components/Navbar'`.

## Environment Variables

Copy `.env.example` to `.env` and fill in real values before running.

## Folder Structure

```
frontend/
├── public/            Static assets (images, favicon)
└── src/
    ├── components/    Shared UI components
    ├── context/       React context providers
    ├── data/          Static data / mock data
    ├── features/      Feature-scoped modules (meals, cart, checkout, tracking)
    ├── hooks/         Custom React hooks
    ├── pages/         Route-level page components
    ├── services/      API client stubs (TODO: connect to backend)
    ├── styles/        Additional global styles
    ├── types/         Shared TypeScript types
    └── utils/         Pure utility functions
```
