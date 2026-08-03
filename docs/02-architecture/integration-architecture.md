# Integration Architecture

## Identity & SSO
- **Protocols**: OIDC (Authorization Code + PKCE), SAML 2.0
- **Provisioning**: SCIM 2.0
- **Required Attributes**: `email`, `name`, `roles`, `entity_ids`

## Attendance Device Gateway
- **Protocol**: HTTPS push from gateway to API (`/devices/events`)
- **Batching**: Max 500 events per batch
- **Supported Devices**: ZKTeco, Hikvision
- **Event Schema**: `{ device_id, employee_identifier, type, occurred_at, confidence }`
- **Idempotency**: Deduplication via hashing `device_id + timestamp + employee_identifier`

## Banking Integrations
Generator for bank files based on specific bank formats. Validations for checksum and field length are applied.
- **BCA**: TXT format
- **Mandiri**: CSV format
- **BNI**: CSV format
- **Fields**: account number, name, amount, reference, description

## E-Signature
- **Providers**: PrivyID, DocuSign
- **Flow**: OAuth + template mapping
- **Webhooks**: Callback for status updates (`signed`, `declined`, `expired`)

## Accounting Integrations
- **Functionality**: General Ledger (GL) posting (debit/credit per account code) with payslip references.
- **Export Formats**: CSV / JSON
- **Adapters**: Jurnal, Accurate, Xero, NetSuite

## Webhook Specifications
- **Examples**: `payroll.run.completed`, `leave.request.approved`, `employee.created`
- **Security**: HMAC SHA-256 signature provided in the `X-Webhook-Signature` header.
- **Retry Policy**: Exponential backoff retry up to 24 hours.
