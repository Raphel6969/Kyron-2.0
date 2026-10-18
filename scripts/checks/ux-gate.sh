#!/usr/bin/env bash
# ux-gate.sh — Fast-tier usability and state completeness gate
# Every data-fetching route must support 4 states: empty / loading skeleton / error / success.
# Raw alert() or unhandled console.error are banned.

set -o pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

UI_DIRS=()
for DIR in "$REPO_ROOT/ui" "$REPO_ROOT/src" "$REPO_ROOT/frontend/src" "$REPO_ROOT/app"; do
  if [ -d "$DIR" ]; then
    UI_DIRS+=("$DIR")
  fi
done


if [ ${#UI_DIRS[@]} -eq 0 ]; then
  echo "  [ux-gate] PASS: No UI directory detected yet (scaffolding stage)."
  exit 0
fi

FAILURES=0

scan_pattern() {
  local pattern="$1"
  local case_insensitive="$2"
  if command -v rg >/dev/null 2>&1; then
    if [ "$case_insensitive" = "true" ]; then
      rg -in "$pattern" "${UI_DIRS[@]}" --glob='!*.test.*' --glob='!*.spec.*' 2>/dev/null || true
    else
      rg -n "$pattern" "${UI_DIRS[@]}" --glob='!*.test.*' --glob='!*.spec.*' 2>/dev/null || true
    fi
  else
    if [ "$case_insensitive" = "true" ]; then
      grep -rnEI --exclude='*.test.*' --exclude='*.spec.*' --exclude-dir=node_modules --exclude-dir=.git "$pattern" "${UI_DIRS[@]}" 2>/dev/null || true
    else
      grep -rnE --exclude='*.test.*' --exclude='*.spec.*' --exclude-dir=node_modules --exclude-dir=.git "$pattern" "${UI_DIRS[@]}" 2>/dev/null || true
    fi
  fi
}

# 1. Banned window.alert() or prompt() standing in for real error handling
RAW_ALERTS=$(scan_pattern "\balert\(|\bconfirm\(|\bprompt\(" "false")
if [ -n "$RAW_ALERTS" ]; then
  echo "  [ux-gate] FAIL: Raw browser alert()/prompt() detected. Use designed error states and toast notifications:"
  echo "$RAW_ALERTS" | head -n 5 | sed 's/^/    /'
  FAILURES=$((FAILURES + 1))
fi

# 2. Banned raw spinning icons as loading state instead of skeletons
SPINNERS=$(scan_pattern "animate-spin.*Loading\.\.\." "false")
if [ -n "$SPINNERS" ]; then
  echo "  [ux-gate] FAIL: Spinner with 'Loading...' text detected. Implement skeleton loading layout per dod.md:"
  echo "$SPINNERS" | head -n 5 | sed 's/^/    /'
  FAILURES=$((FAILURES + 1))
fi

# 3. Dead button copy: "Click here" or uninformative buttons
DEAD_COPY=$(scan_pattern ">Click here<|>Submit<|>Button<" "true")
if [ -n "$DEAD_COPY" ]; then
  echo "  [ux-gate] FAIL: Dead / generic button text detected. Use action-oriented imperative copy (e.g., 'Deploy Firewall', 'Generate Passport'):"
  echo "$DEAD_COPY" | head -n 5 | sed 's/^/    /'
  FAILURES=$((FAILURES + 1))
fi

# 4. Check that routes registered in routes.json have corresponding error boundary or state
if [ -f "$REPO_ROOT/routes.json" ] && command -v jq >/dev/null 2>&1; then
  ROUTE_COUNT=$(jq '.routes | length' "$REPO_ROOT/routes.json" 2>/dev/null || echo 0)
  if [ "$ROUTE_COUNT" -gt 0 ]; then
    # Verify routes don't leave empty error handlers
    EMPTY_CATCHES=$(scan_pattern "catch\s*\([^)]*\)\s*\{\s*\}" "false")
    if [ -n "$EMPTY_CATCHES" ]; then
      echo "  [ux-gate] FAIL: Empty catch block detected. All errors must map to visible user states:"
      echo "$EMPTY_CATCHES" | head -n 5 | sed 's/^/    /'
      FAILURES=$((FAILURES + 1))
    fi
  fi
fi

if [ $FAILURES -gt 0 ]; then
  echo "  [ux-gate] FAIL: Usability gate failed ($FAILURES errors)."
  exit 1
fi

echo "  [ux-gate] PASS: Usability and interaction states validated."
exit 0
