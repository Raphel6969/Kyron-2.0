import React, { useState, useEffect } from 'react';
import {
  Shield,
  LayoutDashboard,
  LayoutGrid,
  KeyRound,
  History,
  Terminal,
  Network,
  Sliders,
  RotateCw
} from 'lucide-react';
import { MetricsBar } from './components/MetricsBar';
import { CommandOverview } from './components/CommandOverview';
import { ToolInventory, ToolItem } from './components/ToolInventory';
import { SemanticDriftModal } from './components/SemanticDriftModal';
import { ApprovalQueue, ApprovalItem } from './components/ApprovalQueue';
import { AuditDrawer, AuditEventItem } from './components/AuditDrawer';
import { EgressMonitor } from './components/EgressMonitor';
import { PolicyStudio } from './components/PolicyStudio';

export type NavTab = 'overview' | 'registry' | 'approvals' | 'egress' | 'audit' | 'policies';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');

  // Tools state
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [toolsLoading, setToolsLoading] = useState<boolean>(true);
  const [toolsError, setToolsError] = useState<string | null>(null);

  // Approvals state
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [approvalsLoading, setApprovalsLoading] = useState<boolean>(true);
  const [approvalsError, setApprovalsError] = useState<string | null>(null);

  // Audit events state
  const [auditEvents, setAuditEvents] = useState<AuditEventItem[]>([]);
  const [auditLoading, setAuditLoading] = useState<boolean>(true);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Semantic drift inspection modal state
  const [activeDiff, setActiveDiff] = useState<any | null>(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState<boolean>(false);

  // Notification message
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchTools = async () => {
    try {
      setToolsLoading(true);
      setToolsError(null);
      const res = await fetch('/v1/tools');
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch tools`);
      const data = await res.json();
      setTools(data);
    } catch (err: any) {
      setToolsError(err.message || 'Failed to connect to control plane API');
    } finally {
      setToolsLoading(false);
    }
  };

  const fetchApprovals = async () => {
    try {
      setApprovalsLoading(true);
      setApprovalsError(null);
      const res = await fetch('/v1/approvals?status=pending');
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch approvals`);
      const data = await res.json();
      setApprovals(data);
    } catch (err: any) {
      setApprovalsError(err.message || 'Failed to connect to approval service');
    } finally {
      setApprovalsLoading(false);
    }
  };

  const fetchAuditEvents = async () => {
    try {
      setAuditLoading(true);
      setAuditError(null);
      const res = await fetch('/v1/audit/events?limit=30');
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch audit events`);
      const data = await res.json();
      setAuditEvents(data);
    } catch (err: any) {
      setAuditError(err.message || 'Failed to connect to audit evidence store');
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
    fetchApprovals();
    fetchAuditEvents();
  }, []);

  const handleApproveTool = async (toolId: string) => {
    try {
      const res = await fetch(`/v1/tools/${encodeURIComponent(toolId)}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approver_id: 'sec-admin', canonical_description: 'Approved by SOC operator' }),
      });
      if (res.ok) {
        showNotification(`Tool '${toolId}' approved and pinned successfully.`);
        fetchTools();
      }
    } catch {
      showNotification(`Failed to approve tool '${toolId}'.`);
    }
  };

  const handleRejectTool = async (toolId: string) => {
    try {
      const res = await fetch(`/v1/tools/${encodeURIComponent(toolId)}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Quarantined and blocked by security operator' }),
      });
      if (res.ok) {
        showNotification(`Tool '${toolId}' blocked.`);
        fetchTools();
      }
    } catch {
      showNotification(`Failed to reject tool '${toolId}'.`);
    }
  };

  const handleInspectDiff = async (toolId: string) => {
    try {
      const res = await fetch(`/v1/tools/${encodeURIComponent(toolId)}/diff`);
      if (res.ok) {
        const diffData = await res.json();
        setActiveDiff(diffData);
        setIsDiffModalOpen(true);
      }
    } catch {
      showNotification(`Failed to inspect semantic diff for '${toolId}'.`);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/v1/approvals/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decided_by: 'soc-operator', reason: 'Granted capability lease' }),
      });
      if (res.ok) {
        showNotification(`Capability lease granted for request '${requestId}'.`);
        fetchApprovals();
        fetchTools();
      }
    } catch {
      showNotification(`Approval failed for '${requestId}'.`);
    }
  };

  const handleDenyRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/v1/approvals/${requestId}/deny`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decided_by: 'soc-operator', reason: 'Denied by policy' }),
      });
      if (res.ok) {
        showNotification(`Request '${requestId}' denied.`);
        fetchApprovals();
      }
    } catch {
      showNotification(`Denial failed for '${requestId}'.`);
    }
  };

  const handleExportEUAct = async () => {
    try {
      const res = await fetch('/v1/audit/export?session_id=active');
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kyron-eu-ai-act-dossier-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('EU AI Act Article 50 Dossier exported successfully.');
      }
    } catch {
      showNotification('Export failed.');
    }
  };

  const quarantinedCount = tools.filter((t) => t.state === 'quarantined').length;
  const approvedCount = tools.filter((t) => t.state === 'approved' || t.state === 'active').length;

  return (
    <div className="min-h-screen bg-surface-base text-gray-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-neutral-border bg-surface-raised sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-surface-base border border-neutral-border flex items-center justify-center text-accent">
              <Shield className="w-4 h-4 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight font-mono text-gray-100">KYRON 2.0</span>
                <span className="bg-surface-base border border-neutral-border font-mono text-[10px] px-1.5 py-0.5 rounded text-neutral-muted">
                  SOC CONSOLE
                </span>
              </div>
              <span className="text-[11px] text-neutral-muted block leading-none mt-0.5">
                Deterministic Trust Layer & Runtime Firewall
              </span>
            </div>
          </div>

          {/* Clean Segmented Navigation */}
          <nav className="flex items-center gap-1 bg-surface-base border border-neutral-border p-1 rounded-lg text-xs font-mono overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'overview' ? 'bg-neutral-border text-gray-100' : 'text-neutral-muted hover:text-gray-300'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('registry')}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'registry' ? 'bg-neutral-border text-gray-100' : 'text-neutral-muted hover:text-gray-300'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Tool Registry
              {quarantinedCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-status-danger inline-block ml-0.5"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'approvals' ? 'bg-neutral-border text-gray-100' : 'text-neutral-muted hover:text-gray-300'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Approvals
              {approvals.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-status-warning inline-block ml-0.5"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('egress')}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'egress' ? 'bg-neutral-border text-gray-100' : 'text-neutral-muted hover:text-gray-300'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              Network Egress
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'audit' ? 'bg-neutral-border text-gray-100' : 'text-neutral-muted hover:text-gray-300'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Audit Trail
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'policies' ? 'bg-neutral-border text-gray-100' : 'text-neutral-muted hover:text-gray-300'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Policies
            </button>
          </nav>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-surface-raised border border-neutral-border text-gray-100 px-4 py-3 rounded-lg shadow-xl text-xs font-mono flex items-center gap-2">
          <Terminal className="w-4 h-4 text-accent" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        <MetricsBar
          quarantinedCount={quarantinedCount}
          approvedCount={approvedCount}
          activeLeasesCount={approvals.filter((a) => a.status === 'approved').length}
          attacksBlockedCount={33900}
        />

        {activeTab === 'overview' && (
          <CommandOverview
            quarantinedCount={quarantinedCount}
            approvedCount={approvedCount}
            activeLeasesCount={approvals.filter((a) => a.status === 'approved').length}
            auditCount={auditEvents.length}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onTriggerScan={fetchTools}
            onExportEUAct={handleExportEUAct}
          />
        )}

        {activeTab === 'registry' && (
          <ToolInventory
            tools={tools}
            loading={toolsLoading}
            error={toolsError}
            onRefresh={fetchTools}
            onApprove={handleApproveTool}
            onReject={handleRejectTool}
            onInspectDiff={handleInspectDiff}
          />
        )}

        {activeTab === 'approvals' && (
          <ApprovalQueue
            approvals={approvals}
            loading={approvalsLoading}
            error={approvalsError}
            onRefresh={fetchApprovals}
            onApprove={handleApproveRequest}
            onDeny={handleDenyRequest}
          />
        )}

        {activeTab === 'egress' && <EgressMonitor />}

        {activeTab === 'audit' && (
          <AuditDrawer
            events={auditEvents}
            loading={auditLoading}
            error={auditError}
            onRefresh={fetchAuditEvents}
            onExportEUAct={handleExportEUAct}
          />
        )}

        {activeTab === 'policies' && <PolicyStudio />}
      </main>

      {/* Semantic Drift Inspection Modal */}
      <SemanticDriftModal
        diff={activeDiff}
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        onApprove={handleApproveTool}
      />
    </div>
  );
};

export default App;
