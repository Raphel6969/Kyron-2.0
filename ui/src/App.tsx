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
  RotateCw,
  LogOut,
  Layers,
  ArrowRight,
  ExternalLink,
  Menu,
  X
} from 'lucide-react';
import { MetricsBar } from './components/MetricsBar';
import { CommandOverview } from './components/CommandOverview';
import { ToolInventory, ToolItem } from './components/ToolInventory';
import { SemanticDriftModal } from './components/SemanticDriftModal';
import { ApprovalQueue, ApprovalItem } from './components/ApprovalQueue';
import { AuditDrawer, AuditEventItem } from './components/AuditDrawer';
import { EgressMonitor } from './components/EgressMonitor';
import { PolicyStudio } from './components/PolicyStudio';
import { LandingPage } from './components/LandingPage';

export type NavTab = 'overview' | 'registry' | 'approvals' | 'egress' | 'audit' | 'policies';

export const App: React.FC = () => {
  // View mode: 'landing' or 'console'
  const [viewMode, setViewMode] = useState<'landing' | 'console'>(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/console') {
      return 'console';
    }
    return 'landing';
  });

  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [currentRole, setCurrentRole] = useState<string>('sec-admin');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

  // Impact report / blocked calls counter
  const [blockedCalls, setBlockedCalls] = useState<number>(33900);
  const [impactLoading, setImpactLoading] = useState<boolean>(false);

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

  const fetchImpactSummary = async () => {
    try {
      setImpactLoading(true);
      const res = await fetch('/v1/reports/summary');
      if (res.ok) {
        const data = await res.json();
        if (data.blocked_calls) {
          setBlockedCalls(Number(data.blocked_calls));
        }
      }
    } catch {
      // Keep deterministic seeded baseline
    } finally {
      setImpactLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
    fetchApprovals();
    fetchAuditEvents();
    fetchImpactSummary();
  }, []);

  const handleApproveTool = async (toolId: string) => {
    try {
      const res = await fetch(`/v1/tools/${encodeURIComponent(toolId)}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approver_id: currentRole, canonical_description: 'Approved by SOC operator' }),
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
        body: JSON.stringify({ decided_by: currentRole, reason: 'Granted capability lease' }),
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
        body: JSON.stringify({ decided_by: currentRole, reason: 'Denied by policy' }),
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

  const handleEnterConsole = (role: string = 'sec-admin') => {
    setCurrentRole(role);
    setViewMode('console');
    window.history.pushState({}, '', '/console');
  };

  const handleReturnToLanding = () => {
    setViewMode('landing');
    window.history.pushState({}, '', '/');
  };

  const quarantinedCount = tools.filter((t) => t.state === 'quarantined').length;
  const approvedCount = tools.filter((t) => t.state === 'approved' || t.state === 'active').length;

  if (viewMode === 'landing') {
    return (
      <LandingPage
        onEnterConsole={handleEnterConsole}
        quarantinedCount={quarantinedCount}
        approvedCount={approvedCount}
        blockedCalls={blockedCalls}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#080B0E] text-[#F0F4F8] flex flex-col font-sans selection:bg-[#0EA5E9] selection:text-white">
      {/* Top Operations Header */}
      <header className="border-b border-[#1E2630] bg-[#0E1318] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-[#2D3A49] bg-[#141B22] flex items-center justify-center text-[#0EA5E9]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wider font-mono text-[#F0F4F8]">KYRON 2.0</span>
                <span className="bg-[#141B22] border border-[#1E2630] font-mono text-[10px] px-1.5 py-0.5 rounded text-[#8A99A8]">
                  SOC CONSOLE
                </span>
                <span className="bg-[#141B22] border border-[#1E2630] text-[#10B981] font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold">
                  ENFORCE
                </span>
              </div>
              <span className="text-[11px] text-[#8A99A8] block leading-none mt-0.5 font-mono">
                Operator: <span className="text-[#F0F4F8] font-semibold">{currentRole}</span> · 0 Hot-Path Tokens
              </span>
            </div>
          </div>

          {/* Segmented Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#080B0E] border border-[#1E2630] p-1 rounded font-mono text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors whitespace-nowrap font-medium ${
                activeTab === 'overview' ? 'bg-[#1E2630] text-[#F0F4F8]' : 'text-[#8A99A8] hover:text-[#F0F4F8]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('registry')}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors whitespace-nowrap font-medium ${
                activeTab === 'registry' ? 'bg-[#1E2630] text-[#F0F4F8]' : 'text-[#8A99A8] hover:text-[#F0F4F8]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Tool Registry
              {quarantinedCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E] inline-block ml-0.5"></span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('approvals')}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors whitespace-nowrap font-medium ${
                activeTab === 'approvals' ? 'bg-[#1E2630] text-[#F0F4F8]' : 'text-[#8A99A8] hover:text-[#F0F4F8]'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Authority
              {approvals.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] inline-block ml-0.5"></span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('egress')}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors whitespace-nowrap font-medium ${
                activeTab === 'egress' ? 'bg-[#1E2630] text-[#F0F4F8]' : 'text-[#8A99A8] hover:text-[#F0F4F8]'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              Egress
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors whitespace-nowrap font-medium ${
                activeTab === 'audit' ? 'bg-[#1E2630] text-[#F0F4F8]' : 'text-[#8A99A8] hover:text-[#F0F4F8]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Audit Trail
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('policies')}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors whitespace-nowrap font-medium ${
                activeTab === 'policies' ? 'bg-[#1E2630] text-[#F0F4F8]' : 'text-[#8A99A8] hover:text-[#F0F4F8]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Policies
            </button>
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2 font-mono">
            <button
              type="button"
              onClick={handleReturnToLanding}
              className="px-2.5 py-1.5 text-xs text-[#8A99A8] hover:text-[#F0F4F8] border border-[#1E2630] rounded hover:border-[#2D3A49] transition-colors flex items-center gap-1"
              title="View Public Architecture and Threat Matrix"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Architecture</span>
            </button>

            <button
              type="button"
              onClick={handleReturnToLanding}
              className="p-1.5 text-[#8A99A8] hover:text-[#F43F5E] border border-[#1E2630] rounded transition-colors"
              title="Sign Out to Landing"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <div className="md:hidden border-t border-[#1E2630] bg-[#080B0E] px-4 py-2 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-1 overflow-x-auto">
            {(['overview', 'registry', 'approvals', 'egress', 'audit', 'policies'] as NavTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 rounded capitalize whitespace-nowrap ${
                  activeTab === tab ? 'bg-[#1E2630] text-[#F0F4F8] font-bold' : 'text-[#8A99A8]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0E1318] border border-[#2D3A49] text-[#F0F4F8] px-4 py-3 rounded shadow-2xl text-xs font-mono flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#0EA5E9]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Console Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        <MetricsBar
          quarantinedCount={quarantinedCount}
          approvedCount={approvedCount}
          activeLeasesCount={approvals.filter((a) => a.status === 'approved').length}
          attacksBlockedCount={blockedCalls}
          impactLoading={impactLoading}
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
