# Kyron 2.0 — Real-World Agent Connection & Integration Guide

This directory contains production drop-in configurations, client adapters, and test runners for connecting real AI agents to Kyron's deterministic trust layer.

---

## 1. How Real Agents Connect to Kyron 2.0

Kyron 2.0 sits **transparently** between any stock AI agent and its reachable MCP tools. Real agents require **zero code changes** to their prompts, models, or tool logic.

```
┌─────────────────┐      Standard MCP Protocol       ┌─────────────────────┐
│  Real AI Agent  │ ───────────────────────────────► │   Kyron Gateway     │
│ (Cursor, Claude,│   (stdio or HTTP/SSE stream)     │  (7-Stage Firewall) │
│  LangChain)     │ ◄─────────────────────────────── │                     │
└─────────────────┘      Governed & Redacted Output   └──────────┬──────────┘
                                                                 │
                                                       Governed Tool Dispatch
                                                                 ▼
                                                      ┌─────────────────────┐
                                                      │ Upstream MCP Tools  │
                                                      │ (Postgres, GitHub,  │
                                                      │  Filesystem, APIs)  │
                                                      └─────────────────────┘
```

---

## 2. Drop-in IDE & Application Configurations

### A. Claude Desktop
Add to your Claude Desktop configuration (`%APPDATA%\Claude\claude_desktop_config.json` on Windows or `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "kyron-governed-tools": {
      "command": "kyron",
      "args": ["gateway", "--stdio", "--", "npx", "-y", "@modelcontextprotocol/server-filesystem", "."]
    }
  }
}
```

### B. Cursor IDE
Add to `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "kyron-gateway": {
      "command": "kyron",
      "args": ["gateway", "--stdio", "--", "python", "-m", "lab.server", "--all"]
    },
    "kyron-sse-remote": {
      "url": "http://localhost:8080/sse"
    }
  }
}
```

---

## 3. Python AI Agents (LangChain, LangGraph, CrewAI, AutoGen)

Connect any Python agent using `scripts/agents/langchain_agent.py`:

```bash
# Run standalone demonstration walkthrough:
python scripts/agents/langchain_agent.py --simulate

# Run against live gateway:
python scripts/agents/langchain_agent.py --gateway http://localhost:8080
```

### Python Code Snippet:
```python
import urllib.request, json

def call_kyron_tool(tool_name: str, args: dict, session_id: str = "agent-01"):
    url = f"http://localhost:8080/message?session_id={session_id}"
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {"name": tool_name, "arguments": args, "session_id": session_id}
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

# Example invocation:
result = call_kyron_tool("currency_converter", {"amount": 100, "from": "USD", "to": "EUR"})
print("Governed result:", result)
```

---

## 4. Diagnostic & Verification Test Suite

Run the connection tester:
```bash
python scripts/agents/test_agent_connection.py
```
Outputs live test matrices across stdio, HTTP/SSE, and all 6 adversarial threat vectors.
