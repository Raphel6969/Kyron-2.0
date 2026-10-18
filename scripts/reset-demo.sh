#!/usr/bin/env bash
# Kyron 2.0 — Automated Demo Reset (< 5s target)
set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

START_TIME=$(date +%s)

echo "=================================================="
echo "⚡ KYRON 2.0 — RESET DEMO STATE (< 5s target)"
echo "=================================================="

# 1. Clean transient sqlite db or test logs if in local dev
if [ -f "${ROOT_DIR}/control/app/kyron_dev.db" ]; then
    rm -f "${ROOT_DIR}/control/app/kyron_dev.db"
fi

# 2. Run Idempotent Seed Script
echo "--> Restoring pristine database state (35+ tools, policies, audit events)..."
python "${ROOT_DIR}/scripts/seed.py"

# 3. Clean transient test caches
rm -rf "${ROOT_DIR}/.pytest_cache" "${ROOT_DIR}/eval/__pycache__" 2>/dev/null || true

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "=================================================="
echo "✅ DEMO STATE RESTORED IN ${DURATION}s (Target: < 5s)"
echo "=================================================="

if [ "$DURATION" -gt 5 ]; then
    echo "⚠️ Warning: Demo reset exceeded 5 seconds budget."
    exit 1
fi

exit 0
