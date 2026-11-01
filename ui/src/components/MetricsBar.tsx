import React from 'react';
import { Shield, Lock, AlertTriangle, Cpu, Activity, Clock } from 'lucide-react';

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
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6 font-mono">
      {/* Metric 1: Verified Tools */}
      <div className="p-3.5 bg-[#0E1318] border border-[#1E2630] rounded flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#8A99A8] text-[11px] uppercase tracking-wider mb-2">
          <span>Verified Tools</span>
          <Shield className="w-3.5 h-3.5 text-[#10B981]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[#F0F4F8]">{approvedCount}</span>
          <span className="text-[11px] text-[#10B981]">pinned</span>
        </div>
        <span className="text-[10px] text-[#5C6B7A] mt-1 block">SHA-256 canonical manifests</span>
      </div>

      {/* Metric 2: Quarantined Threats */}
      <div className="p-3.5 bg-[#0E1318] border border-[#1E2630] rounded flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#8A99A8] text-[11px] uppercase tracking-wider mb-2">
          <span>Quarantined</span>
          <AlertTriangle className="w-3.5 h-3.5 text-[#F43F5E]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[#F43F5E]">{quarantinedCount}</span>
          <span className="text-[11px] text-[#F43F5E]">drifts</span>
        </div>
        <span className="text-[10px] text-[#5C6B7A] mt-1 block">Requires operator review</span>
      </div>

      {/* Metric 3: Active Leases */}
      <div className="p-3.5 bg-[#0E1318] border border-[#1E2630] rounded flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#8A99A8] text-[11px] uppercase tracking-wider mb-2">
          <span>Active Leases</span>
          <Lock className="w-3.5 h-3.5 text-[#F59E0B]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[#F0F4F8]">{activeLeasesCount}</span>
          <span className="text-[11px] text-[#F59E0B]">single-use</span>
        </div>
        <span className="text-[10px] text-[#5C6B7A] mt-1 block">Ed25519-signed capability TTL</span>
      </div>

      {/* Metric 4: Attacked Calls Blocked */}
      <div className="p-3.5 bg-[#0E1318] border border-[#1E2630] rounded flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#8A99A8] text-[11px] uppercase tracking-wider mb-2">
          <span>Calls Intercepted</span>
          <Activity className="w-3.5 h-3.5 text-[#0EA5E9]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[#0EA5E9]" aria-live="polite">
            {impactLoading ? '—' : attacksBlockedCount}
          </span>
          <span className="text-[11px] text-[#0EA5E9]">halted</span>
        </div>
        <span className="text-[10px] text-[#5C6B7A] mt-1 block">Egress & injection defense</span>
      </div>

      {/* Metric 5: Hot-Path Model Tokens */}
      <div className="col-span-2 lg:col-span-1 p-3.5 bg-[#0E1318] border border-[#1E2630] rounded flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#8A99A8] text-[11px] uppercase tracking-wider mb-2">
          <span>Security Tokens</span>
          <Cpu className="w-3.5 h-3.5 text-[#10B981]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[#10B981]">0</span>
          <span className="text-[11px] text-[#10B981]">tokens</span>
        </div>
        <span className="text-[10px] text-[#5C6B7A] mt-1 block">&lt;4ms deterministic evaluation</span>
      </div>
    </div>
  );
};
