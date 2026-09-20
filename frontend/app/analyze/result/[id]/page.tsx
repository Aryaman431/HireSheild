import { getAuth } from "@/lib/auth-server"
import Link from 'next/link'
import ReportOpportunityForm from '@/components/ReportOpportunityForm'
import VerificationPanel from '@/components/VerificationPanel'
import RiskVisualization from '@/components/RiskVisualization'
import RiskSignalRow from '@/components/RiskSignalRow'
import { getServerApiUrl } from '@/lib/api'
import { Globe, ExternalLink, ShieldAlert, ShieldCheck, AlertOctagon, Info } from 'lucide-react'

async function getAnalysisResult(id: string, token: string | null) {
  const apiUrl = getServerApiUrl()
  if (!token) {
    return { status: 'unauthorized' as const }
  }

  try {
    const response = await fetch(`${apiUrl}/api/v1/jobs/${id}/result`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    })

    if (response.status === 401 || response.status === 404) {
      return { status: 'not_found' as const }
    }

    if (!response.ok) {
      return { status: 'error' as const }
    }

    return { status: 'ok' as const, data: await response.json() }
  } catch {
    return { status: 'error' as const }
  }
}

async function getHistoricalIntelligence(id: string, token: string | null) {
  const apiUrl = getServerApiUrl()
  if (!token) {
    return { available: false, similar_opportunities: [], pattern_summary: {} }
  }

  try {
    const response = await fetch(`${apiUrl}/api/v1/jobs/${id}/historical-intelligence`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      return { available: false, similar_opportunities: [], pattern_summary: {} }
    }

    return response.json()
  } catch {
    return { available: false, similar_opportunities: [], pattern_summary: {} }
  }
}

async function getVerificationData(id: string, token: string | null) {
  const apiUrl = getServerApiUrl()
  if (!token) return null

  try {
    const response = await fetch(`${apiUrl}/api/v1/jobs/${id}/verification`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    })

    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

function getOneSentenceVerdict(data: any): string {
  const score = Number(data.risk_score) || 0
  const level = data.risk_level || 'LOW'
  const signals: Array<{ type: string; evidence?: string }> = Array.isArray(data.signals) ? data.signals : []
  
  const hasUpfrontFee = signals.some(s => s.type === 'UPFRONT_PAYMENT')
  const hasImpersonation = signals.some(s => s.type === 'POSSIBLE_IMPERSONATION')
  const hasHighPressure = signals.some(s => s.type === 'HIGH_PRESSURE_LANGUAGE')
  const hasUnrealisticComp = signals.some(s => s.type === 'UNREALISTIC_COMPENSATION')
  const hasSuspiciousUrl = signals.some(s => s.type === 'SUSPICIOUS_APPLICATION_URL')

  if (score >= 80 || level === 'CRITICAL') {
    if (hasUpfrontFee) {
      return "CRITICAL SCAM: Immediate fraud alert — candidate is requested to pay upfront equipment or onboarding fees, a hallmark of recruitment scams."
    }
    if (hasImpersonation) {
      return "CRITICAL THREAT: Impersonation detected — malicious actor utilizing unverified off-platform contact channels to impersonate an employer."
    }
    return "CRITICAL THREAT: Opportunity exhibits severe hallmarks of employment fraud, including advance fee demands and unverified contact channels."
  }

  if (score >= 60 || level === 'HIGH') {
    if (hasUnrealisticComp) {
      return "HIGH RISK: Non-standard recruitment detected with unrealistic compensation structures and unverified contact channels."
    }
    if (hasHighPressure) {
      return "HIGH RISK: Arbitrary short-deadline ultimatums and non-standard recruitment channels strongly deviate from authentic hiring protocols."
    }
    if (hasSuspiciousUrl) {
      return "HIGH RISK: Application portal directs to an unverified external domain with suspicious redirect behavior."
    }
    return "HIGH RISK: Multiple high-severity anomalies detected across recruiter credentials, communication channels, and hiring timeline."
  }

  if (score > 20 || level === 'MODERATE' || level === 'SUSPICIOUS') {
    return "MODERATE RISK: Notable anomalies in recruiter identity or application channels require caution and independent verification before proceeding."
  }

  return "LOW RISK / VERIFIED: Opportunity exhibits standard recruitment workflows, verified domain credentials, and legitimate corporate hiring practices."
}

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  let token: string | null = null
  try {
    const authObj = await getAuth()
    token = await authObj.getToken()
  } catch {
    token = null
  }
  if (!token) {
    token = "demo_token"
  }
  const { id } = await params
  
  // Concurrently fetch analysis result, historical intelligence, and verification checks
  const [resultResponse, historicalData, verificationData] = await Promise.all([
    getAnalysisResult(id, token),
    getHistoricalIntelligence(id, token),
    getVerificationData(id, token)
  ])

  if (resultResponse.status !== 'ok') {
    const message = resultResponse.status === 'unauthorized'
      ? 'Your investigation is not available in this session.'
      : resultResponse.status === 'not_found'
        ? 'This investigation could not be found or is not accessible.'
        : 'Investigation could not be loaded. Please try again.'

    return (
      <div className="min-h-screen bg-background text-text p-8">
        <div className="max-w-2xl mx-auto mt-16 panel p-8">
          <p className="tech-label text-text-muted">INVESTIGATION STATUS</p>
          <h1 className="mt-3 text-3xl font-light tracking-wide text-white">Unable to load result</h1>
          <p className="mt-4 text-text-muted">{message}</p>
          <div className="mt-6 flex gap-3">
            <Link href="/analyze" className="btn-primary">Analyze another job</Link>
            <Link href="/dashboard" className="btn-ghost">Back to dashboard</Link>
          </div>
        </div>
      </div>
    )
  }

  const result = resultResponse.data
  const signals = Array.isArray(result.signals) ? result.signals : []
  const commSignal = signals.find((s: any) => s.type === 'HISTORICAL_REPORTS')
  const approvedReportsCount = commSignal ? parseInt(commSignal.reasoning.match(/\d+/)?.[0] || '0') : 0

  const oneSentenceVerdict = getOneSentenceVerdict(result)

  const getRecommendation = (signalType: string) => {
    switch (signalType) {
      case 'UPFRONT_PAYMENT': return "Do not pay any registration, onboarding, training, or equipment setup fee before independently verifying the employer through official channels."
      case 'HIGH_PRESSURE_LANGUAGE': return "Take time to independently verify the opportunity. Legitimate corporate employers do not enforce arbitrary 24-hour ultimatums."
      case 'GUARANTEED_SELECTION': return "Be cautious of guaranteed-selection or no-interview offers. Authentic organizations conduct structured technical evaluations."
      case 'SUSPICIOUS_APPLICATION_URL': return "Verify that the application link belongs to the employer's official domain rather than an unverified redirect or typo-squatted site."
      case 'POSSIBLE_IMPERSONATION': return "Do not share sensitive identity documents (SSN, passport, banking) until you verify the recruiter's identity through corporate channels."
      default: return null
    }
  }

  const hasHighRiskSignals = signals.some((s: any) => s.contribution >= 20) || result.risk_score >= 60

  // ============================================================
  // COMPOSE WEB EVIDENCE ITEMS
  // ============================================================
  interface WebEvidenceItem {
    source: string
    finding: string
    link?: string | null
    linkLabel?: string
    status: 'VERIFIED' | 'SUSPICIOUS' | 'UNVERIFIED' | 'ALERT'
    badgeClass: string
  }

  const evidenceItems: WebEvidenceItem[] = []

  // 1. Checks from Verification Engine
  const checks: any[] = verificationData?.checks || []
  for (const c of checks) {
    let sourceLabel = "Authoritative Domain Registry"
    let linkUrl: string | null = null
    let linkName: string | undefined = undefined

    if (c.check_type === 'COMPANY_DOMAIN') {
      sourceLabel = "DNS & Domain Registry"
      if (result.company?.domain) {
        linkUrl = `https://${result.company.domain}`
        linkName = `Visit ${result.company.domain}`
      }
    } else if (c.check_type === 'HTTPS') {
      sourceLabel = "TLS / HTTPS Handshake"
      if (result.company?.domain) {
        linkUrl = `https://${result.company.domain}`
        linkName = "Inspect TLS Endpoint"
      }
    } else if (c.check_type === 'RECRUITER_EMAIL_DOMAIN') {
      sourceLabel = "Corporate MX & Email Routing"
      if (result.company?.id) {
        linkUrl = `/companies/${result.company.id}`
        linkName = "Company Dossier"
      }
    } else if (c.check_type === 'APPLICATION_URL') {
      sourceLabel = "Safe URL Inspector & HTTP Trace"
      if (result.source_url) {
        linkUrl = result.source_url
        linkName = "Inspect URL"
      }
    }

    const badgeClass = c.result === 'VERIFIED' 
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' 
      : c.result === 'SUSPICIOUS' 
        ? 'text-risk-critical bg-risk-critical/10 border-risk-critical/30' 
        : 'text-text-muted bg-surface-raised border-border'

    evidenceItems.push({
      source: sourceLabel,
      finding: c.evidence,
      link: linkUrl,
      linkLabel: linkName,
      status: c.result,
      badgeClass
    })
  }

  // 2. If no checks were present, ensure basic domain/email items exist
  if (evidenceItems.length === 0) {
    if (result.company?.domain) {
      evidenceItems.push({
        source: "Domain & DNS Registry",
        finding: `Resolved official domain identifier: ${result.company.domain} (Status: ${result.company.verification_status || 'UNVERIFIED'})`,
        link: `https://${result.company.domain}`,
        linkLabel: `Visit ${result.company.domain}`,
        status: result.company.verification_status || 'UNVERIFIED',
        badgeClass: result.company.verification_status === 'VERIFIED' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-text-muted bg-surface-raised border-border'
      })
    }

    if (result.recruiter?.email) {
      evidenceItems.push({
        source: "Corporate Mail Exchange (MX)",
        finding: `Recruiter email registered as: ${result.recruiter.email} (Status: ${result.recruiter.verification_status || 'UNVERIFIED'})`,
        link: null,
        status: result.recruiter.verification_status || 'UNVERIFIED',
        badgeClass: result.recruiter.verification_status === 'VERIFIED' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-text-muted bg-surface-raised border-border'
      })
    }
  }

  // 3. Historical Threat Clusters
  if (historicalData?.available && historicalData.similar_opportunities?.length > 0) {
    evidenceItems.push({
      source: "Scam Signature Index (pgvector)",
      finding: `${historicalData.pattern_summary.similar_count} correlated scam cluster cases detected with ${historicalData.pattern_summary.high_risk_count} confirmed fraudulent records sharing similar threat patterns.`,
      link: "/community",
      linkLabel: "View Threat Intelligence",
      status: "ALERT",
      badgeClass: "text-risk-critical bg-risk-critical/10 border-risk-critical/30"
    })
  }

  // 4. Community Victim Registry
  if (approvedReportsCount > 0) {
    evidenceItems.push({
      source: "HireShield Community Fraud Registry",
      finding: `${approvedReportsCount} community-verified fraud report(s) actively linked to this target entity.`,
      link: "/community",
      linkLabel: "Community Intelligence Registry",
      status: "ALERT",
      badgeClass: "text-risk-critical bg-risk-critical/10 border-risk-critical/30"
    })
  }

  return (
    <div className="min-h-screen bg-background text-text p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="border-b border-border pb-6 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-surface-elevated px-2.5 py-1 rounded-sm border border-border text-text">
                CASE #{result.id.substring(0, 8).toUpperCase()}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider bg-brand-500/10 border border-brand-500/30 text-brand-400 px-2.5 py-1 rounded-sm">
                {result.input_source || 'TEXT'} AUDIT
              </span>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-sm">
                ANALYSIS COMPLETE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-light tracking-wide uppercase text-text">
              Investigation Dossier
            </h1>
            <p className="text-text-muted font-mono text-xs mt-1">
              UUID: {result.id}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/analyze" 
              className="btn-primary text-xs flex items-center gap-2 py-2 px-4 shadow-sm"
            >
              <span>← NEW AUDIT</span>
            </Link>
          </div>
        </header>

        {/* 1. RISK SCORE */}
        <div className="flex flex-col gap-8">
          <RiskVisualization 
            score={result.risk_score} 
            level={result.risk_level} 
            confidence={result.confidence} 
            oneSentenceExplanation={oneSentenceVerdict} 
          />

          {/* 2. RED FLAGS & OBSERVED THREAT SIGNALS */}
          <div className="panel p-0 border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border p-5 sm:p-6">
              <div>
                <h2 className="tech-label text-text-muted m-0">RED FLAGS & OBSERVED THREAT SIGNALS</h2>
                <p className="text-xs font-mono text-text-muted mt-0.5">
                  Algorithmically extracted claims evaluated with severity, exact evidence, and threat rationale
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-surface-elevated px-2.5 py-1 rounded text-text">
                {signals.length} SIGNALS
              </span>
            </div>
            
            {signals.length === 0 ? (
              <div className="p-8 text-center bg-surface-raised/20">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-emerald-500/10 text-emerald-400 mb-3 border border-emerald-500/30">
                  <span className="text-lg font-bold font-mono">✓</span>
                </div>
                <h3 className="text-sm font-mono font-bold text-text uppercase mb-1">
                  All Threat Heuristics Cleared
                </h3>
                <p className="text-xs font-mono text-text-muted max-w-md mx-auto leading-relaxed">
                  No deceptive patterns, upfront fee claims, or domain spoofing indicators were identified in this opportunity submission.
                </p>
              </div>
            ) : (
              <div className="flex flex-col p-4 sm:p-6 gap-3">
                {signals.map((signal: unknown, idx: number) => (
                  <RiskSignalRow key={idx} signal={signal as any} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. INDEPENDENT VERIFICATION */}
        <VerificationPanel 
          jobId={result.id} 
          accessToken={token || ''} 
          initialData={verificationData}
          company={result.company}
          recruiter={result.recruiter}
          sourceUrl={result.source_url}
        />

        {/* 4. WEB EVIDENCE & INVESTIGATION SOURCES */}
        <div className="panel p-0 border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border p-5 sm:p-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Globe size={16} className="text-brand-400" />
                <h2 className="tech-label text-text m-0">WEB EVIDENCE & INVESTIGATION SOURCES</h2>
              </div>
              <p className="text-xs font-mono text-text-muted">
                Authoritative external web traces, DNS records, safe HTTP inspection, and threat indexes
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-surface-elevated px-2.5 py-1 rounded text-text">
              {evidenceItems.length} SOURCES
            </span>
          </div>

          {evidenceItems.length === 0 ? (
            <div className="p-6 text-center text-xs font-mono text-text-muted">
              No external web evidence sources registered for this case.
            </div>
          ) : (
            <div className="divide-y divide-surface-elevated/70">
              {evidenceItems.map((item, idx) => (
                <div key={idx} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-raised/10 transition-colors">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-raised border border-border text-brand-400">
                        {item.source}
                      </span>
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${item.badgeClass}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-mono text-text leading-relaxed break-words">
                      {item.finding}
                    </p>
                  </div>

                  {item.link ? (
                    <a
                      href={item.link}
                      target={item.link.startsWith('http') ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="self-start sm:self-center shrink-0 flex items-center gap-1.5 text-xs font-mono text-brand-400 hover:text-brand-300 bg-surface-raised/40 hover:bg-surface-raised border border-border hover:border-brand-500/50 px-3 py-1.5 rounded transition-all shadow-sm"
                    >
                      <span>{item.linkLabel || 'Inspect Source'}</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="text-[11px] font-mono text-text-muted self-start sm:self-center shrink-0">
                      Authoritative internal registry
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. RECOMMENDED ACTION: CLEAR SAFETY STEPS */}
        <div className="panel p-6 border-border bg-surface">
          <div className="border-b border-border pb-3 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert size={16} className={hasHighRiskSignals ? "text-risk-critical" : "text-brand-400"} />
                <h2 className="tech-label text-text m-0">RECOMMENDED ACTION & SAFETY STEPS</h2>
              </div>
              <p className="text-xs font-mono text-text-muted">
                Actionable defensive protocols calibrated to identified threat heuristics
              </p>
            </div>
            <span className={`badge ${hasHighRiskSignals ? 'badge-critical' : 'badge-low'} self-start sm:self-auto`}>
              {hasHighRiskSignals ? 'DEFENSIVE PROTOCOL REQUIRED' : 'STANDARD DUE DILIGENCE'}
            </span>
          </div>

          <div className="space-y-4">
            {/* Step 1: Critical Prohibitions */}
            {hasHighRiskSignals && (
              <div className="p-4 rounded border border-risk-critical/30 bg-risk-critical/5 space-y-3">
                <div className="flex items-center gap-2 text-risk-critical font-mono text-xs font-bold uppercase">
                  <AlertOctagon size={14} />
                  <span>STEP 1 — CRITICAL PROHIBITIONS (DO NOT DO)</span>
                </div>
                <ul className="space-y-2.5 font-mono text-xs text-text">
                  <li className="flex gap-2.5 items-start">
                    <span className="text-risk-critical font-bold text-sm leading-none">✕</span>
                    <span><strong className="text-text">DO NOT send money:</strong> Never pay fees via Zelle, wire, Apple Pay, Venmo, or cryptocurrency for equipment, software, or onboarding. Authentic employers never charge candidates.</span>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <span className="text-risk-critical font-bold text-sm leading-none">✕</span>
                    <span><strong className="text-text">DO NOT conduct interviews on messaging apps:</strong> Decline interviews conducted solely via Telegram, Signal, WhatsApp, or Google Chat text messages.</span>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <span className="text-risk-critical font-bold text-sm leading-none">✕</span>
                    <span><strong className="text-text">DO NOT disclose sensitive credentials:</strong> Never submit your Social Security Number, passport scan, or direct deposit banking info before verifying official corporate onboarding.</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Step 2: Safe Verification Actions */}
            <div className="p-4 rounded border border-brand-500/30 bg-brand-500/5 space-y-3">
              <div className="flex items-center gap-2 text-brand-400 font-mono text-xs font-bold uppercase">
                <ShieldCheck size={14} />
                <span>STEP {hasHighRiskSignals ? '2' : '1'} — SAFE VERIFICATION ACTIONS</span>
              </div>
              <ul className="space-y-2 font-mono text-xs text-text">
                {signals.map((s: {type: string}) => getRecommendation(s.type)).filter(Boolean).map((rec: string, i: number) => (
                  <li key={i} className="flex gap-2.5 items-start">
                    <span className="text-brand-400 font-bold text-sm leading-none">▸</span>
                    <span>{rec}</span>
                  </li>
                ))}
                <li className="flex gap-2.5 items-start">
                  <span className="text-brand-400 font-bold text-sm leading-none">▸</span>
                  <span><strong className="text-text">Verify company career page directly:</strong> Navigate independently to the company&apos;s verified domain and check for an active requisition matching this title.</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="text-brand-400 font-bold text-sm leading-none">▸</span>
                  <span><strong className="text-text">Authenticate recruiter identity:</strong> Reach out to the employer&apos;s corporate HR desk or official switchboard to verify the recruiter&apos;s employment.</span>
                </li>
              </ul>
            </div>

            {/* Step 3: Reporting & Escalation */}
            <div className="p-4 rounded border border-border bg-surface-raised/30 space-y-2.5">
              <div className="flex items-center gap-2 text-text font-mono text-xs font-bold uppercase">
                <Info size={14} />
                <span>STEP {hasHighRiskSignals ? '3' : '2'} — REPORT & WARN PEERS</span>
              </div>
              <p className="font-mono text-xs text-text-muted leading-relaxed">
                If this job posting solicited fees, used deceptive redirects, or impersonated a legitimate business, submit a community report below to alert other job seekers and enrich the HireShield threat intelligence registry.
              </p>
            </div>
          </div>
        </div>

        {/* Intelligence Dossiers: Company & Recruiter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Company Intelligence */}
          {result.company && (
            <div className="panel p-6 border-border bg-surface">
              <div className="border-b border-border pb-3 mb-4 flex justify-between items-center">
                <span className="tech-label text-text-muted m-0">COMPANY INTELLIGENCE</span>
                <Link 
                  href={`/companies/${result.company.id}`} 
                  className="text-xs font-mono text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
                >
                  <span>VIEW DOSSIER</span>
                  <span>→</span>
                </Link>
              </div>

              <div className="space-y-3.5 text-xs font-mono">
                <div className="flex items-center justify-between p-2.5 rounded bg-surface-raised/30 border border-border">
                  <span className="text-text-muted">ENTITY NAME:</span>
                  <span className="text-text font-bold truncate max-w-[200px]">{result.company.name}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded bg-surface-raised/30 border border-border">
                  <span className="text-text-muted">RESOLVED DOMAIN:</span>
                  <span className="text-brand-400 font-bold truncate max-w-[200px]">{result.company.domain || "Unknown Domain"}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded bg-surface-raised/30 border border-border">
                  <span className="text-text-muted">VERIFICATION:</span>
                  <span className={
                    result.company.verification_status === 'VERIFIED'
                      ? 'badge badge-verified'
                      : result.company.verification_status === 'SUSPICIOUS'
                        ? 'badge badge-critical'
                        : 'badge badge-suspicious'
                  }>
                    {result.company.verification_status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Recruiter Intelligence */}
          {result.recruiter && (
            <div className="panel p-6 border-border bg-surface">
              <div className="border-b border-border pb-3 mb-4 flex justify-between items-center">
                <span className="tech-label text-text-muted m-0">RECRUITER INTELLIGENCE</span>
                <Link 
                  href={`/recruiters/${result.recruiter.id}`} 
                  className="text-xs font-mono text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
                >
                  <span>VIEW DOSSIER</span>
                  <span>→</span>
                </Link>
              </div>

              <div className="space-y-3.5 text-xs font-mono">
                <div className="flex items-center justify-between p-2.5 rounded bg-surface-raised/30 border border-border">
                  <span className="text-text-muted">RECRUITER NAME:</span>
                  <span className="text-text font-bold truncate max-w-[200px]">{result.recruiter.name || "Unknown Identity"}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded bg-surface-raised/30 border border-border">
                  <span className="text-text-muted">EMAIL CHANNEL:</span>
                  <span className="text-brand-400 font-bold truncate max-w-[200px]">{result.recruiter.email || "Unknown Email"}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded bg-surface-raised/30 border border-border">
                  <span className="text-text-muted">VERIFICATION:</span>
                  <span className={
                    result.recruiter.verification_status === 'VERIFIED'
                      ? 'badge badge-verified'
                      : result.recruiter.verification_status === 'SUSPICIOUS'
                        ? 'badge badge-critical'
                        : 'badge badge-suspicious'
                  }>
                    {result.recruiter.verification_status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Community Intelligence Section */}
        {approvedReportsCount > 0 && (
          <div className="panel p-6 border-border bg-surface">
            <h2 className="tech-label text-text-muted border-b border-border pb-3 mb-4">
              COMMUNITY DEFENSE INTELLIGENCE
            </h2>
            <div className="text-xs font-mono text-text space-y-3">
              <div className="p-3 bg-risk-critical/10 border border-risk-critical/30 rounded text-risk-critical font-bold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-risk-critical animate-ping" />
                <span>{approvedReportsCount} approved community fraud report(s) are actively linked to this target entity.</span>
              </div>
              <Link href="/community" className="text-brand-400 hover:underline inline-block">
                Explore Community Intelligence Registry →
              </Link>
            </div>
          </div>
        )}

        {/* Historical Intelligence Section */}
        {historicalData?.available && historicalData.similar_opportunities?.length > 0 && (
          <div className="panel p-6 border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div>
                <h2 className="tech-label text-text-muted m-0">HISTORICAL THREAT INTELLIGENCE (PGVECTOR MATCHES)</h2>
                <p className="text-xs font-mono text-text-muted mt-0.5">
                  Semantic embedding comparison against known fraudulent campaign clusters
                </p>
              </div>
              <span className="badge badge-critical">
                {historicalData.pattern_summary.similar_count} MATCHES
              </span>
            </div>
            
            <div className="mb-6 space-y-3 text-xs text-text font-mono">
              {historicalData.pattern_summary.high_risk_count > 0 && (
                <div className="border-l-2 border-brand-500 pl-3 py-2 bg-brand-500/10 text-brand-200 rounded-r">
                  ⚠️ {historicalData.pattern_summary.high_risk_count} of {historicalData.pattern_summary.similar_count} historically matched cases were verified as HIGH or CRITICAL recruitment fraud.
                </div>
              )}

              {historicalData.pattern_summary.common_signals?.length > 0 && (
                <div className="p-3 bg-surface-raised/30 rounded border border-border">
                  <p className="text-text-muted font-bold mb-2 uppercase">Recurring Signal Patterns in Cluster:</p>
                  <div className="flex flex-wrap gap-2">
                    {historicalData.pattern_summary.common_signals.map((sig: string) => (
                      <span key={sig} className="px-2 py-0.5 rounded bg-surface border border-border text-text text-[11px]">
                        {sig.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest font-mono mb-3 border-b border-border pb-1">
              Top Correlated Threat Opportunities
            </h3>
            <div className="space-y-3">
              {historicalData.similar_opportunities.map((opp: { title?: string; relevance: string; company?: string; risk_level: string; risk_score?: number; summary?: string }, idx: number) => {
                const cardKey = `opp-${idx}-${opp.relevance}-${opp.risk_level}`
                return (
                  <div 
                    key={cardKey} 
                    className="p-3.5 border border-border rounded bg-surface-raised/20 hover:border-border transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <h4 className="font-mono text-xs font-bold text-text truncate">{opp.title || "Historical Opportunity"}</h4>
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-surface px-2 py-0.5 rounded text-text-muted border border-border">
                        {opp.relevance}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-text-muted">{opp.company || "Protected Entity"}</span>
                      <span className={
                        opp.risk_level === 'CRITICAL' || opp.risk_level === 'HIGH' 
                          ? 'badge badge-critical' 
                          : opp.risk_level === 'MODERATE' || opp.risk_level === 'SUSPICIOUS' 
                            ? 'badge badge-suspicious' 
                            : 'badge badge-low'
                      }>
                        {opp.risk_level}
                      </span>
                    </div>
                    {opp.summary && (
                      <p className="mt-2 text-[11px] font-mono text-text-muted leading-relaxed bg-surface/50 p-2 rounded">
                        {opp.summary}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        
        {/* Report Component */}
        <div className="pt-4 border-t border-border mt-8">
          <ReportOpportunityForm 
            jobId={result.id} 
            companyId={result.company?.id} 
            recruiterId={result.recruiter?.id} 
            accessToken={token || ''} 
          />
        </div>
      </div>
    </div>
  )
}

