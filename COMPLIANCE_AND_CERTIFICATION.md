# STEP 10: Compliance, Legal Readiness & External Certification

This document describes AccuBooks STEP 10 compliance architecture and certification readiness.

## Scope

Frameworks covered by the STEP 10 control framework and evidence system:

- SOC 2 (Security, Availability, Confidentiality)
- ISO 27001 (Annex A mappings)
- GDPR
- CCPA
- SOX (financial audit and control expectations)

Outputs are deterministic and system-backed. No external auditor APIs, ML dependencies, or non-deterministic generators are required.

## Architecture Overview

### Control framework

- Control mappings are maintained in:
  - `server/compliance/control-mapping.json`
- Typed access and CI validation is implemented in:
  - `server/compliance/control-registry.ts`

### Runtime enforcement and monitoring

Existing enforcement components (system-backed):

- Tenant isolation: `server/tenant/tenant-isolation.ts`
- Authorization: `server/auth/authorization-engine.ts`
- Immutable audit logging: `server/compliance/immutable-audit-log.ts`
- Runtime compliance guards: `server/compliance/runtime-compliance-guards.ts`

### Evidence and audit readiness

Evidence chain-of-custody (tenant scoped):

- Evidence store (hash-chained): `server/compliance/evidence-store.ts`
- Evidence recorder: `server/compliance/evidence-engine.ts`
- Time-boxed snapshots: `server/compliance/evidence-snapshots.ts`
- Evidence export bundles: `server/compliance/evidence-export.ts`

Related existing modules:

- Audit vault: `server/compliance/audit-vault.ts`
- Evidence collector: `server/compliance/evidence-collector.ts`

### Data subject rights

- Data rights engine: `server/compliance/data-rights-engine.ts`
- Tenant export: `server/compliance/tenant-data-export.ts`
- Destructive actions approvals: `server/compliance/data-rights-approvals.ts`

### Policy artifacts

- Policy generator: `server/compliance/policy-engine.ts`
- Templates:
  - `server/compliance/policies/DPA.md`
  - `server/compliance/policies/PRIVACY_POLICY.md`
  - `server/compliance/policies/SECURITY_POLICY.md`
  - `server/compliance/policies/INCIDENT_RESPONSE_POLICY.md`
  - `server/compliance/policies/ACCESS_CONTROL_POLICY.md`

## CI Gates

STEP 10 adds a fail-fast compliance validation gate:

- Script: `scripts/ci-compliance-validation.sh`
- Tests: `server/compliance/compliance.test.ts`
- Output report: `reports/compliance-validation-report.json`

The CI workflow runs this gate in:

- `test` job
- `production-readiness` job

## Certification Readiness Checklist (deterministic)

### SOC 2 (Security/Availability/Confidentiality)

- Control registry present and mapped
- Immutable audit logging active
- RBAC + tenant isolation enforced
- Evidence chain + export bundle available
- Auditor access is read-only, scoped, audited

### ISO 27001

- Annex A mappings maintained in control registry
- Evidence sources recorded for controls
- Policies exist and are versioned with integrity hashes

### GDPR / CCPA

- Data subject rights workflows exist
- Erasure respects legal/financial retention safeguards
- Exports are tenant-isolated and audited

### SOX

- Audit logging and retention policies exist
- Dangerous operations are approval-gated
- Billing/export actions are auditable

## Readiness Level (current)

- SOC 2: **Ready for formal gap assessment** (controls, audit, evidence, and policies are system-backed; external auditor evidence requests can be satisfied with deterministic exports)
- ISO 27001: **Ready for formal ISMS/risk treatment workshop** (technical controls and mappings exist; requires organization/process ownership confirmation)
- GDPR/CCPA: **Operational baseline implemented** (rights workflows, export, retention/legal hold controls exist; requires legal sign-off for policy language)
- SOX: **ITGC foundation implemented** (auditability/retention/approvals exist; requires accounting policy alignment for revenue recognition procedures)
