# Zero Hunger — Monorepo

"Buy 1, Give 1 Meal" platform monorepo containing three independent projects.

## Projects

| Folder | Description | Port | Tech |
|--------|-------------|------|------|
| [`frontend/`](./frontend/) | Customer website | **5173** | React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router v7 |
| [`admin/`](./admin/) | Internal admin dashboard | **5174** | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| [`backend/`](./backend/) | REST API + WebSockets | **5000** | Node.js + Express + JavaScript + MongoDB (Mongoose) |
| [`shared/`](./shared/) | Shared types (future) | — | TypeScript (not yet populated) |

Each project is **fully independent** — it has its own `package.json`, `node_modules`, `tsconfig`, `.gitignore`, `.env.example`, and `README.md`. You can deploy any one of them as a standalone root directory.

---

## Quick Start

### Install all three projects

```bash
# From the repo root
cd frontend && npm install && cd ..
cd admin    && npm install && cd ..
cd backend  && npm install && cd ..
```

### Run all three in separate terminals

```bash
# Terminal 1 — Customer website → http://localhost:5173
cd frontend && npm run dev

# Terminal 2 — Admin dashboard → http://localhost:5174
cd admin && npm run dev

# Terminal 3 — API server → http://localhost:5000
cd backend && npm run dev
```

### Or use the optional root script (requires concurrently)

```bash
npm install   # installs concurrently at the root level
npm run dev   # starts all three concurrently
```

---

## Environment Variables

Each project has its own `.env` file pre-configured for local development:
- [`frontend/.env`](./frontend/.env)
- [`admin/.env`](./admin/.env)
- [`backend/.env`](./backend/.env)

Fill in any secret API keys (e.g. Razorpay, Gemini) as needed.

> ⚠️ **Never commit `.env` files.** They are listed in every `.gitignore`.

---

## Project READMEs

- [frontend/README.md](./frontend/README.md)
- [admin/README.md](./admin/README.md)
- [backend/README.md](./backend/README.md)
- [shared/README.md](./shared/README.md)

---

## Auth Status

No authentication is implemented yet. See `TODO (auth):` comments in:
- [`admin/src/App.tsx`](./admin/src/App.tsx)
- [`admin/src/components/layout/AdminLayout.tsx`](./admin/src/components/layout/AdminLayout.tsx)
- [`backend/src/routes/admin.js`](./backend/src/routes/admin.js)
- [`backend/src/routes/riders.js`](./backend/src/routes/riders.js)
- [`backend/src/controllers/adminController.js`](./backend/src/controllers/adminController.js)

---

## Git History

Existing history from the original single-project repo is preserved.
All monorepo changes use conventional commit prefixes:
- `feat(frontend):` — customer website
- `chore(admin):` — admin dashboard
- `chore(backend):` — API server
- `chore(root):` — monorepo-level changes
