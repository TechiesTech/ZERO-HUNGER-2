# ─────────────────────────────────────────────────────────────────────────────
# Zero Hunger — Backend Dockerfile (PLACEHOLDER)
# TODO: Fill in production-ready multi-stage build once the backend is implemented.
# ─────────────────────────────────────────────────────────────────────────────

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

# TODO: Add health check
# HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:5000/health || exit 1

EXPOSE 5000
CMD ["node", "dist/server.js"]
