# Data Migration

This guide outlines the process for migrating legacy data into the HRIS platform.

## Legacy Data Migration Pipeline
Data is often sourced from Legacy HRIS systems, Excel, or CSV formats. The migration pipeline ensures data integrity during this process.

1. **Mapping**: Standard field templates per module are used to map external data to the HRIS schema.
2. **Pre-Flight Validation Checks**: 
   * Format validation.
   * Duplication checks.
   * Referential integrity checks.
3. **Dry-Run Execution**: Data is migrated into a staging environment as a dry-run.
4. **User Sign-Off**: Users (e.g., HR admins, Finance) must sign off on the data accuracy in staging.
5. **Sandbox Data Anonymization**: (Optional) Data migrated into sandbox environments can be anonymized for testing purposes without exposing sensitive information.
