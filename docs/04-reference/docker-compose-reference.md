# Docker Compose Reference

This document outlines the Docker Compose configuration used in the HRIS monorepo to orchestrate the frontend, backend, and supporting services.

## Usage Commands

The configuration uses Docker profiles to isolate development and production environments.

- **Development Profile (Hot Reload):**
  ```bash
  docker compose --profile dev up --build web-dev
  ```

- **Production Profile:**
  ```bash
  docker compose --profile prod up --build web
  ```

## Services Overview

### Frontend Services

#### `web` (Production)
- **Image:** Built from `./hris-frontend` with the `runner` target (tagged as `hris-client:prod`).
- **Ports:** `3000:3000`
- **Environment:** `NODE_ENV=production`, `NEXT_PUBLIC_API_BASE_URL`, `NEXTAUTH_URL`.
- **Dependencies:** Waits for the `api` service.
- **Profile:** `prod`

#### `web-dev` (Development)
- **Image:** Built from `./hris-frontend` with the `dev` target (tagged as `hris-client:dev`).
- **Command:** `pnpm dev -- -p 3000 --turbo`
- **Ports:** `3000:3000`
- **Volumes:** Mounts the host `./hris-frontend` directory to `/app` for hot reloading, and uses a named `pnpm-store` volume.
- **Environment:** `NODE_ENV=development`, `NEXT_PUBLIC_API_BASE_URL`, `NEXTAUTH_URL`.
- **Dependencies:** `api`, `db`, `redis`, `keycloak`.
- **Profile:** `dev`

### Backend Service

#### `api`
- **Image:** Built from `./hris-backend` (tagged as `hris-api:latest`).
- **Ports:** `8080:8080`
- **Environment:** `ASPNETCORE_ENVIRONMENT`, `ASPNETCORE_URLS`, `ConnectionStrings__DefaultConnection`.
- **Dependencies:** `db`, `redis`, `keycloak`.
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
