# Payroll Release Process

Payroll is a business-critical module. Special rules apply to any release impacting payroll calculations.

## Critical Payroll Release Rules
1. **Release Window**: Payroll runs require a scheduled release window (during non-business/off-peak hours). A database backup and verification must occur before deployment.
2. **Dual Sign-Off**: The release must be explicitly authorized by both the Finance Lead and the DevOps engineer on call.
3. **Staging Dry-Run**: Must pass a payroll dry-run on staging with a sample dataset and financial reconciliation.
4. **Feature Flags**: Use feature flags to gate changes to the calculation logic. This allows for a toggleable rollback.
5. **Audit Logging**: Every payroll run must be logged and cryptographically checksummed. Artifacts must be retained for at least 7 years.

## Rollout Sequence for Calculation Changes
1. Developer implements the new calculation behind a feature flag.
2. Run extensive unit and integration tests (including edge cases) + simulation on staging data.
3. Finance runs a dry-run and verifies reconciliation.
4. Deploy to production with the feature flag **OFF**.
5. Run a scheduled payroll simulation with a small sample on production.
6. Toggle the feature flag for 5% of users (canary) -> monitor key metrics & reconcile.
7. Expand to 50% -> 100% if metrics are OK.
8. Remove the old code in a subsequent release according to the deprecation plan (code cleanup).
