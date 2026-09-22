#!/usr/bin/env bash
# impact-gate.sh — Slow-tier defensibility and impact validation gate
# Run at phase close. Motivated by Sentinel & Nexus: impact must be a running page with arithmetic, not a slide.

set -o pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

FAILURES=0

# 1. Verify docs/IMPACT.md exists and contains required sections
if [ -f "$REPO_ROOT/docs/IMPACT.md" ]; then
  echo "  [impact-gate] Verifying IMPACT.md completeness..."
  
  if ! grep -qi "Honest Limits" "$REPO_ROOT/docs/IMPACT.md"; then
    echo "  [impact-gate] FAIL: docs/IMPACT.md is missing mandatory 'Honest Limits' section."
    echo "  A team that names its weakest assumption first is credible; one caught in Q&A isn't."
    FAILURES=$((FAILURES + 1))
  fi

  if ! grep -qiE "(baseline|arithmetic|formula|assumptions)" "$REPO_ROOT/docs/IMPACT.md"; then
    echo "  [impact-gate] FAIL: docs/IMPACT.md must contain explicit arithmetic and sourced baselines."
    FAILURES=$((FAILURES + 1))
  fi
else
  # If fresh repo before phase 1, check template existence
  if [ -f "$REPO_ROOT/.agents/templates/IMPACT.md" ]; then
    echo "  [impact-gate] Notice: Fresh engine repo, docs/IMPACT.md not yet instantiated."
  else
    echo "  [impact-gate] FAIL: docs/IMPACT.md does not exist."
    FAILURES=$((FAILURES + 1))
  fi
fi

# 2. Verify /impact route in routes.json
if [ -f "$REPO_ROOT/routes.json" ]; then
  if ! grep -q "/impact" "$REPO_ROOT/routes.json"; then
    echo "  [impact-gate] FAIL: No '/impact' route registered in routes.json."
    echo "  The impact thesis must be a running page computing numbers from seeded history, not a pitch slide."
    FAILURES=$((FAILURES + 1))
  fi
fi

# 3. Verify judge-sim evaluation in docs/reviews/ (no criterion below 6/10)
if [ -d "$REPO_ROOT/docs/reviews" ]; then
  LATEST_JUDGE_REVIEW=$(find "$REPO_ROOT/docs/reviews" -name "*judge-sim*.md" 2>/dev/null | sort -r | head -n 1)
  if [ -n "$LATEST_JUDGE_REVIEW" ]; then
    while IFS= read -r line; do
      SCORE=$(echo "$line" | grep -oE "([0-9]+)/10" | cut -d'/' -f1 || true)
      if [ -n "$SCORE" ] && [ "$SCORE" -lt 6 ]; then
        echo "  [impact-gate] FAIL: Rubric criterion scored below 6/10 by judge-sim: '$line'"
        FAILURES=$((FAILURES + 1))
      fi
    done < <(grep -iE "(criterion|score|technical|impact|feasibility): *[0-9]+/10" "$LATEST_JUDGE_REVIEW" || true)
  fi
fi

if [ $FAILURES -gt 0 ]; then
  echo "  [impact-gate] FAIL: Impact and defensibility gate failed ($FAILURES violations)."
  exit 1
fi

echo "  [impact-gate] PASS: Defensibility and impact model validated."
exit 0
