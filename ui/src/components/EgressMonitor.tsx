import React from 'react';
import { Network, ShieldAlert, CheckCircle, Ban, ArrowUpRight, HardDrive } from 'lucide-react';

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
    { domain: 'webhook.site', status: 'blocked', category: 'Public Tunnel' },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white border border-[#E2E8F0] rounded p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-5">
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">
              Source-Attributed Network Egress Broker
            </h2>
            <p className="text-xs text-[#475569] mt-0.5">
              Outbound connections metered per originating data source to defeat sharded exfiltration across multiple micro-calls.
            </p>
          </div>
          <span className="text-xs text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-3 py-1 rounded font-semibold font-mono">
            Enforcing Source Quotas
          </span>
        </div>

        {/* Source Budgets Grid */}
        <div className="space-y-3.5 text-xs">
          {sources.map((src) => {
            const pct = Math.min((src.used_bytes / src.budget_bytes) * 100, 100);
            const isHalted = src.status === 'halted';
            return (
              <div key={src.source_id} className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-[#475569]" />
                    <span className="font-bold text-sm text-[#0F172A]">{src.label}</span>
                    <span className="text-xs text-[#64748B] font-mono">({src.source_id})</span>
                  </div>
                  <div>
                    <span
                      className={`text-xs uppercase px-2.5 py-0.5 rounded font-bold border ${
                        isHalted
                          ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                          : 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                      }`}
                    >
                      {src.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-[#475569] font-mono">
                    <span>
                      {(src.used_bytes / 1024).toFixed(0)} KB / {(src.budget_bytes / 1024).toFixed(0)} KB metered
                    </span>
                    <span className="font-semibold">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${isHalted ? 'bg-[#DC2626]' : 'bg-[#1D4ED8]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="text-xs text-[#475569] flex items-center justify-between pt-1 font-mono">
                  <span>Calls tracked: {src.call_count}</span>
                  <span className={isHalted ? 'text-[#DC2626] font-semibold' : 'text-[#475569]'}>
                    {src.reason}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Network Whitelist & Blocklist Table */}
      <div className="bg-white border border-[#E2E8F0] rounded p-6 shadow-sm">
        <h3 className="text-sm font-bold text-[#0F172A] mb-4">
          Destination Whitelist & SSRF Guard Policy
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#475569] bg-[#F8FAFC] uppercase text-[11px] font-semibold">
                <th className="py-3 px-3">Destination Host</th>
                <th className="py-3 px-3">Verdict</th>
                <th className="py-3 px-3">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {destinations.map((dst) => (
                <tr key={dst.domain} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-3 font-semibold text-[#0F172A] font-mono text-xs">{dst.domain}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold uppercase border ${
                        dst.status === 'allowed'
                          ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                          : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                      }`}
                    >
                      {dst.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#475569]">{dst.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
