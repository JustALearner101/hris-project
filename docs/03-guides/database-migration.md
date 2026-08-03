# Database Migration Policy

**Principles**: Backward compatibility, zero-downtime deployments, reversible migrations where possible.

## Additive Changes
Additive changes are considered safe and are permitted without a scheduled release window. 
* Examples: Adding a column (nullable or with a default value).

## Non-Additive / Destructive Changes
Dropping columns, renaming fields, or changing data types require a 3-step migration process to avoid downtime:

* **Step A (Add & Dual-write)**: Introduce new fields and write dual-writes in the application code (reading from the old field as a fallback).
* **Step B (Backfill & Switch)**: Backfill data and migrate reads to the new field (monitor for issues). Large backfills should run as background jobs with throttling, not as part of the request path.
* **Step C (Cleanup)**: Remove the old fields in a subsequent release (after sign-off).

## Execution & Commands
* Migrations are applied via a controlled job in the CI/CD release pipeline (not by the application on boot).
* Pre-migration backups and migration locks are required to prevent concurrent deployments.
* **Prisma Commands**:
  * Local development: `prisma migrate dev`
  * CI/CD (Release Job): `prisma migrate deploy`
* Keep migration scripts in the repository and visible during the PR review.
