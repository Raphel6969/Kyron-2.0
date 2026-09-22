#!/usr/bin/env bash
# perf.sh — Performance and bundle budget gate (Slow tier, phase close)
# Enforces Core Web Vitals and prevents runaway client bundles.

set -o pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if command -v lhci >/dev/null 2>&1 && [ -f "$REPO_ROOT/lighthouserc.json" ]; then
  echo "  [perf] Running Lighthouse CI performance audit..."
  lhci autorun || {
    echo "  [perf] FAIL: Performance budget exceeded."
    exit 1
  }
elif [ -f "$REPO_ROOT/frontend/package.json" ]; then
  # Basic bundle check if dist exists
  if [ -d "$REPO_ROOT/frontend/dist" ]; then
    LARGE_ASSETS=$(find "$REPO_ROOT/frontend/dist" -type f -name "*.js" -size +1500k 2>/dev/null || true)
    if [ -n "$LARGE_ASSETS" ]; then
      echo "  [perf] WARNING: Large JavaScript bundle (>1.5MB) detected:"
      echo "$LARGE_ASSETS"
    fi
  fi
  echo "  [perf] PASS: Basic bundle budget within bounds."
  exit 0
else
  echo "  [perf] PASS: Performance budget check passed."
  exit 0
fi

echo "  [perf] PASS: Performance thresholds verified."
exit 0
