# API Specification

This document details the public API specifications and contracts for the HRIS system.

## General Overview

- **Version**: `v1`
- **Base URL**: `/api/v1`
- **Format**: JSON
- **Authentication**: OAuth2 (Bearer) with scopes per resource
- **Rate Limit**: Default 120 rpm per token
- **Idempotency**: All `POST` endpoints that create resources accept an `Idempotency-Key` (UUID) header. The server stores the result for 24 hours in a Redis cache; retrying with the same key will return an identical response.

## Pagination & Query

- **Pagination**: Uses `page` and `page_size`. `page` is 1-based. `page_size` defaults to 50, maximum 200. The response contains `total` and `items`.
- **Sorting**: Multi-column sorting is supported via `sort=field:asc|desc` (e.g., `sort=field1:asc,field2:desc`).
- **Filtering**: Query parameters support simple `q` and nested filters using `filters[field.path]=operator:value` (operators: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `like`, `in`).

## Concurrency Control

- **ETag**: `GET` requests return an `ETag` header. `PUT`/`PATCH` requests should use the `If-Match` header for optimistic locking.

## Error Handling

Errors return an appropriate HTTP status code and a standard JSON body:
```json
{
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "details": "Additional context or field-level details",
  "correlation_id": "UUID-for-tracing"
}
```

### Error Code Matrix

| Error Code | HTTP Status | Description |
|---|---|---|
| `E_AUTH_001` | 401 | Invalid or expired token |
| `E_AUTHZ_001` | 403 | Insufficient scope or role |
| `E_VALID_001` | 400 | Field validation failed (details per field) |
| `E_RATE_001` | 429 | Rate limit exceeded |
| `E_CONFLICT_001` | 409 | Data version changed (optimistic lock conflict) |
| `E_NOTFOUND_001` | 404 | Resource not found |
| `E_INT_001` | 500 | Internal server error (refer to `correlation_id`) |

## Endpoint Examples

### 1. Create Employee

```http
POST /api/v1/employees
Content-Type: application/json
Idempotency-Key: a1b2c3d4-e5f6-7890-1234-56789abcdef0

{
  "employee_no": "E-000123",
  "first_name": "Budi",
  "last_name": "Santoso",
  "email": "budi@contoh.co.id",
  "nik": "3276...",
  "npwp": "09.123.456.7-012.000",
  "hire_date": "2025-08-01",
  "entity_id": "UUID",
  "position_id": "UUID",
  "grade_id": "UUID"
}
```
**Response**: `201 Created` with a full object body containing `id` and `version`.

### 2. Submit Attendance (Clock-In)

```http
POST /api/v1/attendance/events
Content-Type: application/json
Idempotency-Key: b2c3d4e5-f6a7-8901-2345-6789abcdef01

{
  "employee_id": "UUID",
  "type": "CLOCK_IN",
  "occurred_at": "2025-08-19T08:01:12Z",
  "source": "MOBILE",
  "geo": { "lat": -6.1754, "lng": 106.8272, "accuracy_m": 25 }
}
```
**Response**: `202 Accepted` with event `event_id`; async processing to timesheet.

### 3. Trigger Payroll Run

```http
POST /api/v1/payroll/runs
Content-Type: application/json
Idempotency-Key: c3d4e5f6-a7b8-9012-3456-789abcdef012

{
  "pay_group_id": "UUID",
  "period_start": "2025-08-01",
  "period_end": "2025-08-31",
  "payout_date": "2025-09-01",
  "options": { "simulate": true }
}
```
**Response**: `202 Accepted` with a status URL `/payroll/runs/{id}`.

### 4. Recruitment & ATS Microservice (`hris-recruitment-be`, `:8083`)

All responses use `DefaultDtoResponse<T>` (`status`, `data: T[]`, `message`, `total`).

#### Public Career Portal (`[AllowAnonymous]`)

| Method | Path | Rate Limit | Description |
|--------|------|------------|-------------|
| `GET` | `/api/v1/public/jobs` | `public-read` (60/min/IP) | Paginated list of `OPEN` job postings (`DefaultDtoPagingParams`) |
| `GET` | `/api/v1/public/jobs/{slug}` | `public-read` (60/min/IP) | Public job posting detail by slug |
| `POST` | `/api/v1/public/jobs/{jobId}/applications` | `public-apply` (5/min/IP) | Multipart CV upload (`cv` up to 5 MB `.pdf`/`.doc`/`.docx`) + `Idempotency-Key` header; returns `202 Accepted` with `{ applicationId, trackingToken, status: "PENDING" }` |
| `GET` | `/api/v1/public/applications/{token}` | `public-status` (30/min/IP) | Candidate status tracker by opaque 256-bit `trackingToken` |

#### HR Admin ATS (`[Authorize(Roles = "HR Admin")]`)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/auth/login` | Issue signed JWT for `HR Admin` testing/local dev |
| `GET` | `/api/v1/JobPosting` | List all job postings (all statuses) |
| `GET` | `/api/v1/JobPosting/{id}` | Get job posting by ID with pipeline stages |
| `POST` | `/api/v1/JobPosting` | Create job posting + seed default 5 stages (`Sourcing`, `Screening`, `Interview`, `Offer`, `Hired`) |
| `PUT` | `/api/v1/JobPosting/{id}` | Update job posting |
| `DELETE` | `/api/v1/JobPosting/{id}` | Soft-delete job posting (`is_deleted = true`) |
| `POST` | `/api/v1/JobPosting/{id}/publish` | Transition status to `OPEN` and set `published_at` |
| `POST` | `/api/v1/JobPosting/{id}/unpublish` | Transition status to `CLOSED` |
| `GET` | `/api/v1/JobPosting/{id}/stages` | List ordered stages for job posting |
| `PUT` | `/api/v1/JobPosting/{id}/stages` | Reorder/update pipeline stages |
| `GET` | `/api/v1/Application` | List applications (`jobPostingId`, `stageId`, `status`, `search`) |
| `GET` | `/api/v1/Application/{id}` | Full application detail including `parsed_cv_json`, `extracted_text`, and documents |
| `POST` | `/api/v1/Application/{id}/move-stage` | Move application to target stage |
| `POST` | `/api/v1/Application/{id}/reject` | Mark application `REJECTED` with reason |
| `POST` | `/api/v1/Application/{id}/hire` | Mark application `HIRED`, set `hired_at`, and publish `candidate.hired` to Redis Streams |
| `GET` | `/api/v1/Application/{id}/documents/{docId}` | Authenticated CV file stream download (`X-Content-Type-Options: nosniff`) |
| `GET` | `/api/v1/Candidate` | Paginated talent pool directory |
| `GET` | `/api/v1/Candidate/{id}` | Candidate profile + application history |

## Webhooks

The HRIS supports webhooks for various events.

- **Sample Events**: `payroll.run.completed`, `leave.request.approved`, `employee.created`
- **Security**: Webhook payloads are signed using an HMAC SHA-256 signature provided in the `X-Webhook-Signature` header.
- **Retry Policy**: Exponential backoff retry up to 24 hours on delivery failure.
