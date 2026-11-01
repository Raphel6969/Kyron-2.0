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
    <div className="bg-white border border-[#E2E8F0] rounded p-6 shadow-sm mb-8 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded text-[#059669]">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">Cryptographic Audit Trail</h2>
            <p className="text-xs text-[#475569]">
              SHA-256 hash-chained & Ed25519-signed trajectory records (EU AI Act Article 50 compliant).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 text-[#475569] hover:text-[#0F172A] border border-[#CBD5E1] rounded bg-white hover:bg-[#F8FAFC] transition-colors"
            title="Refresh Audit Events"
            aria-label="Refresh Audit Events"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={onExportEUAct}
            className="px-4 py-2 text-xs font-semibold bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export EU AI Act Dossier</span>
          </button>
        </div>
      </div>

      {/* State 1: Skeleton Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-2">
              <div className="h-4 skeleton-box rounded w-1/4"></div>
              <div className="h-3 skeleton-box rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )}

      {/* State 2: Error State */}
      {!loading && error && (
        <div className="py-8 text-center">
          <h3 className="text-sm font-bold text-[#0F172A] mb-1">Failed to Load Audit Trail</h3>
          <p className="text-xs text-[#64748B] mb-3">{error}</p>
          <button
            onClick={onRefresh}
            className="px-4 py-2 text-xs font-semibold bg-[#0F172A] text-white rounded hover:bg-[#1E293B] transition-colors"
          >
            Retry Fetching Trail
          </button>
        </div>
      )}

      {/* State 3: Empty State */}
      {!loading && !error && events.length === 0 && (
        <div className="py-12 text-center text-xs text-[#64748B]">
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
                className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-2.5"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    {isAllow ? (
                      <CheckCircle className="w-4 h-4 text-[#059669]" />
                    ) : (
                      <ShieldX className="w-4 h-4 text-[#DC2626]" />
                    )}
                    <span className="font-bold text-sm text-[#0F172A]">{ev.tool_id}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold uppercase border ${
                        isAllow
                          ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                          : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                      }`}
                    >
                      {ev.verdict}
                    </span>
                  </div>

                  <span className="text-xs text-[#64748B]">
                    {new Date(ev.created_at).toLocaleTimeString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#475569]">
                  <div className="flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-[#1D4ED8]" />
                    <span className="font-semibold text-[#0F172A]">Prev Hash:</span>
                    <span className="truncate">{ev.prev_hash.slice(0, 20)}...</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#0F172A]">Signature:</span>{' '}
                    <span className="truncate">{ev.signature.slice(0, 20)}...</span>
                  </div>
                </div>

                {ev.reasons && ev.reasons.length > 0 && (
                  <div className="mt-2 text-xs text-[#475569] bg-white p-2.5 rounded border border-[#E2E8F0] font-sans">
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
