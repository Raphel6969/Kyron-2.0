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
      <div className="bg-[#0E1318] border border-[#1E2630] rounded p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block animate-pulse"></span>
            <span className="font-mono text-xs text-[#F0F4F8] font-bold uppercase tracking-wider">
              Kyron 2.0 In-Line Proxy: ENFORCE MODE
            </span>
          </div>
          <p className="text-xs text-[#8A99A8] max-w-2xl font-sans">
            In-line deterministic data plane active across stdio and HTTP/SSE transports. All tool definitions,
            in-flight parameters, and outbound network packets are metered with zero model tokens on the security hot path.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto font-mono">
          <button
            type="button"
            onClick={onTriggerScan}
            className="flex-1 md:flex-initial px-3 py-2 text-xs font-semibold bg-[#141B22] hover:bg-[#1E2630] text-[#F0F4F8] border border-[#1E2630] rounded transition-colors flex items-center justify-center gap-1.5"
          >
            <ScanSearch className="w-3.5 h-3.5 text-[#0EA5E9]" />
            <span>Audit Registry</span>
          </button>
          <button
            type="button"
            onClick={onExportEUAct}
            className="flex-1 md:flex-initial px-3.5 py-2 text-xs font-semibold bg-[#0EA5E9] hover:bg-[#38BDF8] text-[#080B0E] rounded transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Export EU AI Act Dossier</span>
          </button>
        </div>
      </div>

      {/* 7-Stage Gateway Data-Plane Architecture Matrix */}
      <div className="bg-[#0E1318] border border-[#1E2630] rounded p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2630] mb-4 font-mono">
          <div>
            <h2 className="text-sm font-bold text-[#F0F4F8]">
              7-Stage Deterministic Security Pipeline
            </h2>
            <p className="text-xs text-[#8A99A8] font-sans">
              Every tool call traverses all seven deterministic gates before reaching execution or model context.
            </p>
          </div>
          <span className="text-[11px] text-[#10B981] bg-[#141B22] border border-[#1E2630] px-2.5 py-1 rounded">
            Hot-Path p95: 3.8ms
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
          <div className="bg-[#141B22] border border-[#1E2630] p-3.5 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-[#8A99A8] uppercase">Stage 1</span>
              <span className="text-[10px] text-[#10B981] bg-[#0E1318] border border-[#1E2630] px-1.5 py-0.5 rounded">
                Active
              </span>
            </div>
            <h3 className="text-xs font-bold text-[#F0F4F8] mb-1">Registry Firewall</h3>
            <p className="text-[11px] text-[#8A99A8] leading-relaxed font-sans">
              SHA-256 manifest pinning and TRUSTDESC synthesis. Strips prompt injections before model sees metadata.
            </p>
          </div>

          <div className="bg-[#141B22] border border-[#1E2630] p-3.5 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-[#8A99A8] uppercase">Stage 2 & 3</span>
              <span className="text-[10px] text-[#0EA5E9] bg-[#0E1318] border border-[#1E2630] px-1.5 py-0.5 rounded">
                Enforcing
              </span>
            </div>
            <h3 className="text-xs font-bold text-[#F0F4F8] mb-1">Capability Leases</h3>
            <p className="text-[11px] text-[#8A99A8] leading-relaxed font-sans">
              Single-use Ed25519-signed capability leases with TTL bounds and SHA-256 TOCTOU resource identity binding.
            </p>
          </div>

          <div className="bg-[#141B22] border border-[#1E2630] p-3.5 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-[#8A99A8] uppercase">Stage 4 & 5</span>
              <span className="text-[10px] text-[#10B981] bg-[#0E1318] border border-[#1E2630] px-1.5 py-0.5 rounded">
                Attested
              </span>
            </div>
            <h3 className="text-xs font-bold text-[#F0F4F8] mb-1">OpenAPPA IFC & Sandbox</h3>
            <p className="text-[11px] text-[#8A99A8] leading-relaxed font-sans">
              Information-flow lattice check with RFC 6901 JSON-path provenance and Linux syscall attestation.
            </p>
          </div>

          <div className="bg-[#141B22] border border-[#1E2630] p-3.5 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-[#8A99A8] uppercase">Stage 6 & 7</span>
              <span className="text-[10px] text-[#10B981] bg-[#0E1318] border border-[#1E2630] px-1.5 py-0.5 rounded">
                Verified
              </span>
            </div>
            <h3 className="text-xs font-bold text-[#F0F4F8] mb-1">Egress & Signed Audit</h3>
            <p className="text-[11px] text-[#8A99A8] leading-relaxed font-sans">
              Source-attributed network byte meters halting sharded exfiltration; SHA-256 hash-chained audit emitter.
            </p>
          </div>
        </div>
      </div>

      {/* Operational Triage Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        <div
          onClick={() => onNavigateTab('registry')}
          className="bg-[#0E1318] border border-[#1E2630] p-5 rounded cursor-pointer hover:border-[#0EA5E9] transition-colors flex flex-col justify-between group"
        >
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#F0F4F8] font-bold">Tool Registry & Drift</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#8A99A8] group-hover:text-[#0EA5E9] transition-colors" />
            </div>
            <p className="text-xs text-[#8A99A8] font-sans">
              Inspect {approvedCount} pinned enterprise tools and {quarantinedCount} quarantined threats with side-by-side semantic diffs.
            </p>
          </div>
          <div className="text-xs text-[#0EA5E9] flex items-center gap-1 font-semibold">
            <span>Review Registry →</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('approvals')}
          className="bg-[#0E1318] border border-[#1E2630] p-5 rounded cursor-pointer hover:border-[#0EA5E9] transition-colors flex flex-col justify-between group"
        >
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#F0F4F8] font-bold">Authority & Leases</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#8A99A8] group-hover:text-[#0EA5E9] transition-colors" />
            </div>
            <p className="text-xs text-[#8A99A8] font-sans">
              {activeLeasesCount} active single-use leases. Grant or deny tool execution authority requests in real time.
            </p>
          </div>
          <div className="text-xs text-[#0EA5E9] flex items-center gap-1 font-semibold">
            <span>Manage Leases →</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('audit')}
          className="bg-[#0E1318] border border-[#1E2630] p-5 rounded cursor-pointer hover:border-[#0EA5E9] transition-colors flex flex-col justify-between group"
        >
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#F0F4F8] font-bold">Cryptographic Trail</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#8A99A8] group-hover:text-[#0EA5E9] transition-colors" />
            </div>
            <p className="text-xs text-[#8A99A8] font-sans">
              {auditCount} hash-chained audit events with Ed25519 digital signatures complying with EU AI Act Article 50.
            </p>
          </div>
          <div className="text-xs text-[#0EA5E9] flex items-center gap-1 font-semibold">
            <span>Inspect Hash Chain →</span>
          </div>
        </div>
      </div>
    </div>
  );
};
