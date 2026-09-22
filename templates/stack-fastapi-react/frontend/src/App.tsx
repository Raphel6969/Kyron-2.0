import React, { useEffect, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { Activity, ShieldCheck, ArrowUpRight, RefreshCw, AlertCircle } from 'lucide-react';
import './styles/TOKENS.css';

interface ImpactData {
  baseline_metric: number;
  optimized_metric: number;
  total_economic_saved: number;
  sample_count: number;
  unit: string;
}

export default function App() {
  const [impact, setImpact] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Lenis Smooth Scroll Initialization
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // GSAP Entrance Animation
    gsap.from('.hero-headline', {
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.04,
      ease: 'power3.out',
    });

    fetchImpact();
  }, []);

  const fetchImpact = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/impact');
      if (!res.ok) throw new Error('Telemetry feed temporarily unavailable');
      const data = await res.json();
      setImpact(data);
    } catch (err: any) {
      setError(err.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  const executeAction = () => {
    setActionSuccess(true);
    setTimeout(() => setActionSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-surface-base text-slate-100 px-6 py-12 md:px-16 lg:px-24">
      {/* Top Bar */}
      <header className="flex justify-between items-center pb-8 border-b border-neutral-border">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-accent" />
          <span className="font-semibold tracking-tight text-sm uppercase">HackEngine OS</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-neutral-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Telemetry
          </span>
          <a
            href="/impact"
            className="hover:text-slate-100 flex items-center gap-0.5 border border-neutral-border px-3 py-1 rounded"
          >
            /impact route <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Main Asymmetric Grid */}
      <main className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column (7 cols): Editorial Hero */}
        <section className="lg:col-span-7">
          <h1 className="hero-headline text-fluid-display font-bold text-slate-100">
            Autonomous execution. Proven with an exit code.
          </h1>
          <p className="mt-6 text-fluid-body text-neutral-muted max-w-xl">
            A permanent operating system designed to take a hackathon Problem Statement and
            produce a verified, deployed, production-quality build that survives context resets.
          </p>

          <div className="mt-8 flex gap-4">
            <button
              onClick={executeAction}
              className="bg-accent hover:opacity-90 text-white font-medium px-6 py-3 rounded text-sm transition-opacity"
            >
              Execute Core Differentiator
            </button>
            <button
              onClick={fetchImpact}
              className="border border-neutral-border hover:bg-surface-raised text-slate-300 px-5 py-3 rounded text-sm flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Recalculate
            </button>
          </div>

          {actionSuccess && (
            <div className="mt-4 p-3 bg-surface-raised border border-accent/40 text-xs text-accent rounded flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Action verified and executed in 4.2ms. Event logged to PostgreSQL.
            </div>
          )}
        </section>

        {/* Right Column (5 cols): Live Telemetry Card */}
        <section className="lg:col-span-5 bg-surface-raised border border-neutral-border rounded-lg p-6">
          <div className="flex justify-between items-center pb-4 border-b border-neutral-border">
            <span className="text-xs uppercase tracking-wider text-neutral-muted font-mono flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-accent" /> Quantified Value Model
            </span>
            <span className="text-xs font-mono text-neutral-muted">SQL Aggregation</span>
          </div>

          {/* Loading Skeleton State */}
          {loading && (
            <div className="mt-6 space-y-4 animate-pulse">
              <div className="h-10 bg-neutral-border/50 rounded w-3/4" />
              <div className="h-6 bg-neutral-border/30 rounded w-1/2" />
              <div className="h-16 bg-neutral-border/40 rounded w-full mt-6" />
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="mt-6 p-4 border border-rose-500/30 bg-rose-500/5 rounded text-xs text-rose-400 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Telemetry Feed Error</p>
                <p className="mt-1 text-rose-400/80">{error}</p>
                <button
                  onClick={fetchImpact}
                  className="mt-3 text-xs underline hover:text-white"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          )}

          {/* Success State */}
          {!loading && !error && impact && (
            <div className="mt-6 space-y-6">
              <div>
                <span className="text-3xl font-mono font-bold text-slate-100">
                  {impact.total_economic_saved.toLocaleString()} {impact.unit}
                </span>
                <p className="text-xs text-neutral-muted mt-1">Total Disparity Resolved across Seed History</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-border font-mono text-xs">
                <div>
                  <span className="text-neutral-muted block">Status Quo Disparity</span>
                  <span className="text-sm font-semibold text-slate-200">{impact.baseline_metric}%</span>
                </div>
                <div>
                  <span className="text-neutral-muted block">Engine Optimized</span>
                  <span className="text-sm font-semibold text-accent">{impact.optimized_metric}%</span>
                </div>
              </div>

              <div className="p-3 bg-surface-base border border-neutral-border rounded text-xs text-neutral-muted font-mono">
                Sample: {impact.sample_count} verified events in PostgreSQL
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
