import Link from 'next/link'
import { getAuth } from '@/lib/auth-server'
import RiskVisualization from '@/components/RiskVisualization'
import { getServerApiUrl } from '@/lib/api'
import { ShieldAlert } from 'lucide-react'

async function getCompanyIntelligence(id: string) {
  let token: string | null = null
  try {
    const authObj = await getAuth()
    token = (await authObj.getToken()) || 'demo_token'
  } catch {
    token = 'demo_token'
  }

  const apiUrl = getServerApiUrl()
  const response = await fetch(`${apiUrl}/api/v1/companies/${id}/intelligence`, {
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  })

  if (!response.ok) {
    return null
  }
  
  const communityRes = await fetch(`${apiUrl}/api/v1/community?limit=100`, { headers: { ...(token && { 'Authorization': `Bearer ${token}` }) } })
  const allCommunity = communityRes.ok ? await communityRes.json() : null
  
  return {
    ...await response.json(),
    community_feed: allCommunity
  }
}

export default async function CompanyDossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getCompanyIntelligence(id)

  if (!data) {
    return (
      <div className="min-h-screen bg-background text-text p-8 flex items-center justify-center">
        <div className="panel max-w-lg w-full p-8 border-border text-center space-y-4">
          <div className="inline-flex p-3 rounded-full bg-risk-critical/10 text-risk-critical border border-risk-critical/30 mb-2">
            <ShieldAlert size={24} />
          </div>
          <h1 className="text-xl font-light uppercase tracking-wider text-text">
            ORGANIZATION DOSSIER NOT FOUND
          </h1>
          <p className="font-mono text-xs text-text-muted leading-relaxed">
            The requested organization record could not be retrieved from the intelligence database.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link href="/analyze" className="btn-primary text-xs">← INITIATE AUDIT</Link>
            <Link href="/dashboard" className="btn-ghost text-xs border border-border">DASHBOARD</Link>
          </div>
        </div>
      </div>
    )
  }

  const { company, risk, verification, related_jobs, associated_recruiters, community_feed } = data
  
  const communityReportsCount = community_feed?.reports?.filter((r: any) => r.company_name === company?.name).length || 0

  const getResultColor = (result: string) => {
    switch (result) {
      case 'VERIFIED': return 'text-brand-400'
      case 'PARTIALLY_VERIFIED': return 'text-brand-300'
      case 'SUSPICIOUS': return 'text-risk-critical'
      default: return 'text-text-muted'
    }
  }

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'VERIFIED': return '✓'
      case 'PARTIALLY_VERIFIED': return '~'
      case 'SUSPICIOUS': return '⚠'
      default: return '—'
    }
  }

  const companyVerdict = risk.score >= 60
    ? "High risk organization profile: elevated threat associations, unverified domain channels, or recurring risk signals."
    : risk.score > 20
      ? "Moderate risk organization profile: partial domain verification or non-standard corporate channel records."
      : "Verified corporate identity: domain records and historical activity conform to authentic recruitment standards."

  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-border pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-light tracking-wide uppercase text-text">COMPANY DOSSIER</h1>
            <p className="text-text-muted font-mono text-xs mt-2">ID: {company.id}</p>
          </div>
          <Link href="/analyze" className="btn-ghost text-sm border border-border">← NEW ANALYSIS</Link>
        </header>

        {/* Full-width composite risk visualization */}
        <RiskVisualization 
          score={risk.score || 0} 
          level={risk.level || 'LOW'} 
          confidence={95} 
          oneSentenceExplanation={companyVerdict}
        />

        {/* Identity Section */}
        <div className="panel p-0 border-border">
          <h2 className="tech-label text-text-muted border-b border-border p-6 mb-0">IDENTITY & DOMAIN PROVENANCE</h2>
          <div className="p-6 space-y-4 font-mono text-sm text-text">
            <div className="grid grid-cols-3 gap-2 pb-4 border-b border-border/50">
              <span className="text-text-muted uppercase tracking-widest text-xs">Normalized Name:</span>
              <span className="col-span-2 text-text">{company.name || "Unknown Organization"}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pb-4 border-b border-border/50">
              <span className="text-text-muted uppercase tracking-widest text-xs">Official Domain:</span>
              <span className="col-span-2 text-text">{company.domain || "No official domain recorded"}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-text-muted uppercase tracking-widest text-xs">Verification State:</span>
              <span className={`col-span-2 font-bold ${getResultColor(verification.status)}`}>{(verification.status || 'UNVERIFIED').replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>

        <div className="panel p-0 border-border">
          <h2 className="tech-label text-text-muted border-b border-border p-6 mb-0">VERIFICATION CHECKS</h2>
          {verification.checks?.length === 0 ? (
            <p className="text-text-muted font-mono text-sm p-6">No verification checks found.</p>
          ) : (
            <ul className="space-y-3 px-6 pb-6">
              {verification.checks?.map((c: any) => (
                <li key={c.id} className="text-sm font-mono flex items-start gap-4 p-3 bg-surface border border-border rounded-sm">
                  <span className={`badge ${c.result === 'VERIFIED' ? 'badge-verified' : c.result === 'SUSPICIOUS' ? 'badge-critical' : 'badge-suspicious'}`}>{getResultIcon(c.result)}</span>
                  <div>
                    <div className="font-bold text-text tracking-wide text-xs mb-1">{c.check_type?.replace(/_/g, ' ') || c.result}</div>
                    <div className="text-text-muted text-xs">{c.evidence}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="panel p-6 border-border col-span-1 md:col-span-2">
            <h2 className="tech-label text-text-muted border-b border-border pb-2 mb-4">
              HISTORICAL INTELLIGENCE
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 bg-surface-elevated border-l-2 border-slate-500">
                <span className="block text-xs text-text-muted mb-1">Analyzed Opportunities</span>
                <span className="text-xl font-light text-text">{risk.historical_opportunities_count}</span>
              </div>
              <div className="p-3 bg-surface-elevated border-l-2 border-risk-critical/50">
                <span className="block text-xs text-text-muted mb-1">High-Risk Associated</span>
                <span className="text-xl font-light text-risk-critical">{risk.high_risk_opportunities_count}</span>
              </div>
            </div>
            {risk.recurring_risk_signals?.length > 0 && (
              <div className="text-sm font-mono text-text mb-6">
                <span className="text-text-muted block mb-2">Recurring risk signals across opportunities:</span>
                <ul className="list-disc list-inside text-risk-moderate">
                  {risk.recurring_risk_signals.map((sig: string) => (
                    <li key={sig}>{sig.replace(/_/g, ' ')}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {communityReportsCount > 0 && (
              <div className="pt-4 border-t border-border">
                <h3 className="tech-label text-text-muted mb-2">COMMUNITY INTELLIGENCE</h3>
                <p className="text-sm font-mono text-text">
                  <span className="text-risk-critical font-bold">{communityReportsCount}</span> approved community report(s) associated with this company.
                </p>
                <Link href="/community" className="text-text-muted hover:underline font-mono text-xs mt-2 block">
                  View Community Reports →
                </Link>
              </div>
            )}
          </div>
          
          <div className="panel p-6 border-border">
            <h2 className="tech-label text-text-muted border-b border-border pb-2 mb-4">
              ANALYZED OPPORTUNITIES ({related_jobs.length})
            </h2>
            {related_jobs.length === 0 ? (
              <p className="text-text-muted font-mono text-xs">No analyzed jobs found.</p>
            ) : (
              <ul className="space-y-3 font-mono text-xs">
                {related_jobs.map((job: {id: string, title: string, risk_score: number}) => (
                  <li key={job.id} className="flex flex-col gap-1 border border-border p-3 rounded-sm bg-surface-raised">
                    <Link href={`/analyze/result/${job.id}`} className="text-text hover:underline truncate">
                      {job.title || "Untitled Job"}
                    </Link>
                    <span className="text-text-muted">Risk: {job.risk_score}/100</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel p-6 border-border">
            <h2 className="tech-label text-text-muted border-b border-border pb-2 mb-4">
              ASSOCIATED CONTACTS ({associated_recruiters.length})
            </h2>
            {associated_recruiters.length === 0 ? (
              <p className="text-text-muted font-mono text-xs">No recruiters associated.</p>
            ) : (
              <ul className="space-y-3 font-mono text-xs">
                {associated_recruiters.map((rec: {id: string, name: string, verification_status: string}) => (
                  <li key={rec.id} className="flex flex-col gap-1 border border-border p-3 rounded-sm bg-surface-raised">
                    <Link href={`/recruiters/${rec.id}`} className="text-text hover:underline truncate">
                      {rec.name || "Unknown Name"}
                    </Link>
                    <span className={`text-xs ${getResultColor(rec.verification_status)}`}>Verification: {rec.verification_status.replace(/_/g, ' ')}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
