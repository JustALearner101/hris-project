# --------------------------------------------
# Dockerfile for HRIS Recruitment & Careers Web (Next.js 15)
# Build context = REPO ROOT (monorepo):
#   docker build -f apps/recruitment-web/Dockerfile -t hris-recruitment-web .
# --------------------------------------------

FROM node:22-slim AS base

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable \
    && corepack prepare pnpm@9 --activate

FROM base AS deps

ENV NODE_ENV=development

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/recruitment-web/package.json apps/recruitment-web/
COPY packages/ packages/

RUN pnpm install --frozen-lockfile

FROM deps AS dev
ENV NODE_ENV=development \
    NEXT_PUBLIC_API_BASE_URL=http://localhost:8083 \
    PORT=3001

COPY apps/recruitment-web/ apps/recruitment-web/

EXPOSE 3001

CMD ["pnpm", "--filter", "./apps/recruitment-web", "dev"]

FROM deps AS builder

COPY apps/recruitment-web/ apps/recruitment-web/

ENV NODE_ENV=production
RUN pnpm --filter ./apps/recruitment-web build

FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_API_BASE_URL=http://localhost:8083 \
    PORT=3001 \
    HOSTNAME="0.0.0.0"

COPY --from=builder /app/apps/recruitment-web/.next/standalone ./
COPY --from=builder /app/apps/recruitment-web/.next/static ./apps/recruitment-web/.next/static

USER node

EXPOSE 3001

CMD ["node", "apps/recruitment-web/server.js"]
