import React, { useState } from 'react';
import {
  Terminal,
  Copy,
  Check,
  CheckCircle,
  Network,
  Cpu,
  Layers,
  ArrowRight,
  Shield,
  Activity,
  Server,
  Play,
  RotateCw,
  ExternalLink,
  Lock,
  AlertTriangle
} from 'lucide-react';

export const AgentConnect: React.FC = () => {
  const [selectedClient, setSelectedClient] = useState<'cursor' | 'claude' | 'python' | 'node' | 'stdio'>('cursor');
  const [copied, setCopied] = useState<boolean>(false);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simulationLog, setSimulationLog] = useState<{
    stage: string;
    verdict: string;
    latency: string;
    threatNeutralized: string;
    details: string;
  } | null>(null);

  const configs = {
    cursor: {
      name: 'Cursor IDE',
      filename: '.cursor/mcp.json',
      description: 'Protects Cursor Agent Composer by proxying all MCP tool calls through Kyron stdio gateway.',
      snippet: `{
  "mcpServers": {
    "kyron-gateway": {
      "command": "kyron",
      "args": ["gateway", "--stdio", "--", "python", "-m", "lab.server", "--all"]
    },
    "kyron-sse-remote": {
      "url": "http://localhost:8080/sse"
    }
  }
}`
    },
    claude: {
      name: 'Claude Desktop',
      filename: 'claude_desktop_config.json',
      description: 'Drop-in transparent proxy configuration for Anthropic Claude Desktop MCP tools.',
      snippet: `{
  "mcpServers": {
    "kyron-protected-tools": {
      "command": "kyron",
      "args": [
        "gateway",
        "--stdio",
        "--",
        "npx",
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "."
      ],
      "env": {
        "KYRON_POLICY_MODE": "enforce"
      }
    }
  }
}`
    },
    python: {
      name: 'Python (LangChain / LangGraph)',
      filename: 'agent.py',
      description: 'Direct HTTP/SSE or JSON-RPC tool caller for custom Python AI agents and multi-agent swarms.',
      snippet: `import urllib.request, json

def call_kyron_tool(tool_name: str, args: dict, session_id: str = "agent-session-01"):
    url = f"http://localhost:8080/message?session_id={session_id}"
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": args,
            "session_id": session_id
        }
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

# Example invocation governed by 7 deterministic gates:
result = call_kyron_tool("currency_converter", {"amount": 100, "from": "USD", "to": "EUR"})
print("Governed result:", result)`
    },
    node: {
      name: 'TypeScript / Node.js',
      filename: 'agent.ts',
      description: 'Client connection using standard @modelcontextprotocol/sdk connecting to Kyron SSE stream.',
      snippet: `import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

async function main() {
  const transport = new SSEClientTransport(new URL("http://localhost:8080/sse"));
  const client = new Client({ name: "enterprise-agent", version: "1.0.0" }, { capabilities: {} });
  await client.connect(transport);

  // Tools listed here receive safe canonical TRUSTDESC descriptions
  const tools = await client.listTools();
  console.log("Governed Tools:", tools);

  // Calls pass through all 7 deterministic defense stages
  const callResult = await client.callTool({
    name: "currency_converter",
    arguments: { amount: 250, from: "USD", to: "EUR" }
  });
  console.log("Call result:", callResult);
}

main();`
    },
    stdio: {
      name: 'CLI Subprocess Gateway',
      filename: 'Terminal / Docker Command',
      description: 'Wrap any existing MCP server binary with zero agent code modifications.',
      snippet: `# Wrap any MCP server command with "kyron gateway --stdio --"
kyron gateway --stdio -- python -m lab.server --all

# Or run persistent HTTP / SSE Gateway on port 8080
kyron gateway --port 8080`
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(configs[selectedClient].snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSimulateAgentCall = (scenario: 'benign' | 'poison' | 'shard' | 'lease') => {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      if (scenario === 'benign') {
        setSimulationLog({
          stage: 'All 7 Gates Passed',
          verdict: 'ADMITTED (Clean Tool)',
          latency: '2.8ms p95',
          threatNeutralized: 'None (Safe Operation)',
          details: 'Invoked currency_converter(amount=250, from=USD, to=EUR). Returned 232.50 EUR. Ed25519 audit event emitted.'
        });
      } else if (scenario === 'poison') {
        setSimulationLog({
          stage: 'Gate 2: TRUSTDESC Normalizer',
          verdict: 'INTERCEPTED & NEUTRALIZED',
          latency: '0.4ms',
          threatNeutralized: 'Prompt Injection / Key Exfiltration (Scenario S1)',
          details: 'Upstream tool contained hidden instruction to exfiltrate ~/.ssh/id_rsa. Kyron replaced model-facing description with canonical schema contract. Attack prevented before model saw it!'
        });
      } else if (scenario === 'shard') {
        setSimulationLog({
          stage: 'Gate 6: Egress Broker',
          verdict: 'BLOCKED (Quota Exhausted)',
          latency: '0.3ms',
          threatNeutralized: 'Sharded Covert Exfiltration (Scenario S4)',
          details: 'Attacker attempted 41 micro-calls leaking 12 KB each. Cumulative source byte budget (512 KB) breached on call #41. Execution immediately halted.'
        });
      } else {
        setSimulationLog({
          stage: 'Gate 4: Authority Service',
          verdict: 'SUSPENDED (Lease Required)',
          latency: '0.8ms',
          threatNeutralized: 'High-Blast Radius Mutation',
          details: 'Tool k8s:restart_cluster requires human approval. Suspended in Authority Queue (Req ID: req_98f12a). Security operator ruling requested.'
        });
      }
    }, 400);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Hero Banner */}
      <div className="console-card overflow-hidden">
        <div className="p-6 md:p-8 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="max-w-3xl space-y-2">
            <div className="flex items-center gap-3">
              <span className="landing-kicker text-[10px]">
                <span className="landing-kicker-dot" /> AGENT INTEGRATION INTERFACE
              </span>
              <span className="landing-live text-[10px]">
                <i /> ZERO AGENT CODE CHANGES
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
              Connect Real AI Agents <span className="text-[#1D4ED8]">to Kyron 2.0</span>
            </h1>
            <p className="text-sm text-[#475569] leading-relaxed">
              Kyron operates as a transparent MCP gateway. Whether your AI fleet runs in Cursor, Claude Desktop,
              LangChain, LangGraph, AutoGen, or custom TypeScript microservices, point your MCP client to Kyron
              and every tool call is deterministically protected with 0 model tokens on the hot path.
            </p>
          </div>
        </div>

        {/* Integration Architecture Bar */}
        <div className="px-6 py-4 bg-white border-b border-[#E2E8F0] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <Cpu className="w-4 h-4 text-[#1D4ED8] flex-shrink-0" />
            <span className="font-semibold text-[#0F172A]">Real Agent Client</span>
            <span className="text-[#94A3B8]">→</span>
            <span className="font-mono text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
              kyron gateway (stdio / :8080 SSE)
            </span>
            <span className="text-[#94A3B8]">→</span>
            <Server className="w-4 h-4 text-[#059669] flex-shrink-0" />
            <span className="font-semibold text-[#0F172A]">Governed MCP Tools</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-[#64748B]">
            <span><b>Status:</b> Ready</span>
            <span className="text-[#CBD5E1]">|</span>
            <span><b>Hot-Path Latency:</b> &lt; 4ms</span>
            <span className="text-[#CBD5E1]">|</span>
            <span className="text-[#059669] font-bold">100% Deterministic</span>
          </div>
        </div>
      </div>

      {/* Code Snippet & Configuration Selector */}
      <div className="console-card overflow-hidden">
        <div className="console-card-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="landing-kicker text-[10px]">01 / Drop-In Configurations</p>
            <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
              Select Your Agent Stack / Framework
            </h2>
          </div>
          <button
            onClick={handleCopy}
            className="landing-button landing-button-secondary text-xs h-8 px-3"
            title="Copy configuration to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#059669]" /> : <Copy className="w-3.5 h-3.5 text-[#1D4ED8]" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Configuration'}</span>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-1 bg-[#F1F5F9] p-1 border border-[#E2E8F0] rounded text-xs" role="tablist">
            {(['cursor', 'claude', 'python', 'node', 'stdio'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedClient(key)}
                className={`px-3 py-1.5 rounded font-medium text-xs transition-colors ${
                  selectedClient === key
                    ? 'bg-white text-[#1D4ED8] font-bold shadow-sm border border-[#CBD5E1]'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                {configs[key].name}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <p>{configs[selectedClient].description}</p>
            <span className="font-mono text-[11px] text-[#0F172A] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0] hidden sm:inline">
              Target File: {configs[selectedClient].filename}
            </span>
          </div>

          {/* Code Viewer */}
          <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded p-4 font-mono text-xs text-[#0F172A] overflow-x-auto leading-relaxed relative">
            <pre className="m-0">{configs[selectedClient].snippet}</pre>
          </div>
        </div>
      </div>

      {/* Live Agent Threat Simulator & Interactive Handshake */}
      <div className="console-card overflow-hidden">
        <div className="console-card-header flex items-center justify-between">
          <div>
            <p className="landing-kicker text-[10px]">02 / Live Execution Tester</p>
            <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
              Simulate Real Agent Scenarios Through Gateway
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded">
            Live Gateway Emulation
          </span>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-xs text-[#475569] leading-relaxed">
            Click any real-world scenario below to execute an agent tool call through the 7-stage deterministic security pipeline:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => handleSimulateAgentCall('benign')}
              disabled={simulating}
              className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-left hover:border-[#1D4ED8] transition-all group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-[#0F172A] mb-1">
                <span>1. Benign Call</span>
                <Play className="w-3.5 h-3.5 text-[#1D4ED8]" />
              </div>
              <p className="text-[11px] text-[#64748B] leading-normal">
                Standard tool execution with sub-4ms deterministic verification.
              </p>
            </button>

            <button
              onClick={() => handleSimulateAgentCall('poison')}
              disabled={simulating}
              className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-left hover:border-[#DC2626] transition-all group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-[#DC2626] mb-1">
                <span>2. Poisoned Tool</span>
                <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
              </div>
              <p className="text-[11px] text-[#64748B] leading-normal">
                S1 Attack: Hidden prompt injection stripped by TRUSTDESC normalizer.
              </p>
            </button>

            <button
              onClick={() => handleSimulateAgentCall('shard')}
              disabled={simulating}
              className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-left hover:border-[#D97706] transition-all group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-[#D97706] mb-1">
                <span>3. Exfiltration</span>
                <Network className="w-3.5 h-3.5 text-[#D97706]" />
              </div>
              <p className="text-[11px] text-[#64748B] leading-normal">
                S4 Attack: Sharded exfiltration stopped by source byte quota.
              </p>
            </button>

            <button
              onClick={() => handleSimulateAgentCall('lease')}
              disabled={simulating}
              className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-left hover:border-[#1D4ED8] transition-all group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-[#1D4ED8] mb-1">
                <span>4. High-Blast Call</span>
                <Lock className="w-3.5 h-3.5 text-[#1D4ED8]" />
              </div>
              <p className="text-[11px] text-[#64748B] leading-normal">
                Destructive action suspended for human authority queue sign-off.
              </p>
            </button>
          </div>

          {/* Simulation Output Card */}
          {simulationLog && (
            <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#059669]" />
                  <span className="font-bold text-xs text-[#0F172A] font-mono">{simulationLog.stage}</span>
                  <span className="bg-white border border-[#CBD5E1] px-2 py-0.5 rounded text-[10px] font-mono font-bold text-[#1D4ED8]">
                    {simulationLog.verdict}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono text-[#64748B]">
                  <span>Latency: <b className="text-[#059669]">{simulationLog.latency}</b></span>
                  <span>Tokens: <b className="text-[#059669]">0</b></span>
                </div>
              </div>

              <div className="text-xs text-[#475569] leading-relaxed">
                <span className="font-semibold text-[#0F172A]">Execution Trace: </span>
                {simulationLog.details}
              </div>

              <div className="text-[11px] text-[#64748B] flex items-center justify-between pt-1 border-t border-[#E2E8F0]/60 font-mono">
                <span>Threat Status: <b className="text-[#059669]">{simulationLog.threatNeutralized}</b></span>
                <span className="text-[#1D4ED8]">Ed25519 Signed Audit Sealed</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
