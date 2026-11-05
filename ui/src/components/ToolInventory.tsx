import React, { useState } from 'react';
import { Search, ShieldAlert, Check, Ban, Eye, RotateCw, Filter, ShieldCheck, ArrowRight } from 'lucide-react';

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
    <div className="console-card overflow-hidden mb-8 font-sans">
      {/* Top Header & Search Control Bar */}
      <div className="console-card-header flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <p className="landing-kicker text-[10px]">01 / Pinned Manifests</p>
          <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
            Tool Registry & Semantic Drift Firewall
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="flex items-center gap-2 bg-white border border-[#CBD5E1] rounded px-3 py-1.5 text-xs w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search tools or server..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none text-[#0F172A] placeholder-[#94A3B8] focus:outline-none w-full text-xs font-mono"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-[#F1F5F9] border border-[#E2E8F0] p-1 rounded text-xs" role="group" aria-label="Filter tools by state">
            {['all', 'approved', 'quarantined', 'blocked'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStateFilter(tab)}
                aria-pressed={stateFilter === tab}
                className={`px-2.5 py-1 rounded capitalize font-medium text-xs transition-colors ${
                  stateFilter === tab
                    ? 'bg-white text-[#1D4ED8] font-bold shadow-sm border border-[#CBD5E1]'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={onRefresh}
            className="landing-button landing-button-secondary h-8 w-8 p-0"
            title="Refresh Registry"
            aria-label="Refresh Registry"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#475569]" />
          </button>
        </div>
      </div>

      {/* State 1: Loading Skeleton */}
      {loading && (
        <div className="divide-y divide-[#E2E8F0] p-6">
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
        <div className="py-12 text-center p-6">
          <div className="inline-flex p-3 bg-[#FEF2F2] border border-[#FECACA] rounded text-[#DC2626] mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A] mb-1">Failed to Synchronize Registry</h3>
          <p className="text-xs text-[#64748B] mb-4 max-w-sm mx-auto">{error}</p>
          <button
            onClick={onRefresh}
            className="landing-button landing-button-primary text-xs h-9 px-4"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* State 3: Empty State */}
      {!loading && !error && filteredTools.length === 0 && (
        <div className="py-12 text-center p-6">
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
              <tr className="border-b border-[#E2E8F0] text-[#475569] bg-[#F8FAFC] font-mono text-[10px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Tool Identifier</th>
                <th className="py-3 px-4">Server</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Risk Assessment</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] bg-white">
              {filteredTools.map((tool) => {
                const isQuarantined = tool.state === 'quarantined';
                const isApproved = tool.state === 'approved' || tool.state === 'active';
                const isBlocked = tool.state === 'blocked' || tool.state === 'revoked';

                return (
                  <tr key={tool.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#0F172A] text-xs font-mono">{tool.name}</div>
                      <div className="text-xs text-[#475569] line-clamp-1 max-w-md mt-0.5">
                        {tool.model_facing || tool.original_text || 'No description provided'}
                      </div>
                      {tool.risk_reasons && tool.risk_reasons.length > 0 && (
                        <div className="text-[11px] text-[#DC2626] font-medium mt-1">
                          Risk reason: {tool.risk_reasons[0]}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[#475569]">
                      <span className="bg-[#F8FAFC] border border-[#CBD5E1] px-2 py-0.5 rounded text-[11px] font-mono text-[#475569]">
                        {tool.server_id}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          isApproved
                            ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                            : isQuarantined
                            ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                            : isBlocked
                            ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                            : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                        }`}
                      >
                        {tool.state.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="w-28">
                        <div className="flex justify-between text-[11px] text-[#64748B] mb-1 font-mono">
                          <span>Risk Score</span>
                          <span className="font-bold">{(tool.risk_score * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#E2E8F0] rounded overflow-hidden">
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

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onInspectDiff(tool.id)}
                          className="landing-button landing-button-secondary text-xs h-7 px-2.5"
                          title="Inspect Semantic Drift Diff"
                          aria-label="Inspect Semantic Drift Diff"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#1D4ED8]" />
                          <span>Diff</span>
                        </button>

                        {isQuarantined && (
                          <button
                            onClick={() => onApprove(tool.id)}
                            className="landing-button landing-button-primary text-xs h-7 px-2.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve & Pin</span>
                          </button>
                        )}

                        {!isBlocked && (
                          <button
                            onClick={() => onReject(tool.id)}
                            className="landing-button landing-button-secondary text-xs h-7 px-2 text-[#64748B] hover:text-[#DC2626] hover:border-[#DC2626]"
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
