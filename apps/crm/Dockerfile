# --------------------------------------------
# Dockerfile untuk HRIS CRM & PSA (NestJS + Prisma)
# Build context = REPO ROOT (monorepo), bukan folder ini.
#   docker build -f apps/crm/Dockerfile -t hris-crm .
# Lihat infra/docker-compose.yml (service crm).
# --------------------------------------------

FROM node:22-slim AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate

# ===== Deps stage: instal dependensi workspace untuk apps/crm =====
FROM base AS deps
ENV NODE_ENV=development
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/crm/package.json apps/crm/
RUN pnpm install --frozen-lockfile

# ===== Builder stage: generate Prisma client + compile =====
FROM deps AS builder
COPY apps/crm/ apps/crm/
RUN pnpm --filter ./apps/crm exec prisma generate
RUN pnpm --filter ./apps/crm build

# ===== Runner stage =====
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# node-linker=hoisted => semua dependency ada di /app/node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/crm/dist ./apps/crm/dist
COPY --from=builder /app/apps/crm/prisma ./apps/crm/prisma
COPY --from=builder /app/apps/crm/package.json ./apps/crm/package.json

EXPOSE 8082

CMD ["node", "apps/crm/dist/main"]
