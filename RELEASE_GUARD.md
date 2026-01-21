# Release Guard (AccuBooks)

This checklist is a **hard gate** for production promotion.

## Automated gates (must pass)

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run verify:contract-lock`
- `npm run verify:release-governance`
- `npm run verify:prod-readiness`
- `npm run verify:runtime-invariants`
- `npm run verify:security`
- `npm run verify:slo`
- `npm run verify:disaster-recovery`
- `npm run verify:enterprise-assurance`
- `npm run verify:public-trust`
- `npm run verify:release-guard`

## Manual gates (human review)

- Verify **no secrets** or customer PII are logged.
- Verify all production environment variables are configured.
- Verify rollback plan is present in `governance/release-declaration.json`.
- Verify recent deploy has stable error rate and acceptable latency.
