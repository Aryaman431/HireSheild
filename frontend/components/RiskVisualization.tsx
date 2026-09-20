import { ShieldAlert, ShieldCheck, AlertTriangle, AlertOctagon, Info } from 'lucide-react'

export default function RiskVisualization({ 
  score, 
  level, 
  confidence,
  oneSentenceExplanation
}: { 
  score: number
  level: string
  confidence: number
  oneSentenceExplanation?: string 
}) {
  const isCritical = score >= 80
  const isHigh = score >= 60 && score < 80
  const isModerate = score > 20 && score < 60

  const getTheme = () => {
    if (isCritical) {
      return {
        text: 'text-risk-critical',
        border: 'border-risk-critical/40',
        bg: 'bg-risk-critical/10',
        glow: 'shadow-[0_0_25px_rgba(255,42,42,0.2)]',
        fill: '#ff2a2a',
        badge: 'badge-critical',
        label: 'CRITICAL THREAT DETECTED',
        icon: AlertOctagon,
        summary: 'Critical threat detected: Severe indicators of employment fraud identified, including unverified contact channels or advance financial demands.'
      }
    }
    if (isHigh) {
      return {
        text: 'text-risk-high',
        border: 'border-risk-high/40',
        bg: 'bg-risk-high/10',
        glow: 'shadow-[0_0_25px_rgba(255,115,38,0.2)]',
        fill: '#ff7326',
        badge: 'badge-high',
        label: 'HIGH RISK OPPORTUNITY',
        icon: ShieldAlert,
        summary: 'High risk opportunity: Non-standard recruitment detected with suspicious compensation structures and irregular communication channels.'
      }
    }
    if (isModerate) {
      return {
        text: 'text-risk-suspicious',
        border: 'border-risk-suspicious/40',
        bg: 'bg-risk-suspicious/10',
        glow: 'shadow-[0_0_20px_rgba(255,183,3,0.15)]',
        fill: '#ffb703',
        badge: 'badge-suspicious',
        label: 'MODERATE / SUSPICIOUS',
        icon: AlertTriangle,
        summary: 'Anomalies detected. Unverified domains, unusual urgency, or non-standard procedures warrant independent verification before taking action.'
      }
    }
    return {
      text: 'text-risk-low',
      border: 'border-risk-low/40',
      bg: 'bg-risk-low/10',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      fill: '#10b981',
      badge: 'badge-low',
      label: 'LOW RISK / VERIFIED',
      icon: ShieldCheck,
      summary: 'No critical threat heuristics triggered. The opportunity matches legitimate recruitment patterns and verified corporate identifiers.'
    }
  }

  const theme = getTheme()
  const Icon = theme.icon

  // SVG Gauge calculations
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className={`panel border ${theme.border} ${theme.glow} bg-surface transition-all`}>
      <div className="flex flex-col lg:flex-row items-stretch divide-y lg:divide-y-0 lg:divide-x divide-surface-elevated">
        
        {/* Left Column: Radial Meter */}
        <div className="p-6 lg:w-5/12 flex flex-col items-center justify-center bg-surface-raised/20 text-center relative">
          <span className="tech-label text-text-muted mb-4 self-start">COMPOSITE RISK ENGINE</span>
          
          <div className="relative flex items-center justify-center my-2">
            <svg width="150" height="150" viewBox="0 0 150 150" className="-rotate-90">
              {/* Background Track */}
              <circle
                cx="75"
                cy="75"
                r={radius}
                fill="none"
                stroke="rgba(51,65,85,0.4)"
                strokeWidth="10"
              />
              {/* Animated Progress Ring */}
              <circle
                cx="75"
                cy="75"
                r={radius}
                fill="none"
                stroke={theme.fill}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 1s ease-out',
                  filter: `drop-shadow(0 0 8px ${theme.fill}88)`
                }}
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={`text-5xl font-light font-mono tracking-tighter ${theme.text} leading-none`}>
                {score}
              </span>
              <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest mt-1">
                OUT OF 100
              </span>
            </div>
          </div>

          <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-sm ${theme.bg} ${theme.border} border font-mono text-xs font-bold ${theme.text}`}>
            <Icon size={13} />
            <span>{level.toUpperCase()}</span>
          </div>
        </div>

        {/* Right Column: Breakdown & Tier Indicator */}
        <div className="p-6 lg:w-7/12 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-xs font-mono font-bold tracking-wider text-text uppercase">
                {theme.label}
              </span>
              <div className="flex items-center gap-2 font-mono text-xs text-text-muted bg-surface-elevated/40 px-2.5 py-1 rounded-sm border border-border">
                <span className="text-text-muted">ENGINE CONFIDENCE:</span>
                <span className="text-text font-bold">{confidence}%</span>
              </div>
            </div>

            {/* Segmented Threat Tier Bar */}
            <div className="my-4">
              <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono text-text-muted mb-1.5 text-center">
                <span className={score <= 20 ? 'text-emerald-400 font-bold' : 'text-text-muted'}>0-20 LOW</span>
                <span className={score > 20 && score <= 60 ? 'text-amber-400 font-bold' : 'text-text-muted'}>21-60 MOD</span>
                <span className={score > 60 && score <= 80 ? 'text-orange-400 font-bold' : 'text-text-muted'}>61-80 HIGH</span>
                <span className={score > 80 ? 'text-red-400 font-bold' : 'text-text-muted'}>81-100 CRIT</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 h-2">
                <div className={`rounded-sm transition-all ${score <= 20 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-surface-elevated/70'}`} />
                <div className={`rounded-sm transition-all ${score > 20 && score <= 60 ? 'bg-amber-400 shadow-[0_0_8px_#ffb703]' : 'bg-surface-elevated/70'}`} />
                <div className={`rounded-sm transition-all ${score > 60 && score <= 80 ? 'bg-orange-500 shadow-[0_0_8px_#ff7326]' : 'bg-surface-elevated/70'}`} />
                <div className={`rounded-sm transition-all ${score > 80 ? 'bg-red-500 shadow-[0_0_8px_#ff2a2a]' : 'bg-surface-elevated/70'}`} />
              </div>
            </div>

            {/* One-Sentence Explanation Callout */}
            <div className="mt-4 p-3.5 bg-surface-raised/40 rounded-sm border border-border">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted uppercase tracking-wider font-bold mb-1.5">
                <Info size={12} className={theme.text} />
                <span>EXECUTIVE VERDICT &bull; ONE-SENTENCE EXPLANATION</span>
              </div>
              <p className="text-xs sm:text-sm font-mono text-text font-medium leading-relaxed">
                {oneSentenceExplanation || theme.summary}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-text-muted">
            <span>METHODOLOGY: HEURISTIC ANALYSIS + HISTORICAL PGVECTOR SIMILARITY</span>
            <span className="text-text-muted">EXPLAINABLE RISK ENGINE</span>
          </div>
        </div>

      </div>
    </div>
  )
}

