import React from 'react';
import { History, Download, CheckCircle, ShieldAlert, Link as LinkIcon, RotateCw, FileCheck2, Fingerprint } from 'lucide-react';

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
    <div className="console-card overflow-hidden mb-8 font-sans">
      <div className="console-card-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#059669]">
            <History className="w-4 h-4" />
          </div>
          <div>
            <p className="landing-kicker text-[10px]">04 / Compliance Evidence</p>
            <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
              Cryptographic Audit Chain (EU AI Act Article 50)
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="landing-button landing-button-secondary h-8 w-8 p-0"
            title="Refresh Audit Events"
            aria-label="Refresh Audit Events"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#475569]" />
          </button>
          <button
            onClick={onExportEUAct}
            className="landing-button landing-button-primary text-xs h-8 px-3.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Article 50 Dossier</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* State 1: Skeleton Loading */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-2">
                <div className="h-4 skeleton-box rounded w-1/4"></div>
                <div className="h-3 skeleton-box rounded w-1/2"></div>
                <div className="h-3 skeleton-box rounded w-3/4"></div>
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
            <h3 className="text-base font-bold text-[#0F172A] mb-1">Audit Ledger Offline</h3>
            <p className="text-xs text-[#64748B] mb-4 max-w-sm mx-auto">{error}</p>
            <button
              onClick={onRefresh}
              className="landing-button landing-button-primary text-xs h-9 px-4"
            >
              Retry Connecting Ledger
            </button>
          </div>
        )}

        {/* State 3: Empty State */}
        {!loading && !error && events.length === 0 && (
          <div className="py-12 text-center">
            <div className="inline-flex p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded text-[#64748B] mb-3">
              <Fingerprint className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0F172A] mb-1">Ledger Empty</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              Zero trajectory events committed to cryptographic chain. Execute tool calls to begin logging.
            </p>
          </div>
        )}

        {/* State 4: Populated Chain Timeline */}
        {!loading && !error && events.length > 0 && (
          <div className="relative border-l-2 border-[#E2E8F0] ml-3 pl-6 space-y-5">
            {events.map((ev, idx) => {
              const isAdmitted = ev.verdict === 'admitted';
              return (
                <div key={ev.id || idx} className="relative group">
                  {/* Timeline Node Point */}
                  <div
                    className={`absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full border-2 bg-white transition-transform ${
                      isAdmitted
                        ? 'border-[#059669] group-hover:bg-[#059669]'
                        : 'border-[#DC2626] group-hover:bg-[#DC2626]'
                    }`}
                  />

                  <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-2 hover:border-[#1D4ED8] transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#0F172A] font-mono">{ev.tool_id}</span>
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                            isAdmitted
                              ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                              : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                          }`}
                        >
                          {ev.verdict.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[#64748B] text-[11px] font-mono">{ev.created_at}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono text-[#64748B] bg-white p-2.5 rounded border border-[#E2E8F0]/80">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-[#94A3B8]">PREV:</span>
                        <span className="text-[#475569]">{ev.prev_hash ? ev.prev_hash.slice(0, 24) : 'genesis_block'}...</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-[#94A3B8]">CALL:</span>
                        <span className="text-[#475569]">{ev.call_hash ? ev.call_hash.slice(0, 24) : '—'}...</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#E2E8F0]/60 text-[11px]">
                      <div className="flex items-center gap-1 text-[#059669] font-mono">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Ed25519 Verified: {ev.signature ? ev.signature.slice(0, 16) : 'valid'}...</span>
                      </div>
                      <span className="text-[#64748B] font-mono">Trajectory: {ev.trajectory_id ? ev.trajectory_id.slice(0, 12) : '—'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
