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
    <div className="bg-surface-raised border border-neutral-border rounded-xl p-5 mb-8">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-border mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-surface-base border border-neutral-border rounded text-accent">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-100">Live Approval Queue</h2>
            <p className="text-xs text-neutral-muted">
              Call-scoped authority requests requiring operator sign-off before dispatch.
            </p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="p-1.5 text-neutral-muted hover:text-gray-100 border border-neutral-border rounded-md bg-surface-base hover:bg-neutral-border/50 transition-colors"
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
            <div key={i} className="p-4 bg-surface-base border border-neutral-border rounded-lg space-y-2">
              <div className="h-4 skeleton-box rounded w-1/3"></div>
              <div className="h-3 skeleton-box rounded w-2/3"></div>
            </div>
          ))}
        </div>
      )}

      {/* State 2: Error State */}
      {!loading && error && (
        <div className="py-8 text-center">
          <div className="inline-flex p-2 bg-surface-base border border-neutral-border rounded-lg text-status-danger mb-2">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-gray-200 mb-1">Queue Connection Failed</h3>
          <p className="text-xs text-neutral-muted mb-3">{error}</p>
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 text-xs font-medium bg-neutral-border text-gray-200 rounded hover:bg-neutral-border/80 transition-colors"
          >
            Retry Fetching Queue
          </button>
        </div>
      )}

      {/* State 3: Empty State */}
      {!loading && !error && approvals.length === 0 && (
        <div className="py-8 text-center">
          <div className="inline-flex p-2.5 bg-surface-base border border-neutral-border rounded-lg text-neutral-muted mb-2">
            <Inbox className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-gray-200 mb-0.5">Approval Queue Clear</h3>
          <p className="text-xs text-neutral-muted">
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
              className="p-4 bg-surface-base border border-neutral-border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-gray-200">
                    {req.tool_id || 'System Privilege'}
                  </span>
                  <span className="bg-surface-raised text-status-warning border border-neutral-border font-mono text-[10px] px-1.5 py-0.5 rounded uppercase">
                    {req.kind}
                  </span>
                </div>
                <div className="text-xs text-neutral-muted">
                  {req.details?.reason || 'Agent requested single-use capability escalation'}
                </div>
                <div className="text-[10px] font-mono text-neutral-muted flex items-center gap-3">
                  <span>Req ID: {req.id}</span>
                  <span>Trajectory: {req.trajectory_id}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => onDeny(req.id)}
                  className="px-3 py-1.5 text-xs font-medium border border-neutral-border text-neutral-muted hover:text-status-danger hover:bg-surface-raised rounded transition-colors flex items-center gap-1"
                >

                  <X className="w-3.5 h-3.5" />
                  Deny Request
                </button>
                <button
                  onClick={() => onApprove(req.id)}
                  className="px-3 py-1.5 text-xs font-medium bg-accent hover:bg-accent-hover text-white rounded transition-colors flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Grant Capability Lease
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
