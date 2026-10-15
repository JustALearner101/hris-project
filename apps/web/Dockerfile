# --------------------------------------------
# Dockerfile untuk HRIS Frontend (Next.js)
# Build context = REPO ROOT (monorepo), bukan folder ini.
#   docker build -f apps/web/Dockerfile -t hris-client .
# Lihat infra/docker-compose.yml (service web / web-dev).
# --------------------------------------------

# Catatan:
# - Menggunakan Node.js 22 LTS (Debian slim) untuk kestabilan dan kompatibilitas Next.js 15 + React 19.
# - Menggunakan pnpm sebagai package manager (workspace monorepo).
# - Multi-stage build: base -> deps -> builder -> runner (standalone)
# - Menggunakan Next.js standalone mode (output: "standalone") agar runtime sangat ringan (~100MB RAM).

# ===== Base stage: siapkan Node + pnpm =====
FROM node:22-slim AS base

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable \
    && corepack prepare pnpm@9 --activate

# ===== Deps stage: instal dependensi workspace untuk apps/web =====
FROM base AS deps

ENV NODE_ENV=development

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile

# ===== Dev stage (opsional): untuk pengembangan dengan hot reload =====
FROM deps AS dev
ENV NODE_ENV=development \
    NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1 \
    NEXTAUTH_URL=http://localhost:3000

COPY apps/web/ apps/web/

EXPOSE 3000

CMD ["pnpm", "--filter", "./apps/web", "dev"]

# ===== Builder stage: build Next.js untuk produksi =====
FROM deps AS builder

COPY apps/web/ apps/web/

ENV NODE_ENV=production
RUN pnpm --filter ./apps/web build

# ===== Runner stage: image final produksi (Standalone Mode) =====
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_API_BASE_URL=https://api.hris.local/api/v1 \
    NEXTAUTH_URL=http://localhost:3000 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Standalone output mencerminkan struktur monorepo: server.js ada di apps/web/.
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# Menjalankan sebagai user non-root (keamanan lebih baik)
USER node

EXPOSE 3000

# Jalankan server Next.js standalone (tanpa pnpm/next start, sangat hemat memori)
CMD ["node", "apps/web/server.js"]
