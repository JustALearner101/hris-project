# Data Model

## Data Model Summary

The system consists of over 40 core entities organized by domain. 

### Core Entities by Domain
- **Core / Org**: Company, Entity, Location, Department, Position, Grade, Policy, Employee, Employment, Compensation, Document, Signature
- **Time & Attendance**: AttendanceEvent, Shift, Schedule, Timesheet, Overtime, LeavePolicy, LeaveBalance, LeaveRequest
- **Payroll & Finance**: PayrollRun, PayGroup, Payslip, TaxComponent, BPJSComponent, ExpenseReport, ExpenseItem
- **Asset**: Asset, AssetAssignment
- **Talent / ATS**: Candidate, Application, Interview, Offer, Goal, KPI, Review, Feedback
- **System**: Notification, Task, Checklist, AuditEvent

## Data Standards

- **Primary Keys**: UUID v7 (`id`)
- **Multi-Tenancy**: `tenant_id` and `entity_id` (nullable if at the tenant level) on all tables.
- **Timestamps**: `created_at`, `updated_at`, `deleted_at` (for soft deletes).
- **Timezone**: Dates and times are stored in UTC (ISO 8601). Timezone is stored on the entity and rendered according to the user's timezone.
- **Concurrency**: `version` field for optimistic locking.
- **Business Unique Keys**: Unique per tenant (e.g., `employee_no`, `npwp`, `nik`, `bank_account_no`).

## Sample PostgreSQL DDL

```sql
-- Tenant & Entity
create table tenant (
    id uuid primary key,
    name text not null,
    created_at timestamptz not null default now()
);

create table entity (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    name text not null,
    timezone text not null default 'Asia/Jakarta'
);

-- Employee (simplified)
create table employee (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    entity_id uuid references entity(id),
    employee_no text not null,
    first_name text not null,
    last_name text,
    email text unique,
    nik text,
    npwp text,
    hire_date date not null,
    status text not null check (status in ('ACTIVE','INACTIVE','TERMINATED')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    version int not null default 1
);

create unique index uq_emp_no on employee(tenant_id, employee_no) where deleted_at is null;
```
