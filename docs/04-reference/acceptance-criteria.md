# Acceptance Criteria & Testing Strategy

This document outlines the acceptance criteria and testing strategy for the HRIS system.

## Acceptance Criteria Matrix

| ID | Module | Description / Metrics |
|---|---|---|
| **AC-PAY-01** | Payroll | 5,000 employees in one pay group, simulation run finishes in ≤ 20 minutes compute; reconciliation diff with reference template = 0. |
| **AC-PAY-02** | Payroll | Generates valid bank files that are accepted by the bank sandbox (checksum & format passed). |
| **AC-PAY-03** | Payroll | E-payslip is generated ≤ 2 minutes after run posting; downloadable via web & mobile. |
| **AC-ATT-01** | Attendance | Events from devices are ingested by the system with a P95 latency ≤ 10 seconds. |
| **AC-ATT-02** | Attendance | Offline mobile sync: 100 events sync automatically when online without duplication (idempotency test passes). |
| **AC-LV-01** | Leave | Accruals & carry-overs follow the policy matrix; ≥ 99% accuracy across 100 test scenarios. |
| **AC-SEC-01** | Security | OIDC SSO (Google/Azure) works correctly; MFA is mandatory for admins. |
| **AC-SEC-02** | Security | OWASP ZAP/DAST scans reveal zero critical/high findings in production prior to go-live. |

## Testing Strategy

- **Unit Testing**: ≥ 70% statement coverage on critical modules (Payroll, Attendance, Leave).
- **Contract Testing**: Used for public API contracts (Pact).
- **End-to-End (E2E) Integration**: Key scenarios such as `hire → payroll → payslip`, leave approval workflows, and `attendance device → timesheet` flows.
- **Load Testing**: Uses k6 to simulate 100 requests/second steady state for 15 minutes with an error rate < 0.1%.
- **Chaos Engineering (Optional)**: Simulates failures of cache components and message buses to ensure system resilience.
