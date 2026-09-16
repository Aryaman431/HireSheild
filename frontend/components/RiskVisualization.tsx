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
    <div className="panel flex flex-col items-center justify-center space-y-6 p-7 text-center">
      <h2 className="tech-label m-0 w-full border-b border-surface-elevated pb-3 text-slate-400">Risk assessment</h2>
      
      <div className="flex flex-col items-center justify-center pt-4">
        <div className={`text-7xl font-light tracking-tighter ${scoreColor} leading-none`}>
          {score}
        </div>
        <div className="text-xl text-slate-600 font-mono mt-1">/ 100</div>
      </div>
      
      <div className={`text-xl font-bold tracking-widest uppercase ${scoreColor}`}>
        {level}
      </div>

      <div className="relative mt-2 h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-elevated">
        <div className={`absolute top-0 left-0 h-full ${barColor}`} style={{ width: `${score}%` }} />
      </div>

      <div className="pt-4 border-t border-surface-elevated w-full text-center">
        <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">ANALYSIS CONFIDENCE: {confidence}%</span>
      </div>
    </div>
  )
}
