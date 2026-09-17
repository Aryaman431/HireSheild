import { Loader2, Shield } from 'lucide-react'

export default function ResultLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="border-b border-surface-elevated pb-6 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-5 w-24 bg-surface-elevated rounded-sm" />
              <div className="h-5 w-20 bg-surface-elevated rounded-sm" />
              <div className="h-5 w-28 bg-brand-500/20 rounded-sm" />
            </div>
            <div className="h-8 w-64 bg-surface-elevated rounded" />
            <div className="h-3 w-48 bg-surface-raised rounded" />
          </div>
          <div className="h-9 w-28 bg-surface-elevated rounded-sm" />
        </div>

        {/* Loading Banner with Active Telemetry */}
        <div className="panel p-4 border border-brand-500/30 bg-brand-500/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Loader2 size={18} className="text-brand-400 animate-spin shrink-0" />
            <div>
              <p className="font-mono text-xs font-bold text-brand-300 uppercase tracking-wider">
                SYNCHRONIZING INVESTIGATION DOSSIER
              </p>
              <p className="font-mono text-[11px] text-slate-400">
                Resolving DNS provenance, verifying recruiter channels, and querying pgvector threat indexes...
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-slate-500">
            <Shield size={14} className="text-brand-400" />
            <span>HIRESHIELD ENGINE</span>
          </div>
        </div>

        {/* Risk Score Card Skeleton */}
        <div className="panel border border-surface-elevated bg-surface p-6">
          <div className="flex flex-col lg:flex-row items-stretch gap-6">
            <div className="lg:w-5/12 flex flex-col items-center justify-center p-6 bg-surface-raised/20 rounded">
              <div className="h-32 w-32 rounded-full border-4 border-surface-elevated border-t-brand-500/40 animate-spin" />
              <div className="h-6 w-32 bg-surface-elevated rounded mt-4" />
            </div>
            <div className="lg:w-7/12 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="h-4 w-48 bg-surface-elevated rounded" />
                <div className="h-3 w-full bg-surface-raised rounded" />
                <div className="h-3 w-3/4 bg-surface-raised rounded" />
              </div>
              <div className="h-16 bg-surface-raised/40 rounded border border-surface-elevated p-3" />
            </div>
          </div>
        </div>

        {/* 4-Part Verification Matrix Skeleton */}
        <div className="panel p-6 border border-surface-elevated bg-surface space-y-4">
          <div className="h-4 w-56 bg-surface-elevated rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded border border-surface-elevated bg-surface-raised/20 space-y-3">
                <div className="flex justify-between">
                  <div className="h-3 w-16 bg-surface-elevated rounded" />
                  <div className="h-4 w-12 bg-surface-elevated rounded-sm" />
                </div>
                <div className="h-4 w-28 bg-surface-raised rounded" />
                <div className="h-3 w-full bg-surface-raised/40 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Threat Signals Skeleton */}
        <div className="panel p-6 border border-surface-elevated bg-surface space-y-4">
          <div className="h-4 w-48 bg-surface-elevated rounded" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 rounded border border-surface-elevated bg-surface-raised/20 space-y-2.5">
                <div className="flex justify-between">
                  <div className="h-4 w-36 bg-surface-elevated rounded" />
                  <div className="h-4 w-16 bg-surface-elevated rounded" />
                </div>
                <div className="h-12 bg-surface/50 rounded border border-surface-elevated/40" />
                <div className="h-10 bg-surface-raised/30 rounded" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
