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
egress_bytes_per_trajectory = 1048576 # 1 MB source quota
max_calls_per_trajectory = 100
max_distinct_destinations = 5

[egress]
default_action = "deny"
allowed_destinations = [
  "api.github.com",
  "*.corp.internal"
]
blocked_destinations = [
  "169.254.169.254", # Cloud metadata SSRF
  "evil-exfil.com"
]

[[tools]]
pattern = "bash"
action = "block"
reason = "Direct raw shell execution is prohibited"

[[tools]]
pattern = "k8s:restart_deployment"
action = "require_lease"
max_calls = 1
ttl_seconds = 600
`;

  return (
    <div className="space-y-6 font-sans">
      {/* Policy Bundle Header */}
      <div className="bg-white border border-[#E2E8F0] rounded p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] mb-5">
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">
              Declarative Policy Studio & Hot-Reload
            </h2>
            <p className="text-xs text-[#475569] mt-0.5">
              Compile, simulate, and atomically hot-reload declarative TOML policies across running gateway sessions with zero downtime.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleHotReload}
              className="px-4 py-2 text-xs font-semibold bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Hot-Reload Active Policy</span>
            </button>
          </div>
        </div>

        {hotReloadSuccess && (
          <div className="mb-4 bg-[#ECFDF5] border border-[#A7F3D0] p-3 rounded text-xs text-[#059669] flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Policy atomically hot-reloaded across active gateway sessions (0 downtime).</span>
          </div>
        )}

        {/* Policy Selector Tabs */}
        <div className="flex items-center gap-2 mb-4 text-xs font-medium">
          {['enterprise-strict', 'developer-sandbox', 'pci-compliance'].map((p) => (
            <button
              key={p}
              onClick={() => setActivePolicy(p)}
              className={`px-3 py-1.5 rounded border transition-colors ${
                activePolicy === p
                  ? 'bg-[#1D4ED8] text-white border-[#1D4ED8] shadow-sm'
                  : 'bg-white text-[#475569] border-[#CBD5E1] hover:bg-[#F8FAFC]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* TOML Display */}
        <pre className="bg-[#0F172A] border border-[#E2E8F0] p-5 rounded font-mono text-xs text-[#F8FAFC] overflow-x-auto leading-relaxed">
          <code>{sampleToml}</code>
        </pre>
      </div>

      {/* Circuit Breakers & Resilience Status */}
      <div className="bg-white border border-[#E2E8F0] rounded p-6 shadow-sm">
        <h3 className="text-sm font-bold text-[#0F172A] mb-1">
          Operational Circuit Breakers & Fault Tolerance
        </h3>
        <p className="text-xs text-[#475569] mb-4">
          Automated circuit breakers return deterministic seeded fallbacks rather than throwing errors if external cloud dependencies fail during a presentation.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded flex items-center justify-between">
            <span className="text-[#475569] font-medium font-mono">ENABLE_LLM_INFERENCE</span>
            <span className="text-[#059669] font-bold font-mono">
              {circuitBreakers?.ENABLE_LLM_INFERENCE ? 'ENABLED' : 'MOCK FALLBACK'}
            </span>
          </div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded flex items-center justify-between">
            <span className="text-[#475569] font-medium font-mono">ENABLE_PAYMENT_GATEWAY</span>
            <span className="text-[#059669] font-bold font-mono">
              {circuitBreakers?.ENABLE_PAYMENT_GATEWAY ? 'ENABLED' : 'MOCK FALLBACK'}
            </span>
          </div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded flex items-center justify-between">
            <span className="text-[#475569] font-medium font-mono">FALLBACK_MODE</span>
            <span className="text-[#1D4ED8] font-bold font-mono">
              {circuitBreakers?.fallback_mode || 'SEEDED_MOCKS'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
