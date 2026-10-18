#!/usr/bin/env bash
set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "==> Restoring clean demo state in < 5 seconds..."
python "$REPO_ROOT/scripts/seed.py"
echo "==> Pristine demo state restored cleanly."
