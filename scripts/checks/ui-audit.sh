#!/usr/bin/env bash
# ui-audit.sh — Static regex quality gate against AI-slop / cliché styling
# Run on EVERY commit. Fails build if banned visual patterns are detected.
# The exit code is the only accepted referee.

set -o pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Identify UI source locations
UI_DIRS=()
for DIR in "$REPO_ROOT/src" "$REPO_ROOT/frontend/src" "$REPO_ROOT/app" "$REPO_ROOT/public"; do
  if [ -d "$DIR" ]; then
    UI_DIRS+=("$DIR")
  fi
done

# If no UI directories exist yet, pass cleanly (scaffolding phase)
if [ ${#UI_DIRS[@]} -eq 0 ]; then
  echo "  [ui-audit] PASS: No UI directory detected yet (scaffolding stage)."
  exit 0
fi

FAILURES=0

check_pattern() {
  local pattern="$1"
  local description="$2"
  local exclude_flags="--glob=!*.test.* --glob=!*.spec.* --glob=!*TOKENS.css --glob=!*.svg"
  
  local matches
  if command -v rg >/dev/null 2>&1; then
    matches=$(rg -i "$pattern" "${UI_DIRS[@]}" $exclude_flags 2>/dev/null || true)
  else
    matches=$(grep -rEi "$pattern" "${UI_DIRS[@]}" 2>/dev/null || true)
  fi

  if [ -n "$matches" ]; then
    echo "  [ui-audit] FAIL: Banned aesthetic pattern detected — $description"
    echo "$matches" | head -n 5 | sed 's/^/    /'
    FAILURES=$((FAILURES + 1))
  fi
}

echo "  [ui-audit] Auditing UI code for banned clichés and AI aesthetics..."

# 1. Banned color palettes: purple / indigo / violet accents
check_pattern "(bg|text|border)-(purple|indigo|violet)-[0-9]{3}" "Purple/Indigo/Violet accent classes are banned. Use calibrated design tokens from TOKENS.css."

# 2. Banned gradients on buttons/cards/text
check_pattern "bg-gradient-to|from-(purple|indigo|blue|pink)-[0-9]{3}|text-transparent.*bg-clip-text" "Gradients on button/card/text are banned. Use solid deliberate surfaces and typography."

# 3. Banned card cliches: rounded-2xl + shadow-xl + p-6
check_pattern "rounded-2xl.*shadow-xl.*p-6|rounded-3xl.*shadow-2xl" "Generic AI-card pattern (rounded-2xl + shadow-xl + p-6) is banned. Design editorial asymmetric layouts."

# 4. Banned hero pill badges
check_pattern "(rounded-full|rounded-pill).*(px-[234]|py-1).*(text-xs|text-sm).*border" "Centered pill badge in hero is banned (AI SaaS cliché)."

# 5. "Powered by AI" or sparkle badges
check_pattern "Powered by AI|✨|Sparkles" "'Powered by AI' / sparkles badges are banned. Show capabilities through execution, not labels."

# 6. Raw hover:scale-* as primary motion
check_pattern "hover:scale-(105|110|125)" "'hover:scale-*' as primary interaction is banned. Use GSAP / Lenis / motion tokens."

# 7. Placeholder text & placeholder avatar services
check_pattern "Lorem ipsum|placehold\.co|via\.placeholder\.com" "Lorem ipsum / placeholder avatars are banned. Seed realistic domain content."

# 8. Raw un-tokenized Tailwind palette classes (e.g. bg-blue-500 instead of var(--color-...))
check_pattern "(bg|text|border)-(red|blue|emerald|amber|cyan)-[0-9]{3}" "Raw Tailwind palette classes detected. Wire semantic color tokens in TOKENS.css."

if [ $FAILURES -gt 0 ]; then
  echo "  [ui-audit] FAIL: $FAILURES UI craft violations found. Fix or revert before committing."
  exit 1
fi

echo "  [ui-audit] PASS: UI codebase conforms to design discipline."
exit 0
