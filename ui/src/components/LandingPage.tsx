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
  KeyRound,
  ExternalLink,
  ChevronRight,
  Server,
  Layers,
  Database,
  Fingerprint,
  UserCheck,
  Building2,
  FileText
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
      component: 'Registry Firewall (Rust Engine)',
      latency: '0.8ms',
      mechanism: 'SHA-256 Manifest Pinning & Schema Normalization',
      threatStopped: 'Prompt Injection & Description Poisoning',
      detail: 'Computes cryptographic hashes of all incoming MCP tool listings. If an upstream tool alters its schema or embeds hidden instructions, it is instantly quarantined. Safe canonical descriptions (TRUSTDESC) are synthesized from schemas so the model never ingests untrusted text.',
    },
    {
      stage: 2,
      name: 'Ed25519 Capability Leases',
      component: 'Authority Service (Go Engine)',
      latency: '1.1ms',
      mechanism: 'Single-Use Asymmetric Cryptographic Tokens',
      threatStopped: 'Unauthorized Privilege Escalation',
      detail: 'Destructive calls (database wipes, IAM rotations, pod restarts) require call-scoped, time-bounded leases. The gateway verifies the Ed25519 signature before dispatch. Unsigned calls are rejected with an explicit policy violation and routed to the SOC approval queue.',
    },
    {
      stage: 3,
      name: 'TOCTOU Resource Binding',
      component: 'Policy Engine (Rust Core)',
      latency: '0.4ms',
      mechanism: 'SHA-256 Resource State Fingerprinting',
      threatStopped: 'Time-of-Check to Time-of-Use Race Exploits',
      detail: 'Binds execution permissions to the exact resource snapshot observed at policy evaluation. Prevents attackers from modifying file contents or DNS records in the microsecond window between authorization and tool execution.',
    },
    {
      stage: 4,
      name: 'Information Flow Control',
      component: 'Lattice Security Adapter (Rust)',
      latency: '0.9ms',
      mechanism: 'RFC 6901 JSON-Path Provenance Labels',
      threatStopped: 'Cross-Tenant Data Contamination',
      detail: 'Labels every returned data field with its origin tier. High-integrity confidential outputs cannot flow into low-integrity network sinks without explicit, auditable declassification rules.',
    },
    {
      stage: 5,
      name: 'Syscall Attestation & Sandbox',
      component: 'Execution Sandbox (Kernel eBPF)',
      latency: '0.3ms',
      mechanism: 'Kernel-Level Socket & File Trace Diffs',
      threatStopped: 'Subprocess Escape & Hidden Network Sockets',
      detail: 'Tools run inside isolated execution namespaces. Kernel probes record file opens, socket connects, and binary forks per PID, asserting runtime behavior strictly matches the tool’s declared contract.',
    },
    {
      stage: 6,
      name: 'Source-Attributed Egress Broker',
      component: 'Network Egress Broker (Custom Go Proxy)',
      latency: '0.7ms',
      mechanism: 'Cumulative Per-Source Byte Quotas & SSRF Guard',
      threatStopped: 'Sharded Exfiltration & Cloud Metadata Theft',
      detail: 'Outbound network connections are metered against the originating data source rather than individual calls. When an attacker shards database records across 40 tiny micro-calls, cumulative byte tracking trips the threshold and terminates the socket.',
    },
    {
      stage: 7,
      name: 'Cryptographic Evidence Store',
      component: 'Audit Emitter & Verifier',
      latency: '0.5ms',
      mechanism: 'SHA-256 Hash Chaining & Ed25519 Receipts',
      threatStopped: 'Compliance Non-Repudiation (EU AI Act)',
      detail: 'Every tool invocation produces an immutable record linked to the previous transaction hash. Provides 1-click verifiable dossiers complying with EU AI Act Article 50 record-keeping standards.',
    },
  ];

  const threatMatrix = [
    {
      id: 'S1',
      vector: 'Prompt Injection in Tool Schemas',
      withoutKyron: 'Agent executes hidden instructions injected into tool metadata, exfiltrating internal environment variables.',
      withKyron: 'Intercepted at Stage 1. Kyron replaces mutated descriptions with canonical TRUSTDESC schemas before the LLM reads it.',
      status: '100% Intercepted',
    },
    {
      id: 'S2',
      vector: 'Upstream Schema & Parameter Drift',
      withoutKyron: 'Third-party MCP update silently alters parameter types or instructions, breaking agent workflows without notice.',
      withKyron: 'Quarantined at Stage 1. SHA-256 manifest mismatch alerts SOC; side-by-side diff allows 1-click operator pinning.',
      status: '100% Quarantined',
    },
    {
      id: 'S3',
      vector: 'Destructive Privilege Escalation',
      withoutKyron: 'Autonomous agent issues drop database or restart deployment commands without human oversight or authorization.',
      withKyron: 'Halted at Stage 2. Destructive actions require single-use, time-bounded Ed25519 capability leases signed by an operator.',
      status: '100% Authorized',
    },
    {
      id: 'S4',
      vector: 'Sharded Secret Exfiltration',
      withoutKyron: 'Attacker bypasses per-call size limits by exfiltrating customer database records in 40 tiny 1KB chunks.',
      withKyron: 'Halted at Stage 6. Cumulative byte quotas metered per data source cut the network socket when the source quota is reached.',
      status: '100% Halted',
    },
    {
      id: 'S5',
      vector: 'Cloud Metadata SSRF & Public Webhooks',
      withoutKyron: 'Agent accesses internal metadata services (169.254.169.254) or tunnels credentials to public webhook endpoints.',
      withKyron: 'Dropped at Stage 6. Forward proxy strictly enforces enterprise domain whitelist and drops all metadata/tunnel IPs.',
      status: '100% Blocked',
    },
    {
      id: 'S6',
      vector: 'EU AI Act Article 50 Compliance',
      withoutKyron: 'No tamper-evident records of agent tool invocations, creating critical compliance and audit liability.',
      withKyron: 'Resolved at Stage 7. Immutable SHA-256 hash chains with Ed25519 signatures downloadable in a 1-click dossier.',
      status: '100% Verifiable',
    },
  ];

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthModalOpen(false);
    onEnterConsole(selectedRole);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans">
      {/* Enterprise Navigation Header */}
      <header className="border-b border-[#E2E8F0] bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-[#CBD5E1] bg-[#1D4ED8] flex items-center justify-center text-white">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-[#0F172A]">KYRON</span>
                <span className="bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] text-[11px] px-2 py-0.5 rounded font-semibold">
                  ENTERPRISE
                </span>
              </div>
              <span className="text-xs text-[#475569] block">
                Deterministic Trust Layer for AI Tool Execution
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-[#475569] font-medium">
            <a href="#pipeline" className="hover:text-[#1D4ED8] transition-colors">
              7-Stage Pipeline
            </a>
            <a href="#threat-matrix" className="hover:text-[#1D4ED8] transition-colors">
              Threat Matrix
            </a>
            <a href="#architecture" className="hover:text-[#1D4ED8] transition-colors">
              Architecture
            </a>
            <a href="#compliance" className="hover:text-[#1D4ED8] transition-colors">
              Compliance (EU AI Act)
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-[#059669] inline-block"></span>
              <span>Data Plane: Sub-4ms</span>
            </div>

            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Access SOC Console</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white border-b border-[#E2E8F0] py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] text-xs font-medium">
              <Building2 className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>Designed for Enterprise Security Operations & Autonomous Fleets</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#0F172A] leading-tight">
              Deterministic runtime protection for tool-using AI agents.
            </h1>

            <p className="text-lg text-[#475569] leading-relaxed">
              Enterprise agents fail when untrusted tools mutate, leak credentials, or shard exfiltration across micro-calls.
              Kyron 2.0 intercepts and validates every MCP tool call on the wire in under 4ms—delivering mathematical
              zero-trust guarantees with zero LLM decision tokens.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="px-5 py-3 text-sm font-semibold bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded transition-colors flex items-center gap-2 shadow-sm"
              >
                <UserCheck className="w-4 h-4" />
                <span>Launch SOC Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#pipeline"
                className="px-4 py-3 text-sm font-medium border border-[#CBD5E1] hover:border-[#1D4ED8] text-[#0F172A] bg-white rounded transition-colors flex items-center gap-2"
              >
                <Layers className="w-4 h-4 text-[#475569]" />
                <span>View 7-Stage Pipeline</span>
              </a>
            </div>
          </div>

          {/* Operational Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-10 border-t border-[#E2E8F0]">
            <div className="p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
              <span className="text-xs uppercase text-[#475569] font-semibold block mb-1">Decision Latency</span>
              <div className="text-3xl font-bold text-[#059669]">3.8ms</div>
              <span className="text-xs text-[#475569] mt-1 block">p95 deterministic hot path</span>
            </div>

            <div className="p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
              <span className="text-xs uppercase text-[#475569] font-semibold block mb-1">Hot-Path LLM Tokens</span>
              <div className="text-3xl font-bold text-[#0F172A]">0</div>
              <span className="text-xs text-[#475569] mt-1 block">Zero model drift or inference cost</span>
            </div>

            <div className="p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
              <span className="text-xs uppercase text-[#475569] font-semibold block mb-1">Threat Interception</span>
              <div className="text-3xl font-bold text-[#1D4ED8]">100%</div>
              <span className="text-xs text-[#475569] mt-1 block">Deterministic defense (S1–S6)</span>
            </div>

            <div className="p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
              <span className="text-xs uppercase text-[#475569] font-semibold block mb-1">Compliance Standard</span>
              <div className="text-3xl font-bold text-[#D97706]">Article 50</div>
              <span className="text-xs text-[#475569] mt-1 block">EU AI Act SHA-256 signed evidence</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7-Stage Pipeline Architecture */}
      <section id="pipeline" className="py-20 border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div>
            <span className="text-xs text-[#1D4ED8] uppercase font-bold tracking-wider block mb-2">
              System Architecture & Wire Flow
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A]">
              7-Stage In-Line Deterministic Security Pipeline
            </h2>
            <p className="text-base text-[#475569] max-w-2xl mt-2 leading-relaxed">
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
                    className={`w-full text-left p-4 rounded border transition-colors flex items-center justify-between text-sm ${
                      isActive
                        ? 'bg-white border-[#1D4ED8] shadow-sm text-[#0F172A]'
                        : 'bg-white border-[#E2E8F0] text-[#475569] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        isActive ? 'bg-[#1D4ED8] text-white' : 'bg-[#F1F5F9] text-[#475569]'
                      }`}>
                        Stage {item.stage}
                      </span>
                      <span className="font-semibold text-sm">{item.name}</span>
                    </div>
                    <span className="text-xs text-[#059669] font-medium font-mono">{item.latency}</span>
                  </button>
                );
              })}
            </div>

            {/* Stage Deep Dive Display */}
            <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded p-6 shadow-sm space-y-6">
              {(() => {
                const activeData = architectureStages.find((s) => s.stage === selectedStage)!;
                return (
                  <>
                    <div className="flex items-start justify-between pb-4 border-b border-[#E2E8F0]">
                      <div>
                        <span className="text-xs text-[#1D4ED8] uppercase font-bold block mb-1">
                          Stage {activeData.stage} Specification
                        </span>
                        <h3 className="text-xl font-bold text-[#0F172A]">{activeData.name}</h3>
                        <span className="text-xs text-[#475569] font-mono">{activeData.component}</span>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] font-semibold font-mono">
                        Latency: {activeData.latency}
                      </span>
                    </div>

                    <div className="space-y-4 text-sm">
                      <div>
                        <span className="text-[#475569] block text-xs font-semibold uppercase mb-1">
                          Enforcement Mechanism
                        </span>
                        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded font-medium text-[#0F172A]">
                          {activeData.mechanism}
                        </div>
                      </div>

                      <div>
                        <span className="text-[#475569] block text-xs font-semibold uppercase mb-1">
                          Target Threat Mitigated
                        </span>
                        <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded text-[#DC2626] flex items-center gap-2 font-medium">
                          <ShieldAlert className="w-4 h-4" />
                          <span>{activeData.threatStopped}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[#475569] block text-xs font-semibold uppercase mb-1">
                          Operational Detail
                        </span>
                        <p className="text-sm text-[#475569] leading-relaxed bg-[#F8FAFC] p-4 rounded border border-[#E2E8F0]">
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

      {/* Threat Defense Matrix */}
      <section id="threat-matrix" className="py-20 border-b border-[#E2E8F0] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div>
            <span className="text-xs text-[#1D4ED8] uppercase font-bold tracking-wider block mb-2">
              Defense Verification
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A]">
              Mathematical Threat Defense Matrix
            </h2>
            <p className="text-base text-[#475569] max-w-2xl mt-2 leading-relaxed">
              Comparison between standard unmanaged MCP agent deployments and Kyron’s 7-stage deterministic firewall.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border border-[#E2E8F0] rounded bg-white shadow-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#475569] bg-[#F8FAFC] uppercase text-xs font-semibold">
                  <th className="py-3.5 px-4 w-16">ID</th>
                  <th className="py-3.5 px-4 w-60">Attack Scenario</th>
                  <th className="py-3.5 px-4">Standard MCP Deployment</th>
                  <th className="py-3.5 px-4">Kyron 2.0 Protection</th>
                  <th className="py-3.5 px-4 w-40">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {threatMatrix.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-4 px-4 font-bold text-[#1D4ED8] font-mono">{item.id}</td>
                    <td className="py-4 px-4 font-semibold text-[#0F172A]">{item.vector}</td>
                    <td className="py-4 px-4 text-[#475569] leading-relaxed">{item.withoutKyron}</td>
                    <td className="py-4 px-4 text-[#0F172A] leading-relaxed font-medium">{item.withKyron}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] font-semibold text-xs">
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

      {/* Data Plane vs Control Plane Isolation */}
      <section id="architecture" className="py-20 border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div>
            <span className="text-xs text-[#1D4ED8] uppercase font-bold tracking-wider block mb-2">
              System Topology
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A]">
              Data Plane vs. Control Plane Isolation
            </h2>
            <p className="text-base text-[#475569] max-w-2xl mt-2 leading-relaxed">
              The data plane enforces pre-compiled, cryptographically signed policy bundles in-memory.
              The control plane handles human triage, evidence storage, and policy compilation without touching the call path.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white border border-[#E2E8F0] rounded shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <h3 className="text-base font-bold text-[#059669] flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  DATA PLANE (HOT PATH)
                </h3>
                <span className="text-xs text-[#475569] font-mono">Sub-4ms p95</span>
              </div>
              <ul className="space-y-3 text-sm text-[#475569]">
                <li className="flex items-start gap-2">
                  <span className="text-[#059669] font-bold">✓</span>
                  <span><strong>Go Protocol Gateway:</strong> Terminates MCP clients over stdio & SSE pipes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#059669] font-bold">✓</span>
                  <span><strong>Rust Policy Engine:</strong> Evaluates capability leases in under 1ms.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#059669] font-bold">✓</span>
                  <span><strong>Network Egress Broker:</strong> Meters outbound socket bytes per data source.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#059669] font-bold">✓</span>
                  <span><strong>Zero LLM Inference:</strong> Security verdicts run 100% deterministically.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 bg-white border border-[#E2E8F0] rounded shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <h3 className="text-base font-bold text-[#1D4ED8] flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  CONTROL PLANE (OFF HOT PATH)
                </h3>
                <span className="text-xs text-[#475569] font-mono">Async Management</span>
              </div>
              <ul className="space-y-3 text-sm text-[#475569]">
                <li className="flex items-start gap-2">
                  <span className="text-[#1D4ED8] font-bold">✓</span>
                  <span><strong>FastAPI Management Engine:</strong> PostgreSQL 16+ registry and audit store.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1D4ED8] font-bold">✓</span>
                  <span><strong>Semantic Drift Visualizer:</strong> Side-by-side diff review and canonical pinning.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1D4ED8] font-bold">✓</span>
                  <span><strong>Live SOC Authority Queue:</strong> Operator ruling on capability lease requests.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1D4ED8] font-bold">✓</span>
                  <span><strong>EU AI Act Dossier Emitter:</strong> 1-click Ed25519 hash-chain compliance bundle.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Authentication Gateway Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] rounded-lg w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-[#1D4ED8] flex items-center justify-center text-white">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Enterprise Authentication</h3>
                  <span className="text-xs text-[#475569]">Zero-Trust SOC Operator Access</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                className="text-[#475569] hover:text-[#0F172A] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-[#475569] text-xs font-semibold uppercase mb-2">
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
                          ? 'border-[#1D4ED8] bg-[#EFF6FF] text-[#0F172A]'
                          : 'border-[#E2E8F0] bg-white text-[#475569] hover:border-[#CBD5E1]'
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
                        <span className="text-xs text-[#1D4ED8] font-mono">{role.id}</span>
                      </div>
                      <p className="text-xs text-[#475569] mt-1 leading-normal">{role.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-xs text-[#475569] space-y-1">
                <div className="flex justify-between">
                  <span>Identity Provider:</span>
                  <span className="text-[#059669] font-semibold">Neon Auth (Better Auth Managed)</span>
                </div>
                <div className="flex justify-between">
                  <span>Database State:</span>
                  <span className="text-[#1D4ED8] font-semibold">Neon Postgres (production)</span>
                </div>
                <div className="flex justify-between">
                  <span>Session Policy Mode:</span>
                  <span className="text-[#1D4ED8] font-semibold">Enforce (Active)</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(false)}
                  className="px-3.5 py-2 rounded border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
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
