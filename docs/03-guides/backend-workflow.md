# Backend Workflow

This guide outlines the NestJS 10 specific development flow.

## Development Workflow
1. **OpenAPI Spec**: API contract (OpenAPI) must be updated first if the surface changes.
2. **Implementation**: Implement the service, DTOs, and validators (`class-validator`).
3. **Database Changes**: Add Prisma schema and generate migrations if the database changes.
4. **Testing**: Write unit tests (Jest) + integration tests (Supertest).
5. **Contract Tests**: Add contract tests and smoke tests.
6. **PR Checks**: Run automated PR checks.

## CI/CD for Backend
* **PR Pipeline**: Lint, typecheck, unit & integration tests, OpenAPI validation, container build + image scan.
* **Merge to Main**: Publish container image to the registry, deploy to staging.
* **Release**: Run `prisma migrate deploy` via a controlled job *before* deploying app containers if a migration is required.

## Runtime Concerns
* **Probes**: Use Kubernetes readiness and liveness probes.
* **Graceful Shutdown**: Handle graceful shutdowns to finish inflight jobs (especially critical payroll jobs).
