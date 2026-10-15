# Docker Compose Reference

This document outlines the Docker Compose configuration used in the HRIS monorepo to orchestrate the
frontend, backend, AI, CRM services and supporting infrastructure.

The compose file lives at **`infra/docker-compose.yml`**. All relative paths inside it (build contexts
and bind mounts) resolve relative to `infra/`, so it must be run from the repo root with `-f`.

## Usage Commands

The configuration uses Docker profiles to isolate development and production environments.

- **Development Profile (Hot Reload):**
  ```bash
  docker compose -f infra/docker-compose.yml --profile dev up --build web-dev
  ```

- **Production Profile:**
  ```bash
  docker compose -f infra/docker-compose.yml --profile prod up --build web
  ```

## Services Overview

### Frontend Services

Both web images build from the **repo root** context (needed because the frontend is a pnpm workspace
member and there is a single root lockfile). See `apps/web/Dockerfile`.

#### `web` (Production)
- **Image:** Built from repo root `../` with `apps/web/Dockerfile` (`runner` target, tagged as `hris-client:prod`).
- **Ports:** `3000:3000`
- **Environment:** `NODE_ENV=production`, `NEXT_PUBLIC_API_BASE_URL`, `NEXTAUTH_URL`.
- **Dependencies:** Waits for the `api` service.
- **Profile:** `prod`

#### `web-dev` (Development)
- **Image:** Built from repo root `../` with `apps/web/Dockerfile` (`dev` target, tagged as `hris-client:dev`).
- **Command:** `pnpm --filter ./apps/web dev -- -p 3000 --turbo`
- **Ports:** `3000:3000`
- **Volumes:** Mounts host `../apps/web` to `/app/apps/web` for hot reloading (with an anonymous volume
  preserving `/app/apps/web/node_modules`), and uses a named `pnpm-store` volume.
- **Environment:** `NODE_ENV=development`, `NEXT_PUBLIC_API_BASE_URL`, `NEXTAUTH_URL`.
- **Dependencies:** `api`, `db`, `redis`, `keycloak`.
- **Profile:** `dev`

### Backend Service

#### `api`
- **Image:** Built from `../apps/api` (tagged as `hris-api:latest`).
- **Ports:** `8080:8080`
- **Environment:** `ASPNETCORE_ENVIRONMENT`, `ASPNETCORE_URLS`, `ConnectionStrings__DefaultConnection`.
- **Dependencies:** `db`, `redis`, `keycloak`.
- **Profiles:** `dev`, `prod`

### AI Service

#### `ai` (RAG / FastAPI)
- **Image:** Built from `../apps/ai` (tagged as `hris-ai:latest`).
- **Ports:** `8000:8000`
- **Environment:** `APP_ENV`, `LLM_PROVIDER`, `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `MODEL_CACHE_DIR`.
- **Volumes:** Mounts host `../apps/ai/data` to `/app/data` (vector store + BGE-M3 model cache persist on the host).
- **Healthcheck:** `GET /api/health` every 30s (30s start period).
- **Profiles:** `dev`, `prod`

### CRM & PSA Service

#### `crm` (NestJS + Prisma)
- **Image:** Built from repo root `../` with `apps/crm/Dockerfile` (tagged as `hris-crm:latest`).
- **Ports:** `8082:8082`
- **Environment:** `NODE_ENV`, `PORT`, `DATABASE_URL` (Postgres schema `crm`), `REDIS_URL`.
- **Dependencies:** `db`, `redis`.
- **Profiles:** `dev`, `prod`

### Infrastructure Services

#### `db` (PostgreSQL)
- **Image:** `postgres:16`
- **Ports:** `5432:5432`
- **Volumes:** Uses a named `db_data` volume mapped to `/var/lib/postgresql/data`.
- **Environment:** `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`.
- **Profiles:** `dev`, `prod`

#### `redis`
- **Image:** `redis:7-alpine`
- **Ports:** `6379:6379`
- **Profiles:** `dev`, `prod`

#### `keycloak` (SSO)
- **Image:** `quay.io/keycloak/keycloak:24.0`
- **Command:** `start-dev --http-port=8081`
- **Ports:** `8081:8081`
- **Environment:** `KEYCLOAK_ADMIN`, `KEYCLOAK_ADMIN_PASSWORD`.
- **Profiles:** `dev`, `prod`
