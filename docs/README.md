# HRIS Project Documentation

Welcome to the HRIS (Human Resource Information System) project documentation. This index provides a navigable overview of all available documentation, organized using the [Diataxis framework](https://diataxis.fr/) to match the purpose of each document to the reader's needs.

---

## 📋 Overview

High-level context about the project, its scope, stakeholders, and roadmap.

| Document | Description |
|----------|-------------|
| [Project Overview](00-overview/project-overview.md) | What HRIS is, business scope, target organizations, Indonesian compliance focus, key objectives, and glossary |
| [Stakeholders and Roles](00-overview/stakeholders-and-roles.md) | Stakeholder map, user personas, and RBAC role/access matrix |
| [Release Roadmap](00-overview/release-roadmap.md) | Phased release plan (3 waves), API versioning policy, and SLA targets |

---

## 🚀 Getting Started

Step-by-step guides to set up your development environment and run the project.

| Document | Description |
|----------|-------------|
| [Prerequisites](01-getting-started/prerequisites.md) | Machine requirements, locked tool versions, and installation commands |
| [Environment Setup](01-getting-started/environment-setup.md) | Monorepo structure, frontend/backend bootstrap, Docker infrastructure, Keycloak SSO setup |
| [Running the Project](01-getting-started/running-the-project.md) | How to run the full stack locally (frontend, backend, Docker Compose) with verification steps |
| [Seed Data](01-getting-started/seed-data.md) | Development seed data setup for quick database population |

---

## 🏗️ Architecture

System design, technical decisions, and architectural blueprints.

| Document | Description |
|----------|-------------|
| [System Architecture](02-architecture/system-architecture.md) | Modular monolith with DDD boundaries, multi-tenant isolation, full tech stack, DevOps/observability |
| [Data Model](02-architecture/data-model.md) | 40+ entity schema, data standards (UUID v7, soft delete, optimistic locking), sample DDL |
| [Integration Architecture](02-architecture/integration-architecture.md) | SSO (OIDC/SAML/SCIM), attendance device gateway, banking file formats, e-sign, accounting adapters |
| [Security Architecture](02-architecture/security-architecture.md) | Comprehensive security blueprint: threat model, AuthN/AuthZ, encryption, network controls, compliance |
| [Event-Driven Architecture](02-architecture/event-driven-architecture.md) | Kafka event bus, standard envelope schema, event catalog, schema validation |

---

## 📖 Guides

How-to guides for specific development tasks and workflows.

| Document | Description |
|----------|-------------|
| [Development Workflow](03-guides/development-workflow.md) | Branching strategy, PR requirements, local dev sequence, sprint deliverables, conventions |
| [Frontend Workflow](03-guides/frontend-workflow.md) | Next.js specific dev flow: Storybook prototyping, Server/Client components, React Query, MSW |
| [Data Table Guide](03-guides/data-table.md) | Architectural details and blueprints for client-side and server-side composable tables |
| [Backend Workflow](03-guides/backend-workflow.md) | Backend-specific dev flow: OpenAPI-first, DTOs, Prisma migrations, K8s probes, graceful shutdown |
| [Database Migration](03-guides/database-migration.md) | Zero-downtime migration policy, 3-step non-additive change pattern, Prisma commands |
| [Storybook and MSW](03-guides/storybook-and-msw.md) | Component-first development with Storybook 7, API mocking with MSW, Tailwind integration |
| [Visual Regression Testing](03-guides/visual-regression-testing.md) | Playwright visual snapshot testing, CI pipeline setup, baseline management, troubleshooting |
| [CI/CD Pipeline](03-guides/ci-cd-pipeline.md) | GitHub Actions pipeline stages, quality gates, canary deployments, automated rollback triggers |
| [Payroll Release Process](03-guides/payroll-release-process.md) | Critical payroll/finance release rules, dual sign-off, dry-run validation, feature flag rollout |
| [Incident Response](03-guides/incident-response.md) | IR triage flow, data leak playbook, communication templates, security pre-release checklist |
| [Data Migration](03-guides/data-migration.md) | Legacy data migration pipeline: validation, dry-run, sign-off, anonymization |

---

## 📚 Reference

Technical specifications for quick lookup.

| Document | Description |
|----------|-------------|
| [Functional Requirements](04-reference/functional-requirements.md) | Complete FR-xxx requirement matrix organized by module |
| [Non-Functional Requirements](04-reference/non-functional-requirements.md) | NFR-xxx matrix: availability, performance, scale, security, observability, backup |
| [API Specification](04-reference/api-specification.md) | REST API contracts, error codes, pagination, idempotency, webhook specs |
| [Module Catalog](04-reference/module-catalog.md) | Detailed catalog of all 17 HRIS modules with data ownership, events, and SLAs |
| [Acceptance Criteria](04-reference/acceptance-criteria.md) | AC-xxx matrix with specific metrics, plus testing strategy overview |
| [Environment Variables](04-reference/environment-variables.md) | Complete env var reference organized by category with defaults |
| [Docker Compose Reference](04-reference/docker-compose-reference.md) | Service definitions, ports, volumes, profiles for Docker Compose setup |
| [Indonesian Compliance](04-reference/indonesian-compliance.md) | PPh21, BPJS, THR, and overtime configurable compliance parameters |

---

## 📁 Legacy Documents

Original PDF documents are archived in [`_legacy/`](_legacy/) for reference. All content has been migrated to the markdown files above.

| Original PDF | Migrated To |
|-------------|-------------|
| `HRIS All‑In‑One — SRS & Arsitektur V1.pdf` | `00-overview/*`, `02-architecture/system-architecture.md`, `02-architecture/data-model.md`, `02-architecture/integration-architecture.md`, `04-reference/*` |
| `HRIS Dev Environment — Step‑by‑step Setup (locked Versions).pdf` | `01-getting-started/*` |
| `Hris Dev Workflow & Modules — Frontend + Backend Flow V1.pdf` | `03-guides/development-workflow.md`, `03-guides/frontend-workflow.md`, `03-guides/backend-workflow.md`, `03-guides/ci-cd-pipeline.md`, `04-reference/module-catalog.md` |
| `Skema Keamanan Sistem Hris — Kebijakan & Arsitektur Keamanan V1.pdf` | `02-architecture/security-architecture.md`, `03-guides/incident-response.md` |
| `Frontend — Storybook + Msw + Visual Regression (starter Guide).pdf` | `03-guides/storybook-and-msw.md`, `03-guides/visual-regression-testing.md` |
