# ─────────────────────────────────────────────────────────────────────────────
# GAF WiFi Management System — Dockerfile
# Multi-stage: build frontend, then run production server
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build React frontend ─────────────────────────────────────────────
FROM node:20-slim AS builder

# Native build tools for better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Cache npm install layer — only re-runs when package.json changes
COPY package*.json ./
RUN npm ci

# Copy all source and build
COPY . .
RUN npm run build

# Verify dist was created
RUN test -d dist || (echo "ERROR: dist/ not created by npm run build" && exit 1)


# ── Stage 2: Production runtime ───────────────────────────────────────────────
FROM node:20-slim AS production

# Native build tools — needed to compile better-sqlite3 for this Node version
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install all deps — tsx is in devDependencies but needed at runtime
COPY package*.json ./
RUN npm ci

# Copy built frontend from builder
COPY --from=builder /app/dist ./dist

# Copy server TypeScript source
COPY server.ts database.ts tsconfig.json ./

# Copy scripts (reset-admin etc.)
COPY scripts/ ./scripts/

# Copy public assets (crest image etc.)
COPY public/ ./public/

# Create non-root user BEFORE creating directories
RUN useradd -m -u 1001 -s /bin/sh appuser

# Create data/logs directories owned by appuser
# NOTE: VOLUME must come AFTER this — Docker volume mount replaces the dir
# but the container entrypoint handles ownership at runtime via the CMD
RUN mkdir -p /app/data /app/logs \
  && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Declare volume AFTER chown — data persists across restarts
VOLUME ["/app/data"]

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Health check — uses Node's built-in fetch (Node 18+)
HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

# Run server directly with tsx
CMD ["./node_modules/.bin/tsx", "server.ts"]
