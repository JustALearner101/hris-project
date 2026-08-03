# Environment Setup

> [!NOTE]
> This document details the historical initial setup based on the NestJS/Next.js 14 architecture. For the current ASP.NET Core 9 implementation, refer to the root `README.md`.

## Monorepo Structure

```text
hris/
  apps/
    web/           # Next.js 14 (App Router)
    api/           # NestJS 10
  packages/
    ui/            # (optional) shared components
    config/        # shared eslint/tsconfig
    types/         # shared TypeScript types
  infra/
    compose/       # docker-compose dev services
    k8s/           # manifest/helm (future)
  .nvmrc
  pnpm-workspace.yaml
  .editorconfig
  .gitignore
```

**`pnpm-workspace.yaml`**:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

---

## Bootstrap Frontend (Next.js 14.2.x)

### Initialization
```bash
cd hris
pnpm dlx create-next-app@14.2.5 apps/web \
  --ts --eslint --tailwind --src-dir --app --import-alias "@/*" --use-pnpm
```

### Tailwind & shadcn/ui Configuration
Update `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}'
  ],
  theme: { extend: {} },
  plugins: [require('tailwindcss-animate')]
}

export default config
```
Initialize and add components:
```bash
pnpm dlx shadcn-ui@latest init -d
pnpm i class-variance-authority clsx tailwind-merge tailwindcss-animate
pnpm dlx shadcn-ui@latest add button input card dialog label toast dropdown-menu
```

### React Query Setup
Create `src/providers/query-client.tsx` and integrate it into `app/layout.tsx`.

### Environment Setup
Create `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=hris-dev
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=web
```

---

## Bootstrap Backend (NestJS 10)

### Initialization
```bash
cd ../../apps
pnpm dlx @nestjs/cli@10 new api --package-manager pnpm
cd api
```

### Prisma & PostgreSQL
Initialize Prisma:
```bash
pnpm prisma init --datasource-provider postgresql
```

Update `apps/api/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hris
REDIS_URL=redis://localhost:6379
PORT=3001
JWT_SECRET=dev_dev_dev
```

Run migrations:
```bash
pnpm prisma migrate dev --name init
```

---

## Infrastructure Setup (Docker Compose)

Create `infra/compose/docker-compose.yml` to define services for:
- PostgreSQL 16.3
- Redis 7.2
- Kafka 3.7.0 (KRaft)
- Keycloak 24.0

Run the dev stack:
```bash
cd infra/compose
docker compose up -d
```

---

## Keycloak SSO Quickstart

1. Access `http://localhost:8080` and log in with `admin`/`admin`.
2. Create Realm: `hris-dev`.
3. Create Public Client: `web`
   - Root URL: `http://localhost:3000`
   - Valid redirect: `http://localhost:3000/*`
4. Create Confidential Client: `api`
   - Enable Service Accounts; save the secret for the backend.
5. Create User: `dev.user@example.com` (set a password) and assign the `employee` role.

---

## Wiring Frontend & Backend

Create an API helper `apps/web/src/lib/api.ts` to fetch data from the backend using `NEXT_PUBLIC_API_BASE_URL`.

---

## Root Scripts & Quality Gates

**`package.json` (root)**:
```json
{
  "private": true,
  "scripts": {
    "dev:web": "pnpm --filter web dev",
    "dev:api": "pnpm --filter api start:dev",
    "dev:up": "docker compose -f infra/compose/docker-compose.yml up -d",
    "dev:down": "docker compose -f infra/compose/docker-compose.yml down -v",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck"
  }
}
```

**Testing Tools**:
- **Web**: Playwright (E2E)
- **API**: Jest + Supertest
- **Load**: k6 (optional)
- **Linting**: ESLint + TypeScript strict
