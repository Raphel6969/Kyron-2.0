import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  ArrowRight,
  Check,
  ChevronRight,
  FileCheck2,
  Fingerprint,
  LockKeyhole,
  Network,
  ScanSearch,
  ShieldCheck,
  Waypoints,
} from 'lucide-react';

interface CommandOverviewProps {
  quarantinedCount: number;
  approvedCount: number;
  activeLeasesCount: number;
  auditCount: number;
  onNavigateTab: (tab: any) => void;
  onTriggerScan: () => void;
  onExportEUAct: () => void;
}

const stages = [
  ['01', 'Discover', 'Tool metadata enters the trust boundary.'],
  ['02', 'Scan', 'Static rules inspect schemas and descriptions.'],
  ['03', 'Pin', 'Known-good content receives a SHA-256 identity.'],
  ['04', 'Authorize', 'A scoped lease decides who may call it.'],
  ['05', 'Flow-check', 'Data movement is checked before dispatch.'],
  ['06', 'Meter', 'Egress is attributed to its source.'],
  ['07', 'Prove', 'The outcome is sealed in signed evidence.'],
];

export const CommandOverview: React.FC<CommandOverviewProps> = ({
  quarantinedCount,
  approvedCount,
  activeLeasesCount,
  auditCount,
  onNavigateTab,
  onTriggerScan,
  onExportEUAct,
}) => {
  const overviewRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!overviewRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const context = gsap.context(() => {
      gsap.fromTo('.overview-reveal', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.65, stagger: 0.07, ease: 'power3.out' });
      gsap.fromTo('.flow-line', { strokeDashoffset: 420 }, { strokeDashoffset: 0, duration: 1.5, delay: 0.25, ease: 'power2.inOut' });
      gsap.fromTo('.flow-node', { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, delay: 0.3, stagger: 0.1, ease: 'power2.out' });
    }, overviewRef);
    return () => context.revert();
  }, []);

  return (
    <div ref={overviewRef} className="overview-page">
      <section className="overview-hero overview-reveal" aria-labelledby="overview-hero-title">
        <div className="overview-hero-copy">
          <p className="eyebrow accent-text">Daily operating brief / 07:42 UTC</p>
          <h2 id="overview-hero-title">Keep agent work moving.<br /><span>Make every tool call defensible.</span></h2>
          <p className="overview-lede">Kyron sits between your agents and their tools, quietly checking what changed, what may run, and what left the boundary. Your team gets useful automation without trading away control.</p>
          <div className="overview-actions">
            <button type="button" className="button-primary" onClick={() => onNavigateTab('registry')}>
              <ScanSearch aria-hidden="true" /> Review quarantined tools <ArrowRight aria-hidden="true" />
            </button>
            <button type="button" className="button-secondary" onClick={() => onNavigateTab('audit')}>
              <Fingerprint aria-hidden="true" /> See signed evidence
            </button>
          </div>
          <button type="button" className="overview-text-action" onClick={onTriggerScan}>Refresh the trust boundary <ChevronRight aria-hidden="true" /></button>
        </div>
        <div className="flow-visual" aria-label="Agent requests travel through Kyron before reaching tools">
          <div className="flow-header"><span>Protection path</span><span className="flow-live"><i /> Enforce mode</span></div>
          <svg className="flow-svg" viewBox="0 0 620 168" role="img" aria-label="Agent to Kyron to tools connection">
            <path className="flow-line" d="M72 92 H548" pathLength="420" />
            <path className="flow-line flow-line-muted" d="M174 92 H446" pathLength="420" />
            <g className="flow-node" transform="translate(40 58)"><circle r="32" /><Waypoints /><text x="0" y="58">AGENT</text></g>
            <g className="flow-node flow-node-kyron" transform="translate(310 58)"><circle r="42" /><ShieldCheck /><text x="0" y="68">KYRON</text></g>
            <g className="flow-node" transform="translate(580 58)"><circle r="32" /><Network /><text x="0" y="58">TOOLS</text></g>
          </svg>
          <div className="flow-caption"><span>Request</span><span>deterministic verdict</span><span>sanitized result</span></div>
        </div>
      </section>

      <section className="overview-section overview-reveal" aria-labelledby="stages-title">
        <div className="section-intro"><p className="eyebrow accent-text">01 / Before execution</p><h2 id="stages-title">Protection that follows the call.</h2><p>Seven small decisions, made in sequence, keep untrusted behavior out of the model context and off your network.</p></div>
        <div className="stage-list">{stages.map(([number, title, description]) => <div className="stage-row" key={number}><span className="stage-number">{number}</span><strong>{title}</strong><span className="stage-description">{description}</span><Check aria-hidden="true" /></div>)}</div>
      </section>

      <section className="overview-section loop-section overview-reveal" aria-labelledby="loop-title">
        <div className="section-intro"><p className="eyebrow accent-text">02 / Your daily operating loop</p><h2 id="loop-title">From new tool to audit-ready proof.</h2><p>One console for the moments that matter when autonomous work touches production systems.</p></div>
        <div className="loop-list">
          <div className="loop-row"><span className="loop-index">01</span><h3>Connect</h3><p>Onboard a GitHub, AWS, or internal MCP server without changing the agent. Kyron normalizes its contract at the boundary.</p><span className="loop-use">Platform teams / new integrations</span></div>
          <div className="loop-row"><span className="loop-index">02</span><h3>Observe</h3><p>See drift, active leases, and source-attributed egress as work happens. No waiting for a retrospective report.</p><span className="loop-use">SOC / live incident triage</span></div>
          <div className="loop-row"><span className="loop-index">03</span><h3>Decide</h3><p>Approve a narrow capability or let policy quarantine it. Every decision has a clear reason and a safe next action.</p><span className="loop-use">Security / least-privilege review</span></div>
          <div className="loop-row"><span className="loop-index">04</span><h3>Prove</h3><p>Export the signed trail when compliance, customers, or an incident review asks what happened.</p><span className="loop-use">Compliance / EU AI Act evidence</span></div>
        </div>
      </section>

      <section className="impact-strip overview-reveal" aria-labelledby="impact-title">
        <div><p className="eyebrow accent-text">03 / Live control-plane impact</p><h2 id="impact-title">What Kyron is holding right now.</h2></div>
        <div className="impact-values"><div><b>{approvedCount}</b><span>approved tools</span></div><div className="impact-danger"><b>{quarantinedCount}</b><span>quarantined tools</span></div><div><b>{activeLeasesCount}</b><span>active leases</span></div><div><b>{auditCount}</b><span>signed events</span></div></div>
      </section>

      <section className="limits-note overview-reveal"><LockKeyhole aria-hidden="true" /><div><p className="eyebrow">Honest limits</p><p>Kyron makes tool behavior observable and enforceable at the gateway. It cannot make a compromised upstream service truthful, replace your identity provider, or decide whether a business action is wise. Your policies and operators still own those calls.</p></div><button type="button" onClick={onExportEUAct}>Export dossier <FileCheck2 aria-hidden="true" /></button></section>
    </div>
  );
};
