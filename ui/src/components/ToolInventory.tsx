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
    <div className="bg-white border border-[#E2E8F0] rounded p-6 shadow-sm mb-8 font-sans">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-5 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-[#F8FAFC] border border-[#CBD5E1] rounded px-3 py-2 text-sm">
          <Search className="w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search tools by identifier or MCP server..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none text-[#0F172A] placeholder-[#94A3B8] focus:outline-none w-full text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded p-1 text-xs" role="group" aria-label="Filter tools by state">
            {['all', 'approved', 'quarantined', 'blocked'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStateFilter(tab)}
                aria-pressed={stateFilter === tab}
                className={`px-3 py-1.5 rounded capitalize font-semibold transition-colors ${
                  stateFilter === tab
                    ? 'bg-[#1D4ED8] text-white shadow-sm'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={onRefresh}
            className="p-2 text-[#475569] hover:text-[#0F172A] border border-[#CBD5E1] rounded bg-white hover:bg-[#F8FAFC] transition-colors"
            title="Refresh Registry"
            aria-label="Refresh Registry"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* State 1: Loading Skeleton */}
      {loading && (
        <div className="divide-y divide-[#E2E8F0] py-4">
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
          <div className="inline-flex p-3 bg-[#FEF2F2] border border-[#FECACA] rounded text-[#DC2626] mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A] mb-1">Failed to Synchronize Registry</h3>
          <p className="text-xs text-[#64748B] mb-4 max-w-sm mx-auto">{error}</p>
          <button
            onClick={onRefresh}
            className="px-4 py-2 text-xs font-semibold bg-[#0F172A] text-white rounded hover:bg-[#1E293B] transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* State 3: Empty State */}
      {!loading && !error && filteredTools.length === 0 && (
        <div className="py-12 text-center">
          <div className="inline-flex p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded text-[#64748B] mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A] mb-1">No Tools Found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            Zero registered MCP tools matched the active query filter. Adjust filters or connect an MCP server.
          </p>
        </div>
      )}

      {/* State 4: Populated Success Table */}
      {!loading && !error && filteredTools.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#475569] bg-[#F8FAFC] uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-3">Tool Identifier</th>
                <th className="py-3 px-3">Server</th>
                <th className="py-3 px-3">State</th>
                <th className="py-3 px-3">Risk Assessment</th>
                <th className="py-3 px-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredTools.map((tool) => {
                const isQuarantined = tool.state === 'quarantined';
                const isApproved = tool.state === 'approved' || tool.state === 'active';
                const isBlocked = tool.state === 'blocked' || tool.state === 'revoked';

                return (
                  <tr key={tool.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#0F172A] text-sm font-mono">{tool.name}</div>
                      <div className="text-xs text-[#475569] line-clamp-1 max-w-md mt-0.5">
                        {tool.model_facing || tool.original_text || 'No description provided'}
                      </div>
                      {tool.risk_reasons && tool.risk_reasons.length > 0 && (
                        <div className="text-xs text-[#DC2626] font-medium mt-1">
                          Risk reason: {tool.risk_reasons[0]}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-[#475569]">
                      <span className="bg-[#F1F5F9] border border-[#CBD5E1] px-2.5 py-1 rounded text-xs font-mono">
                        {tool.server_id}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold border ${
                          isApproved
                            ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                            : isQuarantined
                            ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                            : isBlocked
                            ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                            : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                        }`}
                      >
                        {tool.state}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="w-28">
                        <div className="flex justify-between text-xs text-[#64748B] mb-1 font-mono">
                          <span>Risk</span>
                          <span className="font-semibold">{(tool.risk_score * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-2 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              tool.risk_score >= 0.6
                                ? 'bg-[#DC2626]'
                                : tool.risk_score >= 0.3
                                ? 'bg-[#D97706]'
                                : 'bg-[#059669]'
                            }`}
                            style={{ width: `${Math.min(tool.risk_score * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onInspectDiff(tool.id)}
                          className="p-1.5 text-[#475569] hover:text-[#0F172A] border border-[#CBD5E1] hover:bg-[#F8FAFC] rounded transition-colors"
                          title="Inspect Semantic Drift Diff"
                          aria-label="Inspect Semantic Drift Diff"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {isQuarantined && (
                          <button
                            onClick={() => onApprove(tool.id)}
                            className="px-3 py-1.5 text-xs font-semibold bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded flex items-center gap-1 transition-colors shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve & Pin</span>
                          </button>
                        )}

                        {!isBlocked && (
                          <button
                            onClick={() => onReject(tool.id)}
                            className="p-1.5 text-[#64748B] hover:text-[#DC2626] border border-[#CBD5E1] hover:bg-[#FEF2F2] rounded transition-colors"
                            title="Quarantine & Block"
                            aria-label="Quarantine & Block"
                          >
                            <Ban className="w-4 h-4" />
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
