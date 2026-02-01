# Security Policy

Version: {{VERSION}}
Generated at: {{GENERATED_AT}}
Tenant: {{TENANT_ID}}

## Principles

- Least privilege (RBAC)
- Strong tenant isolation
- Immutable auditability
- Approval for dangerous operations

## Enforcement Points (system-backed)

- Authorization decisions: `server/auth/authorization-engine.ts`
- Tenant isolation: `server/tenant/tenant-isolation.ts`
- Immutable audit logging: `server/compliance/immutable-audit-log.ts`
- Runtime compliance guards: `server/compliance/runtime-compliance-guards.ts`

## Logging & Monitoring

- Security-relevant actions are logged via the immutable audit logger.
- Evidence is recorded and can be snapshotted/exported for audits.

This is a deterministic template and does not represent legal advice.
