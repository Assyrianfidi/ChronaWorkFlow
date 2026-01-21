# Artifact Policy (Generated / Binary / Non-Reproducible)

## Default rule
Only **human-authored source files** are allowed to be tracked or staged in git by default.

Any file matching the denylist below being **tracked** or **staged** is a **CI-blocking governance violation**.

## Denylist (forbidden if tracked or staged)
The following patterns are forbidden to be tracked or staged:

<!-- BEGIN DENYLIST -->
```
generated/prisma/**
client/generated/prisma/**
**/*.tsbuildinfo
**/*.dll.node
**/*.wasm
**/*.zip
dist/
client/dist/
backend/dist/**
coverage/**
.next/**
logs/**
**/*.log
phase2_reports/**
phase3_reports/**
devops/backups/**
```
<!-- END DENYLIST -->

## Allowlist (exact paths, no wildcards)
Governance-controlled files that are allowed to be tracked or staged **must be named exactly** below.

<!-- BEGIN ALLOWLIST -->
```
governance/artifact-policy.md
governance/test-performance-snapshot.json
```
<!-- END ALLOWLIST -->

## Rationale
- Denylisted paths are generated outputs, binaries, build products, logs, reports, or backups that are not reproducible across machines, OS/arch, tool versions, or time.
- Governance allowlisted files are explicitly reviewed, intentionally committed artifacts used for governance enforcement and baselining.
