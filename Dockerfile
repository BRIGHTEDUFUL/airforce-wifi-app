# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

# Build tools needed for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install all deps (including dev) for building
COPY package*.json ./
RUN npm ci

# Copy source and build frontend
COPY . .
RUN npm run build


# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-slim AS production

# Build tools needed to compile better-sqlite3 native module
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install production deps — native modules compile here for Linux
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend from builder
COPY --from=builder /app/dist ./dist

# Copy server source files
COPY server.ts database.ts tsconfig.json ./

# Copy scripts (needed for reset-admin)
COPY scripts/ ./scripts/

# Create data dir, non-root user, set ownership
RUN mkdir -p /app/data /app/logs \
  && useradd -m -u 1001 appuser \
  && chown -R appuser:appuser /app

# Persist DB and .secret across container restarts
VOLUME ["/app/data"]

USER appuser

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Health check using the /api/health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

# Use local tsx binary — faster and more reliable than npx
CMD ["./node_modules/.bin/tsx", "server.ts"]
