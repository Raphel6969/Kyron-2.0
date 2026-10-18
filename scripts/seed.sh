#!/usr/bin/env bash
set -e
# Resolve Python executable with installed dependencies
if command -v python.exe >/dev/null 2>&1; then
  PYTHON_BIN="python.exe"
elif [ -x "/mnt/c/Users/raphe/miniconda3/python.exe" ]; then
  PYTHON_BIN="/mnt/c/Users/raphe/miniconda3/python.exe"
elif command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
else
  PYTHON_BIN="python"
fi

(cd "$REPO_ROOT" && $PYTHON_BIN scripts/seed.py)
