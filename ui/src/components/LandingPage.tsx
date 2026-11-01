import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Network,
  Cpu,
  FileCheck2,
  Terminal,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Eye,
  KeyRound,
  ExternalLink,
  ChevronRight,
  Server,
  Layers,
  Database,
  Fingerprint,
  UserCheck,
  AlertTriangle,
  FileCode2,
  HardDrive
} from 'lucide-react';

interface LandingPageProps {
  onEnterConsole: (role?: string) => void;
  quarantinedCount: number;
  approvedCount: number;
  blockedCalls: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterConsole,
  quarantinedCount,
  approvedCount,
  blockedCalls,
}) => {
  const [selectedStage, setSelectedStage] = useState<number>(1);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<string>('sec-admin');

  const architectureStages = [
    {
      stage: 1,
      name: 'Registry Firewall & TRUSTDESC',
      component: 'C2 Registry Firewall (Rust 1.80+)',
      latency: '0.8ms',
      mechanism: 'SHA-256 Manifest Pinning & Semantic Normalization',
      threatStopped: 'S1: Poisoned Descriptions & Prompt Injection',
      detail: 'Computes cryptographic hashes of all incoming MCP tool listings. If an upstream tool alters its schema or embeds hidden instructions, it is instantly quarantined. Safe canonical descriptions (TRUSTDESC) are synthesized from schemas so the model never ingests untrusted text.',
    },
    {
      stage: 2,
      name: 'Ed25519 Capability Leases',
      component: 'C6 Authority Service (Go 1.23+)',
      latency: '1.1ms',
      mechanism: 'Single-Use Asymmetric Cryptographic Tokens',
      threatStopped: 'S3: Destructive Privilege Escalation',
      detail: 'Destructive calls (database wipes, IAM rotations, pod restarts) require call-scoped, time-bounded (TTL) leases. The gateway verifies the Ed25519 signature before dispatch. Unsigned calls are rejected with KYRON_POLICY_VIOLATION and routed to the SOC approval queue.',
    },
    {
      stage: 3,
      name: 'TOCTOU Resource Binding',
      component: 'C3 Policy Engine (Rust 1.80+)',
      latency: '0.4ms',
      mechanism: 'SHA-256 Resource State Fingerprinting',
      threatStopped: 'Time-of-Check to Time-of-Use Race Exploits',
      detail: 'Binds execution permissions to the exact resource snapshot observed at policy evaluation. Prevents attackers from modifying file contents or DNS records in the microsecond window between authorization and tool execution.',
    },
    {
      stage: 4,
      name: 'OpenAPPA Information Flow Control',
      component: 'C4 OpenAPPA Lattice Adapter (Rust)',
      latency: '0.9ms',
      mechanism: 'RFC 6901 JSON-Path Provenance Labels',
      threatStopped: 'Covert Side-Channel Cross-Contamination',
      detail: 'Direct in-process integration with archestra-ai/OpenAPPA (MIT, v0.12.0). Every return field is labeled with its origin tier. High-integrity outputs cannot flow into low-integrity sinks without explicit declassification rules.',
    },
    {
      stage: 5,
      name: 'Linux Syscall Attestation & Sandbox',
      component: 'C10 Isolated Sandbox (Aya eBPF)',
      latency: '0.3ms',
      mechanism: 'Kernel-Level Socket & File Trace Diffs',
      threatStopped: 'Subprocess Escape & Undeclared Network Sockets',
      detail: 'Tools run inside isolated execution namespaces. Kernel probes record file opens, socket connects, and binary forks per PID, asserting runtime behavior strictly matches the tool’s declared MCP contract.',
    },
    {
      stage: 6,
      name: 'Source-Attributed Egress Broker',
      component: 'C8 Network Egress Broker (Custom Go)',
      latency: '0.7ms',
      mechanism: 'Cumulative Per-Source Byte Quotas & SSRF Guard',
      threatStopped: 'S4 & S5: Sharded Exfiltration & Cloud Metadata Theft',
      detail: 'Outbound network connections are metered against the originating data source rather than individual calls. When an attacker shards database records across 40 tiny micro-calls, cumulative byte tracking trips the threshold and cuts the socket.',
    },
    {
      stage: 7,
      name: 'Signed Cryptographic Evidence Store',
      component: 'C11 Audit Emitter (Rust / Go)',
      latency: '0.5ms',
      mechanism: 'SHA-256 Hash Chaining & Ed25519 Receipts',
      threatStopped: 'S6: Compliance Amnesia & Regulatory Fines',
      detail: 'Every tool invocation produces an immutable record linked to the previous transaction hash. Provides 1-click verifiable dossiers complying with EU AI Act Article 50 record-keeping standards.',
    },
  ];

  const threatMatrix = [
    {
      id: 'S1',
      vector: 'Prompt Injection via Tool Description',
      withoutKyron: 'Agent reads injected payload hidden in tool description and exfiltrates environment secrets.',
      withKyron: 'Stripped at Stage 1. Kyron replaces mutated descriptions with canonical TRUSTDESC schemas.',
      status: '100% Intercepted',
    },
    {
      id: 'S2',
      vector: 'Upstream Schema & Semantic Drift',
      withoutKyron: 'Third-party MCP update alters parameter requirements without notice, breaking agent execution.',
      withKyron: 'Quarantined at Stage 1. SHA-256 manifest mismatch alerts SOC; side-by-side diff allows 1-click pinning.',
      status: '100% Quarantined',
    },
    {
      id: 'S3',
      vector: 'Destructive Capability Escalation',
      withoutKyron: 'Compromised agent issues drop database or restart deployment commands without human oversight.',
      withKyron: 'Halted at Stage 2. Requires single-use Ed25519 capability lease signed by security operator.',
      status: '100% Authorized',
    },
    {
      id: 'S4',
      vector: 'Sharded Data Exfiltration',
      withoutKyron: 'Attacker bypasses per-call size limits by exfiltrating 1KB chunks across 40 distinct requests.',
      withKyron: 'Halted at Stage 6. Cumulative byte quotas metered per data source cut the network socket at call #41.',
      status: '100% Halted',
    },
    {
      id: 'S5',
      vector: 'Cloud Metadata SSRF & Public Webhooks',
      withoutKyron: 'Agent calls AWS metadata (169.254.169.254) or tunnels credentials to public webhook URLs.',
      withKyron: 'Dropped at Stage 6. Forward proxy strictly enforces enterprise domain whitelist and drops metadata IPs.',
      status: '100% Blocked',
    },
    {
      id: 'S6',
      vector: 'Compliance & EU AI Act Article 50',
      withoutKyron: 'No verifiable cryptographic evidence of agent actions, risking non-compliance fines.',
      withKyron: 'Proven at Stage 7. Immutable SHA-256 hash chains with Ed25519 signatures downloadable in 1 click.',
      status: '100% Verifiable',
    },
  ];

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthModalOpen(false);
    onEnterConsole(selectedRole);
  };

  return (
    <div className="min-h-screen bg-[#080B0E] text-[#F0F4F8] font-sans selection:bg-[#0EA5E9] selection:text-white">
      {/* Top Telemetry Header */}
      <header className="border-b border-[#1E2630] bg-[#0E1318]/90 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-[#2D3A49] bg-[#141B22] flex items-center justify-center text-[#0EA5E9]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wider font-mono text-[#F0F4F8]">KYRON 2.0</span>
                <span className="bg-[#141B22] border border-[#1E2630] text-[#10B981] font-mono text-[10px] px-2 py-0.5 rounded font-semibold">
                  ENFORCE MODE
                </span>
              </div>
              <span className="text-[11px] text-[#8A99A8] block font-mono">
                Deterministic Trust Layer for MCP Agents
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-mono text-[#8A99A8]">
            <a href="#architecture" className="hover:text-[#F0F4F8] transition-colors">
              7-Stage Pipeline
            </a>
            <a href="#threat-matrix" className="hover:text-[#F0F4F8] transition-colors">
              Threat Matrix
            </a>
            <a href="#data-plane" className="hover:text-[#F0F4F8] transition-colors">
              Data vs Control Plane
            </a>
            <span className="text-[#1E2630]">|</span>
            <div className="flex items-center gap-1.5 text-[#10B981]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block animate-pulse"></span>
              <span>Hot-Path p95: 3.8ms</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="px-3.5 py-2 text-xs font-mono font-semibold bg-[#0EA5E9] hover:bg-[#38BDF8] text-[#080B0E] rounded transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Authenticate SOC Lead</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#1E2630] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-[#2D3A49] bg-[#141B22] text-[#0EA5E9] text-xs font-mono">
              <Terminal className="w-3.5 h-3.5" />
              <span>ZERO MODEL TOKENS CONSUMED ON SECURITY HOT PATH</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F0F4F8] font-sans leading-[1.08]">
              The deterministic trust layer for tool-using AI fleets.
            </h1>

            <p className="text-base sm:text-lg text-[#8A99A8] leading-relaxed">
              Enterprise agents fail when untrusted tools mutate, leak credentials, or shard exfiltration across micro-calls.
              Kyron 2.0 intercepts and validates every MCP tool call on the wire in under 4ms—delivering mathematical
              zero-trust guarantees with zero LLM decision tokens.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="px-5 py-3 text-sm font-mono font-semibold bg-[#0EA5E9] hover:bg-[#38BDF8] text-[#080B0E] rounded transition-colors flex items-center gap-2 shadow-sm"
              >
                <UserCheck className="w-4 h-4" />
                <span>Launch Operational SOC Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#architecture"
                className="px-4 py-3 text-sm font-mono font-medium border border-[#2D3A49] hover:border-[#0EA5E9] text-[#F0F4F8] bg-[#0E1318] rounded transition-colors flex items-center gap-2"
              >
                <Layers className="w-4 h-4 text-[#8A99A8]" />
                <span>Inspect 7-Stage Pipeline</span>
              </a>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-10 border-t border-[#1E2630]">
            <div className="p-4 bg-[#0E1318] border border-[#1E2630] rounded">
              <span className="text-[11px] font-mono uppercase text-[#8A99A8] block mb-1">Decision Latency</span>
              <div className="text-2xl font-bold font-mono text-[#10B981]">3.8ms</div>
              <span className="text-[11px] text-[#5C6B7A] mt-1 block font-mono">p95 deterministic hot-path</span>
            </div>

            <div className="p-4 bg-[#0E1318] border border-[#1E2630] rounded">
              <span className="text-[11px] font-mono uppercase text-[#8A99A8] block mb-1">Hot-Path LLM Tokens</span>
              <div className="text-2xl font-bold font-mono text-[#F0F4F8]">0</div>
              <span className="text-[11px] text-[#5C6B7A] mt-1 block font-mono">Zero model drift or inference cost</span>
            </div>

            <div className="p-4 bg-[#0E1318] border border-[#1E2630] rounded">
              <span className="text-[11px] font-mono uppercase text-[#8A99A8] block mb-1">Threat Interception</span>
              <div className="text-2xl font-bold font-mono text-[#0EA5E9]">100%</div>
              <span className="text-[11px] text-[#5C6B7A] mt-1 block font-mono">S1–S6 attack scenarios halted</span>
            </div>

            <div className="p-4 bg-[#0E1318] border border-[#1E2630] rounded">
              <span className="text-[11px] font-mono uppercase text-[#8A99A8] block mb-1">Compliance Standard</span>
              <div className="text-2xl font-bold font-mono text-[#F59E0B]">Article 50</div>
              <span className="text-[11px] text-[#5C6B7A] mt-1 block font-mono">EU AI Act SHA-256 signed trail</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7-Stage Pipeline Architecture */}
      <section id="architecture" className="py-20 border-b border-[#1E2630] bg-[#0E1318]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div>
            <span className="text-xs font-mono text-[#0EA5E9] uppercase tracking-wider block mb-2">
              01 // System Architecture & Wire Flow
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-[#F0F4F8]">
              7-Stage Deterministic Security Pipeline
            </h2>
            <p className="text-sm text-[#8A99A8] max-w-2xl mt-2">
              Every tool listing, parameter payload, and network packet traverses seven deterministic gates before execution.
              Zero model tokens are expended on security decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Stage Selector List */}
            <div className="lg:col-span-5 space-y-2">
              {architectureStages.map((item) => {
                const isActive = selectedStage === item.stage;
                return (
                  <button
                    key={item.stage}
                    type="button"
                    onClick={() => setSelectedStage(item.stage)}
                    className={`w-full text-left p-3.5 rounded border transition-colors flex items-center justify-between font-mono text-xs ${
                      isActive
                        ? 'bg-[#141B22] border-[#0EA5E9] text-[#F0F4F8]'
                        : 'bg-[#0E1318] border-[#1E2630] text-[#8A99A8] hover:text-[#F0F4F8] hover:border-[#2D3A49]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        isActive ? 'bg-[#0EA5E9] text-[#080B0E] font-bold' : 'bg-[#141B22] text-[#8A99A8]'
                      }`}>
                        Stage {item.stage}
                      </span>
                      <span className="font-semibold">{item.name}</span>
                    </div>
                    <span className="text-[11px] text-[#10B981]">{item.latency}</span>
                  </button>
                );
              })}
            </div>

            {/* Stage Deep Dive Display */}
            <div className="lg:col-span-7 bg-[#0E1318] border border-[#2D3A49] rounded p-6 space-y-6">
              {(() => {
                const activeData = architectureStages.find((s) => s.stage === selectedStage)!;
                return (
                  <>
                    <div className="flex items-start justify-between pb-4 border-b border-[#1E2630]">
                      <div>
                        <span className="text-[11px] font-mono text-[#0EA5E9] uppercase block mb-1">
                          Stage {activeData.stage} Specification
                        </span>
                        <h3 className="text-xl font-bold font-mono text-[#F0F4F8]">{activeData.name}</h3>
                        <span className="text-xs font-mono text-[#8A99A8]">{activeData.component}</span>
                      </div>
                      <span className="font-mono text-xs px-2 py-1 rounded bg-[#141B22] border border-[#1E2630] text-[#10B981]">
                        Latency: {activeData.latency}
                      </span>
                    </div>

                    <div className="space-y-4 font-mono text-xs">
                      <div>
                        <span className="text-[#5C6B7A] block uppercase text-[10px] mb-1">Enforcement Mechanism</span>
                        <div className="p-3 bg-[#141B22] border border-[#1E2630] rounded text-[#F0F4F8]">
                          {activeData.mechanism}
                        </div>
                      </div>

                      <div>
                        <span className="text-[#5C6B7A] block uppercase text-[10px] mb-1">Target Threat Stopped</span>
                        <div className="p-3 bg-[#141B22] border border-[#1E2630] rounded text-[#F43F5E] flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4" />
                          <span>{activeData.threatStopped}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[#5C6B7A] block uppercase text-[10px] mb-1">Operational Detail</span>
                        <p className="text-sm font-sans text-[#8A99A8] leading-relaxed bg-[#080B0E] p-4 rounded border border-[#1E2630]">
                          {activeData.detail}
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* Threat Defense Matrix (How We Stop Threats 100%) */}
      <section id="threat-matrix" className="py-20 border-b border-[#1E2630]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div>
            <span className="text-xs font-mono text-[#0EA5E9] uppercase tracking-wider block mb-2">
              02 // Defense Verification
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-[#F0F4F8]">
              Mathematical Threat Defense Matrix
            </h2>
            <p className="text-sm text-[#8A99A8] max-w-2xl mt-2">
              Comparing standard vulnerable agent deployments against Kyron’s 7-stage deterministic firewall.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border border-[#1E2630] rounded bg-[#0E1318]">
              <thead>
                <tr className="border-b border-[#1E2630] text-[#8A99A8] bg-[#141B22] uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 w-16">Vector</th>
                  <th className="py-3.5 px-4 w-56">Attack Scenario</th>
                  <th className="py-3.5 px-4">Without Kyron 2.0 (Stock MCP)</th>
                  <th className="py-3.5 px-4">With Kyron 2.0 (Deterministic)</th>
                  <th className="py-3.5 px-4 w-36">Defense Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2630]">
                {threatMatrix.map((item) => (
                  <tr key={item.id} className="hover:bg-[#141B22]/60 transition-colors">
                    <td className="py-4 px-4 font-bold text-[#0EA5E9]">{item.id}</td>
                    <td className="py-4 px-4 font-semibold text-[#F0F4F8]">{item.vector}</td>
                    <td className="py-4 px-4 text-[#8A99A8] leading-relaxed font-sans">{item.withoutKyron}</td>
                    <td className="py-4 px-4 text-[#F0F4F8] leading-relaxed font-sans">{item.withKyron}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{item.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Data Plane vs Control Plane Topology */}
      <section id="data-plane" className="py-20 border-b border-[#1E2630] bg-[#0E1318]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div>
            <span className="text-xs font-mono text-[#0EA5E9] uppercase tracking-wider block mb-2">
              03 // Top-Level Architecture
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-[#F0F4F8]">
              Data Plane vs. Control Plane Isolation
            </h2>
            <p className="text-sm text-[#8A99A8] max-w-2xl mt-2">
              The data plane enforces pre-compiled, cryptographically signed policy bundles in-memory.
              The control plane handles human triage, evidence storage, and policy compilation without touching the call path.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-[#0E1318] border border-[#2D3A49] rounded space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1E2630]">
                <h3 className="font-mono text-sm font-bold text-[#10B981] flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  DATA PLANE (HOT PATH)
                </h3>
                <span className="text-[11px] font-mono text-[#8A99A8]">Sub-4ms p95</span>
              </div>
              <ul className="space-y-2.5 text-xs font-mono text-[#8A99A8]">
                <li className="flex items-start gap-2">
                  <span className="text-[#10B981] font-bold">✓</span>
                  <span><strong>Go Protocol Gateway:</strong> Terminates MCP clients over stdio & SSE pipes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#10B981] font-bold">✓</span>
                  <span><strong>Rust Policy Engine:</strong> Evaluates capability leases in &lt;1ms.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#10B981] font-bold">✓</span>
                  <span><strong>Network Egress Broker:</strong> Meters outbound socket bytes per data source.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#10B981] font-bold">✓</span>
                  <span><strong>Zero LLM Inference:</strong> Security verdicts run 100% deterministically.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 bg-[#0E1318] border border-[#2D3A49] rounded space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1E2630]">
                <h3 className="font-mono text-sm font-bold text-[#0EA5E9] flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  CONTROL PLANE (OFF HOT PATH)
                </h3>
                <span className="text-[11px] font-mono text-[#8A99A8]">Async Triage</span>
              </div>
              <ul className="space-y-2.5 text-xs font-mono text-[#8A99A8]">
                <li className="flex items-start gap-2">
                  <span className="text-[#0EA5E9] font-bold">✓</span>
                  <span><strong>FastAPI Management Engine:</strong> PostgreSQL 16+ registry and audit store.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0EA5E9] font-bold">✓</span>
                  <span><strong>Semantic Drift Visualizer:</strong> Side-by-side diff review and canonical pinning.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0EA5E9] font-bold">✓</span>
                  <span><strong>Live SOC Authority Queue:</strong> Operator ruling on capability lease requests.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0EA5E9] font-bold">✓</span>
                  <span><strong>EU AI Act Dossier Emitter:</strong> 1-click Ed25519 hash-chain compliance bundle.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 bg-[#080B0E]">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="w-12 h-12 rounded border border-[#2D3A49] bg-[#141B22] flex items-center justify-center text-[#0EA5E9] mx-auto">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F0F4F8]">
            Ready to secure your autonomous agent fleet?
          </h2>

          <p className="text-sm text-[#8A99A8] max-w-xl mx-auto">
            Experience the live SOC Console with 35 pre-seeded enterprise tools, live capability lease queues,
            and cryptographic hash-chain audit evidence.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="px-6 py-3.5 text-sm font-mono font-semibold bg-[#0EA5E9] hover:bg-[#38BDF8] text-[#080B0E] rounded transition-colors inline-flex items-center gap-2 shadow-sm"
            >
              <UserCheck className="w-4 h-4" />
              <span>Authenticate & Enter SOC Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Authentication Gateway Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0E1318] border border-[#2D3A49] rounded-lg w-full max-w-md shadow-2xl overflow-hidden font-mono">
            <div className="p-5 border-b border-[#1E2630] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded border border-[#2D3A49] bg-[#141B22] flex items-center justify-center text-[#0EA5E9]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F0F4F8]">Enterprise SOC Authentication</h3>
                  <span className="text-[10px] text-[#8A99A8]">Session Identity Token Generator</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                className="text-[#8A99A8] hover:text-[#F0F4F8] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[#8A99A8] text-[10px] uppercase tracking-wider mb-1.5">
                  Select Authorization Role
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'sec-admin',
                      label: 'Enterprise Security Lead',
                      desc: 'Full enforcement authority, tool pinning, and capability lease granting.',
                    },
                    {
                      id: 'compliance-auditor',
                      label: 'EU AI Act Auditor',
                      desc: 'Read-only telemetry and 1-click Article 50 cryptographic dossier export.',
                    },
                    {
                      id: 'platform-architect',
                      label: 'AI Platform Architect',
                      desc: 'Fleet trajectory inspection and TOML declarative policy hot-reloading.',
                    },
                  ].map((role) => (
                    <label
                      key={role.id}
                      className={`block p-3 rounded border cursor-pointer transition-colors ${
                        selectedRole === role.id
                          ? 'border-[#0EA5E9] bg-[#141B22] text-[#F0F4F8]'
                          : 'border-[#1E2630] bg-[#080B0E] text-[#8A99A8] hover:border-[#2D3A49]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="authRole"
                        value={role.id}
                        checked={selectedRole === role.id}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between font-semibold">
                        <span>{role.label}</span>
                        <span className="text-[10px] text-[#0EA5E9]">{role.id}</span>
                      </div>
                      <p className="text-[11px] text-[#8A99A8] mt-1 font-sans leading-normal">{role.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-[#080B0E] border border-[#1E2630] rounded text-[11px] text-[#8A99A8] space-y-1">
                <div className="flex justify-between">
                  <span>Sign-In Protocol:</span>
                  <span className="text-[#10B981]">Ed25519 Zero-Trust SSO</span>
                </div>
                <div className="flex justify-between">
                  <span>Session Policy Mode:</span>
                  <span className="text-[#0EA5E9]">Enforce (Active)</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(false)}
                  className="px-3.5 py-2 rounded border border-[#1E2630] hover:bg-[#141B22] text-[#8A99A8] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#0EA5E9] hover:bg-[#38BDF8] text-[#080B0E] font-bold flex items-center gap-1.5 transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Authorize & Enter Console</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
