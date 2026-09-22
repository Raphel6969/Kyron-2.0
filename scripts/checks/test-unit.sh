#!/usr/bin/env bash
# test-unit.sh — Stack-agnostic unit test runner shim
# The exit code is the only accepted evidence.

set -o pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

TESTS_RAN=0
FAILURES=0

# 1. Python (pytest)
if command -v pytest >/dev/null 2>&1; then
  if [ -d "$REPO_ROOT/tests" ] || [ -d "$REPO_ROOT/backend/tests" ]; then
    TESTS_RAN=1
    echo "  [test-unit] Running Python pytest..."
    pytest "$REPO_ROOT" -v || FAILURES=$((FAILURES + 1))
  fi
fi

# 2. Node / JS (Node native test runner or npm test)
if [ -f "$REPO_ROOT/package.json" ]; then
  TESTS_RAN=1
  echo "  [test-unit] Running Node test suite..."
  (cd "$REPO_ROOT" && npm test) || FAILURES=$((FAILURES + 1))
elif [ -f "$REPO_ROOT/backend/package.json" ]; then
  TESTS_RAN=1
  echo "  [test-unit] Running Backend Node test suite..."
  (cd "$REPO_ROOT/backend" && npm test) || FAILURES=$((FAILURES + 1))
fi

# 3. Go (go test)
if [ -f "$REPO_ROOT/go.mod" ] && command -v go >/dev/null 2>&1; then
  TESTS_RAN=1
  echo "  [test-unit] Running Go unit tests..."
  (cd "$REPO_ROOT" && go test -v ./...) || FAILURES=$((FAILURES + 1))
elif [ -f "$REPO_ROOT/backend/go.mod" ] && command -v go >/dev/null 2>&1; then
  TESTS_RAN=1
  echo "  [test-unit] Running Backend Go unit tests..."
  (cd "$REPO_ROOT/backend" && go test -v ./...) || FAILURES=$((FAILURES + 1))
fi

# 4. Rust (cargo test)
if [ -f "$REPO_ROOT/Cargo.toml" ] && command -v cargo >/dev/null 2>&1; then
  TESTS_RAN=1
  echo "  [test-unit] Running Cargo test..."
  (cd "$REPO_ROOT" && cargo test) || FAILURES=$((FAILURES + 1))
fi

if [ $TESTS_RAN -eq 0 ]; then
  echo "  [test-unit] PASS: No unit tests declared yet (scaffolding stage)."
  exit 0
fi

if [ $FAILURES -gt 0 ]; then
  echo "  [test-unit] FAIL: Unit test assertions failed."
  exit 1
fi

echo "  [test-unit] PASS: All unit tests passed."
exit 0
