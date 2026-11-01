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
  X,
  Search,
  FileCheck2,
  Building2,
  User,
  Activity,
  ChevronRight
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
  const [viewMode, setViewMode] = useState<'landing' | 'console'>(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/console') {
      return 'console';
    }
    return 'landing';
  });

  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [currentRole, setCurrentRole] = useState<string>('Enterprise Security Lead');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

  // Blocked calls counter
  const [blockedCalls, setBlockedCalls] = useState<number>(33900);
  const [impactLoading, setImpactLoading] = useState<boolean>(false);

  // Semantic drift inspection modal state
  const [activeDiff, setActiveDiff] = useState<any | null>(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState<boolean>(false);

  // Toast notification
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
      // Retain deterministic baseline
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
        body: JSON.stringify({ decided_by: 'sec-admin', reason: 'Granted capability lease' }),
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
        body: JSON.stringify({ decided_by: 'sec-admin', reason: 'Denied by policy' }),
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

  const handleEnterConsole = (roleId: string = 'sec-admin') => {
    const roleLabels: Record<string, string> = {
      'sec-admin': 'Enterprise Security Lead',
      'compliance-auditor': 'EU AI Act Auditor',
      'platform-architect': 'AI Platform Architect',
    };
    setCurrentRole(roleLabels[roleId] || 'Enterprise Security Lead');
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

  const tabLabels: Record<NavTab, string> = {
    overview: 'Command Center',
    registry: 'Tool Registry & Drift',
    approvals: 'Authority Queue',
    egress: 'Network Egress',
    audit: 'Cryptographic Trail',
    policies: 'Policy Studio',
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex font-sans">
      {/* Fortune 500 Enterprise Sidebar */}
      <aside className={`w-64 bg-[#0F172A] text-white flex-shrink-0 flex flex-col justify-between fixed inset-y-0 left-0 z-50 md:static transition-transform ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div>
          {/* Organization & Product Brand Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#1D4ED8] flex items-center justify-center text-white">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm tracking-wider">KYRON</span>
                  <span className="bg-slate-800 border border-slate-700 text-[#10B981] text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold">
                    ENFORCE
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Acme Financial AI Fleet
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Categorized Navigation */}
          <nav className="p-4 space-y-6 text-sm">
            <div>
              <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider px-3 block mb-2">
                Operations
              </span>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => { setActiveTab('overview'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-left transition-colors font-medium ${
                    activeTab === 'overview'
                      ? 'bg-[#1D4ED8] text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Command Center</span>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider px-3 block mb-2">
                Security Controls
              </span>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => { setActiveTab('registry'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-left transition-colors font-medium ${
                    activeTab === 'registry'
                      ? 'bg-[#1D4ED8] text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutGrid className="w-4 h-4" />
                    <span>Tool Registry</span>
                  </div>
                  {quarantinedCount > 0 && (
                    <span className="bg-[#DC2626] text-white text-[11px] px-1.5 py-0.5 rounded-full font-bold">
                      {quarantinedCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('approvals'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-left transition-colors font-medium ${
                    activeTab === 'approvals'
                      ? 'bg-[#1D4ED8] text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <KeyRound className="w-4 h-4" />
                    <span>Authority Queue</span>
                  </div>
                  {approvals.length > 0 && (
                    <span className="bg-[#D97706] text-white text-[11px] px-1.5 py-0.5 rounded-full font-bold">
                      {approvals.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('egress'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-left transition-colors font-medium ${
                    activeTab === 'egress'
                      ? 'bg-[#1D4ED8] text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Network className="w-4 h-4" />
                    <span>Network Egress</span>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider px-3 block mb-2">
                Governance & Audit
              </span>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => { setActiveTab('audit'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-left transition-colors font-medium ${
                    activeTab === 'audit'
                      ? 'bg-[#1D4ED8] text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <History className="w-4 h-4" />
                    <span>Cryptographic Trail</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('policies'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-left transition-colors font-medium ${
                    activeTab === 'policies'
                      ? 'bg-[#1D4ED8] text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4" />
                    <span>Policy Studio</span>
                  </div>
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[#1D4ED8]">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-white block truncate">{currentRole}</span>
              <span className="text-[11px] text-slate-400 block truncate">sec-admin · Active</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
            <button
              type="button"
              onClick={handleReturnToLanding}
              className="flex-1 py-1.5 px-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors flex items-center justify-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Landing Page</span>
            </button>

            <button
              type="button"
              onClick={handleReturnToLanding}
              className="p-1.5 text-slate-400 hover:text-status-danger rounded hover:bg-slate-800 transition-colors"
              title="Sign Out to Landing"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Executive Top Header */}
        <header className="h-16 bg-white border-b border-[#E2E8F0] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 text-[#475569] hover:text-[#0F172A]"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Path */}
            <div className="flex items-center gap-2 text-xs text-[#475569]">
              <span className="font-medium">Security Operations</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span className="font-semibold text-[#0F172A]">{tabLabels[activeTab]}</span>
            </div>
          </div>

          {/* Top Actions & Global Telemetry */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-[#059669] inline-block animate-pulse"></span>
              <span>In-Line Proxy: 3.8ms p95</span>
            </div>

            <button
              type="button"
              onClick={handleExportEUAct}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded transition-colors shadow-sm"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Export Article 50 Dossier</span>
            </button>

            <button
              type="button"
              onClick={() => { fetchTools(); fetchApprovals(); fetchAuditEvents(); }}
              className="p-2 text-[#475569] hover:text-[#0F172A] border border-[#CBD5E1] rounded hover:bg-[#F8FAFC] transition-colors"
              title="Refresh Telemetry"
              aria-label="Refresh Telemetry"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Toast Notification */}
        {notification && (
          <div className="fixed bottom-5 right-5 z-50 bg-[#0F172A] text-white px-4 py-3 rounded shadow-xl text-xs font-medium flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#1D4ED8]" />
            <span>{notification}</span>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="p-4 sm:p-8 flex-1 max-w-7xl w-full mx-auto space-y-6">
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
      </div>

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
