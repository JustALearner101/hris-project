# --------------------------------------------
# Dockerfile untuk HRIS Frontend (Next.js)
# Seluruh komentar ditulis dalam Bahasa Indonesia
# --------------------------------------------

# Catatan:
# - Menggunakan Node.js 22 LTS (Debian slim) untuk kestabilan dan kompatibilitas Next.js 15 + React 19.
# - Menggunakan pnpm sebagai package manager.
# - Multi-stage build: base -> deps -> builder -> runner (standalone)
# - Menggunakan Next.js standalone mode (output: "standalone") agar runtime sangat ringan (~100MB RAM).

# ===== Base stage: siapkan Node + pnpm =====
FROM node:22-slim AS base

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable \
    && corepack prepare pnpm@9 --activate

# ===== Deps stage: instal semua dependensi (termasuk dev) =====
FROM base AS deps

ENV NODE_ENV=development

COPY pnpm-lock.yaml package.json ./

RUN pnpm install --frozen-lockfile

# ===== Dev stage (opsional): untuk pengembangan dengan hot reload =====
FROM deps AS dev
ENV NODE_ENV=development \
    NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1 \
    NEXTAUTH_URL=http://localhost:3000

COPY . .

EXPOSE 3000

CMD ["pnpm", "dev"]

# ===== Builder stage: build Next.js untuk produksi =====
FROM deps AS builder

COPY . .

ENV NODE_ENV=production
RUN pnpm run build

# ===== Runner stage: image final produksi (Standalone Mode) =====
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_API_BASE_URL=https://api.hris.local/api/v1 \
    NEXTAUTH_URL=http://localhost:3000 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Salin aset publik dan hasil kompilasi standalone
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Menjalankan sebagai user non-root (keamanan lebih baik)
USER node

EXPOSE 3000

# Jalankan server Next.js standalone (tanpa pnpm/next start, sangat hemat memori)
CMD ["node", "server.js"]