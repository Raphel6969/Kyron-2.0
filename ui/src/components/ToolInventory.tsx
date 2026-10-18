import React, { useState } from 'react';
import { Search, ShieldAlert, Check, Ban, Eye, RotateCw, Filter } from 'lucide-react';

export interface ToolItem {
  id: string;
  server_id: string;
  name: string;
  hash: string;
  risk_score: number;
  risk_reasons: string[];
  state: string;
  model_facing?: string;
  original_text?: string;
}

interface ToolInventoryProps {
  tools: ToolItem[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onApprove: (toolId: string) => void;
  onReject: (toolId: string) => void;
  onInspectDiff: (toolId: string) => void;
}

export const ToolInventory: React.FC<ToolInventoryProps> = ({
  tools,
  loading,
  error,
  onRefresh,
  onApprove,
  onReject,
  onInspectDiff,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');

  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.server_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = stateFilter === 'all' || tool.state.toLowerCase() === stateFilter.toLowerCase();
    return matchesSearch && matchesState;
  });

  return (
    <div className="bg-surface-raised border border-neutral-border rounded-xl p-5 mb-8">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-5 border-b border-neutral-border">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-surface-base border border-neutral-border rounded-md px-3 py-2 text-sm">
          <Search className="w-4 h-4 text-neutral-muted" />
          <input
            type="text"
            placeholder="Search tools by identifier or MCP server..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none text-gray-100 placeholder-neutral-muted focus:outline-none w-full text-xs font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-surface-base border border-neutral-border rounded-md p-1 text-xs">
            {['all', 'approved', 'quarantined', 'blocked'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStateFilter(tab)}
                className={`px-2.5 py-1 rounded capitalize font-medium transition-colors ${
                  stateFilter === tab
                    ? 'bg-neutral-border text-gray-100'
                    : 'text-neutral-muted hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={onRefresh}
            className="p-2 text-neutral-muted hover:text-gray-100 border border-neutral-border rounded-md bg-surface-base hover:bg-neutral-border/50 transition-colors"
            title="Refresh Registry"
            aria-label="Refresh Registry"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* State 1: Loading Skeleton */}
      {loading && (
        <div className="divide-y divide-neutral-border py-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="py-4 flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="h-4 skeleton-box rounded w-1/4"></div>
                <div className="h-3 skeleton-box rounded w-2/3"></div>
              </div>
              <div className="h-6 skeleton-box rounded w-24"></div>
              <div className="h-8 skeleton-box rounded w-32"></div>
            </div>
          ))}
        </div>
      )}

      {/* State 2: Error State */}
      {!loading && error && (
        <div className="py-12 text-center">
          <div className="inline-flex p-3 bg-surface-base border border-neutral-border rounded-lg text-status-danger mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-gray-200 mb-1">Failed to Synchronize Registry</h3>
          <p className="text-xs text-neutral-muted mb-4 max-w-sm mx-auto">{error}</p>
          <button
            onClick={onRefresh}
            className="px-4 py-2 text-xs font-medium bg-neutral-border text-gray-200 rounded hover:bg-neutral-border/80 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* State 3: Empty State */}
      {!loading && !error && filteredTools.length === 0 && (
        <div className="py-12 text-center">
          <div className="inline-flex p-3 bg-surface-base border border-neutral-border rounded-lg text-neutral-muted mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-gray-200 mb-1">No Tools Found</h3>
          <p className="text-xs text-neutral-muted max-w-sm mx-auto">
            Zero registered MCP tools matched the active query filter. Adjust filters or connect an MCP server.
          </p>
        </div>
      )}

      {/* State 4: Populated Success Table */}
      {!loading && !error && filteredTools.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-border text-neutral-muted uppercase tracking-wider font-mono text-[10px]">
                <th className="py-3 px-2">Tool Identifier</th>
                <th className="py-3 px-2">Server</th>
                <th className="py-3 px-2">State</th>
                <th className="py-3 px-2">Risk Meter</th>
                <th className="py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-border">
              {filteredTools.map((tool) => {
                const isQuarantined = tool.state === 'quarantined';
                const isApproved = tool.state === 'approved' || tool.state === 'active';
                const isBlocked = tool.state === 'blocked' || tool.state === 'revoked';

                return (
                  <tr key={tool.id} className="hover:bg-surface-base/50 transition-colors">
                    <td className="py-3 px-2">
                      <div className="font-mono font-semibold text-gray-200">{tool.name}</div>
                      <div className="text-[11px] text-neutral-muted line-clamp-1 max-w-md font-sans">
                        {tool.model_facing || tool.original_text || 'No description provided'}
                      </div>
                      {tool.risk_reasons && tool.risk_reasons.length > 0 && (
                        <div className="text-[10px] text-status-danger mt-1 font-mono">
                          ⚠️ {tool.risk_reasons[0]}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-2 font-mono text-neutral-muted">
                      <span className="bg-surface-base border border-neutral-border px-2 py-0.5 rounded text-[11px]">
                        {tool.server_id}
                      </span>
                    </td>

                    <td className="py-3 px-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-[11px] font-medium border ${
                          isApproved
                            ? 'bg-surface-base text-status-success border-neutral-border'
                            : isQuarantined
                            ? 'bg-surface-base text-status-warning border-neutral-border'
                            : isBlocked
                            ? 'bg-surface-base text-status-danger border-neutral-border'
                            : 'bg-surface-base text-neutral-muted border-neutral-border'
                        }`}
                      >
                        {tool.state}
                      </span>
                    </td>

                    <td className="py-3 px-2">
                      <div className="w-24">
                        <div className="flex justify-between text-[10px] font-mono text-neutral-muted mb-1">
                          <span>Risk</span>
                          <span>{(tool.risk_score * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-base border border-neutral-border rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              tool.risk_score >= 0.6
                                ? 'bg-status-danger'
                                : tool.risk_score >= 0.3
                                ? 'bg-status-warning'
                                : 'bg-status-success'
                            }`}
                            style={{ width: `${Math.min(tool.risk_score * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onInspectDiff(tool.id)}
                          className="p-1.5 text-neutral-muted hover:text-gray-100 border border-neutral-border hover:bg-surface-base rounded transition-colors"
                          title="Inspect Semantic Drift Diff"
                          aria-label="Inspect Semantic Drift Diff"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {isQuarantined && (
                          <button
                            onClick={() => onApprove(tool.id)}
                            className="px-2.5 py-1 text-[11px] font-medium bg-accent hover:bg-accent-hover text-white rounded flex items-center gap-1 transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            Approve & Pin
                          </button>
                        )}

                        {!isBlocked && (
                          <button
                            onClick={() => onReject(tool.id)}
                            className="p-1.5 text-neutral-muted hover:text-status-danger border border-neutral-border hover:bg-surface-base rounded transition-colors"
                            title="Quarantine & Block"
                            aria-label="Quarantine & Block"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
