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
  Server
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
      <div className="bg-surface-raised border border-neutral-border rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-status-success inline-block"></span>
            <span className="font-mono text-xs text-gray-200 font-semibold uppercase tracking-wider">
              Kyron 2.0 Data Plane Status: Operational (Enforce Mode)
            </span>
          </div>
          <p className="text-xs text-neutral-muted max-w-2xl">
            In-line deterministic proxy active across stdio and HTTP/SSE transports. All tool definitions, in-flight
            arguments, and outbound network packets are metered with zero model tokens on the security hot path.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={onTriggerScan}
            className="flex-1 md:flex-initial px-3 py-2 text-xs font-mono font-medium bg-surface-base hover:bg-neutral-border text-gray-200 border border-neutral-border rounded transition-colors"
          >
            Audit Tool Registry
          </button>
          <button
            onClick={onExportEUAct}
            className="flex-1 md:flex-initial px-3 py-2 text-xs font-mono font-medium bg-accent hover:bg-accent-hover text-white rounded transition-colors flex items-center justify-center gap-1.5"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            Export EU AI Act Dossier
          </button>
        </div>
      </div>

      {/* 7-Stage Gateway Data-Plane Architecture */}
      <div className="bg-surface-raised border border-neutral-border rounded-lg p-5">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-border mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-200 font-mono">
              7-Stage Deterministic Security Pipeline
            </h2>
            <p className="text-xs text-neutral-muted">
              Every tool call traverses all seven deterministic gates before reaching execution or model context.
            </p>
          </div>
          <span className="font-mono text-[11px] text-neutral-muted bg-surface-base border border-neutral-border px-2 py-0.5 rounded">
            Hot-Path p95: 3.8ms
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-surface-base border border-neutral-border p-3.5 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-neutral-muted uppercase">Stage 1</span>
              <span className="text-[10px] font-mono text-status-success bg-surface-raised border border-neutral-border px-1.5 py-0.5 rounded">
                Active
              </span>
            </div>
            <h3 className="text-xs font-semibold text-gray-200 font-mono mb-1">Registry Firewall</h3>
            <p className="text-[11px] text-neutral-muted leading-relaxed">
              SHA-256 manifest pinning and TRUSTDESC synthesis. Strips prompt injections before model sees metadata.
            </p>
          </div>

          <div className="bg-surface-base border border-neutral-border p-3.5 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-neutral-muted uppercase">Stage 2 & 3</span>
              <span className="text-[10px] font-mono text-accent bg-surface-raised border border-neutral-border px-1.5 py-0.5 rounded">
                Enforcing
              </span>
            </div>
            <h3 className="text-xs font-semibold text-gray-200 font-mono mb-1">Capability Leases</h3>
            <p className="text-[11px] text-neutral-muted leading-relaxed">
              Single-use Ed25519-signed capability leases with TTL bounds and SHA-256 TOCTOU resource identity binding.
            </p>
          </div>

          <div className="bg-surface-base border border-neutral-border p-3.5 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-neutral-muted uppercase">Stage 4 & 5</span>
              <span className="text-[10px] font-mono text-status-success bg-surface-raised border border-neutral-border px-1.5 py-0.5 rounded">
                In-Process
              </span>
            </div>
            <h3 className="text-xs font-semibold text-gray-200 font-mono mb-1">OpenAPPA IFC & Sandbox</h3>
            <p className="text-[11px] text-neutral-muted leading-relaxed">
              Information-flow lattice check with RFC 6901 JSON-path provenance and Linux syscall attestation.
            </p>
          </div>

          <div className="bg-surface-base border border-neutral-border p-3.5 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-neutral-muted uppercase">Stage 6 & 7</span>
              <span className="text-[10px] font-mono text-status-success bg-surface-raised border border-neutral-border px-1.5 py-0.5 rounded">
                Verified
              </span>
            </div>
            <h3 className="text-xs font-semibold text-gray-200 font-mono mb-1">Egress & Signed Audit</h3>
            <p className="text-[11px] text-neutral-muted leading-relaxed">
              Source-attributed network byte meters halting sharded exfiltration; SHA-256 hash-chained audit emitter.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigateTab('registry')}
          className="bg-surface-raised border border-neutral-border p-4 rounded-lg cursor-pointer hover:border-neutral-muted transition-colors flex flex-col justify-between"
        >
          <div className="space-y-1 mb-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-gray-200 font-semibold">Tool Registry</span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-muted" />
            </div>
            <p className="text-xs text-neutral-muted">
              Inspect {approvedCount} approved tools and {quarantinedCount} quarantined threats with side-by-side semantic diffs.
            </p>
          </div>
          <div className="font-mono text-xs text-accent flex items-center gap-1">
            <span>Manage Registry</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('approvals')}
          className="bg-surface-raised border border-neutral-border p-4 rounded-lg cursor-pointer hover:border-neutral-muted transition-colors flex flex-col justify-between"
        >
          <div className="space-y-1 mb-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-gray-200 font-semibold">Authority Queue</span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-muted" />
            </div>
            <p className="text-xs text-neutral-muted">
              {activeLeasesCount} active single-use leases. Grant or deny tool execution authority requests in real time.
            </p>
          </div>
          <div className="font-mono text-xs text-accent flex items-center gap-1">
            <span>Review Requests</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('audit')}
          className="bg-surface-raised border border-neutral-border p-4 rounded-lg cursor-pointer hover:border-neutral-muted transition-colors flex flex-col justify-between"
        >
          <div className="space-y-1 mb-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-gray-200 font-semibold">Cryptographic Trail</span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-muted" />
            </div>
            <p className="text-xs text-neutral-muted">
              {auditCount} hash-chained audit events with Ed25519 digital signatures complying with EU AI Act Article 50.
            </p>
          </div>
          <div className="font-mono text-xs text-accent flex items-center gap-1">
            <span>View Signatures</span>
          </div>
        </div>
      </div>
    </div>
  );
};
