# Project Overview

## Executive Summary
The HRIS system is an integrated solution designed for organizations with 50 to 5,000 employees. It supports multi-entity, multi-location, and multi-currency operations. The primary focus of the system is compliance with Indonesian regulations (such as PPh21, BPJS, THR, and overtime), fast user experience, robust security, and easy integration. The architecture utilizes a modular monolith approach (ready to be split into microservices) with multi-tenant Row-Level Security (RLS).

## Scope & Objectives

### In-Scope
- Core HR
- Organizational Structure
- Recruitment / Applicant Tracking System (ATS)
- Onboarding & Offboarding
- Attendance & Scheduling
- Leave Management
- Payroll (Indonesia-first focus)
- Benefits & Claims
- Performance Management
- Learning Management
- Expenses & Travel
- Asset Management
- Communication
- Analytics
- Compliance & Security

### Out-of-Scope (Phase 1)
- Payroll for countries other than Indonesia
- Advanced Learning Management Systems (LMS) such as SCORM authoring
- Time & Attendance (T&A) hardware provisioning
- Full Talent Marketplace module

### Key Objectives
- Reduce payroll errors to < 0.1%
- Accelerate leave requests and approvals to a P95 of < 5 minutes
- Enable one-click bank transfers
- Ensure 100% auditability

---

## Glossary & Definitions

- **Tenant**: A customer unit (e.g., per company or holding group).
- **Entity**: A legal entity within a tenant.
- **RLS**: Row-Level Security; access restriction per tenant/entity.
- **Pay Group**: A group of employees with the same payroll schedule and rules.
- **PPh21**: Indonesian Employee Income Tax (Pajak Penghasilan).
- **BPJS**: Social Security Administrator for Health and Employment (Badan Penyelenggara Jaminan Sosial).
- **RTO/RPO**: Recovery Time Objective / Recovery Point Objective.
