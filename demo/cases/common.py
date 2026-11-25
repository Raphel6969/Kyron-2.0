"""Shared HTTP client, terminal formatting, and assertion helpers for Kyron 2.0 demo cases."""

from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

DEMO_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = DEMO_DIR.parent
PAYLOADS_DIR = DEMO_DIR / "payloads"


def configure_utf8_stdout() -> None:
    """Ensure UTF-8 output does not fail on Windows cp1252 terminals."""
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass


class Ansi:
    BOLD = "\033[1m"
    DIM = "\033[2m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    RESET = "\033[0m"


def banner(case_num: int, title: str, subtitle: str) -> None:
    print(f"\n{Ansi.BOLD}{Ansi.CYAN}{'=' * 78}{Ansi.RESET}")
    print(f"{Ansi.BOLD}{Ansi.CYAN}  CASE {case_num}: {title}{Ansi.RESET}")
    print(f"{Ansi.DIM}  {subtitle}{Ansi.RESET}")
    print(f"{Ansi.BOLD}{Ansi.CYAN}{'=' * 78}{Ansi.RESET}\n")


def step(label: str) -> None:
    print(f"{Ansi.BOLD}{Ansi.BLUE}--> {label}{Ansi.RESET}")


def ok(msg: str, latency_ms: Optional[float] = None) -> None:
    lat = f" {Ansi.DIM}({latency_ms:.1f} ms){Ansi.RESET}" if latency_ms is not None else ""
    print(f"    {Ansi.GREEN}[PASS]{Ansi.RESET} {msg}{lat}")


def blocked(msg: str, latency_ms: Optional[float] = None) -> None:
    lat = f" {Ansi.DIM}({latency_ms:.1f} ms){Ansi.RESET}" if latency_ms is not None else ""
    print(f"    {Ansi.YELLOW}[BLOCKED / INTERCEPTED]{Ansi.RESET} {msg}{lat}")


def fail(msg: str) -> None:
    print(f"    {Ansi.RED}[FAIL]{Ansi.RESET} {msg}")


def info(msg: str) -> None:
    print(f"    {Ansi.DIM}{msg}{Ansi.RESET}")


def http_json(
    method: str,
    url: str,
    payload: Optional[Dict[str, Any]] = None,
    timeout: float = 8.0,
) -> Tuple[int, Dict[str, Any] | list, float]:
    """Perform a standard-library JSON HTTP request and return (status_code, parsed_json, latency_ms)."""
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    headers = {
        "Accept": "application/json",
        "User-Agent": "Kyron-Demo-Harness/2.0",
    }
    if data is not None:
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=data, headers=headers, method=method.upper())
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            parsed = json.loads(raw) if raw.strip() else {}
            return resp.status, parsed, elapsed_ms
    except urllib.error.HTTPError as exc:
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(raw) if raw.strip() else {"detail": raw}
        except Exception:
            parsed = {"detail": raw}
        return exc.code, parsed, elapsed_ms
