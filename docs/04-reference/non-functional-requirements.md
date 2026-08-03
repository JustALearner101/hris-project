# Non-Functional Requirements

This document outlines the non-functional requirements (NFRs) for the HRIS system.

| ID | Category | Description |
|---|---|---|
| NFR-AVAIL-001 | Availability | Production availability ≥ 99.9%/year (excluding scheduled maintenance ≤ 4 hours/month). |
| NFR-PERF-001 | Performance | P95 API read ≤ 300 ms for lightweight queries; P95 page LCP ≤ 2.5 s on a 4G connection. |
| NFR-SCALE-001 | Scale | Supports 100K employees/tenant and 5K concurrent active users. |
| NFR-SEC-001 | Security | OWASP ASVS L2 compliant; encryption in-transit (TLS 1.2+) & at-rest (AES-256/KMS). |
| NFR-OBSV-001 | Observability | Tracing (OpenTelemetry), structured logs, and Prometheus metrics. |
| NFR-BKP-001 | Backup & DR | Daily backups + PITR; RTO ≤ 1 hour, RPO ≤ 15 minutes. |
| NFR-A11Y-001 | Accessibility | WCAG 2.1 AA compliant. |
| NFR-I18N-001 | i18n | Internationalization (Bahasa/English), per-entity timezones, local formatting (ID). |
