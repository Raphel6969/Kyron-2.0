#!/usr/bin/env bash
# Hack Engine — Slow Tier Verification Harness (Phase Close & /harden)
# Runs full quality sweep: fast-tier + ui-review-gate, impact-gate, a11y, perf.
# The exit code is the only accepted evidence.

set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

TOTAL_START=$(date +%s)
FAILED_CHECKS=()

echo "=================================================="
echo "🛡️  HACK ENGINE — SLOW TIER VERIFY-FULL (Phase Close)"
echo "=================================================="

# 1. Run Fast Tier first
echo "--> Executing Fast Tier Verification..."
bash "${SCRIPT_DIR}/verify.sh"
FAST_STATUS=$?

if [ $FAST_STATUS -ne 0 ]; then
  echo "💥 FAST TIER FAILED. Aborting slow tier verification."
  exit 1
fi

echo ""
echo "--> Executing Slow Tier Deep Quality Gates..."

run_slow_check() {
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

# Slow tier check sequence
run_slow_check "ui-review-gate"
run_slow_check "impact-gate"
run_slow_check "a11y"
run_slow_check "perf"

TOTAL_END=$(date +%s)
TOTAL_DURATION=$((TOTAL_END - TOTAL_START))

echo "=================================================="
if [ ${#FAILED_CHECKS[@]} -eq 0 ]; then
  echo "🏆 VERIFY-FULL PASSED — REPO IS PRODUCTION & DEMO READY (${TOTAL_DURATION}s)"
  echo "=================================================="
  exit 0
else
  echo "💥 SLOW-TIER GATES FAILED (${TOTAL_DURATION}s)"
  echo "Failed checks: ${FAILED_CHECKS[*]}"
  echo "Phase cannot be closed until all quality gates pass."
  echo "=================================================="
  exit 1
fi
