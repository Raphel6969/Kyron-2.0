#!/usr/bin/env bash
# state-lint.sh — Gate check: state freshness & loop contract hygiene
# Motivated by Sentinel & Aloorithm: docs went stale while code changed.
# The agent CANNOT skip documentation because this script will fail verify.

set -o pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

FAILURES=0

# 1. Check STATE.md exists and respects the 40-line cap
if [ ! -f "$REPO_ROOT/STATE.md" ]; then
  # If STATE.md template exists in .agents/templates, allow fresh repo, but warn
  if [ -f "$REPO_ROOT/.agents/templates/STATE.md" ]; then
    echo "  [state-lint] Notice: Fresh engine repo, root STATE.md not yet instantiated from template."
  else
    echo "  [state-lint] FAIL: STATE.md does not exist."
    FAILURES=$((FAILURES + 1))
  fi
else
  LINE_COUNT=$(wc -l < "$REPO_ROOT/STATE.md" | tr -d ' ')
  if [ "$LINE_COUNT" -gt 40 ]; then
    echo "  [state-lint] FAIL: STATE.md exceeds 40-line cap (actual: ${LINE_COUNT} lines)."
    FAILURES=$((FAILURES + 1))
  fi

  # Verify required machine-parseable fields
  for FIELD in "phase:" "sub_task:" "status:" "hours_used:" "hours_budget:" "last_verified_commit:" "blocked_on:"; do
    if ! grep -q "^${FIELD}" "$REPO_ROOT/STATE.md"; then
      echo "  [state-lint] FAIL: STATE.md missing required field '${FIELD}'"
      FAILURES=$((FAILURES + 1))
    fi
  done

  # Verify section headers
  if ! grep -q "## NEXT ACTION" "$REPO_ROOT/STATE.md"; then
    echo "  [state-lint] FAIL: STATE.md missing '## NEXT ACTION' section"
    FAILURES=$((FAILURES + 1))
  fi
  if ! grep -q "## IN FLIGHT" "$REPO_ROOT/STATE.md"; then
    echo "  [state-lint] FAIL: STATE.md missing '## IN FLIGHT' section"
    FAILURES=$((FAILURES + 1))
  fi
fi

# 2. Check documentation freshness if in git repo and src changes exist
if git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  # Find newest modified source file across typical src trees
  NEWEST_SRC=$(find "$REPO_ROOT" -type f \( \
    -path "*/src/*" -o -path "*/backend/*" -o -path "*/frontend/*" -o -path "*/services/*" -o -path "*/app/*" \
  \) -not -path "*/node_modules/*" -not -path "*/.venv/*" -not -path "*/target/*" -not -path "*/dist/*" \
  -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -n 1 | awk '{print $2}')

  if [ -n "$NEWEST_SRC" ] && [ -f "$REPO_ROOT/STATE.md" ]; then
    # Compare timestamps: if source was edited, STATE.md or phase doc must not be completely abandoned
    if [ "$NEWEST_SRC" -nt "$REPO_ROOT/STATE.md" ]; then
      # If STATE status is VERIFIED but source is newer than STATE.md, documentation is stale
      if grep -q "^status: *VERIFIED" "$REPO_ROOT/STATE.md"; then
        echo "  [state-lint] FAIL: Source file ($NEWEST_SRC) is newer than STATE.md, but status is marked VERIFIED."
        echo "  Update STATE.md before committing."
        FAILURES=$((FAILURES + 1))
      fi
    fi
  fi
fi

# 3. Check for forbidden reactive patch documents (Mistake 6 from mined history)
FORBIDDEN_PATCHES=$(find "$REPO_ROOT/docs" -type f \( -name "*_REWORK_*" -o -name "*_PATCH_*" -o -name "*_TODO*" \) 2>/dev/null)
if [ -n "$FORBIDDEN_PATCHES" ]; then
  echo "  [state-lint] FAIL: Found reactive patch document(s):"
  echo "$FORBIDDEN_PATCHES"
  echo "  Update primary docs (ARCHITECTURE.md, API.md, SCHEMA.md) instead of creating patch context files."
  FAILURES=$((FAILURES + 1))
fi

if [ $FAILURES -gt 0 ]; then
  exit 1
fi

echo "  [state-lint] PASS: State and documentation contracts are verified."
exit 0
