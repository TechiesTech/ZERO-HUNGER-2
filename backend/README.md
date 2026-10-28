# Zero Hunger — Backend API

Node.js + Express + TypeScript + MongoDB (Mongoose) REST API for the Zero Hunger platform.

> **Structure only.** `app.ts` and `server.ts` contain a minimal Express app with a `GET /health` endpoint. All other files are empty stubs with TODO comments.

## Getting Started

```bash
# From this directory (backend/)
npm install

# Start MongoDB locally (or use MONGODB_URI from .env)
# mongod --dbpath /data/db

npm run dev     # → http://localhost:5000 (hot-reload via tsx watch)
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Hot-reload dev server on port **5000** |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run compiled `dist/server.js` |
| `npm run lint` | TypeScript type-check (no emit) |

## Health Check

```bash
curl http://localhost:5000/health
# → { "status": "ok", "service": "zerohunger-api", "timestamp": "..." }
```

## Environment Variables

Copy `.env.example` to `.env` and fill in all values before running.

## Auth

> ⚠️ **No authentication implemented yet.**
> Look for `TODO (auth):` comments in routes and controllers for the exact spots to add JWT/session logic.

## Folder Structure

```
backend/
└── src/
    ├── app.ts              Express app setup + /health endpoint
    ├── server.ts           HTTP server entry point (listens on PORT)
    ├── config/             db.ts — MongoDB connection
    ├── models/             Meal, Order, Token, Rider, Delivery schemas
    ├── routes/             meals, orders, payments, tracking, admin, riders
    ├── controllers/        Handler functions per route file
    ├── services/           pricingService, paymentService, tokenService, notificationService
    ├── middleware/         errorHandler, validate, rateLimit
    ├── sockets/            tracking.ts — Socket.io real-time location
    ├── validators/         Request body schemas (zod / joi)
    └── utils/              Shared utility functions
```

## Ports

| Service | Port |
|---------|------|
| Frontend (customer site) | 5173 |
| Admin dashboard | 5174 |
| **Backend API** | **5000** |
