# Functional Requirements

This document outlines the functional requirements for the HRIS system, organized by module.

## Core HR & Organization

| ID | Description |
|---|---|
| FR-CORE-001 | The system stores employee master data (identity, contact, family, NIK, NPWP, BPJS, bank account) with format validation (regex) and date validation (ISO 8601). |
| FR-CORE-002 | Supports organizational structure: Company → Entity → Location → Department → Position → Grade → Cost Center. |
| FR-CORE-003 | Employee lifecycle management (hire, transfer, promote, suspend, terminate) with effective-date & reason codes. |
| FR-CORE-004 | Document Vault with e-sign integration (PrivyID/DocuSign) and encryption at-rest. |
| FR-CORE-005 | Immutable audit trail for create/update/delete actions on all master tables. |

## Recruitment / ATS

| ID | Description |
|---|---|
| FR-ATS-001 | Career site builder (theme, logo, SEO meta) and custom application forms. |
| FR-ATS-002 | Pipeline management: Sourcing → Screening → Interview → Offer → Hired, configurable per job. |
| FR-ATS-003 | Interview schedule synchronization with Google/Microsoft Calendar; automated invitations. |
| FR-ATS-004 | Offer letter generator (templating) + e-sign. |
| FR-ATS-005 | Candidate deduplication via email/phone + optional fuzzy matching. |

## Onboarding & Offboarding

| ID | Description |
|---|---|
| FR-ONB-001 | Cross-departmental checklists with SLA and reminders. |
| FR-ONB-002 | Account provisioning (Google/Microsoft) via SCIM/OIDC claims. |
| FR-ONB-003 | Offboarding clearance (asset, system access, final payroll) is mandatory before termination is effective. |

## Attendance & Scheduling

| ID | Description |
|---|---|
| FR-ATT-001 | Clock in/out via mobile (GPS geofence), web, and biometric devices (ZKTeco/Hikvision) through a gateway. |
| FR-ATT-002 | Offline mode for mobile; events are stored locally and synced when online, using an idempotency key. |
| FR-ATT-003 | Shift & roster management (fixed/rotating/split) + lateness tolerance & grace period. |
| FR-ATT-004 | Project/task timesheets with multi-level approval. |
| FR-ATT-005 | Automatic overtime calculation based on policies & regulations (configurable). |

## Leave & Absence

| ID | Description |
|---|---|
| FR-LV-001 | Annual leave/sick/maternity/custom with accrual, carry-over, and prorata for joiner/leaver. |
| FR-LV-002 | Team calendar, blackout dates, and document requirements (MC) based on duration. |
| FR-LV-003 | Multi-channel notifications (web/email/WA/Slack/Teams) for requests & approvals. |

## Payroll (Indonesia-First)

| ID | Description |
|---|---|
| FR-PAY-001 | PPh21 schemes: gross, gross-up, nett; dynamic PTKP & tax rates from configuration tables. |
| FR-PAY-002 | BPJS Kesehatan & Ketenagakerjaan (JKK/JKM/JHT/JP) with configurable wage limits, rates, and rounding per period. |
| FR-PAY-003 | THR, overtime, shift allowances, bonuses, and loan deductions. |
| FR-PAY-004 | Payroll simulation, multi-run, multi-pay-group; lock & re-open with reason logs. |
| FR-PAY-005 | PDF e-payslip; bank file generator (BCA, Mandiri, BNI, etc.) according to format specifications. |
| FR-PAY-006 | Export PPh21 e-Filing (CSV/XML per template), BPJS SIPP recapitulation; automatic journal entries to accounting system. |

## Benefits & Claims

| ID | Description |
|---|---|
| FR-BFT-001 | BPJS/insurance enrollment; limits & co-pay per level/grade. |
| FR-BFT-002 | Reimbursement with receipt upload + basic OCR; routing approval & GL mapping. |

## Performance & Goals

| ID | Description |
|---|---|
| FR-PERF-001 | OKR/KPI with periodic check-ins & 1:1 notes. |
| FR-PERF-002 | Review cycle (mid/final), 360° feedback, calibration. |

## Learning (LMS)

| ID | Description |
|---|---|
| FR-LMS-001 | Course catalog (video/pdf/quiz), automated assignments. |
| FR-LMS-002 | Certificates with validity periods & expiry reminders. |

## Expenses & Travel

| ID | Description |
|---|---|
| FR-EXP-001 | Expense claims (category, currency, historical exchange rates) + receipts. |
| FR-EXP-002 | Travel request → approval → itinerary; ready for OTA integration. |

## Asset Management

| ID | Description |
|---|---|
| FR-AST-001 | Asset lifecycle (assign/return/service), QR/Barcode, optional straight-line depreciation. |

## Communications & Engagement

| ID | Description |
|---|---|
| FR-COM-001 | Targeted announcements; polling; kudos. |

## Analytics & Reporting

| ID | Description |
|---|---|
| FR-BI-001 | Executive dashboard (headcount, turnover, overtime, HR costs). |
| FR-BI-002 | Report builder (filter, group, pivot, export CSV/XLSX/PDF). |
| FR-BI-003 | Daily snapshot to data warehouse (optional) for time-travel queries. |
