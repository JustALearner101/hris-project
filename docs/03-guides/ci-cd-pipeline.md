# CI/CD Pipeline

This document describes the full Continuous Integration and Continuous Deployment (CI/CD) pipelines for the HRIS project.

## Pipeline Stages

### PR Pipeline
Runs on every Pull Request.
1. Checkout, cache node/pnpm.
2. Install dependencies (`pnpm i --frozen-lockfile`).
3. Lint and typecheck.
4. Unit tests (Jest/Vitest).
5. Contract tests (Pact / OpenAPI validator) if API or DTO changes.
6. Security scans (Snyk/Trivy for dependencies and container images).
7. Build (frontend SSR build & backend ts compile).
8. Artifact publish (store build artifacts for staging deploy).

### Merge Pipeline (Main)
Runs when PR is merged to the `main` branch.
1. All PR checks re-run.
2. DB migration plan generated (but not auto-applied to production).
3. Deploy to staging (Kubernetes or platform) with blue/green or ephemeral previews.
4. Run smoke tests & E2E tests.
5. Auto-approve sign-offs (QA) setting the release candidate.

### Release Pipeline (Manual Trigger)
1. Tag semantic version (e.g., `vX.Y.Z`).
2. Run DB migration job (with pre-migration backup & lock).
3. Deploy to production using a canary deployment (10% -> 50% -> 100%).
4. Run post-deploy smoke tests and critical business checks (e.g., payroll simulation).
5. Monitor metrics for 30 minutes.

## Quality Gates
* **Pre-merge**: Lint, typecheck, 100% of critical unit tests pass, contract tests green, security scan (no critical vulnerabilities added).
* **Pre-release**: Staging smoke + E2E + security scan.
* **Post-release**: Health checks, business validation (sample payroll run), metrics monitoring (SLOs).

## Automated Rollback Triggers
* Error rate > 3% for 10 minutes.
* Increase in latency > 2x baseline for 10 minutes.
* Payroll simulation mismatch beyond the acceptable threshold.

## Actual CI/CD YAML Config
Located at `.github/workflows/ci-cd.yaml`:

```yaml
name: HRIS Monorepo CI/CD Pipeline

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  backend-ci:
    name: Backend CI (.NET 9)
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '9.0.x'

      - name: Restore Dependencies
        run: dotnet restore apps/api/Hris.Backend.sln

      - name: Build Backend
        run: dotnet build apps/api/Hris.Backend.sln --no-restore -c Release

  frontend-ci:
    name: Frontend CI (Next.js 15)
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          cache-dependency-path: pnpm-lock.yaml

      - name: Install Frontend Dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint Frontend
        run: pnpm --filter ./apps/web lint

      - name: Build Frontend
        run: pnpm --filter ./apps/web build

  docker-build-push:
    name: Docker Build & Push
    needs: [backend-ci, frontend-ci]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and Push Frontend Image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/web/Dockerfile
          target: runner
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/hris-client:latest

      - name: Build and Push Backend Image
        uses: docker/build-push-action@v5
        with:
          context: ./apps/api
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/hris-api:latest
```
