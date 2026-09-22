#!/usr/bin/env bash
# ui-review-gate.sh — Slow-tier visual craft gate (Phase Close)
# Parses ui-critic score logs in docs/reviews/. Fails if any route scores below 7/10.

set -o pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

REVIEWS_DIR="$REPO_ROOT/docs/reviews"

if [ ! -d "$REVIEWS_DIR" ]; then
  # If fresh repo with no UI phases completed, skip cleanly
  echo "  [ui-review-gate] PASS: No reviews recorded yet (pre-phase close)."
  exit 0
fi

# Find latest ui-critic review file
LATEST_UI_REVIEW=$(find "$REVIEWS_DIR" -name "*ui-critic*.md" -o -name "*ui-review*.md" 2>/dev/null | sort -r | head -n 1)

if [ -z "$LATEST_UI_REVIEW" ]; then
  echo "  [ui-review-gate] Notice: No ui-critic review markdown found in docs/reviews/."
  echo "  Run /ui-review before closing a UI phase."
  exit 0
fi

echo "  [ui-review-gate] Evaluating visual craft scores in $LATEST_UI_REVIEW..."

FAILURES=0
# Parse scores formatted as: "Score: X/10" or "Craft: X/10"
while IFS= read -r line; do
  SCORE=$(echo "$line" | grep -oE "([0-9]+)/10" | cut -d'/' -f1 || true)
  if [ -n "$SCORE" ] && [ "$SCORE" -lt 7 ]; then
    echo "  [ui-review-gate] FAIL: Route or criterion scored below 7/10: '$line'"
    FAILURES=$((FAILURES + 1))
  fi
done < <(grep -iE "(score|craft|typography|density): *[0-9]+/10" "$LATEST_UI_REVIEW" || true)

if [ $FAILURES -gt 0 ]; then
  echo "  [ui-review-gate] FAIL: $FAILURES visual craft scores are below 7/10. Refine design tokens and rerun /ui-review."
  exit 1
fi

echo "  [ui-review-gate] PASS: Visual craft review threshold met (all >= 7/10)."
exit 0
