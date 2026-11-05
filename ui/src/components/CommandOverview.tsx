import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Network,
  Cpu,
  FileCheck2,
  Lock,
  ArrowRight,
  ChevronRight,
  Activity,
  Server,
  ScanSearch,
  CheckCircle,
  Fingerprint,
  Layers,
  Check
} from 'lucide-react';

interface CommandOverviewProps {
  quarantinedCount: number;
  approvedCount: number;
  activeLeasesCount: number;
  auditCount: number;
  onNavigateTab: (tab: any) => void;
  onTriggerScan: () => void;
  onExportEUAct: () => void;
}

interface StageDetail {
  number: string;
  title: string;
  short: string;
  component: string;
  latency: string;
  mechanism: string;
  threatStopped: string;
  detail: string;
  status: string;
}

const pipelineStages: StageDetail[] = [
  {
    number: '01',
    title: 'Discover & Ingest',
    short: 'Tool enters boundary',
    component: 'Registry Firewall (Rust Engine)',
    latency: '0.8ms',
    mechanism: 'SHA-256 Manifest Pinning & Schema Normalization',
    threatStopped: 'Prompt Injection & Description Poisoning',
    detail: 'Kyron receives the MCP tool listing before the agent can read it, sanitizing Unicode homoglyphs and hidden instructions.',
    status: 'ENFORCING',
  },
  {
    number: '02',
    title: 'Normalize & TRUSTDESC',
    short: 'Synthesize clean contract',
    component: 'Schema Normalizer (Rust Engine)',
    latency: '0.4ms',
    mechanism: 'Deterministic Schema Projection & Zero-Loss Normalization',
    threatStopped: 'Model-Facing Rug Pulls & Adversarial System Prompts',
    detail: 'Replaces raw developer markdown with high-assurance synthetic descriptions, ensuring the agent sees only verified contracts.',
    status: 'ACTIVE',
  },
  {
    number: '03',
    title: 'Pin & Attest',
    short: 'Cryptographic identity',
    component: 'Tool Registry Store (PostgreSQL / Neon)',
    latency: '0.6ms',
    mechanism: 'SHA-256 Content Hashing & Ed25519 Signatures',
    threatStopped: 'Silent Schema Drifts & Unauthorized Mutations',
    detail: 'Approved tools receive a stable cryptographic identity. Any unauthorized change immediately quarantines the tool before execution.',
    status: 'VERIFIED',
  },
  {
    number: '04',
    title: 'Authorize & Scope',
    short: 'Expiring capability leases',
    component: 'Authority Service (Go Engine)',
    latency: '0.9ms',
    mechanism: 'Single-Use Capability Leases & Dual-Key Approval Queue',
    threatStopped: 'Privilege Escalation & High-Blast Radius Actions',
    detail: 'Binds execution permissions to the exact resource snapshot. Destructive actions suspend until a human SOC operator rules on the request.',
    status: 'GOVERNED',
  },
  {
    number: '05',
    title: 'Flow-Check (OpenAPPA)',
    short: 'Data movement tracking',
    component: 'Information Flow Control (In-Process Adapter)',
    latency: '0.5ms',
    mechanism: 'RFC 6901 JSON-Path Provenance & Label Combination Lattice',
    threatStopped: 'Cross-Tenant Contamination & Silent Poisoning',
    detail: 'Labels taint on tool inputs and outputs dynamically, halting calls if an unapproved sensitive source flows into an insecure sink.',
    status: 'ATTESTED',
  },
  {
    number: '06',
    title: 'Meter Egress',
    short: 'Source-attributed budgets',
    component: 'Network Egress Broker (Go Data Plane)',
    latency: '0.3ms',
    mechanism: 'Token Bucket Rate Limiting & Domain Destination Allowlist',
    threatStopped: 'Sharded Exfiltration & Covert Socket Channels',
    detail: 'Meters outbound TCP socket bytes per data source. Halts execution when the cumulative source threshold is exceeded.',
    status: 'METERED',
  },
  {
    number: '07',
    title: 'Prove & Seal',
    short: 'Cryptographic audit trail',
    component: 'Evidence Emitter (Ed25519 Cryptographic Signer)',
    latency: '0.3ms',
    mechanism: 'SHA-256 Hash Chaining & Ed25519 Signatures',
    threatStopped: 'Audit Tampering & Compliance Blindspots',
    detail: 'Emits a tamper-evident audit record chained to previous calls. 1-click generation of EU AI Act Article 50 compliance bundles.',
    status: 'SEALED',
  },
];

export const CommandOverview: React.FC<CommandOverviewProps> = ({
  quarantinedCount,
  approvedCount,
  activeLeasesCount,
  auditCount,
  onNavigateTab,
  onTriggerScan,
  onExportEUAct,
}) => {
  const [selectedStage, setSelectedStage] = useState<number>(0);
  const activeStage = pipelineStages[selectedStage];

  return (
    <div className="space-y-6">
      {/* Top Banner / System Posture Hero — Resonating with Landing Hero */}
      <div className="console-card overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="landing-kicker text-[10px]">
                <span className="landing-kicker-dot" /> LIVE PROTECTION PLANE
              </span>
              <span className="landing-live text-[10px]">
                <i /> ENFORCE MODE
              </span>
              <span className="text-xs text-[#94A3B8]">|</span>
              <span className="text-xs text-[#64748B] font-mono">Stock MCP Gateway :8080</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
              Let agents move fast. <span className="text-[#1D4ED8]">Keep authority yours.</span>
            </h1>
            <p className="text-sm text-[#475569] leading-relaxed">
              Deterministic trust layer active between your AI agent fleet and reachable tools. Tool manifests,
              in-flight parameters, and outbound socket packets are verified with zero security tokens on the hot path.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 self-stretch lg:self-auto">
            <button
              type="button"
              onClick={onTriggerScan}
              className="landing-button landing-button-secondary text-xs h-10 px-4"
            >
              <ScanSearch className="w-4 h-4 text-[#1D4ED8]" />
              <span>Scan Registry</span>
            </button>
            <button
              type="button"
              onClick={onExportEUAct}
              className="landing-button landing-button-primary text-xs h-10 px-4"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Export Article 50 Dossier</span>
            </button>
          </div>
        </div>

        {/* Visual Flow Strip */}
        <div className="px-6 py-4 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#475569] border-b border-[#E2E8F0]">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <Network className="w-4 h-4 text-[#1D4ED8] flex-shrink-0" />
            <span className="font-semibold text-[#0F172A]">Agent Request</span>
            <span className="text-[#94A3B8]">→</span>
            <span className="font-mono text-[#059669]">7 Deterministic Gates</span>
            <span className="text-[#94A3B8]">→</span>
            <Server className="w-4 h-4 text-[#1D4ED8] flex-shrink-0" />
            <span className="font-semibold text-[#0F172A]">Governed Tool Dispatch</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] font-mono text-[#64748B] flex-shrink-0">
            <span><b>7</b> decision gates</span>
            <span><b>0</b> model tokens</span>
            <span><b>1</b> signed trail</span>
            <span className="text-[#059669] font-bold">Sub-4ms p95</span>
          </div>
        </div>
      </div>

      {/* 7-Stage Pipeline Interactive Explorer — Resonating with Landing Stage Panel */}
      <div className="console-card">
        <div className="console-card-header flex items-center justify-between">
          <div>
            <p className="landing-kicker text-[10px]">01 / The Protection Sequence</p>
            <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
              7-Stage Deterministic Security Pipeline
            </h2>
          </div>
          <span className="text-xs text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-1 rounded font-semibold font-mono">
            Hot-Path p95: 3.8ms
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: 7 Stages List */}
          <div className="lg:col-span-5 border border-[#E2E8F0] divide-y divide-[#E2E8F0] rounded overflow-hidden bg-white">
            {pipelineStages.map((stage, idx) => (
              <button
                key={stage.number}
                type="button"
                onClick={() => setSelectedStage(idx)}
                className={`w-full text-left p-3.5 flex items-center justify-between transition-all ${
                  selectedStage === idx
                    ? 'bg-[#EFF6FF] border-l-4 border-l-[#1D4ED8] text-[#0F172A]'
                    : 'bg-white hover:bg-[#F8FAFC] text-[#475569]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-xs font-bold ${selectedStage === idx ? 'text-[#1D4ED8]' : 'text-[#94A3B8]'}`}>
                    {stage.number}
                  </span>
                  <div>
                    <strong className="block text-xs font-bold text-[#0F172A]">{stage.title}</strong>
                    <small className="text-[11px] text-[#64748B]">{stage.short}</small>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-[#CBD5E1] text-[#475569]">
                    {stage.latency}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 ${selectedStage === idx ? 'text-[#1D4ED8]' : 'text-[#CBD5E1]'}`} />
                </div>
              </button>
            ))}
          </div>

          {/* Right Column: Active Stage Inspector */}
          <div className="lg:col-span-7 border border-[#E2E8F0] rounded p-6 bg-[#F8FAFC] flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div>
                  <span className="landing-kicker text-[10px]">Decision Gate {activeStage.number}</span>
                  <h3 className="text-lg font-bold text-[#0F172A] tracking-tight">{activeStage.title}</h3>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669]">
                  {activeStage.status}
                </span>
              </div>

              <p className="text-sm text-[#475569] leading-relaxed">
                {activeStage.detail}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                <div className="p-3 bg-white border border-[#E2E8F0] rounded">
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-1">Enforcement Component</span>
                  <span className="font-semibold text-[#0F172A]">{activeStage.component}</span>
                </div>
                <div className="p-3 bg-white border border-[#E2E8F0] rounded">
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-1">Defense Latency</span>
                  <span className="font-mono font-bold text-[#059669]">{activeStage.latency} overhead</span>
                </div>
                <div className="p-3 bg-white border border-[#E2E8F0] rounded">
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-1">Mechanism</span>
                  <span className="text-[#475569]">{activeStage.mechanism}</span>
                </div>
                <div className="p-3 bg-white border border-[#E2E8F0] rounded">
                  <span className="text-[10px] uppercase font-bold text-[#DC2626] block mb-1">Threat Stopped</span>
                  <span className="text-[#DC2626] font-semibold">{activeStage.threatStopped}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-xs text-[#059669]">
              <div className="flex items-center gap-1.5 font-mono text-[11px] min-w-0">
                <Check className="w-3.5 h-3.5 text-[#059669] flex-shrink-0" />
                <span className="truncate">Deterministic check · Sub-4ms p95 · Zero LLM token consumption</span>
              </div>
              <span className="text-[#1D4ED8] font-mono text-[10px] flex-shrink-0">VERIFIED GATE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Triage Quick-Nav Cards — Resonating with Landing Operator Rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tool Registry */}
        <div
          onClick={() => onNavigateTab('registry')}
          className="console-card p-5 cursor-pointer hover:border-[#1D4ED8] transition-all flex flex-col justify-between group h-full min-h-[170px]"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="landing-kicker text-[10px]">01 / Tool Registry</span>
              <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#1D4ED8] transition-colors" />
            </div>
            <h4 className="text-sm font-bold text-[#0F172A]">Registry & Drift</h4>
            <p className="text-xs text-[#475569] leading-relaxed">
              {approvedCount} pinned tools, {quarantinedCount} quarantined threats. Side-by-side semantic diff review.
            </p>
          </div>
          <div className="pt-3 border-t border-[#F1F5F9] text-xs text-[#1D4ED8] font-bold flex items-center justify-between">
            <span>Inspect Tools</span>
            <span className="font-mono text-[11px]">→</span>
          </div>
        </div>

        {/* Card 2: Authority & Leases */}
        <div
          onClick={() => onNavigateTab('approvals')}
          className="console-card p-5 cursor-pointer hover:border-[#1D4ED8] transition-all flex flex-col justify-between group h-full min-h-[170px]"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="landing-kicker text-[10px]">02 / Authority Queue</span>
              <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#1D4ED8] transition-colors" />
            </div>
            <h4 className="text-sm font-bold text-[#0F172A]">Capability Leases</h4>
            <p className="text-xs text-[#475569] leading-relaxed">
              {activeLeasesCount} active single-use leases. Grant or deny tool execution authority requests in real time.
            </p>
          </div>
          <div className="pt-3 border-t border-[#F1F5F9] text-xs text-[#1D4ED8] font-bold flex items-center justify-between">
            <span>Manage Leases</span>
            <span className="font-mono text-[11px]">→</span>
          </div>
        </div>

        {/* Card 3: Network Egress */}
        <div
          onClick={() => onNavigateTab('egress')}
          className="console-card p-5 cursor-pointer hover:border-[#1D4ED8] transition-all flex flex-col justify-between group h-full min-h-[170px]"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="landing-kicker text-[10px]">03 / Boundary Guard</span>
              <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#1D4ED8] transition-colors" />
            </div>
            <h4 className="text-sm font-bold text-[#0F172A]">Network Egress</h4>
            <p className="text-xs text-[#475569] leading-relaxed">
              Source-attributed outbound byte limits and domain destination allowlists to prevent data exfiltration.
            </p>
          </div>
          <div className="pt-3 border-t border-[#F1F5F9] text-xs text-[#1D4ED8] font-bold flex items-center justify-between">
            <span>View Limits</span>
            <span className="font-mono text-[11px]">→</span>
          </div>
        </div>

        {/* Card 4: Cryptographic Trail */}
        <div
          onClick={() => onNavigateTab('audit')}
          className="console-card p-5 cursor-pointer hover:border-[#1D4ED8] transition-all flex flex-col justify-between group h-full min-h-[170px]"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="landing-kicker text-[10px]">04 / Compliance Trail</span>
              <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#1D4ED8] transition-colors" />
            </div>
            <h4 className="text-sm font-bold text-[#0F172A]">Evidence Store</h4>
            <p className="text-xs text-[#475569] leading-relaxed">
              {auditCount} hash-chained events with Ed25519 digital signatures complying with EU AI Act Article 50.
            </p>
          </div>
          <div className="pt-3 border-t border-[#F1F5F9] text-xs text-[#1D4ED8] font-bold flex items-center justify-between">
            <span>Verify Chain</span>
            <span className="font-mono text-[11px]">→</span>
          </div>
        </div>
      </div>
    </div>
  );
};
