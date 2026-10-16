# Event-Driven Architecture

## Architecture Overview
The system uses **Kafka** (primary) as the event bus to facilitate communication between domains. Events are used to notify state changes such as employee creation, payroll run completion, or attendance ingestion.

## Standard Event Envelope
All events follow a standard envelope schema containing metadata and a flexible data payload.

- `tenant_id`: Mandatory for multi-tenant isolation.
- `entity_id`: The specific entity related to the event.
- `correlation_id`: For distributed tracing.
- `causation_id`: ID of the event that caused this event.
- `version`: Event schema version.
- `data`: The actual payload of the event.

## Schema Validation & Compatibility
- **Format**: Avro or JSON Schema.
- **Rules**: Producers must publish events for state changes. Consumers must be tolerant of new fields in the `data` payload to ensure forward compatibility.

## Event Catalog (Examples)
- `employee.created`
- `employee.updated`
- `employee.terminated`
- `candidate.applied`
- `candidate.cv.uploaded`
- `candidate.cv.parsed`
- `candidate.cv.failed`
- `candidate.cv.dlq`
- `candidate.hired`
- `onboarding.started`
- `onboarding.completed`
- `offboarding.started`
- `offboarding.completed`
- `attendance.event.ingested`
- `timesheet.updated`
- `leave.request.created`
- `leave.request.approved`
- `leave.balance.updated`
- `payroll.run.started`
- `payroll.run.completed`
- `payslip.generated`
- `claim.submitted`
- `claim.approved`
- `goal.created`
- `review.completed`
- `course.completed`
- `expense.submitted`
- `expense.approved`
- `asset.assigned`
- `asset.returned`
- `announcement.published`
- `notification.sent`
- `external.sync.success`
- `external.sync.fail`
- `config.updated`

## Redis Streams Transport (Recruitment / ATS & AI Worker)

In local and single-node deployments, durable asynchronous workflows between `hris-recruitment-be` (`.NET 9`) and `hris-ai-service` (`Python 3.12 / FastAPI`) use **Redis Streams** (`XADD`, `XREADGROUP`, `XAUTOCLAIM`, `XACK`) on `redis:7-alpine`:

| Stream Key | Producer | Consumer Group | Purpose |
|---|---|---|---|
| `candidate.cv.uploaded` | `hris-recruitment-be` | `cv-parser` (`apps/ai`) | Notifies AI worker that a candidate CV has been persisted to shared storage (`/cv-data`) |
| `candidate.cv.parsed` | `apps/ai` (`CvStreamWorker`) | `recruitment-be` | Returns structured `parsedJson`, `extractedText`, and `confidence` score |
| `candidate.cv.failed` | `apps/ai` (`CvStreamWorker`) | `recruitment-be` | Marks document parse status `FAILED` with `errorCode` and `attempt` |
| `candidate.cv.dlq` | `apps/ai` (`CvStreamWorker`) | Ops / Dead-Letter | Dead-letter stream after 3 failed processing attempts |
| `candidate.hired` | `hris-recruitment-be` | `onboarding-be` / `master-be` | Emitted when an application transitions to `HIRED` to trigger employee onboarding |

## Sample Event Payload

```json
{
  "id": "evt_01HXYZ...",
  "type": "payroll.run.completed",
  "occurred_at": "2025-09-01T02:00:00Z",
  "tenant_id": "...",
  "entity_id": "...",
  "data": {
    "run_id": "...",
    "pay_group_id": "...",
    "employees": 4987,
    "gross": 12345678900,
    "net": 9876543200
  }
}
```
