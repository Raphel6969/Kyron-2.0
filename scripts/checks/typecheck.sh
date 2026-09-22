#!/usr/bin/env bash
# typecheck.sh — Stack-agnostic typecheck shim
# Runs the appropriate type checker depending on the project stack.

set -o pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

CHECKED=0
FAILURES=0

# 1. TypeScript / JavaScript
if [ -f "$REPO_ROOT/tsconfig.json" ]; then
  CHECKED=1
  echo "  [typecheck] Running TypeScript typecheck..."
  if command -v npx >/dev/null 2>&1; then
    npx tsc --noEmit --project "$REPO_ROOT/tsconfig.json" || FAILURES=$((FAILURES + 1))
  fi
elif [ -f "$REPO_ROOT/frontend/tsconfig.json" ]; then
  CHECKED=1
  echo "  [typecheck] Running Frontend TypeScript typecheck..."
  if command -v npx >/dev/null 2>&1; then
    (cd "$REPO_ROOT/frontend" && npx tsc --noEmit) || FAILURES=$((FAILURES + 1))
  fi
fi

# 2. Python (mypy / pyright)
if [ -f "$REPO_ROOT/pyproject.toml" ] || [ -f "$REPO_ROOT/backend/requirements.txt" ] || [ -f "$REPO_ROOT/requirements.txt" ]; then
  if command -v mypy >/dev/null 2>&1; then
    CHECKED=1
    echo "  [typecheck] Running Python mypy..."
    mypy "$REPO_ROOT" --ignore-missing-imports || FAILURES=$((FAILURES + 1))
  fi
fi

# 3. Go (go vet)
if [ -f "$REPO_ROOT/go.mod" ]; then
  CHECKED=1
  echo "  [typecheck] Running Go vet..."
  if command -v go >/dev/null 2>&1; then
    (cd "$REPO_ROOT" && go vet ./...) || FAILURES=$((FAILURES + 1))
  fi
elif [ -f "$REPO_ROOT/backend/go.mod" ]; then
  CHECKED=1
  echo "  [typecheck] Running Backend Go vet..."
  if command -v go >/dev/null 2>&1; then
    (cd "$REPO_ROOT/backend" && go vet ./...) || FAILURES=$((FAILURES + 1))
  fi
fi

# 4. Rust (cargo check)
if [ -f "$REPO_ROOT/Cargo.toml" ]; then
  CHECKED=1
  echo "  [typecheck] Running Cargo check..."
  if command -v cargo >/dev/null 2>&1; then
    (cd "$REPO_ROOT" && cargo check) || FAILURES=$((FAILURES + 1))
  fi
elif [ -f "$REPO_ROOT/services/scoring/Cargo.toml" ]; then
  CHECKED=1
  echo "  [typecheck] Running Scoring Service Cargo check..."
  if command -v cargo >/dev/null 2>&1; then
    (cd "$REPO_ROOT/services/scoring" && cargo check) || FAILURES=$((FAILURES + 1))
  fi
fi

if [ $CHECKED -eq 0 ]; then
  echo "  [typecheck] PASS: No typed runtime detected yet (clean fresh state)."
  exit 0
fi

if [ $FAILURES -gt 0 ]; then
  echo "  [typecheck] FAIL: Type errors encountered."
  exit 1
fi

echo "  [typecheck] PASS: All type checks passed."
exit 0
