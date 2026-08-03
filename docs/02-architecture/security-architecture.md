# Security Architecture

## 1. Summary & Security Principles
**Target:** Sensitive data (NIK, NPWP, bank accounts, payslips, payroll computations) must be protected end-to-end.
**Design Principles:** Defense-in-depth, least privilege, zero trust, secure by default, auditable, and automatable.
**Scope:** Full stack—frontend (Next.js 14), backend (NestJS 10), DB (Postgres 16), cache (Redis 7), event bus (Kafka 3.7), identity (Keycloak 24), infra (Docker/K8s), storage (S3/MinIO), and CI/CD pipeline (GitHub Actions).

## 2. Threat Model

### 2.1 Critical Assets
- Employee master data (identity, NIK, NPWP)
- Payroll calculations & payslips
- Bank transfer files
- Audit logs & event stream
- Secrets (DB credentials, signing keys)

### 2.2 Threat Actors
- External attacker (credential stuffing, phishing)
- Malicious insider (privileged user mis-use)
- Supply chain compromise (dependency attack)
- Compromised CI pipeline
- Misconfigured infra (exposed S3, open DB port)

### 2.3 Main Attack Vectors
- API abuse (IDOR, broken auth)
- SQL/NoSQL injection / deserialization
- Cross-site scripting (XSS) & CSRF
- Compromised third-party libs or container images
- Lateral movement after host compromise

## 3. Governance & Roles
- **Data Owner**: CHRO / Finance — responsible for data classification & retention.
- **Security Owner**: Security Lead — policy, audit, pentest, incident response (IR).
- **Infra Owner**: DevOps — infrastructure configuration & operations.
- **App Owner**: Product/Engineering Team — implementation of app controls.
- **Compliance**: Legal — mapping regulations (UU PDP Indonesia, PDPA/GDPR if needed).
- **Routine Meetings**: Monthly security review + release gate meeting for financial modules (payroll).

## 4. Identity & Access (AuthN/AuthZ)

### 4.1 Identity Provider (IdP)
- Use **Keycloak v24** (dev/prod). Realms: `hris-prod` / `hris-dev`.
- Configuration: OIDC + SAML, client per application (`web`, `api`, `admin`), PKCE for public clients, confidential for backend.
- Enable MFA (TOTP & WebAuthn) for all admin & finance roles.

### 4.2 Authentication Policies
- **Password policy**: Min 12 chars, complexity, reject common passwords, temp lockout after 5 failed attempts, password history 5.
- **Token lifetimes**: Access token short (10–15m), refresh token rotate & one-time use, refresh token TTL 30d, revoked on logout.
- **Session revocation**: On role change or termination.

### 4.3 Authorization Model
- Implement initial RBAC + Policy-based (ABAC) via OPA/oso for complex rules (e.g., approval rules, payroll thresholds).
- Administrative & finance actions require elevated role + MFA.
- **Row-level access**: PostgreSQL RLS enforced per `tenant_id` & `entity_id` for multi-tenancy.

### 4.4 Service-to-Service Auth
- Mutual TLS between critical services (optional) or mTLS at gateway.
- Services identify via short-lived mTLS certs (SPIRE) or signed JWTs (Kubernetes service account tokens with limited scope).
- External integrations (banks, e-sign) use dedicated service accounts + IP allowlist + HMAC signing for webhooks.

## 5. Network & Perimeter Controls

### 5.1 Network Segmentation
- Separate networks: management, app, data plane.
- K8s namespaces per environment; network policies restricting pod-to-pod communication — deny by default.

### 5.2 Ingress & API Gateway
- All external traffic hits API Gateway (e.g., Kong/NGINX/Envoy) with WAF (ModSecurity rules + vendor ruleset).
- Terminate TLS at edge (TLS 1.3 preferred; fallback TLS 1.2 with strong ciphers).
- Enforce rate limiting, IP reputation filtering, and geo restrictions if needed.

### 5.3 Internal Communications
- Encrypt internal traffic using TLS; prefer mTLS for sensitive channels (DB proxy, kafka).
- Redis & Postgres are not exposed publicly; accessible only from app subnet/security group.

## 6. Data Protection & Encryption

### 6.1 Transport
- TLS 1.3 (recommended) or TLS 1.2+ with strong ciphers for all external & internal endpoints.
- HSTS & secure headers on web responses.

### 6.2 At-Rest
- **Object storage (S3/MinIO)**: Server-side encryption (SSE) with KMS keys.
- **Database**: Disk encryption and column/field encryption for PII (NIK, NPWP, account numbers) using application-level encryption or DB-level TDE.
- **Redis**: Enable AUTH and TLS. Do not store raw secrets; use tokens with short TTL.

### 6.3 Key Management
- Use KMS (Cloud KMS or HashiCorp Vault + HSM) for KMS key storage.
- **Rotation policy**: Rotate data-encryption keys yearly; envelope keys quarterly; credentials 30–90 days for CI/service accounts.
- Access governed by IAM roles & least privilege.

### 6.4 Field-Level Encryption
- Sensitive fields encrypted in the application layer before DB insert (e.g., AWS Encryption SDK or libsodium).
- Store ciphertext + KMS key metadata; restrict read access to app services with proper privileges.

## 7. Secrets Management
- Use **HashiCorp Vault** (recommended) or cloud secrets manager. Do NOT store secrets in repo or unencrypted env files.
- Use dynamic secrets (short-lived DB credentials) when possible.
- CI/CD: Use GitHub Actions encrypted secrets + HashiCorp Vault agent on runners for ephemeral credentials.
- Scan repos for accidental leaks (`git-secrets`) on pre-commit & in CI.

## 8. Application Security

### 8.1 Secure SDLC
- SAST (e.g., Semgrep/CodeQL) on PR.
- Dependency scanning (Snyk/Dependabot) automated.
- Container image scanning (Trivy) during build.
- DAST (OWASP ZAP) during staging.
- Security review for high-risk changes (payroll logic, crypto, integrator adapters).

### 8.2 Input Validation & Output Encoding
- Validate inputs server-side (`class-validator`/Zod) and sanitize outputs.
- Use parameterized queries via Prisma to prevent SQL injection.
- Escape & Content Security Policy (CSP) to reduce XSS risk.

### 8.3 Session & Cookie Security
- Cookies: `Secure`, `HttpOnly`, `SameSite=Strict` for session cookies.
- Token storage: In-memory or secure httpOnly cookie for web; avoid `localStorage` for sensitive tokens.

### 8.4 CSRF Protection
- Use double submit cookie or framework middleware. Protect state-changing endpoints.

### 8.5 Rate Limiting & Abuse Controls
- Global + per-user rate limits at API gateway; per-endpoint thresholds for sensitive flows (login, payroll simulate).
- Bot detection (device fingerprinting) and CAPTCHA for suspicious flows.

## 9. Infrastructure & Container Security

### 9.1 Image Build & Registry
- Use minimal base images (distroless/alpine slim).
- Reproducible builds; sign images (cosign).
- Private registry with RBAC; retention & immutable tags for prod images.

### 9.2 Kubernetes Hardening
- RBAC for K8s; least privilege for service accounts.
- Pod Security Admission: restrict privileged containers, `hostNetwork`, `hostPath`.
- Limit container capabilities; run as non-root.
- Resource quotas & limits; liveness/readiness probes.

### 9.3 IaC Security
- Scan Terraform with `tflint` & `tfsec`.
- Secrets never in state files; remote state with encryption & ACL.
- Code review required for infra changes.

## 10. Logging, Monitoring & SIEM

### 10.1 Log Collection
- Centralized logging (Loki/ELK) with structured JSON logs including `correlation_id`, `user_id`, `tenant_id`.
- Log levels: DEBUG (dev only), INFO, WARN, ERROR.
- Mask PII in logs (mask NIK, NPWP, full accounts) — never log full sensitive identifiers.

### 10.2 Retention & Integrity
- Retention: audit logs & payroll artifacts minimum 7 years (configurable).
- Immutable storage (WORM) for critical audit/payslip artifacts.
- Sign or checksum critical artifacts and store metadata.

### 10.3 Monitoring & Alerts
- Metrics in Prometheus; dashboards in Grafana.
- Alerts: high error rate, auth failure surge, migration failures, unusual export volumes.
- Integrate with PagerDuty/Opsgenie.

### 10.4 SIEM & Forensics
- Forward critical logs to SIEM (Splunk/ELK) for correlation & threat hunting.
- Keep forensic-quality logs (timestamps, immutable).

## 11. Event Bus & Data Integrity (Kafka)
- Use TLS + client auth for Kafka connections.
- ACL enforcement on topics.
- Schema registry (Avro/JSON Schema) with compatibility checks.
- Consumer offsets monitored; replay capability for downstream recovery.

## 12. Database Security (Postgres 16)
- Enforce network restrictions (private subnet, no public exposure).
- Use RLS policies for tenant enforcement.
- Principle of least privilege for DB users (read-only for analytics).
- Backup encryption & access control; PITR enabled.

## 13. Backup, DR & Business Continuity
- Daily encrypted backups + WAL shipping for PITR (RPO ≤ 15 minutes).
- DR region replication & documented RTO ≤ 1 hour.
- Quarterly restore drills with documented results.

## 14. Third-Party Integrations & Supply Chain
- Inventory third-party vendors.
- Contractual requirements: SOC2/ISO27001 evidence.
- External integrations use dedicated service accounts & IP allowlist.
- Dependency policy: approved registries, pinned versions, supply chain scanning.

## 15. Privacy, Data Minimization & Retention
- Data classification: PII, Sensitive PII, Financial.
- Retention policy: default 7 years for payroll & audit; configurable per tenant.
- Data subject rights process (view/export/delete) per UU PDP.

## 16. Penetration Testing & Validation
- Annual 3rd-party pentest (external & internal).
- Quarterly internal red-team (focus on payroll/exports).
- Remediation SLA: critical ≤ 7 days, high ≤ 30 days.

## 17. Secure Release & Change Management
- Security review checklist for PRs touching payroll/identity/crypto.
- Feature flags for risky changes; canary rollout with monitoring & auto-rollback.
- Pre-deployment backup & dry-run for payroll changes.

## 18. Incident Response (IR)

### 18.1 Triage Flow
1. Detection → create incident in tracker (Jira/ServiceNow) with severity.
2. Triage by on-call security + infra.
3. Containment (isolate service / revoke keys / block IPs).
4. Eradication & recovery (patch, redeploy, restore backups).
5. Post-mortem & lessons learned.

### 18.2 Communication
- Notification templates for internal stakeholders & regulators.
- For data breach: legal & compliance coordinate external disclosure per UU PDP.

### 18.3 IR Playbook (Data Leak Example)
- Immediately revoke compromised credentials.
- Rotate KMS keys if suspected compromise.
- Snapshot forensic logs; escalate to external forensics if needed.
- Notify affected tenants + regulator in required timeframe.

## 19. Acceptance Criteria & Security KPIs
- No critical OWASP vulnerabilities in prod.
- SAST/DAST pass gating on main merges.
- 0 secrets in repo (scan).
- MFA enabled for all admin & finance users.
- MTTD < 15 min; MTTR < 4 hours for critical.

## 20. Pre-Release Security Checklist (Required for Payroll)
- [ ] Code review by security owner.
- [ ] SAST & dependency scan green.
- [ ] DAST on staging successful (no critical).
- [ ] Dry-run payroll simulation & reconciliation signed by finance.
- [ ] Backup & snapshot complete.
- [ ] Feature flags available for rollback.

## 21. Runbook Templates & Artifacts
- Incident report template.
- Security change request form.
- Emergency contact list.

## 22. Technical Implementation & Config Samples
- **TLS**: Terminate with Let's Encrypt / ACM; modern ciphers; HTTP/2 & HSTS.
- **Cookie**: `Set-Cookie: session=...; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600`
- **CSP**: `Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-...'; object-src 'none'`
- **CORS**: Whitelist specific domains; do not use `*` for credentials.
- **Rate Limit**: 100 req/min per IP normal; 10 req/min for login with adaptive backoff.

## 23. Implementation Priority Roadmap
1. Secrets management (Vault) + CI integration.
2. Keycloak with MFA & RBAC mapping.
3. RLS + Prisma middleware for tenant enforcement.
4. Centralized logging & SIEM ingestion.
5. SAST/DAST in CI, container signing & image scanning.
6. Annual pentest + quarterly red team.

## 24. Documentation & Training
- Security policy documentation available for dev & ops.
- Annual security training for dev & onboarding for new hires.
- IR drill 2x a year.

## 25. Conclusion
This is a living document, reviewed every 6 months or after significant changes. Implementation will be managed via prioritized backlog tickets by DevOps & Security teams.
