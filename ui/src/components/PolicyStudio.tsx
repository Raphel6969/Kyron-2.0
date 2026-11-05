import React, { useState, useEffect } from 'react';
import { Sliders, RefreshCw, CheckCircle2, Shield, AlertTriangle, Play, FileCode2 } from 'lucide-react';

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
      <div className="console-card overflow-hidden">
        <div className="console-card-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#1D4ED8]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <p className="landing-kicker text-[10px]">05 / Declarative Policy</p>
              <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                Policy Studio & Hot-Reload Engine
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hotReloadSuccess && (
              <span className="text-xs text-[#059669] font-mono font-bold flex items-center gap-1 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Reloaded Across Fleet</span>
              </span>
            )}
            <button
              onClick={handleHotReload}
              className="landing-button landing-button-primary text-xs h-8 px-3.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Hot-Reload TOML</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#0F172A]">Active Policy:</span>
              <span className="font-mono text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                {activePolicy}.toml
              </span>
            </div>
            <span className="text-xs text-[#059669] font-mono font-semibold">Sub-1ms Evaluation</span>
          </div>

          {/* TOML Code Display Container */}
          <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded p-4 font-mono text-xs text-[#0F172A] overflow-x-auto leading-relaxed">
            <pre className="m-0 font-mono text-xs leading-relaxed">{sampleToml}</pre>
          </div>
        </div>
      </div>

      {/* Operational Circuit Breakers */}
      <div className="console-card overflow-hidden">
        <div className="console-card-header">
          <p className="landing-kicker text-[10px]">Fault Tolerance</p>
          <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
            Operational Circuit Breakers & Fallback Modes
          </h3>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0F172A]">Remote MCP Fallback</span>
              <span className="w-2 h-2 rounded-full bg-[#059669]"></span>
            </div>
            <p className="text-[#64748B]">Deterministic mock fixtures if upstream tool crashes.</p>
            <span className="text-[10px] font-mono text-[#059669] font-bold block pt-1">
              STATUS: READY
            </span>
          </div>

          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0F172A]">Control Plane Disconnect</span>
              <span className="w-2 h-2 rounded-full bg-[#059669]"></span>
            </div>
            <p className="text-[#64748B]">Gateway runs last signed policy bundle independently.</p>
            <span className="text-[10px] font-mono text-[#059669] font-bold block pt-1">
              STATUS: AUTONOMOUS
            </span>
          </div>

          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0F172A]">Deterministic Recovery</span>
              <span className="w-2 h-2 rounded-full bg-[#059669]"></span>
            </div>
            <p className="text-[#64748B]">Cached recovery plans indexed by composite fingerprint.</p>
            <span className="text-[10px] font-mono text-[#059669] font-bold block pt-1">
              STATUS: CACHED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
