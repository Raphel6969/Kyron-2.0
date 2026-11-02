import React, { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleCheck,
  Fingerprint,
  LockKeyhole,
  Network,
  Server,
  Shield,
  ShieldCheck,
  X,
} from 'lucide-react';

interface LandingPageProps {
  onEnterConsole: (role?: string) => void;
  quarantinedCount: number;
  approvedCount: number;
  blockedCalls: number;
}

type Stage = {
  number: string;
  title: string;
  short: string;
  detail: string;
};

const stages: Stage[] = [
  { number: '01', title: 'Discover', short: 'Tool enters boundary', detail: 'Kyron receives the listing before the agent can read it.' },
  { number: '02', title: 'Normalize', short: 'Clean the contract', detail: 'Descriptions, schemas, and control characters are normalized.' },
  { number: '03', title: 'Pin', short: 'Give it an identity', detail: 'Approved content receives a stable SHA-256 identity.' },
  { number: '04', title: 'Authorize', short: 'Scope the action', detail: 'Policies and expiring capability leases decide who may call.' },
  { number: '05', title: 'Flow-check', short: 'Check data movement', detail: 'Data-flow rules evaluate the call before dispatch and on return.' },
  { number: '06', title: 'Meter egress', short: 'Watch the boundary', detail: 'Outbound bytes and destinations are attributed to their source.' },
  { number: '07', title: 'Prove', short: 'Seal the outcome', detail: 'A signed, ordered audit event records what happened.' },
];

const roles = [
  { id: 'sec-admin', label: 'Security lead', detail: 'Review drift, approve pins, and issue bounded authority.' },
  { id: 'platform-architect', label: 'Platform architect', detail: 'Inspect fleet posture, policies, and gateway behavior.' },
  { id: 'compliance-auditor', label: 'Compliance auditor', detail: 'Review signed evidence and export a dossier.' },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterConsole,
  quarantinedCount,
  approvedCount,
  blockedCalls,
}) => {
  const [selectedStage, setSelectedStage] = useState(3);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('sec-admin');
  const pageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!pageRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const context = gsap.context(() => {
      gsap.fromTo('.landing-reveal', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' });
      gsap.fromTo('.landing-path', { strokeDashoffset: 360 }, { strokeDashoffset: 0, duration: 1.7, delay: 0.2, ease: 'power2.inOut' });
      gsap.fromTo('.landing-node', { opacity: 0, scale: 0.75 }, { opacity: 1, scale: 1, duration: 0.5, delay: 0.35, stagger: 0.12, ease: 'power2.out' });
      gsap.to('.landing-signal', { x: 420, duration: 2.4, repeat: -1, repeatDelay: 1.1, ease: 'none' });
    }, pageRef);
    return () => context.revert();
  }, []);

  const handleAuthSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setAuthModalOpen(false);
    onEnterConsole(selectedRole);
  };

  return (
    <div ref={pageRef} className="landing-page">
      <div className="landing-grid" aria-hidden="true" />
      <header className="landing-nav">
        <a href="#top" className="landing-brand" aria-label="Kyron home">
          <span className="landing-brand-mark"><Shield aria-hidden="true" /></span>
          <span>KYRON <em>2.0</em></span>
        </a>
        <nav className="landing-nav-links" aria-label="Landing page sections">
          <a href="#how-it-works">How it works</a>
          <a href="#operators">For operators</a>
          <a href="#architecture">Architecture</a>
        </nav>
        <button type="button" className="landing-nav-cta" onClick={() => setAuthModalOpen(true)}>
          Enter control plane <ArrowRight aria-hidden="true" />
        </button>
      </header>

      <main id="top">
        <section className="landing-hero landing-reveal" aria-labelledby="landing-title">
          <div className="landing-hero-copy">
            <p className="landing-kicker"><span className="landing-kicker-dot" /> Runtime trust for AI agents</p>
            <h1 id="landing-title">Let agents move fast.<br /><span>Keep authority yours.</span></h1>
            <p className="landing-hero-lede">Kyron is the deterministic trust layer between an AI agent and every tool it can reach. Verify the tool, constrain the call, meter the boundary, and leave proof behind.</p>
            <div className="landing-actions">
              <button type="button" className="landing-button landing-button-primary" onClick={() => setAuthModalOpen(true)}>
                Open the control plane <ArrowRight aria-hidden="true" />
              </button>
              <a className="landing-button landing-button-secondary" href="#how-it-works">See how it works <ChevronRight aria-hidden="true" /></a>
            </div>
            <div className="landing-proof-line"><CircleCheck aria-hidden="true" /> Stock MCP clients · gateway-first · zero security tokens on the hot path</div>
          </div>

          <div className="landing-hero-visual" aria-label="Animated protection path from agent to tools">
            <div className="landing-visual-topline"><span>LIVE PROTECTION PLANE</span><span className="landing-live"><i /> ENFORCE</span></div>
            <div className="landing-flow-labels"><span>agent request</span><span>policy verdict</span><span>sanitized result</span></div>
            <svg className="landing-flow" viewBox="0 0 620 260" role="img" aria-label="Agent request passes through Kyron before reaching tools">
              <path className="landing-path landing-path-muted" d="M72 126 H548" pathLength="360" />
              <path className="landing-path" d="M72 126 H548" pathLength="360" />
              <circle className="landing-signal" cx="0" cy="126" r="4" />
              <g className="landing-node" transform="translate(72 126)"><circle r="43" /><Network /><text y="66">AGENT</text></g>
              <g className="landing-node landing-node-core" transform="translate(310 126)"><circle r="65" /><ShieldCheck /><text y="91">KYRON GATEWAY</text></g>
              <g className="landing-node" transform="translate(548 126)"><circle r="43" /><Server /><text y="66">TOOLS</text></g>
            </svg>
            <div className="landing-visual-footer"><span><b>7</b> decision gates</span><span><b>0</b> model tokens</span><span><b>1</b> signed trail</span></div>
          </div>
        </section>

        <section className="landing-trust-strip landing-reveal" aria-label="Kyron operating principles">
          <span>Built for teams shipping with</span><b>Claude</b><b>Cursor</b><b>OpenAI</b><b>Internal agents</b><b>Stock MCP</b>
        </section>

        <section id="how-it-works" className="landing-section landing-reveal" aria-labelledby="how-title">
          <div className="landing-section-intro">
            <p className="landing-kicker">01 / The protection path</p>
            <h2 id="how-title">Trust is a sequence,<br /><span>not a checkbox.</span></h2>
            <p>Every call moves through a short chain of deterministic decisions. Pick a stage to see what Kyron checks before the request can touch a real tool.</p>
          </div>
          <div className="landing-stage-panel">
            <div className="landing-stage-list" role="tablist" aria-label="Kyron protection stages">
              {stages.map((stage, index) => (
                <button key={stage.number} type="button" role="tab" aria-selected={selectedStage === index} className={`landing-stage-tab ${selectedStage === index ? 'is-selected' : ''}`} onClick={() => setSelectedStage(index)}>
                  <span>{stage.number}</span><strong>{stage.title}</strong><small>{stage.short}</small><ChevronRight aria-hidden="true" />
                </button>
              ))}
            </div>
            <div className="landing-stage-detail" role="tabpanel">
              <p className="landing-kicker">Decision gate {stages[selectedStage].number}</p>
              <h3>{stages[selectedStage].title}</h3>
              <p>{stages[selectedStage].detail}</p>
              <div className="landing-stage-status"><Check aria-hidden="true" /> Deterministic check · no model call required</div>
            </div>
          </div>
        </section>

        <section id="operators" className="landing-section landing-section-operators landing-reveal" aria-labelledby="operators-title">
          <div className="landing-section-intro">
            <p className="landing-kicker">02 / Built for the workday</p>
            <h2 id="operators-title">One operating rhythm for every team that owns agent risk.</h2>
          </div>
          <div className="landing-operator-rows">
            <div><span>01</span><h3>Connect</h3><p>Route an existing agent through Kyron. Start in monitor mode and see what would have been blocked.</p><b>Platform engineering</b></div>
            <div><span>02</span><h3>Decide</h3><p>Review drift, grant narrow leases, and quarantine risky tools without stopping the rest of the fleet.</p><b>Security operations</b></div>
            <div><span>03</span><h3>Prove</h3><p>Export a signed record of what the agent saw, did, and who approved the authority.</p><b>Risk & compliance</b></div>
          </div>
        </section>

        <section id="architecture" className="landing-section landing-architecture landing-reveal" aria-labelledby="architecture-title">
          <div className="landing-section-intro">
            <p className="landing-kicker">03 / Enterprise architecture</p>
            <h2 id="architecture-title">The control plane manages.<br /><span>The data plane decides.</span></h2>
            <p>Human workflows stay off the critical path. Gateways enforce the last signed policy bundle even when the control plane is unavailable.</p>
          </div>
          <div className="landing-architecture-diagram">
            <div className="landing-arch-row landing-arch-client"><span>AI agents</span><small>stock clients · no rewrite</small></div>
            <div className="landing-arch-arrow">↓ request</div>
            <div className="landing-arch-core"><div><ShieldCheck aria-hidden="true" /><strong>KYRON DATA PLANE</strong><small>gateway · policy · egress · secrets</small></div><div><LockKeyhole aria-hidden="true" /><strong>CONSTRAINT</strong><small>authority · flow · budget</small></div><div><Fingerprint aria-hidden="true" /><strong>EVIDENCE</strong><small>hash chain · signed event</small></div></div>
            <div className="landing-arch-arrow">↓ governed call</div>
            <div className="landing-arch-row landing-arch-tools"><span>MCP tools</span><small>remote servers · local sandboxes</small></div>
            <div className="landing-arch-control"><span>CONTROL PLANE</span><b>inventory · approvals · policies · reports</b></div>
          </div>
        </section>

        <section className="landing-proof landing-reveal" aria-labelledby="proof-title">
          <div><p className="landing-kicker">04 / Live posture</p><h2 id="proof-title">Protection you can point to.</h2><p>These numbers come from the connected control plane, not a marketing slide.</p></div>
          <div className="landing-proof-metrics"><div><b>{approvedCount}</b><span>approved tools</span></div><div className="is-risk"><b>{quarantinedCount}</b><span>quarantined tools</span></div><div><b>{blockedCalls}</b><span>blocked calls</span></div></div>
          <button type="button" className="landing-button landing-button-primary" onClick={() => setAuthModalOpen(true)}>Inspect live posture <ArrowRight aria-hidden="true" /></button>
        </section>

        <section className="landing-disclaimer landing-reveal"><LockKeyhole aria-hidden="true" /><p><strong>Honest boundary.</strong> Kyron enforces what crosses its gateway and can attest local tools when sandboxed. Remote third-party internals remain black boxes; policies and operators still own business judgment.</p><button type="button" onClick={() => setAuthModalOpen(true)}>Enter as an operator <ArrowRight aria-hidden="true" /></button></section>
      </main>

      <footer className="landing-footer"><span>KYRON 2.0</span><span>Deterministic trust for tool-using agents</span><span>Control plane / v2.0</span></footer>

      {authModalOpen && (
        <div className="landing-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setAuthModalOpen(false); }}>
          <div className="landing-auth-modal" role="dialog" aria-modal="true" aria-labelledby="landing-auth-title">
            <div className="landing-modal-header"><div><p className="landing-kicker">Secure workspace</p><h2 id="landing-auth-title">Choose your operating view</h2></div><button type="button" className="landing-modal-close" onClick={() => setAuthModalOpen(false)} aria-label="Close access dialog"><X aria-hidden="true" /></button></div>
            <form onSubmit={handleAuthSubmit}>
              <div className="landing-role-list">{roles.map((role) => <label key={role.id} className={`landing-role ${selectedRole === role.id ? 'is-selected' : ''}`}><input type="radio" name="landing-role" value={role.id} checked={selectedRole === role.id} onChange={(event) => setSelectedRole(event.target.value)} /><span><strong>{role.label}</strong><small>{role.detail}</small></span><Check aria-hidden="true" /></label>)}</div>
              <div className="landing-modal-note"><Fingerprint aria-hidden="true" /> Demo access opens the seeded control plane; enforcement behavior and API workflows remain unchanged.</div>
              <button type="submit" className="landing-button landing-button-primary landing-modal-submit">Continue to control plane <ArrowRight aria-hidden="true" /></button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
