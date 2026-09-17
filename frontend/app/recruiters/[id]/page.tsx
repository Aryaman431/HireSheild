import { getAuth } from "@/lib/auth-server"
import Link from 'next/link'
import RiskVisualization from '@/components/RiskVisualization'
import { getServerApiUrl } from '@/lib/api'
import { ShieldAlert } from 'lucide-react'

interface VerificationCheck {
  id: string
  check_type: string
  result: string
  evidence: string
}

async function getRecruiterIntelligence(id: string) {
  let token: string | null = null
  try {
    const authObj = await getAuth()
    token = (await authObj.getToken()) || 'demo_token'
  } catch {
    token = 'demo_token'
  }

  const apiUrl = getServerApiUrl()
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

export default async function RecruiterDossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const recruiter = await getRecruiterIntelligence(id)

  if (!recruiter) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-8 flex items-center justify-center">
        <div className="panel max-w-lg w-full p-8 border-surface-elevated text-center space-y-4">
          <div className="inline-flex p-3 rounded-full bg-risk-critical/10 text-risk-critical border border-risk-critical/30 mb-2">
            <ShieldAlert size={24} />
          </div>
          <h1 className="text-xl font-light uppercase tracking-wider text-slate-100">
            RECRUITER DOSSIER NOT FOUND
          </h1>
          <p className="font-mono text-xs text-slate-400 leading-relaxed">
            The requested recruiter record could not be retrieved from the intelligence database.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link href="/analyze" className="btn-primary text-xs">← INITIATE AUDIT</Link>
            <Link href="/dashboard" className="btn-ghost text-xs border border-surface-elevated">DASHBOARD</Link>
          </div>
        </div>
      </div>
    )
  }

  const isHighRisk = (recruiter.risk_score || 0) > 60
  const isModerateRisk = (recruiter.risk_score || 0) > 20 && (recruiter.risk_score || 0) <= 60

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

  const recruiterVerdict = isHighRisk
    ? "High risk contact: Recruiter identity is linked to suspicious opportunities, unverified email domains, or flagged communications."
    : isModerateRisk
      ? "Moderate risk contact: Recruiter identity exhibits anomalies or unverified domain provenance that requires confirmation."
      : "Low risk contact: Recruiter profile aligns with verified corporate identity and standard recruitment practices."

  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-surface-elevated pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-light tracking-wide uppercase text-slate-100">RECRUITER DOSSIER</h1>
            <p className="text-slate-400 font-mono text-xs mt-2">ID: {recruiter.id}</p>
          </div>
          <Link href="/analyze" className="btn-ghost text-sm border border-surface-elevated">← NEW ANALYSIS</Link>
        </header>

        {/* Full-width composite risk visualization */}
        <RiskVisualization 
          score={recruiter.risk_score || 0} 
          level={isHighRisk ? 'HIGH RISK CONTACT' : isModerateRisk ? 'MODERATE RISK' : 'LOW RISK'} 
          confidence={90} 
          oneSentenceExplanation={recruiterVerdict}
        />

        {/* Identity Section */}
        <div className="panel p-0 border-surface-elevated">
          <h2 className="tech-label text-slate-500 border-b border-surface-elevated p-6 mb-0">IDENTITY & CONTACT CHANNELS</h2>
          <div className="p-6 space-y-4 font-mono text-sm text-slate-300">
            <div className="grid grid-cols-3 gap-2 pb-4 border-b border-surface-elevated/50">
              <span className="text-slate-500 uppercase tracking-widest text-xs">Name:</span>
              <span className="col-span-2 text-slate-200">{recruiter.name || "Unknown Recruiter"}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pb-4 border-b border-surface-elevated/50">
              <span className="text-slate-500 uppercase tracking-widest text-xs">Email:</span>
              <span className="col-span-2 text-slate-200">{recruiter.email || "No email recorded"}</span>
            </div>
            {recruiter.phone && (
              <div className="grid grid-cols-3 gap-2 pb-4 border-b border-surface-elevated/50">
                <span className="text-slate-500 uppercase tracking-widest text-xs">Phone:</span>
                <span className="col-span-2 text-slate-200">{recruiter.phone}</span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 pb-4 border-b border-surface-elevated/50">
              <span className="text-slate-500 uppercase tracking-widest text-xs">Associated Company:</span>
              <span className="col-span-2 text-slate-200">
                {recruiter.company ? (
                  <Link href={`/companies/${recruiter.company.id}`} className="hover:text-slate-300 hover:underline">
                    {recruiter.company.name}
                  </Link>
                ) : "Unknown Organization"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500 uppercase tracking-widest text-xs">Verification State:</span>
              <span className={`col-span-2 font-bold ${getResultColor(recruiter.verification_status)}`}>{(recruiter.verification_status || 'UNVERIFIED').replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>

        {/* Verification Checks Section */}
        <div className="panel p-0 border-surface-elevated">
          <h2 className="tech-label text-slate-500 border-b border-surface-elevated p-6 mb-0">VERIFICATION CHECKS</h2>
          {recruiter.verification_checks?.length === 0 ? (
            <p className="text-slate-400 font-mono text-sm p-6">No verification checks found.</p>
          ) : (
            <ul className="space-y-3 px-6 pb-6">
              {recruiter.verification_checks?.map((c: VerificationCheck) => (
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

        <div className="panel p-6 border-surface-elevated">
          <h2 className="tech-label text-slate-500 border-b border-surface-elevated pb-2 mb-4">
            ACTIVITY SUMMARY
          </h2>
          <p className="text-slate-300 font-mono text-sm mb-6">{recruiter.activity_summary}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-surface-elevated border-l-2 border-slate-500">
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

        <div className="panel p-6 border-surface-elevated">
          <h2 className="tech-label text-slate-500 border-b border-surface-elevated pb-2 mb-4">
            ANALYZED OPPORTUNITIES ({recruiter.related_jobs.length})
          </h2>
          {recruiter.related_jobs.length === 0 ? (
            <p className="text-slate-500 font-mono text-xs">No analyzed jobs found.</p>
          ) : (
            <ul className="space-y-3 font-mono text-xs">
              {recruiter.related_jobs.map((job: {id: string, title: string, risk_score: number}) => (
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
      </div>
    </div>
  )
}
