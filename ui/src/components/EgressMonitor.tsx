import React from 'react';
import { Network, ShieldAlert, CheckCircle, Ban, ArrowUpRight, HardDrive } from 'lucide-react';

export const EgressMonitor: React.FC = () => {
  const sources = [
    {
      source_id: 'db:internal_postgres',
      label: 'Production DB Dump',
      used_bytes: 524288,
      budget_bytes: 524288,
      call_count: 41,
      status: 'halted',
      reason: 'Source cumulative byte budget exhausted (Scenario S4 halted)',
    },
    {
      source_id: 'api:stripe_customers',
      label: 'Financial Records',
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
    { domain: '169.254.169.254', status: 'blocked', category: 'Cloud Metadata SSRF' },
    { domain: 'evil-exfil.com', status: 'blocked', category: 'Covert Side-Channel' },
    { domain: 'webhook.site', status: 'blocked', category: 'Public Tunnel' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-surface-raised border border-neutral-border rounded-lg p-5">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-border mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-200 font-mono">
              Source-Attributed Network Egress Broker (C8)
            </h2>
            <p className="text-xs text-neutral-muted">
              Outbound connections metered per originating data source to defeat sharded exfiltration across multiple micro-calls.
            </p>
          </div>
          <span className="font-mono text-[11px] text-neutral-muted bg-surface-base border border-neutral-border px-2 py-0.5 rounded">
            Enforcing Source Quotas
          </span>
        </div>

        {/* Source Budgets Grid */}
        <div className="space-y-3 font-mono text-xs">
          {sources.map((src) => {
            const pct = Math.min((src.used_bytes / src.budget_bytes) * 100, 100);
            const isHalted = src.status === 'halted';
            return (
              <div key={src.source_id} className="bg-surface-base border border-neutral-border p-4 rounded-lg space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-neutral-muted" />
                    <span className="font-semibold text-gray-200">{src.label}</span>
                    <span className="text-[10px] text-neutral-muted">({src.source_id})</span>
                  </div>
                  <div>
                    <span
                      className={`text-[10px] uppercase px-1.5 py-0.5 rounded border border-neutral-border ${
                        isHalted ? 'bg-surface-raised text-status-danger' : 'bg-surface-raised text-status-success'
                      }`}
                    >
                      {src.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-neutral-muted">
                    <span>
                      {(src.used_bytes / 1024).toFixed(0)} KB / {(src.budget_bytes / 1024).toFixed(0)} KB metered
                    </span>
                    <span>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-raised border border-neutral-border rounded-full overflow-hidden">
                    <div
                      className={`h-full ${isHalted ? 'bg-status-danger' : 'bg-accent'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="text-[11px] text-neutral-muted flex items-center justify-between pt-1">
                  <span>Calls tracked: {src.call_count}</span>
                  <span className={isHalted ? 'text-status-danger' : 'text-neutral-muted'}>{src.reason}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Network Whitelist & Blocklist Table */}
      <div className="bg-surface-raised border border-neutral-border rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-200 font-mono mb-3">
          Destination Whitelist & SSRF Guard
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-neutral-border text-neutral-muted uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-2">Destination Host</th>
                <th className="py-2.5 px-2">Verdict</th>
                <th className="py-2.5 px-2">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-border">
              {destinations.map((dst) => (
                <tr key={dst.domain} className="hover:bg-surface-base/50 transition-colors">
                  <td className="py-2.5 px-2 font-semibold text-gray-200">{dst.domain}</td>
                  <td className="py-2.5 px-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] uppercase border border-neutral-border ${
                        dst.status === 'allowed' ? 'text-status-success' : 'text-status-danger'
                      }`}
                    >
                      {dst.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-neutral-muted">{dst.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
