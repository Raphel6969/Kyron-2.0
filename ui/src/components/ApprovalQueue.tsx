import React from 'react';
import { KeyRound, Check, X, ShieldAlert, Inbox, RotateCw, Lock } from 'lucide-react';

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
    <div className="console-card overflow-hidden mb-8 font-sans">
      <div className="console-card-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#1D4ED8]">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <p className="landing-kicker text-[10px]">02 / Authority Queue</p>
            <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
              Call-Scoped Capability Lease Approvals
            </h2>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="landing-button landing-button-secondary h-8 w-8 p-0"
          title="Refresh Queue"
          aria-label="Refresh Queue"
        >
          <RotateCw className="w-3.5 h-3.5 text-[#475569]" />
        </button>
      </div>

      <div className="p-6">
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
          <div className="py-12 text-center">
            <div className="inline-flex p-3 bg-[#FEF2F2] border border-[#FECACA] rounded text-[#DC2626] mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0F172A] mb-1">Queue Connection Failed</h3>
            <p className="text-xs text-[#64748B] mb-4 max-w-sm mx-auto">{error}</p>
            <button
              onClick={onRefresh}
              className="landing-button landing-button-primary text-xs h-9 px-4"
            >
              Retry Fetching Queue
            </button>
          </div>
        )}

        {/* State 3: Empty State */}
        {!loading && !error && approvals.length === 0 && (
          <div className="py-12 text-center">
            <div className="inline-flex p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded text-[#64748B] mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0F172A] mb-1">Authority Queue Clear</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
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
                    <span className="font-bold text-sm text-[#0F172A] font-mono">
                      {req.tool_id || 'System Privilege'}
                    </span>
                    <span className="bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                      {req.kind}
                    </span>
                  </div>
                  <div className="text-xs text-[#475569] leading-relaxed">
                    {req.details?.reason || 'Agent requested single-use capability escalation'}
                  </div>
                  <div className="text-[11px] text-[#64748B] flex items-center gap-4 font-mono">
                    <span>Req ID: {req.id.slice(0, 16)}</span>
                    <span>Trajectory: {req.trajectory_id.slice(0, 16)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => onDeny(req.id)}
                    className="landing-button landing-button-secondary text-xs h-8 px-3 text-[#475569] hover:text-[#DC2626] hover:border-[#DC2626]"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Deny Request</span>
                  </button>
                  <button
                    onClick={() => onApprove(req.id)}
                    className="landing-button landing-button-primary text-xs h-8 px-3.5"
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
    </div>
  );
};
