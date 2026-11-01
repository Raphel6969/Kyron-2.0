import React from 'react';
import {
  ShieldCheck,
  AlertOctagon,
  Network,
  Cpu,
  FileCheck2,
  Lock,
  ArrowRight,
  ExternalLink,
  Activity,
  Server,
  Terminal,
  ScanSearch,
  CheckCircle2,
  Fingerprint,
  HardDrive
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

export const CommandOverview: React.FC<CommandOverviewProps> = ({
  quarantinedCount,
  approvedCount,
  activeLeasesCount,
  auditCount,
  onNavigateTab,
  onTriggerScan,
  onExportEUAct,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner / System Posture */}
      <div className="bg-white border border-[#E2E8F0] rounded p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669] inline-block"></span>
            <span className="text-sm text-[#0F172A] font-bold uppercase tracking-wider">
              Kyron In-Line Security Proxy: Enforce Mode Active
            </span>
          </div>
          <p className="text-sm text-[#475569] max-w-2xl leading-relaxed">
            In-line deterministic data plane active across stdio and HTTP/SSE transports. All tool definitions,
            in-flight parameters, and outbound network packets are metered with zero model tokens on the security hot path.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-stretch md:self-auto">
          <button
            type="button"
            onClick={onTriggerScan}
            className="flex-1 md:flex-initial px-4 py-2.5 text-xs font-semibold bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#CBD5E1] rounded transition-colors flex items-center justify-center gap-1.5"
          >
            <ScanSearch className="w-4 h-4 text-[#1D4ED8]" />
            <span>Audit Registry</span>
          </button>
          <button
            type="button"
            onClick={onExportEUAct}
            className="flex-1 md:flex-initial px-4 py-2.5 text-xs font-semibold bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Export EU AI Act Dossier</span>
          </button>
        </div>
      </div>

      {/* 7-Stage Gateway Data-Plane Architecture */}
      <div className="bg-white border border-[#E2E8F0] rounded p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-5">
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">
              7-Stage Deterministic Security Pipeline
            </h2>
            <p className="text-sm text-[#475569] mt-0.5">
              Every tool call traverses all seven deterministic gates before reaching execution or model context.
            </p>
          </div>
          <span className="text-xs text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-3 py-1 rounded font-semibold font-mono">
            Hot-Path p95: 3.8ms
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#475569] uppercase">Stage 1</span>
              <span className="text-xs text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded font-medium">
                Active
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#0F172A] mb-1">Registry Firewall</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              SHA-256 manifest pinning and TRUSTDESC synthesis. Strips prompt injections before model sees metadata.
            </p>
          </div>

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#475569] uppercase">Stage 2 & 3</span>
              <span className="text-xs text-[#1D4ED8] bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 rounded font-medium">
                Enforcing
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#0F172A] mb-1">Capability Leases</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              Single-use Ed25519-signed capability leases with TTL bounds and SHA-256 TOCTOU resource identity binding.
            </p>
          </div>

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#475569] uppercase">Stage 4 & 5</span>
              <span className="text-xs text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded font-medium">
                Attested
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#0F172A] mb-1">OpenAPPA IFC & Sandbox</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              Information-flow lattice check with RFC 6901 JSON-path provenance and Linux syscall attestation.
            </p>
          </div>

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#475569] uppercase">Stage 6 & 7</span>
              <span className="text-xs text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded font-medium">
                Verified
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#0F172A] mb-1">Egress & Signed Audit</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              Source-attributed network byte meters halting sharded exfiltration; SHA-256 hash-chained audit emitter.
            </p>
          </div>
        </div>
      </div>

      {/* Operational Triage Quick-Nav Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => onNavigateTab('registry')}
          className="bg-white border border-[#E2E8F0] p-6 rounded shadow-sm cursor-pointer hover:border-[#1D4ED8] transition-colors flex flex-col justify-between group"
        >
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#0F172A] font-bold">Tool Registry & Drift</span>
              <ArrowRight className="w-4 h-4 text-[#475569] group-hover:text-[#1D4ED8] transition-colors" />
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              Inspect {approvedCount} pinned enterprise tools and {quarantinedCount} quarantined threats with side-by-side semantic diffs.
            </p>
          </div>
          <div className="text-xs text-[#1D4ED8] flex items-center gap-1 font-semibold">
            <span>Review Registry →</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('approvals')}
          className="bg-white border border-[#E2E8F0] p-6 rounded shadow-sm cursor-pointer hover:border-[#1D4ED8] transition-colors flex flex-col justify-between group"
        >
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#0F172A] font-bold">Authority & Leases</span>
              <ArrowRight className="w-4 h-4 text-[#475569] group-hover:text-[#1D4ED8] transition-colors" />
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              {activeLeasesCount} active single-use leases. Grant or deny tool execution authority requests in real time.
            </p>
          </div>
          <div className="text-xs text-[#1D4ED8] flex items-center gap-1 font-semibold">
            <span>Manage Leases →</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('audit')}
          className="bg-white border border-[#E2E8F0] p-6 rounded shadow-sm cursor-pointer hover:border-[#1D4ED8] transition-colors flex flex-col justify-between group"
        >
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#0F172A] font-bold">Cryptographic Trail</span>
              <ArrowRight className="w-4 h-4 text-[#475569] group-hover:text-[#1D4ED8] transition-colors" />
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              {auditCount} hash-chained audit events with Ed25519 digital signatures complying with EU AI Act Article 50.
            </p>
          </div>
          <div className="text-xs text-[#1D4ED8] flex items-center gap-1 font-semibold">
            <span>Inspect Hash Chain →</span>
          </div>
        </div>
      </div>
    </div>
  );
};
