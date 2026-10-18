import React, { useState, useEffect } from 'react';
import { Sliders, RefreshCw, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';

export const PolicyStudio: React.FC = () => {
  const [circuitBreakers, setCircuitBreakers] = useState<any>(null);
  const [activePolicy, setActivePolicy] = useState('enterprise-strict');
  const [hotReloadSuccess, setHotReloadSuccess] = useState(false);

  useEffect(() => {
    fetch('/v1/circuit-breakers')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setCircuitBreakers(data);
      })
      .catch(() => {});
  }, []);

  const handleHotReload = async () => {
    try {
      const res = await fetch('/v1/policies/reload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy_version: 1 }),
      });
      if (res.ok) {
        setHotReloadSuccess(true);
        setTimeout(() => setHotReloadSuccess(false), 3000);
      }
    } catch {}
  };

  const sampleToml = `[meta]
version = 1
name = "${activePolicy}"
mode = "enforce"
signed_by = "sec-admin-corp"

[budgets]
egress_bytes_per_trajectory = 1048576 # 1 MB
max_calls_per_trajectory = 100
max_distinct_destinations = 5

[egress]
default_action = "deny"
allowed_destinations = [
  "api.github.com",
  "*.corp.net"
]
blocked_destinations = [
  "169.254.169.254", # Cloud metadata SSRF
  "evil-exfil.com"
]

[[tools]]
pattern = "bash"
action = "block"
reason = "Direct raw shell execution is banned"

[[tools]]
pattern = "k8s:restart_deployment"
action = "require_lease"
max_calls = 1
ttl_seconds = 600
`;

  return (
    <div className="space-y-6">
      {/* Policy Bundle Header */}
      <div className="bg-surface-raised border border-neutral-border rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-border mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-200 font-mono">
              Declarative Policy Studio (C3, F35)
            </h2>
            <p className="text-xs text-neutral-muted">
              Compile, simulate, and atomically hot-reload declarative TOML policies across running gateway sessions with zero downtime.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleHotReload}
              className="px-3 py-1.5 text-xs font-mono font-medium bg-surface-base hover:bg-neutral-border text-gray-200 border border-neutral-border rounded flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Hot-Reload Active Policy
            </button>
          </div>
        </div>

        {hotReloadSuccess && (
          <div className="mb-4 bg-surface-base border border-neutral-border p-3 rounded text-xs font-mono text-status-success flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Policy atomically hot-reloaded across active gateway sessions (0 downtime).</span>
          </div>
        )}

        {/* Policy Selector Tabs */}
        <div className="flex items-center gap-2 mb-4 font-mono text-xs" role="group" aria-label="Select active policy">
          {['enterprise-strict', 'developer-sandbox', 'pci-compliance'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setActivePolicy(p)}
              aria-pressed={activePolicy === p}
              className={`px-3 py-1.5 rounded border transition-colors ${
                activePolicy === p
                  ? 'bg-neutral-border text-gray-100 border-neutral-muted'
                  : 'bg-surface-base text-neutral-muted border-neutral-border hover:text-gray-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* TOML Display */}
        <pre className="bg-surface-base border border-neutral-border p-4 rounded-lg font-mono text-xs text-gray-300 overflow-x-auto leading-relaxed">
          <code>{sampleToml}</code>
        </pre>
      </div>

      {/* Circuit Breakers & Resilience Status */}
      <div className="bg-surface-raised border border-neutral-border rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-200 font-mono mb-3">
          Operational Circuit Breakers (demo-resilience)
        </h3>
        <p className="text-xs text-neutral-muted mb-4">
          Automated circuit breakers return deterministic seeded fallbacks rather than throwing errors if external cloud dependencies fail during a presentation.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div className="bg-surface-base border border-neutral-border p-3.5 rounded flex items-center justify-between">
            <span className="text-neutral-muted">ENABLE_LLM_INFERENCE</span>
            <span className="text-status-success font-semibold">
              {circuitBreakers?.ENABLE_LLM_INFERENCE ? 'ENABLED' : 'MOCK FALLBACK'}
            </span>
          </div>
          <div className="bg-surface-base border border-neutral-border p-3.5 rounded flex items-center justify-between">
            <span className="text-neutral-muted">ENABLE_PAYMENT_GATEWAY</span>
            <span className="text-status-success font-semibold">
              {circuitBreakers?.ENABLE_PAYMENT_GATEWAY ? 'ENABLED' : 'MOCK FALLBACK'}
            </span>
          </div>
          <div className="bg-surface-base border border-neutral-border p-3.5 rounded flex items-center justify-between">
            <span className="text-neutral-muted">FALLBACK_MODE</span>
            <span className="text-accent font-semibold">
              {circuitBreakers?.fallback_mode || 'SEEDED_MOCKS'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
