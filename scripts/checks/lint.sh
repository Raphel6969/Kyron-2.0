#!/usr/bin/env bash
# lint.sh — Stack-agnostic lint shim
# Checks code formatting and syntax standards across all active runtimes.

set -o pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

CHECKED=0
FAILURES=0

# 1. Python (Ruff / Flake8)
if command -v ruff >/dev/null 2>&1 && { [ -f "$REPO_ROOT/pyproject.toml" ] || [ -d "$REPO_ROOT/control" ]; }; then
  CHECKED=1
  echo "  [lint] Running Python ruff check..."
  ruff check "$REPO_ROOT/control" || FAILURES=$((FAILURES + 1))
fi

# 2. JavaScript / TypeScript (ESLint)
if [ -f "$REPO_ROOT/package.json" ] || [ -f "$REPO_ROOT/ui/package.json" ]; then
  if [ -f "$REPO_ROOT/node_modules/.bin/eslint" ]; then
    CHECKED=1
    echo "  [lint] Running ESLint..."
    "$REPO_ROOT/node_modules/.bin/eslint" . || FAILURES=$((FAILURES + 1))
  elif [ -f "$REPO_ROOT/ui/node_modules/.bin/eslint" ]; then
    CHECKED=1
    echo "  [lint] Running UI ESLint..."
    (cd "$REPO_ROOT/ui" && ./node_modules/.bin/eslint .) || FAILURES=$((FAILURES + 1))
  fi
fi

# 3. Go (gofmt / golangci-lint)
if [ -f "$REPO_ROOT/go.mod" ] || [ -f "$REPO_ROOT/gateway/go.mod" ]; then
  if command -v gofmt >/dev/null 2>&1; then
    CHECKED=1
    echo "  [lint] Checking gofmt formatting..."
    DIFFS=$(gofmt -l "$REPO_ROOT/gateway" 2>/dev/null | grep -v "vendor/" || true)
    if [ -n "$DIFFS" ]; then
      echo "  [lint] Unformatted Go files:"
      echo "$DIFFS"
      FAILURES=$((FAILURES + 1))
    fi
  fi
fi

# 4. Rust (clippy)
if [ -f "$REPO_ROOT/Cargo.toml" ] && command -v cargo >/dev/null 2>&1; then
  CHECKED=1
  echo "  [lint] Checking Rust clippy..."
  (cd "$REPO_ROOT" && cargo clippy -- -D warnings) || FAILURES=$((FAILURES + 1))
elif [ -f "$REPO_ROOT/core/Cargo.toml" ] && command -v cargo >/dev/null 2>&1; then
  CHECKED=1
  echo "  [lint] Checking Core Rust clippy..."
  (cd "$REPO_ROOT/core" && cargo clippy -- -D warnings) || FAILURES=$((FAILURES + 1))
fi

if [ $CHECKED -eq 0 ]; then
  echo "  [lint] PASS: No active linter runtime detected yet (clean fresh state)."
  exit 0
fi

if [ $FAILURES -gt 0 ]; then
  echo "  [lint] FAIL: Lint errors encountered."
  exit 1
fi

echo "  [lint] PASS: All lint checks passed."
exit 0
