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
    <div className="console-metric-panel rounded overflow-hidden shadow-sm mb-6">
      {/* Metric 1: Verified Tools */}
      <div className="console-metric-tile min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="landing-kicker text-[10px] truncate">01 / Verified Tools</span>
          <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-[#059669]">
            <Shield className="w-3.5 h-3.5" />
          </div>
        </div>
        <b className="console-metric-val text-[#0F172A] truncate">{approvedCount}</b>
        <div className="flex items-center justify-between gap-1 text-xs text-[#64748B] pt-1 border-t border-[#F1F5F9]">
          <span className="truncate">Pinned manifests</span>
          <span className="text-[#059669] font-mono text-[10px] font-bold flex-shrink-0">100% PINNED</span>
        </div>
      </div>

      {/* Metric 2: Quarantined Threats */}
      <div className="console-metric-tile min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="landing-kicker text-[10px] text-[#DC2626] truncate">02 / Quarantined</span>
          <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-[#DC2626]">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>
        <b className="console-metric-val text-[#DC2626] truncate">{quarantinedCount}</b>
        <div className="flex items-center justify-between gap-1 text-xs text-[#64748B] pt-1 border-t border-[#F1F5F9]">
          <span className="truncate">Drifts flagged</span>
          <span className="text-[#DC2626] font-mono text-[10px] font-bold flex-shrink-0">
            {quarantinedCount > 0 ? 'NEEDS REVIEW' : 'CLEAR'}
          </span>
        </div>
      </div>

      {/* Metric 3: Active Capability Leases */}
      <div className="console-metric-tile min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="landing-kicker text-[10px] text-[#D97706] truncate">03 / Active Leases</span>
          <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-[#D97706]">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>
        <b className="console-metric-val text-[#D97706] truncate">{activeLeasesCount}</b>
        <div className="flex items-center justify-between gap-1 text-xs text-[#64748B] pt-1 border-t border-[#F1F5F9]">
          <span className="truncate">Single-use TTL</span>
          <span className="text-[#D97706] font-mono text-[10px] font-bold flex-shrink-0">ED25519</span>
        </div>
      </div>

      {/* Metric 4: Intercepted Calls */}
      <div className="console-metric-tile min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="landing-kicker text-[10px] text-[#1D4ED8] truncate">04 / Blocked Calls</span>
          <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-[#1D4ED8]">
            <Activity className="w-3.5 h-3.5" />
          </div>
        </div>
        <b className="console-metric-val text-[#1D4ED8] truncate" aria-live="polite">
          {impactLoading ? '—' : attacksBlockedCount.toLocaleString()}
        </b>
        <div className="flex items-center justify-between gap-1 text-xs text-[#64748B] pt-1 border-t border-[#F1F5F9]">
          <span className="truncate">Egress & injections</span>
          <span className="text-[#1D4ED8] font-mono text-[10px] font-bold flex-shrink-0">INTERCEPTED</span>
        </div>
      </div>

      {/* Metric 5: Hot-Path LLM Tokens */}
      <div className="console-metric-tile min-w-0 col-span-2 sm:col-span-1 md:col-span-1">
        <div className="flex items-center justify-between gap-1">
          <span className="landing-kicker text-[10px] text-[#059669] truncate">05 / Hot-Path Tokens</span>
          <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-[#059669]">
            <Cpu className="w-3.5 h-3.5" />
          </div>
        </div>
        <b className="console-metric-val text-[#059669] truncate">0</b>
        <div className="flex items-center justify-between gap-1 text-xs text-[#64748B] pt-1 border-t border-[#F1F5F9]">
          <span className="truncate">Security overhead</span>
          <span className="text-[#059669] font-mono text-[10px] font-bold flex-shrink-0">SUB-4MS</span>
        </div>
      </div>
    </div>
  );
};
