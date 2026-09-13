import { auth } from "@clerk/nextjs/server"
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RiskVisualization from '@/components/RiskVisualization'

interface VerificationCheck {
  id: string
  check_type: string
  result: string
  evidence: string
}

async function getRecruiterIntelligence(id: string) {
  const { userId, getToken } = await auth()
  
  if (!userId) {
    return null
  }
  const token = await getToken()

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const response = await fetch(`${apiUrl}/api/v1/recruiters/${id}`, {
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  })

  if (!response.ok) {
    return null
  }
  
  return await response.json()
}

export default async function RecruiterDossierPage({ params }: { params: { id: string } }) {
  const recruiter = await getRecruiterIntelligence(params.id)

  if (!recruiter) {
    redirect('/dashboard')
  }

  const isHighRisk = recruiter.risk_score > 60
  const isModerateRisk = recruiter.risk_score > 20 && recruiter.risk_score <= 60

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
            <h1 className="text-3xl font-light tracking-wide uppercase text-brand-100">RECRUITER DOSSIER</h1>
            <p className="text-slate-400 font-mono text-xs mt-2">ID: {recruiter.id}</p>
          </div>
          <Link href="/analyze" className="btn-ghost text-sm border border-surface-elevated">← NEW ANALYSIS</Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <RiskVisualization score={recruiter.risk_score || 0} level={isHighRisk ? 'HIGH RISK CONTACT' : isModerateRisk ? 'MODERATE RISK' : 'LOW RISK'} confidence={90} />
          </div>

          <div className="md:col-span-2 panel p-0 border-brand-500/30">
            <h2 className="tech-label text-brand-500 border-b border-surface-elevated p-6 mb-0">IDENTITY</h2>
            <div className="p-6 space-y-4 font-mono text-sm text-slate-300">
              <div className="grid grid-cols-3 gap-2 pb-4 border-b border-surface-elevated/50">
                <span className="text-slate-500 uppercase tracking-widest text-xs">Name:</span>
                <span className="col-span-2 text-slate-200">{recruiter.name || "Unknown"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pb-4 border-b border-surface-elevated/50">
                <span className="text-slate-500 uppercase tracking-widest text-xs">Email:</span>
                <span className="col-span-2 text-brand-400">{recruiter.email || "Unknown"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pb-4 border-b border-surface-elevated/50">
                <span className="text-slate-500 uppercase tracking-widest text-xs">Associated Company:</span>
                <span className="col-span-2 text-slate-200">
                  {recruiter.company ? (
                    <Link href={`/companies/${recruiter.company.id}`} className="hover:text-brand-400 hover:underline">
                      {recruiter.company.name}
                    </Link>
                  ) : "Unknown"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 uppercase tracking-widest text-xs">Verification State:</span>
                <span className={`col-span-2 font-bold ${getResultColor(recruiter.verification_status)}`}>{recruiter.verification_status.replace(/_/g, ' ')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Checks Section */}
        <div className="panel p-0 border-brand-500/30">
          <h2 className="tech-label text-brand-500 border-b border-surface-elevated p-6 mb-0">VERIFICATION CHECKS</h2>
          {recruiter.verification_checks?.length === 0 ? (
            <p className="text-slate-400 font-mono text-sm p-6">No verification checks found.</p>
          ) : (
            <ul className="space-y-3 px-6 pb-6">
              {recruiter.verification_checks?.map((c: VerificationCheck) => (
                <li key={c.id} className="text-sm font-mono flex items-start gap-4 p-3 bg-surface border border-surface-elevated rounded">
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

        <div className="panel p-6 border-brand-500/20">
          <h2 className="tech-label text-brand-500 border-b border-surface-elevated pb-2 mb-4">
            ACTIVITY SUMMARY
          </h2>
          <p className="text-slate-300 font-mono text-sm mb-6">{recruiter.activity_summary}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-surface-elevated border-l-2 border-brand-500/30">
              <span className="block text-xs text-slate-500 mb-1">Total Opportunities</span>
              <span className="text-xl font-light text-slate-200">{recruiter.historical_opportunities_count}</span>
            </div>
            <div className="p-3 bg-surface-elevated border-l-2 border-risk-critical/50">
              <span className="block text-xs text-slate-500 mb-1">High-Risk Count</span>
              <span className="text-xl font-light text-risk-critical">{recruiter.high_risk_opportunities_count}</span>
            </div>
          </div>

          {recruiter.recurring_risk_signals?.length > 0 && (
            <div className="text-sm font-mono text-slate-300 mb-6">
              <span className="text-slate-500 block mb-2">Recurring risk signals from this recruiter:</span>
              <ul className="list-disc list-inside text-risk-moderate">
                {recruiter.recurring_risk_signals.map((sig: string) => (
                  <li key={sig}>{sig.replace(/_/g, ' ')}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="panel p-6 border-brand-500/20">
          <h2 className="tech-label text-brand-500 border-b border-surface-elevated pb-2 mb-4">
            ANALYZED OPPORTUNITIES ({recruiter.related_jobs.length})
          </h2>
          {recruiter.related_jobs.length === 0 ? (
            <p className="text-slate-500 font-mono text-xs">No analyzed jobs found.</p>
          ) : (
            <ul className="space-y-3 font-mono text-xs">
              {recruiter.related_jobs.map((job: {id: string, title: string, risk_score: number}) => (
                <li key={job.id} className="flex flex-col gap-1 border border-surface-elevated p-3 rounded bg-slate-900/50">
                  <Link href={`/analyze/result/${job.id}`} className="text-brand-400 hover:underline truncate">
                    {job.title || "Untitled Job"}
                  </Link>
                  <span className="text-slate-500">Risk: {job.risk_score}/100</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
