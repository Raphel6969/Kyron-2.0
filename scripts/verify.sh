#!/usr/bin/env bash
# Hack Engine — Fast Tier Verification Harness (< 30s)
# Must run and pass on EVERY commit.
# The exit code is the only accepted evidence.

set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

TOTAL_START=$(date +%s)
FAILED_CHECKS=()

echo "=================================================="
echo "⚡ HACK ENGINE — FAST TIER VERIFY (Target: <30s)"
echo "=================================================="

run_check() {
  local check_name="$1"
  local check_script="${SCRIPT_DIR}/checks/${check_name}.sh"
  
  if [ ! -f "$check_script" ]; then
    echo "⚠️  [SKIP] ${check_name}: check script not found at ${check_script}"
    return 0
  fi

  local start_time=$(date +%s)
  echo -n "⏳ [RUN]  ${check_name}... "
  
  local output
  output=$(bash "$check_script" 2>&1)
  local status=$?
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))

  if [ $status -eq 0 ]; then
    echo "✅ PASS (${duration}s)"
    if [ -n "$VERBOSE" ] && [ -n "$output" ]; then
      echo "$output" | sed 's/^/    /'
    fi
  else
    echo "❌ FAIL (${duration}s)"
    echo "--------------------------------------------------"
    echo "$output" | sed 's/^/    /'
    echo "--------------------------------------------------"
    FAILED_CHECKS+=("$check_name")
  fi
}

# Fast tier check sequence
run_check "state-lint"
run_check "typecheck"
run_check "lint"
run_check "test-unit"
run_check "ui-audit"
run_check "ux-gate"
run_check "hardening-gate"
run_check "test-e2e"

TOTAL_END=$(date +%s)
TOTAL_DURATION=$((TOTAL_END - TOTAL_START))

echo "=================================================="
if [ ${#FAILED_CHECKS[@]} -eq 0 ]; then
  echo "🎉 ALL FAST-TIER CHECKS PASSED in ${TOTAL_DURATION}s"
  echo "=================================================="
  exit 0
else
  echo "💥 FAST-TIER VERIFY FAILED in ${TOTAL_DURATION}s"
  echo "Failed checks: ${FAILED_CHECKS[*]}"
  echo "Fix the failures before committing. Exit code is 1."
  echo "=================================================="
  exit 1
fi
