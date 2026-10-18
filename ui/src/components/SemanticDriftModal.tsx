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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-surface-raised border border-neutral-border rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-neutral-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-surface-base border border-neutral-border rounded text-status-warning">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                Semantic Drift Inspection: <span className="font-mono text-accent">{diff.tool_id}</span>
              </h2>
              <p className="text-xs text-neutral-muted">
                Upstream manifest mutation altered tool contract. Review canonical diff prior to release.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-muted hover:text-gray-100 rounded hover:bg-surface-base border border-transparent hover:border-neutral-border transition-colors"
            aria-label="Dismiss view"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hashes Row */}
        <div className="px-5 py-3 bg-surface-base border-b border-neutral-border grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-neutral-muted">
            <GitCommit className="w-4 h-4 text-status-danger" />
            <span>Upstream Hash:</span>
            <span className="text-gray-300 truncate">{diff.old_hash.slice(0, 16)}...</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-muted">
            <GitCommit className="w-4 h-4 text-status-success" />
            <span>Canonical Hash:</span>
            <span className="text-gray-300 truncate">{diff.new_hash.slice(0, 16)}...</span>
          </div>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto flex-1 font-mono text-xs">
          {/* Left: Original Description */}
          <div className="bg-surface-base border border-neutral-border rounded-lg p-4 flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-border">
              <span className="font-semibold text-status-danger uppercase tracking-wider text-[10px]">
                Original Text (Attacker / Upstream)
              </span>
              <span className="text-[10px] text-neutral-muted">SHA-256 Unpinned</span>
            </div>
            <div className="whitespace-pre-wrap leading-relaxed text-gray-300 flex-1 bg-surface-base p-3 rounded border border-neutral-border">
              {diff.original_description}
            </div>
          </div>

          {/* Right: Sanitized Model-Facing Description */}
          <div className="bg-surface-base border border-neutral-border rounded-lg p-4 flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-border">
              <span className="font-semibold text-status-success uppercase tracking-wider text-[10px]">
                TRUSTDESC Model-Facing (Sanitized)
              </span>
              <span className="text-[10px] text-neutral-muted">Deterministic Floor</span>
            </div>
            <div className="whitespace-pre-wrap leading-relaxed text-gray-200 flex-1 bg-surface-base p-3 rounded border border-neutral-border">
              {diff.model_facing_description}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-neutral-border bg-surface-raised flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-muted hover:text-gray-200 hover:bg-surface-base border border-neutral-border rounded-md transition-colors"
          >
            Dismiss Diff
          </button>
          <button
            onClick={() => {
              onApprove(diff.tool_id);
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded-md flex items-center gap-2 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Approve & Pin Canonical
          </button>
        </div>
      </div>
    </div>
  );
};
