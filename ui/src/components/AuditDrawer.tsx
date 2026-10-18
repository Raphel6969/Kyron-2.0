import React from 'react';
import { History, Download, CheckCircle, ShieldX, Link as LinkIcon, RotateCw } from 'lucide-react';

export interface AuditEventItem {
  id: string;
  prev_hash: string;
  session_id: string;
  trajectory_id: string;
  call_hash: string;
  tool_id: string;
  verdict: string;
  reasons: string[];
  signature: string;
  created_at: string;
}

interface AuditDrawerProps {
  events: AuditEventItem[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onExportEUAct: () => void;
}

export const AuditDrawer: React.FC<AuditDrawerProps> = ({
  events,
  loading,
  error,
  onRefresh,
  onExportEUAct,
}) => {
  return (
    <div className="bg-surface-raised border border-neutral-border rounded-xl p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-neutral-border mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-surface-base border border-neutral-border rounded text-status-success">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-100">Cryptographic Audit Trail</h2>
            <p className="text-xs text-neutral-muted">
              SHA-256 hash-chained & Ed25519-signed trajectory records (EU AI Act Article 50 compliant).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-1.5 text-neutral-muted hover:text-gray-100 border border-neutral-border rounded-md bg-surface-base hover:bg-neutral-border/50 transition-colors"
            title="Refresh Audit Events"
            aria-label="Refresh Audit Events"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={onExportEUAct}
            className="px-3 py-1.5 text-xs font-medium bg-surface-base hover:bg-neutral-border/50 text-gray-200 border border-neutral-border rounded-md flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-accent" />
            Export EU AI Act Dossier
          </button>
        </div>
      </div>

      {/* State 1: Skeleton Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 bg-surface-base border border-neutral-border rounded-lg space-y-2">
              <div className="h-4 skeleton-box rounded w-1/4"></div>
              <div className="h-3 skeleton-box rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )}

      {/* State 2: Error State */}
      {!loading && error && (
        <div className="py-8 text-center">
          <h3 className="text-sm font-semibold text-gray-200 mb-1">Failed to Load Audit Trail</h3>
          <p className="text-xs text-neutral-muted mb-3">{error}</p>
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 text-xs font-medium bg-neutral-border text-gray-200 rounded hover:bg-neutral-border/80 transition-colors"
          >
            Retry Fetching Trail
          </button>
        </div>
      )}

      {/* State 3: Empty State */}
      {!loading && !error && events.length === 0 && (
        <div className="py-8 text-center text-xs text-neutral-muted">
          No audit events recorded for active trajectory yet.
        </div>
      )}

      {/* State 4: Populated Events Chain */}
      {!loading && !error && events.length > 0 && (
        <div className="space-y-3 font-mono text-xs">
          {events.map((ev, idx) => {
            const isAllow = ev.verdict === 'allow' || ev.verdict === 'lease-allow';
            return (
              <div
                key={ev.id || idx}
                className="p-3.5 bg-surface-base border border-neutral-border rounded-lg relative overflow-hidden"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-border">
                  <div className="flex items-center gap-2">
                    {isAllow ? (
                      <CheckCircle className="w-4 h-4 text-status-success" />
                    ) : (
                      <ShieldX className="w-4 h-4 text-status-danger" />
                    )}
                    <span className="font-semibold text-gray-200">{ev.tool_id}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold border border-neutral-border bg-surface-raised ${
                        isAllow
                          ? 'text-status-success'
                          : 'text-status-danger'
                      }`}
                    >
                      {ev.verdict}
                    </span>

                  </div>

                  <span className="text-[10px] text-neutral-muted">
                    {new Date(ev.created_at).toLocaleTimeString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-neutral-muted">
                  <div className="flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-accent" />
                    <span className="text-gray-400">Prev Hash:</span>
                    <span className="truncate">{ev.prev_hash.slice(0, 16)}...</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Signature:</span>{' '}
                    <span className="truncate">{ev.signature.slice(0, 16)}...</span>
                  </div>
                </div>

                {ev.reasons && ev.reasons.length > 0 && (
                  <div className="mt-2 text-[11px] text-gray-300 font-sans bg-surface-raised/60 p-2 rounded border border-neutral-border">
                    {ev.reasons.join(' · ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
