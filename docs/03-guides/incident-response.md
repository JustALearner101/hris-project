# Incident Response & Security

This document details the incident response plan and security operations.

## IR Triage Flow
1. **Detection**: Detect anomaly or alert -> Create an incident ticket (Jira/ServiceNow) with severity.
2. **Triage**: Triaged by on-call security and infrastructure teams.
3. **Containment**: Isolate service, revoke keys, or block malicious IPs.
4. **Eradication & Recovery**: Patch vulnerabilities, redeploy, or restore from backups.
5. **Post-mortem**: Conduct a post-mortem review and document lessons learned.

## Communication
* **Internal**: Use predefined notification templates for internal stakeholders.
* **Regulatory**: For data breaches involving personal data, Legal and Compliance teams coordinate external disclosure in accordance with regulations (e.g., UU PDP).

## Data Leak Playbook (Example)
1. Immediately revoke compromised credentials (service and user).
2. Rotate KMS keys if a key compromise is suspected.
3. Snapshot forensic logs; escalate to external forensics if necessary.
4. Notify affected tenants and regulators within the required timeframe.

## Security Pre-Release Checklist (Payroll Changes)
* [ ] Security code review by security owner.
* [ ] SAST & dependency scan passing (green).
* [ ] DAST on staging successful (no critical findings).
* [ ] Dry-run payroll simulation & reconciliation signed off by Finance.
* [ ] Backup & snapshot complete.
* [ ] Feature flags available for safe rollback.

## Runbook Templates
* **Incident Report Template**: Timestamp, impact, root cause, remediation steps.
* **Security Change Request Form**.
* **Emergency Contact List**: Security, infrastructure, legal, finance teams.
