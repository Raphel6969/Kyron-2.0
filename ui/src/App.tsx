import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  Activity, FileCheck2, History, KeyRound, LayoutDashboard, LayoutGrid,
  Menu, Network, Shield, Sliders, Terminal, X,
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

const navigation: Array<{ id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: 'Command center', icon: LayoutDashboard },
  { id: 'registry', label: 'Tool registry', icon: LayoutGrid },
  { id: 'approvals', label: 'Authority queue', icon: KeyRound },
  { id: 'egress', label: 'Network egress', icon: Network },
  { id: 'audit', label: 'Cryptographic trail', icon: History },
  { id: 'policies', label: 'Policy studio', icon: Sliders },
];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [toolsLoading, setToolsLoading] = useState(true);
  const [toolsError, setToolsError] = useState<string | null>(null);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [approvalsLoading, setApprovalsLoading] = useState(true);
  const [approvalsError, setApprovalsError] = useState<string | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEventItem[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [blockedCalls, setBlockedCalls] = useState(0);
  const [impactLoading, setImpactLoading] = useState(true);
  const [activeDiff, setActiveDiff] = useState<any | null>(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const pageTitle = navigation.find((item) => item.id === activeTab)?.label ?? 'Command center';

  const fetchTools = async () => { try { setToolsLoading(true); setToolsError(null); const res = await fetch('/v1/tools'); if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch tools`); setTools(await res.json()); } catch (err: any) { setToolsError(err.message || 'Failed to connect to control plane API'); } finally { setToolsLoading(false); } };
  const fetchApprovals = async () => { try { setApprovalsLoading(true); setApprovalsError(null); const res = await fetch('/v1/approvals?status=pending'); if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch approvals`); setApprovals(await res.json()); } catch (err: any) { setApprovalsError(err.message || 'Failed to connect to approval service'); } finally { setApprovalsLoading(false); } };
  const fetchAuditEvents = async () => { try { setAuditLoading(true); setAuditError(null); const res = await fetch('/v1/audit/events?limit=30'); if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch audit events`); setAuditEvents(await res.json()); } catch (err: any) { setAuditError(err.message || 'Failed to connect to audit evidence store'); } finally { setAuditLoading(false); } };
  const fetchImpactSummary = async () => { try { setImpactLoading(true); const res = await fetch('/v1/reports/summary'); if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch impact summary`); const data = await res.json(); setBlockedCalls(Number(data.blocked_calls) || 0); } catch { setBlockedCalls(0); } finally { setImpactLoading(false); } };

  useEffect(() => { fetchTools(); fetchApprovals(); fetchAuditEvents(); fetchImpactSummary(); }, []);
  useLayoutEffect(() => { const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; if (reduce || !shellRef.current) return; const ctx = gsap.context(() => { gsap.fromTo('.js-rail, .js-header', { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }); gsap.fromTo('.js-content > *', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.48, stagger: 0.07, delay: 0.12, ease: 'power2.out' }); }, shellRef); return () => ctx.revert(); }, [activeTab]);

  const showNotification = (message: string) => { setNotification(message); window.setTimeout(() => setNotification(null), 4000); };
  const approveTool = async (toolId: string) => { try { const res = await fetch(`/v1/tools/${encodeURIComponent(toolId)}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approver_id: 'sec-admin', canonical_description: 'Approved by SOC operator' }) }); if (res.ok) { showNotification(`Tool '${toolId}' approved and pinned successfully.`); fetchTools(); } } catch { showNotification(`Failed to approve tool '${toolId}'.`); } };
  const rejectTool = async (toolId: string) => { try { const res = await fetch(`/v1/tools/${encodeURIComponent(toolId)}/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'Quarantined and blocked by security operator' }) }); if (res.ok) { showNotification(`Tool '${toolId}' blocked.`); fetchTools(); } } catch { showNotification(`Failed to reject tool '${toolId}'.`); } };
  const inspectDiff = async (toolId: string) => { try { const res = await fetch(`/v1/tools/${encodeURIComponent(toolId)}/diff`); if (res.ok) { setActiveDiff(await res.json()); setIsDiffModalOpen(true); } } catch { showNotification(`Failed to inspect semantic diff for '${toolId}'.`); } };
  const approveRequest = async (id: string) => { try { const res = await fetch(`/v1/approvals/${id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decided_by: 'soc-operator', reason: 'Granted capability lease' }) }); if (res.ok) { showNotification(`Capability lease granted for request '${id}'.`); fetchApprovals(); fetchTools(); } } catch { showNotification(`Approval failed for '${id}'.`); } };
  const denyRequest = async (id: string) => { try { const res = await fetch(`/v1/approvals/${id}/deny`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decided_by: 'soc-operator', reason: 'Denied by policy' }) }); if (res.ok) { showNotification(`Request '${id}' denied.`); fetchApprovals(); } } catch { showNotification(`Denial failed for '${id}'.`); } };
  const exportEUAct = async () => { try { const res = await fetch('/v1/audit/export?session_id=active'); if (res.ok) { const blob = new Blob([JSON.stringify(await res.json(), null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `kyron-eu-ai-act-dossier-${Date.now()}.json`; anchor.click(); URL.revokeObjectURL(url); showNotification('EU AI Act Article 50 dossier exported successfully.'); } } catch { showNotification('Export failed.'); } };
  const selectTab = (tab: NavTab) => { setActiveTab(tab); setMobileNavOpen(false); };
  const quarantinedCount = tools.filter((t) => t.state === 'quarantined').length;
  const approvedCount = tools.filter((t) => t.state === 'approved' || t.state === 'active').length;
  const navKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, tab: NavTab) => { const index = navigation.findIndex((item) => item.id === tab); const next = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? (index + 1) % navigation.length : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? (index - 1 + navigation.length) % navigation.length : event.key === 'Home' ? 0 : event.key === 'End' ? navigation.length - 1 : index; if (next !== index) { event.preventDefault(); selectTab(navigation[next].id); document.getElementById(`nav-${navigation[next].id}`)?.focus(); } };

  return <div ref={shellRef} className="console-shell">
    <a href="#main-content" className="skip-link">Skip to console content</a>
    <aside className={`app-rail js-rail ${mobileNavOpen ? 'is-open' : ''}`} aria-label="Primary navigation">
      <div className="brand-lockup"><span className="brand-mark"><Shield aria-hidden="true" /></span><span className="brand-wordmark">KYRON<span>2.0</span></span></div>
      <div className="rail-label">Control plane</div>
      <nav role="tablist" aria-label="SOC console sections">{navigation.map(({ id, label, icon: Icon }) => <button key={id} id={`nav-${id}`} type="button" role="tab" aria-selected={activeTab === id} aria-current={activeTab === id ? 'page' : undefined} onClick={() => selectTab(id)} onKeyDown={(event) => navKeyDown(event, id)} className={`rail-item ${activeTab === id ? 'is-active' : ''}`}><Icon aria-hidden="true" /><span>{label}</span>{id === 'registry' && quarantinedCount > 0 && <b className="nav-count danger">{quarantinedCount}</b>}{id === 'approvals' && approvals.length > 0 && <b className="nav-count warning">{approvals.length}</b>}</button>)}</nav>
      <div className="rail-footer"><span className="status-dot" />Enforce mode<span className="rail-version">v2.0.0</span></div>
    </aside>
    {mobileNavOpen && <button className="nav-scrim" type="button" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
    <div className="console-main">
      <header className="operator-header js-header"><div className="mobile-header"><button className="icon-button" type="button" aria-label="Open navigation" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(true)}><Menu aria-hidden="true" /></button><span className="mobile-wordmark">KYRON 2.0</span></div><div className="header-context"><span className="eyebrow">SOC / {activeTab}</span><span className="header-separator" aria-hidden="true" /><span className="header-subtitle">Deterministic trust layer</span></div><div className="operator-status"><span className="status-dot" /> <span>Operator session active</span><span className="operator-id">sec-admin</span></div></header>
      <main id="main-content" tabIndex={-1} aria-labelledby="page-title" className="content-wrap js-content"><div className="page-heading"><div><p className="eyebrow accent-text">Live workspace / {activeTab}</p><h1 id="page-title">{pageTitle}</h1><p className="page-description">Runtime decisions, trust posture, and signed evidence for the active agent fleet.</p></div><div className="heading-actions"><span className="sync-indicator"><Activity aria-hidden="true" /> Live data</span><button className="icon-button" type="button" onClick={() => { fetchTools(); fetchApprovals(); fetchAuditEvents(); }} aria-label="Refresh console data"><Terminal aria-hidden="true" /></button></div></div>
        <MetricsBar quarantinedCount={quarantinedCount} approvedCount={approvedCount} activeLeasesCount={approvals.filter((a) => a.status === 'approved').length} attacksBlockedCount={blockedCalls} impactLoading={impactLoading} />
        {activeTab === 'overview' && <CommandOverview quarantinedCount={quarantinedCount} approvedCount={approvedCount} activeLeasesCount={approvals.filter((a) => a.status === 'approved').length} auditCount={auditEvents.length} onNavigateTab={selectTab} onTriggerScan={fetchTools} onExportEUAct={exportEUAct} />}
        {activeTab === 'registry' && <ToolInventory tools={tools} loading={toolsLoading} error={toolsError} onRefresh={fetchTools} onApprove={approveTool} onReject={rejectTool} onInspectDiff={inspectDiff} />}
        {activeTab === 'approvals' && <ApprovalQueue approvals={approvals} loading={approvalsLoading} error={approvalsError} onRefresh={fetchApprovals} onApprove={approveRequest} onDeny={denyRequest} />}
        {activeTab === 'egress' && <EgressMonitor />}
        {activeTab === 'audit' && <AuditDrawer events={auditEvents} loading={auditLoading} error={auditError} onRefresh={fetchAuditEvents} onExportEUAct={exportEUAct} />}
        {activeTab === 'policies' && <PolicyStudio />}
      </main>
    </div>
    {notification && <div role="status" aria-live="polite" className="toast"><Terminal aria-hidden="true" /><span>{notification}</span><button type="button" aria-label="Dismiss notification" onClick={() => setNotification(null)}><X aria-hidden="true" /></button></div>}
    <SemanticDriftModal diff={activeDiff} isOpen={isDiffModalOpen} onClose={() => setIsDiffModalOpen(false)} onApprove={approveTool} />
  </div>;
};

export default App;
