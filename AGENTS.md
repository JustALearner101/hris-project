# Project Overview

HRIS Monorepo (`hris-project`) is an integrated enterprise Human Resource Information System
combining a Next.js 15 frontend client (`apps/web`), an ASP.NET Core 9 Web API
backend (`apps/api`), and a Python/FastAPI AI backend (`apps/ai`). The platform delivers core
HR operations including employee directory management, attendance monitoring, payroll processing,
onboarding/offboarding workflows, claim reimbursements, performance tracking, and recruitment.
Built with modern full-stack engineering standards, the repository provides pnpm workspace
orchestration, containerized local execution via Docker Compose, automated multi-job CI/CD
pipelines using GitHub Actions, and automated CLI microservice scaffolding.

## Repository Structure

The repo is organized by **deployment boundary**: each deployable lives under `apps/`, shared
libraries under `packages/`, and infrastructure under `infra/`. Domain logic lives *inside* each app
(frontend `features/<domain>/`, backend `Services/<Domain>/`), not at the root.

- `apps/web/`: Next.js 15 web client built with React 19, Tailwind, and Radix.
- `apps/api/`: ASP.NET Core 9 Web API solution organized under `src/` into modular
  service packages (`Services/Master`, `Services/Recruitment`, etc.) and cross-cutting modules
  (`Approval`, `Email`, `Logging`, `Scheduler`, `TokenValidation`).
- `apps/ai/`: Polyglot AI backend (Python 3.12 / FastAPI, managed with `uv`) providing
  Retrieval-Augmented Generation (RAG) over corporate documents — ChromaDB vector store, local
  BGE-M3 embeddings, grounded answers with citation attribution. See [apps/ai/README.md](apps/ai/README.md).
- `apps/crm/`: CRM & PSA microservice (NestJS 10 + Prisma) exposing `/api/v1/crm` and `/api/v1/psa`,
  with a Redis event bus bridging `deal.closed_won` → auto-spawned PSA project.
- `packages/contracts/`: `@hris/contracts` — TypeScript types generated from the backend OpenAPI
  (`/swagger/v1/swagger.json`). Single source of truth for FE/BE API shapes.
- `infra/`: `docker-compose.yml` and infrastructure configuration. Run it with
  `docker compose -f infra/docker-compose.yml ...` (relative paths resolve from `infra/`).
- `.github/`: Contains root GitHub Actions workflows (`ci-cd.yaml`) for CI testing and deployment.
- `docs/`: Diataxis-organized documentation (`00-overview/`, `01-getting-started/`,
  `02-architecture/`, `03-guides/`, `04-reference/`). See [docs/README.md](docs/README.md).
- `scripts/`: Development automation scripts (e.g. `create-service.ps1` for generating new 5-layer backend services).

## Build & Development Commands

```bash
# Install all root and workspace dependencies
pnpm install

# Run frontend (Next.js) and backend (ASP.NET Core) concurrently in development mode
pnpm dev

# Run frontend development server only
pnpm dev:client

# Run backend ASP.NET Core Web API server with Hot Reload & auto-launching Swagger UI
pnpm dev:backend

# Run AI service (FastAPI RAG backend) with hot reload on port 8000 (requires uv)
pnpm dev:ai

# Run AI service test suite (77 pytest tests)
pnpm test:ai

# Index all documents in apps/ai/data/raw/ into the ChromaDB vector store
pnpm ai:index

# Generate a new 5-layer backend microservice (e.g. Recruitment, Payroll, Attendance)
pnpm create:service <ServiceName>

# Build production artifacts for both frontend and backend
pnpm build

# Build production bundle for frontend only
pnpm build:client

# Build production binaries for backend solution only
pnpm build:backend

# Run ESLint across the frontend codebase
pnpm lint:client

# Type-check TypeScript code in the frontend
pnpm --filter ./apps/web exec tsc --noEmit

# Run unit tests for the frontend
pnpm --filter ./apps/web test

# Run unit and integration tests for backend solution
dotnet test apps/api/Hris.Backend.sln

# Launch full containerized development environment (Web, API, AI, CRM, Postgres, Redis, Keycloak)
docker compose -f infra/docker-compose.yml --profile dev up --build
```

## Code Style & Conventions

- Formatting: Use Prettier and ESLint for TypeScript/React code; follow standard C# formatting.
- Indentation: 2 spaces for TypeScript, JSX, JSON, and YAML; 4 spaces for C# files.
- TypeScript Naming: `kebab-case` for component files (`clock-in-card.tsx`), `PascalCase` for React
  components (`ClockInCard`), and named exports for all non-page components.
- C# Naming: `PascalCase` for classes, methods, and properties; prefix interfaces with `I`
  (e.g., `IEmployeeService`).
- DTO Standard: `DefaultDtoResponse<T>` (`Status`, `Data`, `Message`, `Total`) and `DefaultDtoPagingParams`.
- Constants & Enums: `UPPER_SNAKE_CASE` for environment variables; string literal unions for states.
- Lint Config: `eslint.config.mjs` in frontend; standard Roslyn analyzers for ASP.NET Core.
- Commit Message Template:
  ```text
  <type>(<scope>): <short summary>

  [optional body explanation]

  [optional issue/ticket reference]
  ```
  Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

## Architecture Notes

```mermaid
graph TD
    Client["Browser / Next.js 15 Client (apps/web)"]

    subgraph Backend ["ASP.NET Core 9 Solution (apps/api)"]
        subgraph Shared ["src/ (Cross-Cutting Modules)"]
            Approval["Hris.Approval"]
            Email["Hris.Email"]
            Logging["Hris.Logging"]
            Scheduler["Hris.Scheduler"]
            TokenVal["Hris.TokenValidation"]
        end

        subgraph MasterService ["src/Services/Master/"]
            MasterHost["hris-be (API Host)"]
            MasterServiceLayer["hris-be.service"]
            MasterDbLayer["hris-be.database"]
            MasterViewLayer["hris-be.view"]
            MasterLibLayer["hris-be.lib"]
        end

        subgraph RecruitmentService ["src/Services/Recruitment/"]
            RecruitmentHost["hris-recruitment-be (API Host)"]
            RecruitmentServiceLayer["hris-recruitment-be.service"]
            RecruitmentDbLayer["hris-recruitment-be.database"]
        end
    end

    AI["AI / RAG Service (apps/ai, FastAPI)"]
    CRM["CRM & PSA Service (apps/crm, NestJS + Prisma)"]
    Contracts["@hris/contracts (packages/contracts)"]

    DB[("PostgreSQL 16 / InMemory DB")]
    Cache[("Redis 7 Cache")]
    SSO["Keycloak SSO Service"]

    Client -->|REST API / HTTP| MasterHost
    Client -->|REST API / HTTP| RecruitmentHost
    Client -->|REST API / HTTP| AI
    Client -->|REST API / HTTP| CRM
    MasterHost --> MasterServiceLayer
    MasterServiceLayer --> MasterDbLayer
    MasterDbLayer --> DB
    MasterServiceLayer --> Cache
    Client -->|OIDC Authentication| SSO
    MasterHost -->|JWT Token Validation| SSO
    Contracts -.->|generated types| Client
    MasterHost -.->|OpenAPI| Contracts
    CRM -->|deal.closed_won event| Cache
```

The backend follows a modular microservice directory layout (`eproc-be` structure) under `apps/api/src/`. Each service (e.g. `Master`, `Recruitment`) is decomposed into 5 projects:
1. `*-be` (Web API Host & Controllers with auto-enabled Swagger at `/swagger`)
2. `*-be.database` (DbContext, Domain Entities in `Models/`, Custom Repositories in `Repositories/`, BaseRepository, UnitOfWork)
3. `*-be.service` (Application Business Logic Services)
4. `*-be.view` (DTOs in `DTOs/` & View Models in `ViewModels/`)
5. `*-be.lib` (Utilities & `DefaultDtoResponse<T>`)

The frontend follows a Feature-Driven Architecture under `apps/web/features/<feature-name>/`:
1. `features/<feature>/api/`: SWR data fetching hooks & API mutations (`use-employees.ts`)
2. `features/<feature>/components/`: Feature-specific UI components (`employee-table.tsx`, `employee-form-dialog.tsx`)
3. `features/<feature>/types/`: TypeScript DTO interfaces & Zod validation schemas (`employee.ts`)
4. `features/<feature>/README.md`: Feature-specific documentation & architectural notes
5. `app/(dashboard)/<feature>/page.tsx`: Lightweight Server Component pages using App Router Route Groups `(dashboard)` for layout isolation.
6. `lib/api-client.ts`: Centralized fetcher wrapper handling `DefaultDtoResponse<T>` and `NEXT_PUBLIC_API_BASE_URL`.


## Testing Strategy

- Unit Tests:
  - Frontend: Jest + `@testing-library/react` with `ts-jest` for component testing.
  - Backend: xUnit / NUnit for testing domain entities and application services.
- Integration Tests:
  - Backend: `Microsoft.AspNetCore.Mvc.Testing` (`WebApplicationFactory`) for WebAPI endpoints.
  - Frontend: MSW (Mock Service Worker) for API request interception during component tests.
- E2E Tests:
  > TODO: Configure Playwright or Cypress suite for automated cross-browser end-to-end tests.
- Execution in CI:
  Root GitHub Actions workflow (`ci-cd.yaml`) executes frontend lint/build and backend test/build
  on every pull request to `main`.

## Security & Compliance

- Secrets Handling: Never commit `.env.local`, `appsettings.Development.json`, or credentials.
  Use `.env.example` as a reference template and reference GitHub Secrets in CI/CD.
- Dependency Scanning: Use `pnpm audit` for NPM packages and `dotnet list package --vulnerable`
  for NuGet dependencies. Security analysis is managed via JetBrains Qodana (`qodana.yaml`).
- Execution Safety: Production containers run with non-root user privileges.
- License & Usage: Proprietary internal enterprise codebase; unauthorized redistribution is prohibited.

## Agent Guardrails

- Restricted Files:
  - Do NOT manually modify generated lockfiles (`pnpm-lock.yaml`). Run `pnpm install` instead.
  - Do NOT directly edit generated UI primitives in `apps/web/components/ui/`. Use
    composition or the `shadcn` CLI tool.
  - Do NOT modify production database migration scripts without explicit human review.
- Required Reviews: Pull requests containing changes to `.github/workflows/`, security configs,
  or shared API interfaces require mandatory senior engineer sign-off.
- Verification Rule: Automated agents MUST execute `pnpm build` and `dotnet build` verification
  commands after making code changes before declaring completion.

## Extensibility Hooks

- Frontend Hooks: Custom React hooks under `apps/web/hooks/` and SWR fetchers.
- Backend Generator: Use `pnpm create:service <ServiceName>` to scaffold a new 5-layer backend service.
- Environment Variables:
  - `NEXT_PUBLIC_API_BASE_URL`: Base URL pointing to the ASP.NET Core API (`http://localhost:8080/api/v1`).
  - `ASPNETCORE_ENVIRONMENT`: Execution environment (`Development`, `Staging`, `Production`).
  - `DATABASE_URL`: PostgreSQL connection string.
  - `REDIS_URL`: Redis cache connection string.

## Further Reading

Full documentation is organized under `docs/` using the Diataxis framework. Start with the
[Documentation Index](docs/README.md) for a navigable overview of all documents.

### Overview & Project Context
- [Project Overview](docs/00-overview/project-overview.md) — Scope, objectives, and glossary
- [Stakeholders & Roles](docs/00-overview/stakeholders-and-roles.md) — RBAC role matrix
- [Release Roadmap](docs/00-overview/release-roadmap.md) — Phased release plan and SLA targets

### Getting Started
- [Prerequisites](docs/01-getting-started/prerequisites.md) — Tool versions and machine setup
- [Environment Setup](docs/01-getting-started/environment-setup.md) — Full dev environment bootstrap
- [Running the Project](docs/01-getting-started/running-the-project.md) — How to run locally

### Architecture
- [System Architecture](docs/02-architecture/system-architecture.md) — Stack, DDD, multi-tenancy
- [Security Architecture](docs/02-architecture/security-architecture.md) — Threat model, AuthN/AuthZ, encryption
- [Data Model](docs/02-architecture/data-model.md) — Entity schema and data standards
- [Integration Architecture](docs/02-architecture/integration-architecture.md) — SSO, banking, biometrics
- [Event-Driven Architecture](docs/02-architecture/event-driven-architecture.md) — Kafka events

### Development Guides
- [Development Workflow](docs/03-guides/development-workflow.md) — Branching, PRs, conventions
- [Frontend Workflow](docs/03-guides/frontend-workflow.md) — Next.js specific flow
- [Backend Workflow](docs/03-guides/backend-workflow.md) — ASP.NET Core / NestJS flow
- [Database Migration](docs/03-guides/database-migration.md) — Zero-downtime migration policy
- [Storybook & MSW](docs/03-guides/storybook-and-msw.md) — Component-first development
- [Visual Regression Testing](docs/03-guides/visual-regression-testing.md) — Playwright snapshots
- [CI/CD Pipeline](docs/03-guides/ci-cd-pipeline.md) — GitHub Actions, quality gates
- [Payroll Release Process](docs/03-guides/payroll-release-process.md) — Critical finance releases
- [Incident Response](docs/03-guides/incident-response.md) — IR triage and playbooks

### Technical Reference
- [Functional Requirements](docs/04-reference/functional-requirements.md) — FR-xxx matrix
- [Non-Functional Requirements](docs/04-reference/non-functional-requirements.md) — NFR-xxx matrix
- [API Specification](docs/04-reference/api-specification.md) — REST API, error codes, webhooks
- [Module Catalog](docs/04-reference/module-catalog.md) — All 17 HRIS modules
- [Environment Variables](docs/04-reference/environment-variables.md) — Env var reference
- [Indonesian Compliance](docs/04-reference/indonesian-compliance.md) — PPh21, BPJS, THR config
