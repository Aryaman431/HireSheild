export default function RiskVisualization({ score, level, confidence }: { score: number, level: string, confidence: number }) {
  const isHighRisk = score > 60
  const isModerateRisk = score > 20 && score <= 60
  
  const scoreColor = isHighRisk 
    ? 'text-risk-critical' 
    : isModerateRisk ? 'text-risk-suspicious' : 'text-risk-low'

  const barColor = isHighRisk 
    ? 'bg-risk-critical' 
    : isModerateRisk ? 'bg-risk-suspicious' : 'bg-risk-low'

  return (
    <div className="panel border-surface-elevated">
      <div className="flex flex-col md:flex-row items-stretch">
        <div className="p-6 md:w-1/3 flex flex-col justify-between border-b md:border-b-0 md:border-r border-surface-elevated bg-surface-raised/30">
          <div>
            <h2 className="tech-label text-slate-500 mb-4">RISK ASSESSMENT</h2>
            <div className={`text-6xl font-light tracking-tighter ${scoreColor} leading-none mb-1`}>
              {score}
            </div>
            <div className="text-sm text-slate-600 font-mono">SCORE / 100</div>
          </div>
          <div className="mt-6 pt-4 border-t border-surface-elevated">
             <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">CONFIDENCE</div>
             <div className="text-lg font-mono text-slate-200">{confidence}%</div>
          </div>
        </div>

        <div className="p-6 md:w-2/3 flex flex-col justify-center">
          <div className="mb-4">
            <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">ASSESSED LEVEL</div>
            <div className={`text-2xl font-bold tracking-widest uppercase ${scoreColor}`}>
              {level}
            </div>
          </div>

          <div className="w-full">
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
              <span>0 (LOW)</span>
              <span>100 (CRITICAL)</span>
            </div>
            <div className="relative h-1 w-full bg-surface-elevated rounded-sm overflow-hidden">
              <div className={`absolute top-0 left-0 h-full ${barColor}`} style={{ width: `${score}%` }} />
            </div>
          </div>
          
          <div className="mt-6 text-xs text-slate-400 font-mono leading-relaxed border-l-2 border-surface-elevated pl-3">
            Risk scores are algorithmically generated based on extracted claims, entity verification states, and historical threat intelligence. High scores indicate a strong probability of deception, impersonation, or financial risk.
          </div>
        </div>
      </div>
    </div>
  )
}
