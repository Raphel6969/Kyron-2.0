#!/usr/bin/env bash
# hardening-gate.sh — Implementation security & production resilience gate
# Run on EVERY commit. Fails build if secrets, fake stores, or deferred security are found.
# Motivated by Sentinel, Nexus, Aloorithm, and Orcheon lessons.

set -o pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

FAILURES=0

# 1. Motivated by Sentinel, Dossier, Aloorithm: Committed SQLite binary files
COMMITTED_DBS=$(find "$REPO_ROOT" -name "*.db" -not -path "*/tests/*" -not -path "*/.venv/*" -not -path "*/node_modules/*" 2>/dev/null || true)
if [ -n "$COMMITTED_DBS" ]; then
  echo "  [hardening-gate] FAIL: Committed .db file found outside tests/:"
  echo "$COMMITTED_DBS" | sed 's/^/    /'
  echo "  SQLite cannot be the production store. Use PostgreSQL."
  FAILURES=$((FAILURES + 1))
fi

# 2. Motivated by Sentinel: sqlite:/// in .env.example
if [ -f "$REPO_ROOT/.env.example" ]; then
  if grep -q "sqlite:///" "$REPO_ROOT/.env.example"; then
    echo "  [hardening-gate] FAIL: sqlite:/// URL found in .env.example. Use postgres:// for all environments."
    FAILURES=$((FAILURES + 1))
  fi
fi

# 3. Motivated by Nexus: Hardcoded demo UUIDs in client/application source
HARDCODED_UUIDS=$(rg -n "00000000-0000-0000-0000-000000000001" "$REPO_ROOT/src" "$REPO_ROOT/frontend" "$REPO_ROOT/backend" --glob='!*.test.*' --glob='!*.spec.*' 2>/dev/null || true)
if [ -n "$HARDCODED_UUIDS" ]; then
  echo "  [hardening-gate] FAIL: Hardcoded demo UUID detected in source files. Auth must be real and server-verified:"
  echo "$HARDCODED_UUIDS" | head -n 5 | sed 's/^/    /'
  FAILURES=$((FAILURES + 1))
fi

# 4. Motivated by Sentinel & Nexus: localhost in DEMO.md
if [ -f "$REPO_ROOT/DEMO.md" ]; then
  if rg -q "http://localhost" "$REPO_ROOT/DEMO.md" 2>/dev/null; then
    echo "  [hardening-gate] FAIL: DEMO.md contains localhost reference. Live demos must run on deployed production URL."
    FAILURES=$((FAILURES + 1))
  fi
fi

# 5. Secrets hygiene: .env must never be tracked in git, .env.example must exist
if git -C "$REPO_ROOT" ls-files --error-unmatch "$REPO_ROOT/.env" >/dev/null 2>&1; then
  echo "  [hardening-gate] FAIL: .env file is tracked in git! Untrack immediately with git rm --cached .env"
  FAILURES=$((FAILURES + 1))
fi

# 6. /healthz endpoint verification if backend exists
if [ -d "$REPO_ROOT/backend" ] || [ -f "$REPO_ROOT/src/server.js" ] || [ -f "$REPO_ROOT/main.py" ]; then
  HAS_HEALTHZ=$(rg -n "/healthz|/health" "$REPO_ROOT/backend" "$REPO_ROOT/src" "$REPO_ROOT/app" 2>/dev/null || true)
  if [ -z "$HAS_HEALTHZ" ]; then
    echo "  [hardening-gate] FAIL: No /healthz endpoint found in backend source. A deep health check is mandatory."
    FAILURES=$((FAILURES + 1))
  fi
fi

# 7. Verification that 'make reset-demo' is supported
if [ -f "$REPO_ROOT/Makefile" ]; then
  if ! grep -q "^reset-demo:" "$REPO_ROOT/Makefile"; then
    echo "  [hardening-gate] FAIL: Makefile is missing 'reset-demo' target."
    FAILURES=$((FAILURES + 1))
  fi
fi

if [ $FAILURES -gt 0 ]; then
  echo "  [hardening-gate] FAIL: $FAILURES hardening failures detected. Cannot commit unhardened state."
  exit 1
fi

echo "  [hardening-gate] PASS: Production hardening criteria satisfied."
exit 0
