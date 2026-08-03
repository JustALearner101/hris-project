# Running the Project

## Current Setup (Next.js 15 + ASP.NET Core 9)

Based on the actual project architecture, here are the steps to run the complete stack.

### 1. Install Dependencies
Run from the repository root:
```bash
pnpm install
```

### 2. Running in Development Mode

#### Option 1: Run Frontend & Backend Concurrently
```bash
pnpm dev
```
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8080` (Swagger UI: `http://localhost:8080/swagger`)

#### Option 2: Run Services Separately
- **Frontend Only**:
  ```bash
  pnpm dev:client
  ```
- **Backend Only**:
  ```bash
  pnpm dev:backend
  ```

#### Option 3: Using Docker Compose Stack
To run the full stack (including Postgres, Redis, Keycloak) using Docker Compose:
```bash
docker compose --profile dev up --build
```

---

## Historical Setup (NestJS Architecture)

If referencing the historical documentation, the end-to-end sequence for development was:

```bash
# 1) Start infra services
pnpm dev:up

# 2) Start API
cd apps/api
pnpm start:dev

# 3) Migrate database
pnpm prisma migrate dev

# 4) Start Web
cd ../../apps/web
pnpm dev
```
Visiting `http://localhost:3000/employees` would show a basic JSON response with `{ total, items: [] }` (empty if unseeded).

---

## Acceptance Checklist ("Done Right")

Verify that your environment is running properly:
- [ ] Node 20 or higher is active (`node -v`)
- [ ] `docker compose ps` shows services (postgres/redis/kafka/keycloak) are up
- [ ] Backend API Swagger documentation is accessible
- [ ] Next.js Frontend is accessible at `http://localhost:3000`
- [ ] The API successfully returns data (e.g., from the `/employees` endpoint)
