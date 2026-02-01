# Access Control Policy

Version: {{VERSION}}
Generated at: {{GENERATED_AT}}
Tenant: {{TENANT_ID}}

## RBAC

- All authorization must go through the AuthorizationEngine.
- Permissions are tenant-scoped and enforced with immutable audit logging.

## Auditor Access

- External auditors are provisioned as read-only, scoped sessions.
- Auditor activity is audited and evidence-exportable.

This is a deterministic template and does not represent legal advice.
