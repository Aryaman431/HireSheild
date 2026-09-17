import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import RiskVisualization from '@/components/RiskVisualization'
import { getServerApiUrl } from '@/lib/api'

async function getCompanyIntelligence(id: string) {
  const { userId, getToken } = await auth()
  
  if (!userId) {
    return null
  }

  const token = await getToken()

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
    redirect('/dashboard')
  }

  const { company, risk, verification, related_jobs, associated_recruiters, community_feed } = data
  
  const communityReportsCount = community_feed?.reports?.filter((r: any) => r.company_name === company.name).length || 0



  const getResultColor = (result: string) => {
    switch (result) {
      case 'VERIFIED': return 'text-brand-400'
      case 'PARTIALLY_VERIFIED': return 'text-brand-300'
      case 'SUSPICIOUS': return 'text-risk-critical'
      default: return 'text-slate-400'
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

  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-surface-elevated pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-light tracking-wide uppercase text-slate-100">COMPANY DOSSIER</h1>
            <p className="text-slate-400 font-mono text-xs mt-2">ID: {company.id}</p>
          </div>
          <Link href="/analyze" className="btn-ghost text-sm border border-surface-elevated">← NEW ANALYSIS</Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <RiskVisualization score={risk.score} level={risk.level} confidence={95} />
          </div>

          <div className="md:col-span-2 panel p-0 border-surface-elevated">
            <h2 className="tech-label text-slate-500 border-b border-surface-elevated p-6 mb-0">IDENTITY</h2>
            <div className="p-6 space-y-4 font-mono text-sm text-slate-300">
              <div className="grid grid-cols-3 gap-2 pb-4 border-b border-surface-elevated/50">
                <span className="text-slate-500 uppercase tracking-widest text-xs">Normalized Name:</span>
                <span className="col-span-2 text-slate-200">{company.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pb-4 border-b border-surface-elevated/50">
                <span className="text-slate-500 uppercase tracking-widest text-xs">Official Domain:</span>
                <span className="col-span-2 text-slate-200">{company.domain || "Unknown"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 uppercase tracking-widest text-xs">Verification State:</span>
                <span className={`col-span-2 font-bold ${getResultColor(verification.status)}`}>{verification.status.replace(/_/g, ' ')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="panel p-0 border-surface-elevated">
          <h2 className="tech-label text-slate-500 border-b border-surface-elevated p-6 mb-0">VERIFICATION CHECKS</h2>
          {verification.checks?.length === 0 ? (
            <p className="text-slate-400 font-mono text-sm p-6">No verification checks found.</p>
          ) : (
            <ul className="space-y-3 px-6 pb-6">
              {verification.checks?.map((c: any) => (
                <li key={c.id} className="text-sm font-mono flex items-start gap-4 p-3 bg-surface border border-surface-elevated rounded-sm">
                  <span className={`badge ${c.result === 'VERIFIED' ? 'badge-verified' : c.result === 'SUSPICIOUS' ? 'badge-critical' : 'badge-suspicious'}`}>{getResultIcon(c.result)}</span>
                  <div>
                    <div className="font-bold text-slate-200 tracking-wide text-xs mb-1">{c.check_type?.replace(/_/g, ' ') || c.result}</div>
                    <div className="text-slate-400 text-xs">{c.evidence}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="panel p-6 border-surface-elevated col-span-1 md:col-span-2">
            <h2 className="tech-label text-slate-500 border-b border-surface-elevated pb-2 mb-4">
              HISTORICAL INTELLIGENCE
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 bg-surface-elevated border-l-2 border-slate-500">
                <span className="block text-xs text-slate-500 mb-1">Analyzed Opportunities</span>
                <span className="text-xl font-light text-slate-200">{risk.historical_opportunities_count}</span>
              </div>
              <div className="p-3 bg-surface-elevated border-l-2 border-risk-critical/50">
                <span className="block text-xs text-slate-500 mb-1">High-Risk Associated</span>
                <span className="text-xl font-light text-risk-critical">{risk.high_risk_opportunities_count}</span>
              </div>
            </div>
            {risk.recurring_risk_signals?.length > 0 && (
              <div className="text-sm font-mono text-slate-300 mb-6">
                <span className="text-slate-500 block mb-2">Recurring risk signals across opportunities:</span>
                <ul className="list-disc list-inside text-risk-moderate">
                  {risk.recurring_risk_signals.map((sig: string) => (
                    <li key={sig}>{sig.replace(/_/g, ' ')}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {communityReportsCount > 0 && (
              <div className="pt-4 border-t border-surface-elevated">
                <h3 className="tech-label text-slate-500 mb-2">COMMUNITY INTELLIGENCE</h3>
                <p className="text-sm font-mono text-slate-300">
                  <span className="text-risk-critical font-bold">{communityReportsCount}</span> approved community report(s) associated with this company.
                </p>
                <Link href="/community" className="text-slate-400 hover:underline font-mono text-xs mt-2 block">
                  View Community Reports →
                </Link>
              </div>
            )}
          </div>
          
          <div className="panel p-6 border-surface-elevated">
            <h2 className="tech-label text-slate-500 border-b border-surface-elevated pb-2 mb-4">
              ANALYZED OPPORTUNITIES ({related_jobs.length})
            </h2>
            {related_jobs.length === 0 ? (
              <p className="text-slate-500 font-mono text-xs">No analyzed jobs found.</p>
            ) : (
              <ul className="space-y-3 font-mono text-xs">
                {related_jobs.map((job: {id: string, title: string, risk_score: number}) => (
                  <li key={job.id} className="flex flex-col gap-1 border border-surface-elevated p-3 rounded-sm bg-surface-raised">
                    <Link href={`/analyze/result/${job.id}`} className="text-slate-300 hover:underline truncate">
                      {job.title || "Untitled Job"}
                    </Link>
                    <span className="text-slate-500">Risk: {job.risk_score}/100</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel p-6 border-surface-elevated">
            <h2 className="tech-label text-slate-500 border-b border-surface-elevated pb-2 mb-4">
              ASSOCIATED CONTACTS ({associated_recruiters.length})
            </h2>
            {associated_recruiters.length === 0 ? (
              <p className="text-slate-500 font-mono text-xs">No recruiters associated.</p>
            ) : (
              <ul className="space-y-3 font-mono text-xs">
                {associated_recruiters.map((rec: {id: string, name: string, verification_status: string}) => (
                  <li key={rec.id} className="flex flex-col gap-1 border border-surface-elevated p-3 rounded-sm bg-surface-raised">
                    <Link href={`/recruiters/${rec.id}`} className="text-slate-300 hover:underline truncate">
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
