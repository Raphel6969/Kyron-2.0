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
  ChevronRight,
  Database
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
    <div className="console-workspace min-h-screen flex font-sans">
      <div className="console-grid" aria-hidden="true" />

      {/* Enterprise SOC Sidebar — In Resonance with Landing Page */}
      <aside className={`w-64 bg-white border-r border-[#E2E8F0] text-[#0F172A] flex-shrink-0 flex flex-col justify-between fixed inset-y-0 left-0 z-50 md:static transition-transform shadow-sm ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div>
          {/* Organization & Product Brand Header */}
          <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <span className="landing-brand-mark"><Shield className="w-4 h-4 text-[#1D4ED8]" /></span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm tracking-wider font-mono text-[#0F172A]">KYRON <em className="text-[#1D4ED8] not-italic">2.0</em></span>
                  <span className="landing-live text-[10px]"><i /> ENFORCE</span>
                </div>
                <span className="text-[11px] text-[#64748B] block mt-0.5 font-mono">
                  Acme Financial AI Fleet
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden text-[#64748B] hover:text-[#0F172A]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Categorized Navigation */}
          <nav className="p-3 space-y-5 text-sm">
            <div>
              <p className="landing-kicker text-[10px] px-2 mb-2">01 / Operations</p>
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => { setActiveTab('overview'); setMobileSidebarOpen(false); }}
                  className={`console-sidebar-tab ${activeTab === 'overview' ? 'is-active' : ''}`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4 text-[#1D4ED8]" />
                    <span>Command Center</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#64748B]">01</span>
                </button>
              </div>
            </div>

            <div>
              <p className="landing-kicker text-[10px] px-2 mb-2">02 / Security Controls</p>
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => { setActiveTab('registry'); setMobileSidebarOpen(false); }}
                  className={`console-sidebar-tab ${activeTab === 'registry' ? 'is-active' : ''}`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutGrid className="w-4 h-4 text-[#1D4ED8]" />
                    <span>Tool Registry</span>
                  </div>
                  {quarantinedCount > 0 ? (
                    <span className="bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                      {quarantinedCount}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-[#64748B]">02</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('approvals'); setMobileSidebarOpen(false); }}
                  className={`console-sidebar-tab ${activeTab === 'approvals' ? 'is-active' : ''}`}
                >
                  <div className="flex items-center gap-2.5">
                    <KeyRound className="w-4 h-4 text-[#1D4ED8]" />
                    <span>Authority Queue</span>
                  </div>
                  {approvals.length > 0 ? (
                    <span className="bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706] text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                      {approvals.length}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-[#64748B]">03</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('egress'); setMobileSidebarOpen(false); }}
                  className={`console-sidebar-tab ${activeTab === 'egress' ? 'is-active' : ''}`}
                >
                  <div className="flex items-center gap-2.5">
                    <Network className="w-4 h-4 text-[#1D4ED8]" />
                    <span>Network Egress</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#64748B]">04</span>
                </button>
              </div>
            </div>

            <div>
              <p className="landing-kicker text-[10px] px-2 mb-2">03 / Governance & Audit</p>
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => { setActiveTab('audit'); setMobileSidebarOpen(false); }}
                  className={`console-sidebar-tab ${activeTab === 'audit' ? 'is-active' : ''}`}
                >
                  <div className="flex items-center gap-2.5">
                    <History className="w-4 h-4 text-[#1D4ED8]" />
                    <span>Cryptographic Trail</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#64748B]">05</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('policies'); setMobileSidebarOpen(false); }}
                  className={`console-sidebar-tab ${activeTab === 'policies' ? 'is-active' : ''}`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 text-[#1D4ED8]" />
                    <span>Policy Studio</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#64748B]">06</span>
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer User Info & Status */}
        <div className="p-4 border-t border-[#E2E8F0] space-y-3 bg-[#F8FAFC]">
          <div className="p-2.5 bg-white border border-[#E2E8F0] rounded space-y-1">
            <div className="flex items-center justify-between">
              <span className="landing-kicker text-[9px]">Operator Session</span>
              <span className="w-2 h-2 rounded-full bg-[#059669]"></span>
            </div>
            <span className="text-xs font-bold text-[#0F172A] block truncate">{currentRole}</span>
            <span className="text-[10px] text-[#64748B] font-mono block">Zero-Trust Verified</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReturnToLanding}
              className="landing-button landing-button-secondary flex-1 text-xs h-9 px-2"
            >
              <Layers className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>Landing Page</span>
            </button>

            <button
              type="button"
              onClick={handleReturnToLanding}
              className="landing-button landing-button-secondary h-9 w-9 p-0 text-[#64748B] hover:text-status-danger"
              title="Sign Out to Landing"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#64748B] font-mono pt-1 border-t border-[#E2E8F0]">
            <span className="flex items-center gap-1.5"><Database className="w-3 h-3 text-[#1D4ED8]" /> Neon Postgres</span>
            <span className="text-[#059669] font-bold">production</span>
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Executive Top Header — Resonating with Landing Header */}
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 text-[#475569] hover:text-[#0F172A]"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Path */}
            <div className="flex items-center gap-2 text-xs">
              <span className="landing-kicker text-[10px]">Console</span>
              <ChevronRight className="w-3 h-3 text-[#94A3B8]" />
              <span className="font-bold text-[#0F172A]">{tabLabels[activeTab]}</span>
            </div>
          </div>

          {/* Top Actions & Global Telemetry */}
          <div className="flex items-center gap-3">
            <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-white border border-[#CBD5E1] text-[#1D4ED8] text-xs font-mono">
              <Database className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>Neon: production</span>
            </div>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-white border border-[#CBD5E1] text-[#059669] text-xs font-mono">
              <span className="landing-live"><i /> ENFORCE</span>
              <span className="text-[#CBD5E1]">|</span>
              <span className="text-[#475569]">3.8ms p95</span>
            </div>

            <button
              type="button"
              onClick={handleExportEUAct}
              className="landing-button landing-button-primary text-xs h-9 px-3.5"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Article 50 Dossier</span>
            </button>

            <button
              type="button"
              onClick={() => { fetchTools(); fetchApprovals(); fetchAuditEvents(); }}
              className="landing-button landing-button-secondary h-9 w-9 p-0"
              title="Refresh Telemetry"
              aria-label="Refresh Telemetry"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#475569]" />
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
