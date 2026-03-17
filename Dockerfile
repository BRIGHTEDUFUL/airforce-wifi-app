# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build the Vite frontend
RUN npm run build


# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-slim AS production

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Compiled frontend
COPY --from=builder /app/dist ./dist

# Server source (tsx compiles at runtime)
COPY server.ts database.ts tsconfig.json ./

# Create data dir, create non-root user, set ownership before volume declaration
RUN mkdir -p /app/data \
  && useradd -m appuser \
  && chown -R appuser:appuser /app

# Persist DB and .secret across restarts
VOLUME ["/app/data"]

USER appuser

EXPOSE 3000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).then(r=>r.status<500?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

CMD ["npx", "tsx", "server.ts"]
