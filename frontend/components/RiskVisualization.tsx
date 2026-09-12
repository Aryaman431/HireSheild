export default function RiskVisualization({ score, level, confidence }: { score: number, level: string, confidence: number }) {
  const isHighRisk = score > 60
  const isModerateRisk = score > 20 && score <= 60
  
  const scoreColor = isHighRisk 
    ? 'text-risk-critical' 
    : isModerateRisk ? 'text-risk-moderate' : 'text-risk-low'

  const barColor = isHighRisk 
    ? 'bg-risk-critical' 
    : isModerateRisk ? 'bg-risk-moderate' : 'bg-risk-low'

  return (
    <div className="panel p-8 flex flex-col items-center justify-center text-center space-y-6">
      <h2 className="tech-label text-slate-400 m-0 border-b border-surface-elevated pb-2 w-full">RISK ASSESSMENT</h2>
      
      <div className="flex flex-col items-center justify-center pt-4">
        <div className={`text-7xl font-light tracking-tighter ${scoreColor} leading-none`}>
          {score}
        </div>
        <div className="text-xl text-slate-600 font-mono mt-1">/ 100</div>
      </div>
      
      <div className={`text-xl font-bold tracking-widest uppercase ${scoreColor}`}>
        {level}
      </div>

      <div className="w-full max-w-xs mt-2 relative h-1.5 bg-surface-elevated rounded-full overflow-hidden">
        <div className={`absolute top-0 left-0 h-full ${barColor}`} style={{ width: `${score}%` }} />
      </div>

      <div className="pt-4 border-t border-surface-elevated w-full text-center">
        <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">ANALYSIS CONFIDENCE: {confidence}%</span>
      </div>
    </div>
  )
}
