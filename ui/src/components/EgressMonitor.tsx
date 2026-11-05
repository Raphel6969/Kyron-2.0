import React from 'react';
import { Network, ShieldAlert, CheckCircle, Ban, ArrowUpRight, HardDrive, Check, Lock } from 'lucide-react';

export const EgressMonitor: React.FC = () => {
  const sources = [
    {
      source_id: 'db:internal_postgres',
      label: 'Production Database Dump',
      used_bytes: 524288,
      budget_bytes: 524288,
      call_count: 41,
      status: 'halted',
      reason: 'Source cumulative byte budget exhausted (Scenario S4 halted)',
    },
    {
      source_id: 'api:stripe_customers',
      label: 'Financial Customer Records',
      used_bytes: 14280,
      budget_bytes: 1048576,
      call_count: 6,
      status: 'active',
      reason: 'Traffic within baseline budget',
    },
    {
      source_id: 'github:repo_contents',
      label: 'Source Code Tree',
      used_bytes: 84320,
      budget_bytes: 2097152,
      call_count: 12,
      status: 'active',
      reason: 'Traffic within baseline budget',
    },
  ];

  const destinations = [
    { domain: 'api.github.com', status: 'allowed', category: 'Enterprise Whitelist' },
    { domain: 'api.stripe.com', status: 'allowed', category: 'Payment Gateway' },
    { domain: '169.254.169.254', status: 'blocked', category: 'Cloud Metadata SSRF Target' },
    { domain: 'evil-exfil.com', status: 'blocked', category: 'Covert Side-Channel Tunnel' },
    { domain: 'webhook.site', status: 'blocked', category: 'Public Infiltration Tunnel' },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Source-Attributed Byte Quotas */}
      <div className="console-card overflow-hidden">
        <div className="console-card-header flex items-center justify-between">
          <div>
            <p className="landing-kicker text-[10px]">03 / Boundary Firebreak</p>
            <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
              Source-Attributed Network Egress Broker
            </h2>
          </div>
          <span className="text-xs text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-1 rounded font-semibold font-mono">
            Enforcing Source Quotas
          </span>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-[#475569] leading-relaxed">
            Outbound socket connections metered per originating data source to defeat sharded exfiltration across micro-calls.
          </p>

          <div className="space-y-3.5 text-xs">
            {sources.map((src) => {
              const pct = Math.min((src.used_bytes / src.budget_bytes) * 100, 100);
              const isHalted = src.status === 'halted';
              return (
                <div key={src.source_id} className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <HardDrive className="w-4 h-4 text-[#475569] flex-shrink-0" />
                      <span className="font-bold text-sm text-[#0F172A] truncate">{src.label}</span>
                      <span className="text-xs text-[#64748B] font-mono truncate">({src.source_id})</span>
                    </div>
                    <div>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border flex-shrink-0 ${
                          isHalted
                            ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                            : 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                        }`}
                      >
                        {src.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Progress Meter */}
                  <div>
                    <div className="flex justify-between text-[11px] text-[#64748B] mb-1 font-mono">
                      <span>Consumed: {(src.used_bytes / 1024).toFixed(1)} KB</span>
                      <span>Budget: {(src.budget_bytes / 1024).toFixed(0)} KB</span>
                    </div>
                    <div className="h-2 w-full bg-[#E2E8F0] rounded overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isHalted ? 'bg-[#DC2626]' : pct > 75 ? 'bg-[#D97706]' : 'bg-[#059669]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-[#64748B] pt-1 border-t border-[#E2E8F0]/60">
                    <span className="text-[#DC2626] font-medium truncate">{src.reason}</span>
                    <span className="font-mono flex-shrink-0">{src.call_count} governed calls</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Destination Domain Firewall Table */}
      <div className="console-card overflow-hidden">
        <div className="console-card-header flex items-center justify-between">
          <div>
            <p className="landing-kicker text-[10px]">Egress Allowlist</p>
            <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
              Network Destination Policy Enforcement
            </h3>
          </div>
          <span className="text-xs text-[#1D4ED8] bg-[#EFF6FF] border border-[#BFDBFE] px-2.5 py-1 rounded font-mono font-semibold">
            5 Configured Routes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[640px]">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#475569] bg-[#F8FAFC] font-mono text-[10px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4 w-[45%]">Destination Host / CIDR</th>
                <th className="py-3 px-4 w-[35%]">Classification</th>
                <th className="py-3 px-4 w-[20%]">Firewall Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] bg-white">
              {destinations.map((dst) => {
                const isAllowed = dst.status === 'allowed';
                return (
                  <tr key={dst.domain} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">
                      {dst.domain}
                    </td>
                    <td className="py-3 px-4 text-[#475569]">
                      {dst.category}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          isAllowed
                            ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                            : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                        }`}
                      >
                        {isAllowed ? <Check className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                        <span>{dst.status.toUpperCase()}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
