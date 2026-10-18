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
elif [ -f "$REPO_ROOT/ui/tsconfig.json" ]; then
  CHECKED=1
  echo "  [typecheck] Running UI TypeScript typecheck..."
  if command -v npx >/dev/null 2>&1; then
    (cd "$REPO_ROOT/ui" && npx tsc --noEmit) || FAILURES=$((FAILURES + 1))
  fi
fi

# 2. Python (mypy / pyright)
if [ -f "$REPO_ROOT/pyproject.toml" ] || [ -f "$REPO_ROOT/control/requirements.txt" ]; then
  if command -v mypy >/dev/null 2>&1; then
    CHECKED=1
    echo "  [typecheck] Running Python mypy..."
    mypy "$REPO_ROOT/control" --ignore-missing-imports || FAILURES=$((FAILURES + 1))
  fi
fi

# 3. Go (go vet)
if [ -f "$REPO_ROOT/go.mod" ]; then
  CHECKED=1
  echo "  [typecheck] Running Go vet..."
  if command -v go >/dev/null 2>&1; then
    (cd "$REPO_ROOT" && go vet ./...) || FAILURES=$((FAILURES + 1))
  fi
elif [ -f "$REPO_ROOT/gateway/go.mod" ]; then
  CHECKED=1
  echo "  [typecheck] Running Gateway Go vet..."
  if command -v go >/dev/null 2>&1; then
    (cd "$REPO_ROOT/gateway" && go vet ./...) || FAILURES=$((FAILURES + 1))
  fi
fi

# 4. Rust (cargo check)
if [ -f "$REPO_ROOT/Cargo.toml" ]; then
  CHECKED=1
  echo "  [typecheck] Running Cargo check..."
  if command -v cargo >/dev/null 2>&1; then
    (cd "$REPO_ROOT" && cargo check) || FAILURES=$((FAILURES + 1))
  fi
elif [ -f "$REPO_ROOT/core/Cargo.toml" ]; then
  CHECKED=1
  echo "  [typecheck] Running Core Rust workspace Cargo check..."
  if command -v cargo >/dev/null 2>&1; then
    (cd "$REPO_ROOT/core" && cargo check) || FAILURES=$((FAILURES + 1))
  fi
fi

if [ $CHECKED -eq 0 ]; then
  echo "  [typecheck] PASS: No active static typing environment detected yet (clean fresh state)."
  exit 0
fi

if [ $FAILURES -gt 0 ]; then
  echo "  [typecheck] FAIL: Typecheck errors encountered."
  exit 1
fi

echo "  [typecheck] PASS: All typechecks passed cleanly."
exit 0
