import React from 'react';
import { X, CheckCircle, ShieldAlert, GitCommit } from 'lucide-react';

interface ToolDiffData {
  tool_id: string;
  has_drift: boolean;
  old_hash: string;
  new_hash: string;
  original_description: string;
  model_facing_description: string;
  semantic_diff: string;
}

interface SemanticDriftModalProps {
  diff: ToolDiffData | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (toolId: string) => void;
}

export const SemanticDriftModal: React.FC<SemanticDriftModalProps> = ({
  diff,
  isOpen,
  onClose,
  onApprove,
}) => {
  if (!isOpen || !diff) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
      <div className="bg-white border border-[#E2E8F0] rounded-lg w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded text-[#D97706]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                Semantic Drift Inspection: <span className="font-mono text-[#1D4ED8]">{diff.tool_id}</span>
              </h2>
              <p className="text-xs text-[#475569]">
                Upstream manifest mutation altered tool contract. Review canonical diff prior to release.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#0F172A] rounded hover:bg-[#F1F5F9] transition-colors"
            aria-label="Dismiss view"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hashes Row */}
        <div className="px-5 py-3 bg-[#F1F5F9] border-b border-[#E2E8F0] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-[#475569]">
            <GitCommit className="w-4 h-4 text-[#DC2626]" />
            <span className="font-semibold text-[#0F172A]">Upstream Hash:</span>
            <span className="text-[#475569] truncate">{diff.old_hash.slice(0, 20)}...</span>
          </div>
          <div className="flex items-center gap-2 text-[#475569]">
            <GitCommit className="w-4 h-4 text-[#059669]" />
            <span className="font-semibold text-[#0F172A]">Canonical Hash:</span>
            <span className="text-[#475569] truncate">{diff.new_hash.slice(0, 20)}...</span>
          </div>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto flex-1 text-xs">
          {/* Left: Original Description */}
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded p-4 flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#FECACA]">
              <span className="font-bold text-[#DC2626] uppercase text-[11px]">
                Original Text (Upstream Payload)
              </span>
              <span className="text-xs text-[#DC2626] font-mono">SHA-256 Unpinned</span>
            </div>
            <div className="whitespace-pre-wrap leading-relaxed text-[#7F1D1D] flex-1 bg-white p-3.5 rounded border border-[#FECACA] font-mono">
              {diff.original_description}
            </div>
          </div>

          {/* Right: Sanitized Model-Facing Description */}
          <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded p-4 flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#A7F3D0]">
              <span className="font-bold text-[#059669] uppercase text-[11px]">
                TRUSTDESC Sanitized (Model-Facing)
              </span>
              <span className="text-xs text-[#059669] font-mono">Deterministic Floor</span>
            </div>
            <div className="whitespace-pre-wrap leading-relaxed text-[#064E3B] flex-1 bg-white p-3.5 rounded border border-[#A7F3D0] font-mono">
              {diff.model_facing_description}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#475569] hover:text-[#0F172A] hover:bg-white border border-[#CBD5E1] rounded transition-colors"
          >
            Dismiss Diff
          </button>
          <button
            onClick={() => {
              onApprove(diff.tool_id);
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded flex items-center gap-2 transition-colors shadow-sm"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Approve & Pin Canonical</span>
          </button>
        </div>
      </div>
    </div>
  );
};
