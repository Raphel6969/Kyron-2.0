import React from 'react';
import { Shield, Lock, AlertTriangle, Cpu } from 'lucide-react';

interface MetricsBarProps {
  quarantinedCount: number;
  approvedCount: number;
  activeLeasesCount: number;
  attacksBlockedCount: number;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  quarantinedCount,
  approvedCount,
  activeLeasesCount,
  attacksBlockedCount,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="motion-stagger-1 bg-surface-raised border border-neutral-border p-4 rounded-lg flex items-center justify-between transition-colors hover:border-neutral-muted">
        <div>
          <span className="text-xs uppercase tracking-wider text-neutral-muted block mb-1">Tools Approved</span>
          <span className="text-2xl font-bold font-mono text-gray-100">{approvedCount}</span>
        </div>
        <div className="p-2.5 bg-surface-base border border-neutral-border rounded text-status-success">
          <Shield className="w-5 h-5" />
        </div>
      </div>

      <div className="motion-stagger-2 bg-surface-raised border border-neutral-border p-4 rounded-lg flex items-center justify-between transition-colors hover:border-neutral-muted">
        <div>
          <span className="text-xs uppercase tracking-wider text-neutral-muted block mb-1">Quarantined Threats</span>
          <span className="text-2xl font-bold font-mono text-status-danger">{quarantinedCount}</span>
        </div>
        <div className="p-2.5 bg-surface-base border border-neutral-border rounded text-status-danger">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      <div className="motion-stagger-3 bg-surface-raised border border-neutral-border p-4 rounded-lg flex items-center justify-between transition-colors hover:border-neutral-muted">
        <div>
          <span className="text-xs uppercase tracking-wider text-neutral-muted block mb-1">Active Leases</span>
          <span className="text-2xl font-bold font-mono text-accent">{activeLeasesCount}</span>
        </div>
        <div className="p-2.5 bg-surface-base border border-neutral-border rounded text-accent">
          <Lock className="w-5 h-5" />
        </div>
      </div>

      <div className="motion-stagger-4 bg-surface-raised border border-neutral-border p-4 rounded-lg flex items-center justify-between transition-colors hover:border-neutral-muted">
        <div>
          <span className="text-xs uppercase tracking-wider text-neutral-muted block mb-1">Hot-Path Model Tokens</span>
          <span className="text-2xl font-bold font-mono text-status-success">0</span>
        </div>
        <div className="p-2.5 bg-surface-base border border-neutral-border rounded text-status-success">
          <Cpu className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
