# Kyron 2.0 — Zero-Code Drop-In Configurations

Kyron 2.0 runs as a transparent gateway between stock AI agents and MCP servers. **Zero changes are required to model weights or agent loops.**

---

## 1. Claude Desktop (Anthropic)
Add to your Claude Desktop configuration file:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

See [claude_desktop_config.json](file:///c:/Users/raphe/Webdev/Projects/Kyron_2.0/configs/claude_desktop_config.json):
```json
{
  "mcpServers": {
    "protected-filesystem": {
      "command": "kyron",
      "args": ["gateway", "--stdio", "--", "npx", "-y", "@modelcontextprotocol/server-filesystem", "/data"]
    }
  }
}
```

---

## 2. Cursor IDE
Add to `.cursor/mcp.json` in your workspace root.
See [cursor_mcp.json](file:///c:/Users/raphe/Webdev/Projects/Kyron_2.0/configs/cursor_mcp.json).

---

## 3. LangChain Agents
Use the drop-in `protect_langchain_tool` decorator in [langchain_client.py](file:///c:/Users/raphe/Webdev/Projects/Kyron_2.0/configs/langchain_client.py):
```python
from configs.langchain_client import protect_langchain_tool

@tool
def bash_execute(cmd: str) -> str:
    return subprocess.check_output(cmd, shell=True).decode()

# Wrap with Kyron deterministic policy enforcement:
safe_tool = protect_langchain_tool(bash_execute)
```

---

## 4. CrewAI Framework
Decorate agent tool methods with `@kyron_guard` in [crewai_adapter.py](file:///c:/Users/raphe/Webdev/Projects/Kyron_2.0/configs/crewai_adapter.py):
```python
from configs.crewai_adapter import kyron_guard

class MyCustomTool(BaseTool):
    name: str = "DatabaseQuery"

    @kyron_guard("DatabaseQuery")
    def _run(self, query: str) -> str:
        return db.run(query)
```
