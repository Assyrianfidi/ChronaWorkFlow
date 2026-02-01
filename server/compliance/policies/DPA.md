# Data Processing Agreement (DPA)

Version: {{VERSION}}
Generated at: {{GENERATED_AT}}
Tenant: {{TENANT_ID}}

## Parties

- Controller/Customer: {{TENANT_ID}} (tenant)
- Processor: AccuBooks Platform

## Scope

This DPA applies to processing of Personal Data in the AccuBooks multi-tenant platform for the tenant identified above.

## Technical and Organizational Measures (TOMs)

The following controls are enforced in-system and auditable:

- Tenant isolation enforcement (runtime + tests)
- RBAC authorization (AuthorizationEngine)
- Immutable audit logging (ImmutableAuditLogger)
- Approval workflows for dangerous/destructive operations (ApprovalWorkflowManager)
- Retention and legal hold enforcement (ComplianceRetentionManager)
- Data export controls (TenantDataExportManager)
- Evidence collection and chain-of-custody (EvidenceStore / EvidenceSnapshots / AuditVault)

## Subprocessors (placeholder)

No subprocessors are declared in this deterministic template.

## Security Incident Notification

Incident handling is governed by the Incident Response Policy and is logged via immutable audit logging and evidence chains.

## Signatures (deterministic placeholder)

- Customer: __________________________
- AccuBooks: _________________________

This is a deterministic template and does not represent legal advice.
