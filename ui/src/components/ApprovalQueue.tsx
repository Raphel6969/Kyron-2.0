import React from 'react';
import { KeyRound, Check, X, ShieldAlert, Inbox, RotateCw } from 'lucide-react';

export interface ApprovalItem {
  id: string;
  trajectory_id: string;
  kind: string;
  tool_id?: string;
  details: Record<string, any>;
  status: string;
  created_at: string;
}

interface ApprovalQueueProps {
  approvals: ApprovalItem[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onApprove: (requestId: string) => void;
  onDeny: (requestId: string) => void;
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  approvals,
  loading,
  error,
  onRefresh,
  onApprove,
  onDeny,
}) => {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded p-6 shadow-sm mb-8 font-sans">
      <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded text-[#1D4ED8]">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">Live Authority & Capability Lease Queue</h2>
            <p className="text-xs text-[#475569]">
              Call-scoped authority requests requiring operator sign-off before execution dispatch.
            </p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 text-[#475569] hover:text-[#0F172A] border border-[#CBD5E1] rounded bg-white hover:bg-[#F8FAFC] transition-colors"
          title="Refresh Queue"
          aria-label="Refresh Queue"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* State 1: Skeleton Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-2">
              <div className="h-4 skeleton-box rounded w-1/3"></div>
              <div className="h-3 skeleton-box rounded w-2/3"></div>
            </div>
          ))}
        </div>
      )}

      {/* State 2: Error State */}
      {!loading && error && (
        <div className="py-8 text-center">
          <div className="inline-flex p-3 bg-[#FEF2F2] border border-[#FECACA] rounded text-[#DC2626] mb-2">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[#0F172A] mb-1">Queue Connection Failed</h3>
          <p className="text-xs text-[#64748B] mb-3">{error}</p>
          <button
            onClick={onRefresh}
            className="px-4 py-2 text-xs font-semibold bg-[#0F172A] text-white rounded hover:bg-[#1E293B] transition-colors"
          >
            Retry Fetching Queue
          </button>
        </div>
      )}

      {/* State 3: Empty State */}
      {!loading && !error && approvals.length === 0 && (
        <div className="py-12 text-center">
          <div className="inline-flex p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded text-[#64748B] mb-2">
            <Inbox className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[#0F172A] mb-0.5">Approval Queue Clear</h3>
          <p className="text-xs text-[#64748B]">
            Zero pending capability lease or authority requests awaiting human sign-off.
          </p>
        </div>
      )}

      {/* State 4: Populated List */}
      {!loading && !error && approvals.length > 0 && (
        <div className="space-y-3">
          {approvals.map((req) => (
            <div
              key={req.id}
              className="p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[#0F172A] font-mono">
                    {req.tool_id || 'System Privilege'}
                  </span>
                  <span className="bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] text-xs font-semibold px-2 py-0.5 rounded uppercase">
                    {req.kind}
                  </span>
                </div>
                <div className="text-xs text-[#475569] leading-relaxed">
                  {req.details?.reason || 'Agent requested single-use capability escalation'}
                </div>
                <div className="text-xs text-[#64748B] flex items-center gap-4 font-mono">
                  <span>Req ID: {req.id}</span>
                  <span>Trajectory: {req.trajectory_id}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => onDeny(req.id)}
                  className="px-3.5 py-2 text-xs font-semibold border border-[#CBD5E1] text-[#475569] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded transition-colors flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Deny Request</span>
                </button>
                <button
                  onClick={() => onApprove(req.id)}
                  className="px-4 py-2 text-xs font-semibold bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Grant Capability Lease</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
