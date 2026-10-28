# ─────────────────────────────────────────────────────────────────────────────
# Zero Hunger — Backend Dockerfile
# Production-ready Node.js container for JavaScript API
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

# Install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY src ./src

# TODO: Add health check
# HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:5000/health || exit 1

EXPOSE 5000
CMD ["node", "src/server.js"]
