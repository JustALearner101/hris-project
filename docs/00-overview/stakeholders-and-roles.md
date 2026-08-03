# Stakeholders and Roles

## Stakeholder Map
- **Executive Sponsor**: COO/CHRO.
- **HR Admin**: Manages master data and payroll.
- **Manager**: Approves timesheets, leave requests, and expenses.
- **Employee**: Uses self-service features.
- **Finance**: Handles payroll journals and reconciliation.
- **IT/Ops**: Manages Single Sign-On (SSO), devices, and security.

---

## User Roles & Access (RBAC)

| Role | Primary Access |
|---|---|
| **Super Admin (Tenant)** | Tenant configuration, entity management, global policies, user & role management. |
| **HR Admin (Entity)** | Master data, payroll, benefits, compliance, reporting. |
| **Manager** | Approvals for leave, timesheets, expenses, and overtime. |
| **Employee** | Self-service functionalities including profile, payslips, leave, attendance, and expenses. |
| **Finance** | Journal posting, reconciliation, and tax/bank exports. |
| **IT Admin** | SSO setup, attendance device integration, and general integrations. |

### Security Principles
- **Least-Privilege**: Users are granted only the permissions necessary to perform their duties.
- **Policy-Based Access**: Role definitions and access rules are governed by policy engines (e.g., OPA/oso).
- **Auditability**: All actions performed by users are strictly audited and logged.
