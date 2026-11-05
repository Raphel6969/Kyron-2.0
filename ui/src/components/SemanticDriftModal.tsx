import React from 'react';
import { X, CheckCircle, ShieldAlert, GitCommit, Check } from 'lucide-react';

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
    <div
      className="landing-modal-backdrop font-sans"
      role="presentation"
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <div className="bg-white border border-[#CBD5E1] rounded w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center text-[#D97706]">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="landing-kicker text-[10px]">Inspection / Semantic Drift</p>
              <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                Tool Manifest Mutation: <span className="font-mono text-[#1D4ED8]">{diff.tool_id}</span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="landing-modal-close"
            aria-label="Dismiss view"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hashes Row */}
        <div className="px-6 py-3 bg-[#F1F5F9] border-b border-[#E2E8F0] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-[#475569]">
            <GitCommit className="w-4 h-4 text-[#DC2626]" />
            <span className="font-bold text-[#0F172A]">Upstream Hash:</span>
            <span className="text-[#475569] truncate">{diff.old_hash.slice(0, 24)}...</span>
          </div>
          <div className="flex items-center gap-2 text-[#475569]">
            <GitCommit className="w-4 h-4 text-[#059669]" />
            <span className="font-bold text-[#0F172A]">Canonical Hash:</span>
            <span className="text-[#475569] truncate">{diff.new_hash.slice(0, 24)}...</span>
          </div>
        </div>

        {/* Side-by-Side Comparison Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <p className="text-xs text-[#475569] leading-relaxed">
            The upstream tool definition changed after initial pinning. Kyron quarantined the mutation to prevent
            model-facing prompt injection or hidden capability expansion.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Upstream Mutated Description */}
            <div className="border border-[#FECACA] bg-[#FEF2F2] rounded p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#DC2626]">
                <span className="font-mono uppercase text-[10px]">Unverified Upstream Payload</span>
                <span className="bg-white border border-[#FECACA] px-2 py-0.5 rounded text-[10px] font-mono">
                  QUARANTINED
                </span>
              </div>
              <div className="text-xs font-mono text-[#0F172A] bg-white p-3 rounded border border-[#FECACA] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {diff.original_description || 'No raw text available'}
              </div>
              <p className="text-[11px] text-[#DC2626] leading-normal">
                Flagged for prompt drift: instructions attempting to divert model behavior away from declared schemas.
              </p>
            </div>

            {/* Right: Synthesized TRUSTDESC Canonical */}
            <div className="border border-[#A7F3D0] bg-[#ECFDF5] rounded p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#059669]">
                <span className="font-mono uppercase text-[10px]">Synthesized TRUSTDESC Specification</span>
                <span className="bg-white border border-[#A7F3D0] px-2 py-0.5 rounded text-[10px] font-mono">
                  MODEL-FACING
                </span>
              </div>
              <div className="text-xs font-mono text-[#0F172A] bg-white p-3 rounded border border-[#A7F3D0] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {diff.model_facing_description || 'Normalized schema specification'}
              </div>
              <p className="text-[11px] text-[#059669] leading-normal">
                Deterministic schema projection. Safe for model presentation with zero prompt injection vectors.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 px-6 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="landing-button landing-button-secondary text-xs h-9 px-4"
          >
            Cancel Inspection
          </button>
          <button
            onClick={() => onApprove(diff.tool_id)}
            className="landing-button landing-button-primary text-xs h-9 px-4"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Approve & Pin Canonical Manifest</span>
          </button>
        </div>
      </div>
    </div>
  );
};
