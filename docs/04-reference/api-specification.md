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

## Webhooks

The HRIS supports webhooks for various events.

- **Sample Events**: `payroll.run.completed`, `leave.request.approved`, `employee.created`
- **Security**: Webhook payloads are signed using an HMAC SHA-256 signature provided in the `X-Webhook-Signature` header.
- **Retry Policy**: Exponential backoff retry up to 24 hours on delivery failure.
