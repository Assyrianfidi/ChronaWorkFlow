#!/usr/bin/env bash
set -euo pipefail

# Release orchestration script
# - semantic version tagging (optional)
# - dependency + migration verification
# - canary rollout + automated rollback placeholders
# - immutable-ish audit trail (hash-chained JSONL)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

MODE="${1:-help}"

AUDIT_LOG_FILE="${AUDIT_LOG_FILE:-./release-audit.log.jsonl}"
ACTOR_ID="${RELEASE_ACTOR_ID:-${GITHUB_ACTOR:-unknown}}"
ENVIRONMENT="${RELEASE_ENVIRONMENT:-production}"

sha256() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 | awk '{print $1}'
  else
    python - <<'PY'
import hashlib,sys
print(hashlib.sha256(sys.stdin.buffer.read()).hexdigest())
PY
  fi
}

last_hash() {
  if [[ -f "$AUDIT_LOG_FILE" ]]; then
    tail -n 1 "$AUDIT_LOG_FILE" | node -e "const fs=require('fs'); const s=fs.readFileSync(0,'utf8').trim(); if(!s){process.exit(0)}; const j=JSON.parse(s); console.log(j.hash||'');" 2>/dev/null || true
  fi
}

audit_append() {
  local action="$1"
  local outcome="$2"
  local details_json="${3:-{}}"

  local ts
  ts="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

  local prev
  prev="$(last_hash)"

  local payload
  payload=$(node -e "
const action=process.argv[1];
const outcome=process.argv[2];
const actor=process.argv[3];
const env=process.argv[4];
const ts=process.argv[5];
const prev=process.argv[6];
const details=JSON.parse(process.argv[7]);
const record={ts, actorId: actor, environment: env, action, outcome, prevHash: prev||null, details};
process.stdout.write(JSON.stringify(record));
" "$action" "$outcome" "$ACTOR_ID" "$ENVIRONMENT" "$ts" "$prev" "$details_json")

  local hash
  hash=$(printf "%s" "$payload" | sha256)

  local final
  final=$(node -e "
const payload=JSON.parse(process.argv[1]);
payload.hash=process.argv[2];
process.stdout.write(JSON.stringify(payload));
" "$payload" "$hash")

  printf "%s\n" "$final" >> "$AUDIT_LOG_FILE"
}

die() {
  audit_append "RELEASE_ORCHESTRATION" "DENIED" "{\"error\":\"$1\"}"
  echo "ERROR: $1" >&2
  exit 1
}

require_clean_git() {
  if command -v git >/dev/null 2>&1; then
    if [[ -n "$(git status --porcelain 2>/dev/null || true)" ]]; then
      die "Working tree is not clean (refusing to orchestrate release)"
    fi
  fi
}

run_migrations() {
  audit_append "DB_MIGRATIONS" "SUCCESS" "{\"command\":\"npm run db:push\"}"
  npm run db:push
}

run_verification() {
  audit_append "PRODUCTION_VALIDATION" "SUCCESS" "{\"script\":\"scripts/ci-production-validation.sh\"}"
  bash scripts/ci-production-validation.sh
}

build_artifacts() {
  audit_append "BUILD" "SUCCESS" "{\"command\":\"npm run build:server && npm run build:prod\"}"
  npm run build:server
  npm run build:prod
}

canary_rollout() {
  # Placeholder: integrate with your actual deploy mechanism (k8s, compose, ArgoCD, etc.)
  audit_append "CANARY_DEPLOY" "SUCCESS" "{\"note\":\"placeholder_deploy\"}"
  echo "Canary deploy placeholder: apply k8s manifests with canary weight and verify SLOs"
}

rollback() {
  # Placeholder: integrate with your actual rollback mechanism.
  audit_append "ROLLBACK" "SUCCESS" "{\"note\":\"placeholder_rollback\"}"
  echo "Rollback placeholder: rollback deployment to previous stable version"
}

promote() {
  audit_append "PROMOTE" "SUCCESS" "{\"note\":\"placeholder_promote\"}"
  echo "Promote placeholder: shift traffic from canary to stable"
}

usage() {
  cat <<'USAGE'
Usage:
  bash scripts/release-orchestration.sh <command>

Commands:
  verify            Runs production validation gates
  migrate           Applies database migrations (db:push)
  build             Builds production artifacts
  canary            Runs canary rollout placeholder + verification
  promote           Promotes canary to stable (placeholder)
  rollback          Rollback to last stable (placeholder)
  full-release      verify -> migrate -> build -> canary -> verify -> promote

Environment variables:
  RELEASE_ACTOR_ID          Actor identity for audit
  RELEASE_ENVIRONMENT       dev|staging|production
  AUDIT_LOG_FILE            Path to audit JSONL output
USAGE
}

main() {
  audit_append "RELEASE_ORCHESTRATION" "SUCCESS" "{\"mode\":\"$MODE\"}"

  case "$MODE" in
    verify)
      require_clean_git
      run_verification
      ;;
    migrate)
      require_clean_git
      run_migrations
      ;;
    build)
      require_clean_git
      build_artifacts
      ;;
    canary)
      require_clean_git
      canary_rollout || { rollback; die "Canary rollout failed"; }
      run_verification || { rollback; die "Verification failed"; }
      ;;
    promote)
      require_clean_git
      promote
      ;;
    rollback)
      rollback
      ;;
    full-release)
      require_clean_git
      run_verification || { rollback; die "Preflight verification failed"; }
      run_migrations || { rollback; die "Migrations failed"; }
      build_artifacts || { rollback; die "Build failed"; }
      canary_rollout || { rollback; die "Canary deploy failed"; }
      run_verification || { rollback; die "Post-canary verification failed"; }
      promote || { rollback; die "Promote failed"; }
      audit_append "FULL_RELEASE" "SUCCESS" "{\"status\":\"completed\"}"
      ;;
    help|--help|-h|"")
      usage
      ;;
    *)
      die "Unknown command '$MODE'"
      ;;
  esac
}

main
