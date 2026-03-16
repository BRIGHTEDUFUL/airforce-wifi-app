# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

# Native build tools required by better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Compile the Vite frontend
RUN npm run build


# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-slim AS production

# Native tools needed at runtime for better-sqlite3 bindings
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install all deps (tsx is now in dependencies, not devDependencies)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled frontend and server source
COPY --from=builder /app/dist ./dist
COPY server.ts database.ts tsconfig.json ./
COPY src ./src

# Create data dir and set ownership BEFORE declaring the volume
RUN mkdir -p /app/data && useradd -m appuser && chown -R appuser:appuser /app

# Declare volume after chown so the mount point is owned by appuser
VOLUME ["/app/data"]

USER appuser

EXPOSE 3000

# Healthcheck hits the login endpoint (unauthenticated, always reachable)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).then(r=>r.status<500?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

ENV NODE_ENV=production

CMD ["npx", "tsx", "server.ts"]
