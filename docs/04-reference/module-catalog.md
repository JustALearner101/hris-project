# Module Catalog

This document details all 17 main modules within the HRIS system, their responsibilities, API contracts, event interactions, and ownership SLAs.

## General Principles
- **Employee & Organization** is the single source of truth for master data.
- All modules consume this data, but only Core HR writes (creates/updates) it, with the exception of Onboarding writing an employee upon `hired`.

## Ownership SLAs
Each module is owned by a specific team responsible for API docs, contract tests, and runbooks. Example SLAs include:
- **Attendance ingestion**: P95 latency < 10s.
- **Payroll run**: 5,000 employees < 20 min.
- **Employee CRUD API (Core HR)**: Availability 99.9%.

---

## 1. Core HR (Master Data)
- **Description**: Stores personal data, employment details, document vault, and lifecycle events.
- **Data Owner**: Core HR service (single source of truth).
- **APIs**: CRUD for employee, org structure, documents (upload/download presigned URL).
- **Events Emitted**: `employee.created`, `employee.updated`, `employee.terminated`.
- **Dependencies**: Used by Payroll, Benefits, Attendance, Performance, Asset, Recruitment.

## 2. Organization (Org & Position)
- **Description**: Hierarchical structure, cost centers, grades, positions.
- **Data Owner**: Organization service.
- **APIs**: Get org tree, update positions, assign cost center.
- **Events Emitted**: `position.created`, `position.updated`.
- **Dependencies**: Employees have positions/grades; Payroll uses grades for pay rules; Finance uses cost centers.

## 3. Recruitment / ATS
- **Description**: Job posting, application pipeline, interview scheduling.
- **Data Owner**: ATS service (writes to candidate domain).
- **Events Emitted**: `candidate.applied`, `candidate.hired`.
- **Dependencies**: On hire, it triggers Core HR onboarding workflow.

## 4. Onboarding / Offboarding
- **Description**: Task checklists, provisioning (SCIM), probation tracker.
- **Events Emitted**: `onboarding.started`, `onboarding.completed`, `offboarding.started`, `offboarding.completed`.
- **Dependencies**: Listens to `candidate.hired` or `employee.created`.

## 5. Attendance & Scheduling
- **Description**: Clock-in/out, device gateways, roster, timesheets, offline sync.
- **APIs**: Ingest events, query timesheet, roster management.
- **Events Emitted**: `attendance.event.ingested`, `timesheet.updated`.
- **Dependencies**: Payroll consumes timesheets for earnings & overtime; HR uses it for absence reasoning.

## 6. Leave & Absence
- **Description**: Policies, requests, approvals, accruals.
- **APIs**: Request leave, balance query, approve/reject.
- **Events Emitted**: `leave.request.created`, `leave.request.approved`, `leave.balance.updated`.
- **Dependencies**: Payroll reads approved leaves to prorate pay; Attendance reconciles overlapping records.

## 7. Payroll (Finance Critical)
- **Description**: Salary calculation, tax (PPh21), BPJS, THR, deductions, payslip generation, bank file.
- **APIs**: Run payroll, simulate, fetch payslip, export bank file.
- **Events Emitted**: `payroll.run.started`, `payroll.run.completed`, `payslip.generated`.
- **Dependencies**: Requires Core HR, Attendance (timesheets), Leave, Benefits & Claims, Organization (cost center), and Asset (allowances).

## 8. Benefits & Claims
- **Description**: Insurance enrollment, reimbursements, claims flow.
- **Events Emitted**: `claim.submitted`, `claim.approved`.
- **Dependencies**: Payroll reads benefits contributions; Finance handles reimbursements.

## 9. Performance & Goals
- **Description**: OKR/KPI, reviews, 360 feedback, calibration.
- **APIs**: Set goals, submit review, fetch ratings.
- **Events Emitted**: `goal.created`, `review.completed`.
- **Dependencies**: Compensation decisions reflect here (manual or automated tie to payroll).

## 10. Learning (LMS Light)
- **Description**: Course catalog, assignment, completion, certification.
- **Events Emitted**: `course.completed`.
- **Dependencies**: Completion may trigger performance points or role change eligibility.

## 11. Expenses & Travel
- **Description**: Claim submission, travel requests, per-diem calculations, multi-currency.
- **APIs**: Submit claim, approve, export to payroll/finance.
- **Events Emitted**: `expense.submitted`, `expense.approved`.
- **Dependencies**: Finance integrates with Payroll to process reimbursements.

## 12. Asset Management
- **Description**: Lifecycle of hardware & access cards, depreciation.
- **APIs**: Assign asset, return asset, service ticket.
- **Events Emitted**: `asset.assigned`, `asset.returned`.
- **Dependencies**: Onboarding consumes asset assignment; Offboarding triggers asset return.

## 13. Communication & Notifications
- **Description**: Targeted announcements, notification routing (email, WA, Slack), scheduling.
- **APIs**: Create announcement, subscribe.
- **Events Emitted**: `announcement.published`, `notification.sent`.
- **Dependencies**: All modules trigger notifications (e.g., leave approvals, payslip ready).

## 14. Analytics & Reporting (BI)
- **Description**: Dashboards, report builder, ETL to data warehouse.
- **APIs**: Snapshot exports, query endpoints for dashboards.
- **Events Emitted**: Snapshot exports, CDC stream.
- **Dependencies**: Pulls from all modules; owned by Data team. Writes back insights to Performance/HR as needed.

## 15. Integration Layer & Gateway
- **Description**: Adapters for bank, e-sign, SSO (Keycloak), attendance devices, accounting.
- **APIs**: Adapters abstract remote vendor specifics.
- **Events Emitted**: `external.sync.success`, `external.sync.fail`.
- **Dependencies**: Integrates with Payroll, Onboarding, Documents, Attendance.

## 16. Admin / System (RBAC, Config)
- **Description**: Tenant, roles, policy engine, system settings (tax rates, BPJS rates).
- **APIs**: CRUD config, role mapping.
- **Events Emitted**: `config.updated`.
- **Dependencies**: Read by Payroll & other rule engines.

## 17. AuthN / AuthZ
- **Description**: Keycloak realm, clients, claim mapping; token verification service.
- **Dependencies**: All services validate tokens; SCIM used by Onboarding for provisioning.
