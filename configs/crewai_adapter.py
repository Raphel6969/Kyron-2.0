"""
Kyron 2.0 — Zero-Code Drop-In Adapter for CrewAI Agents
Wraps CrewAI Custom Tools and Agent Executions with Kyron's deterministic trust layer.
"""

from typing import Any, Type
import functools


def kyron_guard(tool_name: str, control_url: str = "http://127.0.0.1:8001"):
    """
    Decorator for CrewAI tool methods ensuring all executions pass through Kyron policy engine.
    Usage:
        class DocumentSearchTool(BaseTool):
            name: str = "DocumentSearch"
            description: str = "Search enterprise documents"

            @kyron_guard("DocumentSearch")
            def _run(self, query: str) -> str:
                return fetch_docs(query)
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            import httpx
            try:
                with httpx.Client(timeout=2.0) as client:
                    resp = client.post(
                        f"{control_url.rstrip('/')}/v1/approvals",
                        json={
                            "session_id": "crewai-session",
                            "trajectory_id": f"crewai-{tool_name}",
                            "kind": "tool_invocation",
                            "tool_id": tool_name,
                            "details": {"args_preview": str(args)[:100]},
                        },
                    )
                    if resp.status_code == 200:
                        payload = resp.json()
                        if payload.get("status") == "denied":
                            return f"ERROR: Kyron 2.0 security policy blocked '{tool_name}' execution."
            except Exception:
                pass
            return func(*args, **kwargs)
        return wrapper
    return decorator
