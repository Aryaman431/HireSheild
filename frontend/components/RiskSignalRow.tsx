import { AlertOctagon, AlertTriangle, CreditCard, Clock, Globe, UserX, Quote, Info } from 'lucide-react'

interface RiskSignalData {
  type: string
  contribution?: number
  reasoning: string
  evidence?: string
}

function renderSignalIcon(type: string, isHighOrCritical: boolean) {
  const className = isHighOrCritical ? 'text-risk-critical' : 'text-risk-suspicious'
  switch (type) {
    case 'UPFRONT_PAYMENT':
    case 'UNREALISTIC_COMPENSATION':
      return <CreditCard size={15} className={className} />
    case 'HIGH_PRESSURE_LANGUAGE':
      return <Clock size={15} className={className} />
    case 'SUSPICIOUS_APPLICATION_URL':
    case 'DOMAIN_AGE':
      return <Globe size={15} className={className} />
    case 'POSSIBLE_IMPERSONATION':
      return <UserX size={15} className={className} />
    default:
      return isHighOrCritical ? <AlertOctagon size={15} className={className} /> : <AlertTriangle size={15} className={className} />
  }
}

export default function RiskSignalRow({ signal }: { signal: RiskSignalData }) {
  const contribution = Number(signal.contribution) || 0
  const isCritical = contribution >= 25
  const isHigh = contribution >= 15 && contribution < 25
  const isMed = contribution >= 8 && contribution < 15

  const getSeverityBadge = () => {
    if (isCritical) return { label: 'CRITICAL', badgeClass: 'badge-critical', border: 'border-risk-critical/30', bg: 'bg-risk-critical/5' }
    if (isHigh) return { label: 'HIGH', badgeClass: 'badge-high', border: 'border-risk-high/30', bg: 'bg-risk-high/5' }
    if (isMed) return { label: 'MEDIUM', badgeClass: 'badge-suspicious', border: 'border-risk-suspicious/30', bg: 'bg-risk-suspicious/5' }
    return { label: 'LOW', badgeClass: 'badge-low', border: 'border-risk-low/30', bg: 'bg-risk-low/5' }
  }

  const sev = getSeverityBadge()

  return (
    <div className={`flex flex-col gap-3.5 p-4 sm:p-5 rounded border ${sev.border} ${sev.bg} transition-all my-1.5`}>
      {/* 1. SEVERITY & SIGNAL NAME */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-elevated/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-surface border border-surface-elevated text-slate-300">
            {renderSignalIcon(signal.type, isCritical || isHigh)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold">SEVERITY:</span>
            <span className={`badge ${sev.badgeClass} font-bold`}>
              {sev.label}
            </span>
          </div>
          <span className="font-bold text-slate-100 tracking-wide uppercase text-sm font-mono ml-1">
            {signal.type ? signal.type.replace(/_/g, ' ') : 'SUSPICIOUS SIGNAL'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest hidden sm:inline">RISK IMPACT:</span>
          <span className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded border ${
            isCritical || isHigh 
              ? 'text-risk-critical bg-risk-critical/10 border-risk-critical/30' 
              : 'text-risk-suspicious bg-risk-suspicious/10 border-risk-suspicious/30'
          }`}>
            +{contribution} PTS
          </span>
        </div>
      </div>

      {/* 2. EXACT EVIDENCE */}
      {signal.evidence ? (
        <div className="bg-surface border border-surface-elevated rounded p-3.5 relative overflow-hidden">
          <div className="text-[10px] font-mono text-brand-400 uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1.5">
            <Quote size={11} className="text-brand-400" />
            <span>EXACT EVIDENCE</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 font-mono italic leading-relaxed whitespace-pre-wrap border-l-2 border-brand-400 pl-3">
            &ldquo;{signal.evidence}&rdquo;
          </p>
        </div>
      ) : (
        <div className="bg-surface/50 border border-surface-elevated/60 rounded p-2.5 text-[11px] font-mono text-slate-400">
          <span className="text-slate-500 font-bold uppercase tracking-wider mr-2">EXACT EVIDENCE:</span>
          Identified via structural heuristic pattern analysis across posting metadata.
        </div>
      )}

      {/* 3. WHY IT MATTERS */}
      <div className="bg-surface-raised/40 border border-surface-elevated rounded p-3.5">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1.5">
          <Info size={11} className="text-slate-400" />
          <span>WHY IT MATTERS</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 font-mono leading-relaxed">
          {signal.reasoning}
        </p>
      </div>
    </div>
  )
}

