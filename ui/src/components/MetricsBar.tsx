import React from 'react';
import { Shield, Lock, AlertTriangle, Cpu, Activity } from 'lucide-react';

interface MetricsBarProps {
  quarantinedCount: number;
  approvedCount: number;
  activeLeasesCount: number;
  attacksBlockedCount: number;
  impactLoading: boolean;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  quarantinedCount,
  approvedCount,
  activeLeasesCount,
  attacksBlockedCount,
  impactLoading,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* Metric 1: Verified Tools */}
      <div className="p-4 bg-white border border-[#E2E8F0] rounded shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#475569] text-xs font-semibold uppercase tracking-wider mb-2">
          <span>Verified Tools</span>
          <div className="w-6 h-6 rounded bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
            <Shield className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[#0F172A]">{approvedCount}</span>
          <span className="text-xs text-[#059669] font-medium">active pins</span>
        </div>
        <span className="text-xs text-[#64748B] mt-1 block">SHA-256 canonical manifests</span>
      </div>

      {/* Metric 2: Quarantined Threats */}
      <div className="p-4 bg-white border border-[#E2E8F0] rounded shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#475569] text-xs font-semibold uppercase tracking-wider mb-2">
          <span>Quarantined</span>
          <div className="w-6 h-6 rounded bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[#DC2626]">{quarantinedCount}</span>
          <span className="text-xs text-[#DC2626] font-medium">drifts</span>
        </div>
        <span className="text-xs text-[#64748B] mt-1 block">Pending operator triage</span>
      </div>

      {/* Metric 3: Active Capability Leases */}
      <div className="p-4 bg-white border border-[#E2E8F0] rounded shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#475569] text-xs font-semibold uppercase tracking-wider mb-2">
          <span>Active Leases</span>
          <div className="w-6 h-6 rounded bg-[#FFFBEB] text-[#D97706] flex items-center justify-center">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[#0F172A]">{activeLeasesCount}</span>
          <span className="text-xs text-[#D97706] font-medium">single-use</span>
        </div>
        <span className="text-xs text-[#64748B] mt-1 block">Ed25519-signed capability TTL</span>
      </div>

      {/* Metric 4: Intercepted Calls */}
      <div className="p-4 bg-white border border-[#E2E8F0] rounded shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#475569] text-xs font-semibold uppercase tracking-wider mb-2">
          <span>Calls Intercepted</span>
          <div className="w-6 h-6 rounded bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center">
            <Activity className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[#1D4ED8]" aria-live="polite">
            {impactLoading ? '—' : attacksBlockedCount.toLocaleString()}
          </span>
          <span className="text-xs text-[#1D4ED8] font-medium">blocked</span>
        </div>
        <span className="text-xs text-[#64748B] mt-1 block">Egress & injection defense</span>
      </div>

      {/* Metric 5: Hot-Path LLM Tokens */}
      <div className="col-span-2 lg:col-span-1 p-4 bg-white border border-[#E2E8F0] rounded shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#475569] text-xs font-semibold uppercase tracking-wider mb-2">
          <span>Hot-Path Tokens</span>
          <div className="w-6 h-6 rounded bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
            <Cpu className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[#059669]">0</span>
          <span className="text-xs text-[#059669] font-medium">tokens</span>
        </div>
        <span className="text-xs text-[#64748B] mt-1 block">Sub-4ms deterministic check</span>
      </div>
    </div>
  );
};
