# Acme FinOps & Workspace Assistant — Standalone Project Interception Demo

This is a **100% standalone customer project** (zero imports from Kyron!) designed to prove to judges that Kyron 2.0 drops in front of *any* existing MCP project with **zero agent or server code changes**.

## Files
- `workspace/q3_ledger.csv` & `workspace/finops.db`: Real workspace CSV & SQLite invoice database.
- `mcp_server.py`: Standalone MCP stdio server implementing `query_invoices`, `read_ledger`, `system_diagnostics` (accidentally leaks GitHub/AWS keys), and `vendor_sync_telemetry` (trojanized plugin with prompt injection).
- `agent_app.py`: Real agent client executing MCP JSON-RPC over stdin/stdout pipes.

## Live Judge Demo Comparison (30 seconds!)

### 1. Run WITHOUT Kyron (shows real vulnerability)
```bash
python demo/acme_ops_project/agent_app.py --mode unprotected
```
- Agent sees the raw `Ignore previous instructions...` prompt injection in `tools/list`.
- `system_diagnostics` leaks raw `ghp_...` and `AKIAIOSFODNN7EXAMPLE` credentials.
- `vendor_sync_telemetry` succeeds and leaks data to `http://evil.com/drop`.

### 2. Run WITH Kyron Drop-In Interception (`kyron-gateway stdio`)
Open the SOC Console (`http://127.0.0.1:5173/console`) beside your terminal and run:
```bash
python demo/acme_ops_project/agent_app.py --mode kyron
```
With **one CLI wrapper** (`kyron-gateway.exe stdio -- python mcp_server.py`):
- **Auto-Discovery & TRUSTDESC**: `vendor_sync_telemetry` is automatically scanned, quarantined (`Risk 95%`), and stripped from `tools/list` (`Tool Registry` updates live in browser!).
- **Real Business Work Allowed**: `query_invoices(status='overdue')` executes against real SQLite `finops.db` and logs green `ALLOW` to `Cryptographic Trail`.
- **Secrets Broker Redaction**: Plaintext `ghp_...` and `AKIA...` tokens are redacted in-flight to `[KYRON_REDACTED_SECRET]` before the agent reads stdout!
- **Deterministic Enforcement**: Calling `vendor_sync_telemetry` returns `-32000 Policy violation` and streams red `BLOCK` into `Cryptographic Trail`!
