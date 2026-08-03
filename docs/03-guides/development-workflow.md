# Development Workflow

This document outlines the end-to-end development workflow for the HRIS project.

## Branching Model & Developer Flow

**Main Model:** Trunk-based development with short-lived feature branches.

### Branch Taxonomy
* **Trunk/main**: Always releasable, protected (CI green + approvals).
* **Develop** *(Optional)*: Can be used if the team wants a staging branch (recommended for >8 devs).
* **Feature branches**: `feature/{ticketId}-{short-desc}` (e.g., `feature/HRIS-123-attendance-clockin`). Lifespan <= 7 days.
* **Hotfixes**: `hotfix/{short-desc}` -> merges directly to `main`, tag with semantic version.
* **Release branches**: `release/vX.Y` (only if necessary for long stabilization). Prefer fast trunk releases over long release branches.

### Pull Request (PR) Requirements
* **PR Target**: `develop` or `main` depending on the flow.
* **Must pass**: lint, typecheck, unit tests, contract tests (if API is modified), security scan, dependency scan.
* **Approvals**: At least 1 code owner approval for backend / 1 UI reviewer for frontend.
* **PR Description Template**: Must include:
  * Purpose
  * API contract changes
  * Migration steps (if database is modified)
  * Acceptance checklist

### Local Developer Sequence
1. Branch from trunk: `git checkout -b feature/HRIS-123-desc`
2. Create API contract (OpenAPI minor change) or mock with MSW (frontend).
3. Implement backend service + migration (if needed).
4. Add unit tests + contract tests.
5. Run local E2E (Playwright) for the critical path.
6. Push + open PR.

## Deliverables per Sprint
* **Code**: Feature branches & merged PRs.
* **Tests**: Unit + integration + contract + E2E smoke tests.
* **Docs**: OpenAPI updated, runbooks, migration notes.
* **Infra**: Helm chart or Kubernetes manifest updates.
* **QA**: Test cases executed & sign-off.

## Conventions
* **Tenant ID**: `tenant_id` must be present in events & API calls.
* **UUID Standard**: v7 (if available) or v4.
* **Timestamps in Events**: ISO 8601 UTC.
* **Versioning**: Semantic versioning for services & API major versioning.
