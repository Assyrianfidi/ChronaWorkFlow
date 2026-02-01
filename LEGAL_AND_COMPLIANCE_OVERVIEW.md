# Legal & Compliance Overview (System-Backed)

This document summarizes the AccuBooks legal/compliance artifacts and the system enforcement points that back them.

## What is system-backed

AccuBooks compliance artifacts and controls are tied to real enforcement points and audit trails:

- Tenant isolation enforcement
- RBAC authorization decisions
- Immutable audit logging (hash chained)
- Approval workflows for dangerous operations
- Retention + legal holds
- Data rights workflows (export/rectify/erase safeguards)
- Evidence chain, snapshots, export bundles
- Auditor scoped read-only access

## Policy artifacts

Policy artifacts are templates stored under `server/compliance/policies/` and can be generated into versioned artifacts with integrity hashes using `server/compliance/policy-engine.ts`.

Policies:

- DPA: `server/compliance/policies/DPA.md`
- Privacy Policy: `server/compliance/policies/PRIVACY_POLICY.md`
- Security Policy: `server/compliance/policies/SECURITY_POLICY.md`
- Incident Response Policy: `server/compliance/policies/INCIDENT_RESPONSE_POLICY.md`
- Access Control Policy: `server/compliance/policies/ACCESS_CONTROL_POLICY.md`

## Evidence handling for audits

Evidence sources include:

- Immutable audit log (`server/compliance/immutable-audit-log.ts`)
- Evidence store + snapshots + exports (`server/compliance/evidence-store.ts`, `server/compliance/evidence-snapshots.ts`, `server/compliance/evidence-export.ts`)
- Audit vault (`server/compliance/audit-vault.ts`)

Evidence is tenant-scoped and integrity-protected via cryptographic hashes.

## Data rights and retention

- Data rights engine: `server/compliance/data-rights-engine.ts`
- Retention & legal hold: `server/compliance/retention-legal-hold.ts`
- Export workflow: `server/compliance/tenant-data-export.ts`

Erasure requests can be blocked when retention or legal holds apply.

## Deterministic placeholders

This repository includes deterministic placeholders where external certification artifacts, signatures, or legal approvals would normally be required.

- Signature fields in policy templates are placeholders
- Control mappings are deterministic and require legal/compliance review for final wording

This is not legal advice.
