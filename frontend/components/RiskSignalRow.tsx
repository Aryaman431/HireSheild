export default function RiskSignalRow({ signal }: { signal: unknown }) {
  const isHighSeverity = signal.contribution >= 20

  return (
    <div className="flex flex-col gap-3 py-4 border-b border-surface-elevated last:border-0">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <span className={`badge ${isHighSeverity ? 'badge-critical' : 'badge-suspicious'}`}>
            {isHighSeverity ? 'HIGH' : 'MED'}
          </span>
          <span className="font-bold text-slate-200 tracking-wide uppercase text-sm">
            {signal.type.replace(/_/g, ' ')}
          </span>
        </div>
        <span className="font-mono text-risk-critical text-sm bg-risk-critical/10 px-2 py-0.5 rounded">
          +{signal.contribution}
        </span>
      </div>
      
      <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
        {signal.reasoning}
      </p>

      {signal.evidence && (
        <div className="mt-2 bg-slate-900 border border-surface-elevated rounded-md p-3">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
            EXTRACTED EVIDENCE
          </div>
          <p className="text-sm text-slate-300 font-mono italic whitespace-pre-wrap">
            &ldquo;{signal.evidence}&rdquo;
          </p>
        </div>
      )}
    </div>
  )
}
