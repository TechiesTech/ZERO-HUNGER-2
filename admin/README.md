# Zero Hunger — Admin Dashboard

Internal admin dashboard for the **Zero Hunger** meal program. Built with **React 19 + TypeScript + Vite + Tailwind CSS v4**.

> **Not a public site.** This project has `noindex` and `nofollow` meta tags.

## Getting Started

```bash
# From this directory (admin/)
npm install
npm run dev       # → http://localhost:5174
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite dev server on port **5174** |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | TypeScript type-check (no emit) |

## Path Alias

`@/` maps to `src/` — e.g. `import { adminApi } from '@/services/adminApi'`.

## Environment Variables

Copy `.env.example` to `.env` and fill in real values before running.

## Auth

> ⚠️ **No authentication implemented yet.** All routes are publicly accessible.
> Look for `TODO (auth):` comments in the code for the exact spots to add JWT/session logic later.

## Folder Structure

```
admin/
├── public/            Static assets
└── src/
    ├── components/
    │   └── layout/    AdminLayout (sidebar + content shell)
    ├── features/      Feature-scoped modules (meals, orders, riders)
    ├── hooks/         Custom React hooks
    ├── pages/         Dashboard, Meals, Orders, Riders
    ├── services/      Admin API client (TODO: connect to backend)
    ├── styles/        Additional global styles
    ├── types/         Shared TypeScript types
    └── utils/         Pure utility functions
```

## Ports

| Service | Port |
|---------|------|
| Frontend (customer site) | 5173 |
| **Admin dashboard** | **5174** |
| Backend API | 5000 |
