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
              {/* Enterprise OAuth Single-Sign-On */}
              <div className="landing-oauth-buttons">
                <a
                  href={`/v1/auth/google/login?redirect_url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + '/console' : '/console')}`}
                  className="landing-oauth-btn"
                  title="Authenticate via Google Workspace"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google</span>
                </a>

                <a
                  href={`/v1/auth/github/login?redirect_url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + '/console' : '/console')}`}
                  className="landing-oauth-btn"
                  title="Authenticate via GitHub Enterprise"
                >
                  <svg className="w-4 h-4 flex-shrink-0 fill-[#0F172A]" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>GitHub</span>
                </a>
              </div>

              <div className="landing-oauth-divider">
                <span>or choose role persona</span>
              </div>

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
