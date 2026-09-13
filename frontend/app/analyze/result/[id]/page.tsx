import { auth } from "@clerk/nextjs/server"
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ReportOpportunityForm from '@/components/ReportOpportunityForm'
import VerificationPanel from '@/components/VerificationPanel'
import RiskVisualization from '@/components/RiskVisualization'
import RiskSignalRow from '@/components/RiskSignalRow'

async function getAnalysisResult(id: string, token: string | null) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  if (!token) {
    return null
  }
  const response = await fetch(`${apiUrl}/api/v1/jobs/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    cache: 'no-store'
  })

  if (!response.ok) {
    return null
  }
  return response.json()
}

async function getHistoricalIntelligence(id: string, token: string | null) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const response = await fetch(`${apiUrl}/api/v1/jobs/${id}/intelligence/historical`, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    cache: 'no-store'
  })

  if (!response.ok) {
    return null
  }
  return response.json()
}

export default async function ResultPage({ params }: { params: { id: string } }) {
  const { userId, getToken } = await auth()
  const token = await getToken()
  const result = await getAnalysisResult(params.id, token)

  if (!result) {
    redirect('/dashboard')
  }

  // Fetch historical intelligence
  const historicalData = await getHistoricalIntelligence(params.id, token)


  
  // Note: For MVP we manually filter the reports on the frontend to avoid creating a whole new endpoint just for job reports list.

  // I will just mock job community intelligence using `HISTORICAL_REPORTS` signal presence.
  const commSignal = result.signals.find((s: any) => s.type === 'HISTORICAL_REPORTS')
  const approvedReportsCount = commSignal ? parseInt(commSignal.reasoning.match(/\d+/)?.[0] || '0') : 0


  

  const getRecommendation = (signalType: string) => {
    switch (signalType) {
      case 'UPFRONT_PAYMENT': return "Do not pay any registration, onboarding, training, or application fee before independently verifying the employer."
      case 'HIGH_PRESSURE_LANGUAGE': return "Take time to independently verify the opportunity instead of responding under pressure."
      case 'GUARANTEED_SELECTION': return "Be cautious of guaranteed-selection claims and verify the hiring process independently."
      case 'SUSPICIOUS_APPLICATION_URL': return "Verify that the application link belongs to the employer's official domain."
      case 'POSSIBLE_IMPERSONATION': return "Do not share sensitive documents until you can verify the recruiter's identity through official channels."
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-surface-elevated pb-6 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-light tracking-wide uppercase text-brand-100">Analysis Result</h1>
              <span className="px-2 py-0.5 bg-brand-500/10 border border-brand-500/30 text-brand-400 text-[10px] font-bold tracking-wider rounded uppercase">
                {result.input_source || 'TEXT'} SOURCE
              </span>
            </div>
            <p className="text-slate-400 font-mono text-xs mt-2">ID: {result.id}</p>
          </div>
          <Link href="/analyze" className="btn-ghost text-sm">← NEW ANALYSIS</Link>
        </header>

        <div className="flex flex-col gap-8">
          <RiskVisualization score={result.risk_score} level={result.risk_level} confidence={result.confidence} />

          <div className="panel p-0 border-brand-500/30">
            <h2 className="tech-label text-brand-500 border-b border-surface-elevated p-6 mb-0">KEY FINDINGS & SIGNALS</h2>
            
            {result.signals.length === 0 ? (
              <p className="text-slate-400 font-mono text-sm p-6">No suspicious signals detected by the risk engine.</p>
            ) : (
              <div className="flex flex-col px-6 pb-2">
                {result.signals.map((signal: unknown, idx: number) => (
                  <RiskSignalRow key={idx} signal={signal} />
                ))}
              </div>
            )}
          </div>
        </div>

        <VerificationPanel jobId={result.id} accessToken={token || ''} />

        {/* Intelligence Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Company Intelligence */}
          {result.company && (
            <div className="panel p-6 border-brand-500/20">
              <h2 className="tech-label text-brand-500 border-b border-surface-elevated pb-2 mb-4 flex justify-between items-center">
                <span>COMPANY INTELLIGENCE</span>
                <Link href={`/companies/${result.company.id}`} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">VIEW DOSSIER →</Link>
              </h2>
              <div className="space-y-4 text-sm font-mono text-slate-300">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">Company:</span>
                  <span className="col-span-2 text-slate-200">{result.company.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">Domain:</span>
                  <span className="col-span-2 text-brand-400">{result.company.domain || "Unknown"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">Verification:</span>
                  <span className="col-span-2">{result.company.verification_status.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Recruiter Intelligence */}
          {result.recruiter && (
            <div className="panel p-6 border-brand-500/20">
              <h2 className="tech-label text-brand-500 border-b border-surface-elevated pb-2 mb-4 flex justify-between items-center">
                <span>RECRUITER INTELLIGENCE</span>
                <Link href={`/recruiters/${result.recruiter.id}`} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">VIEW DOSSIER →</Link>
              </h2>
              <div className="space-y-4 text-sm font-mono text-slate-300">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">Recruiter:</span>
                  <span className="col-span-2 text-slate-200">{result.recruiter.name || "Unknown"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">Email:</span>
                  <span className="col-span-2 text-brand-400">{result.recruiter.email || "Unknown"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">Verification:</span>
                  <span className="col-span-2">{result.recruiter.verification_status.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Community Intelligence Section */}
        {approvedReportsCount > 0 && (
          <div className="panel p-6 border-brand-500/20">
            <h2 className="tech-label text-brand-500 border-b border-surface-elevated pb-2 mb-4">COMMUNITY INTELLIGENCE</h2>
            <div className="text-sm font-mono text-slate-300 space-y-2">
              <p className="text-risk-critical font-bold">{approvedReportsCount} approved community report(s) are associated with this opportunity or its recruiter/company.</p>
              <Link href="/community" className="text-brand-400 hover:underline">View community index →</Link>
            </div>
          </div>
        )}

        {/* Historical Intelligence Section */}
        {historicalData?.available && historicalData.similar_opportunities.length > 0 && (
          <div className="panel p-6 border-brand-500/20">
            <h2 className="tech-label text-brand-500 border-b border-surface-elevated pb-2 mb-4">HISTORICAL INTELLIGENCE</h2>
            
            <div className="mb-6 space-y-4 text-sm text-slate-300 font-mono">
              <p className="text-brand-300 font-bold uppercase tracking-wide">
                {historicalData.pattern_summary.similar_count} SIMILAR OPPORTUNITIES FOUND
              </p>
              
              {historicalData.pattern_summary.common_signals?.length > 0 && (
                <div>
                  <p className="text-slate-500 mb-2">Recurring risk patterns:</p>
                  <ul className="list-disc list-inside text-brand-400 space-y-1">
                    {historicalData.pattern_summary.common_signals.map((sig: string) => (
                      <li key={sig}>{sig.replace(/_/g, ' ')}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {historicalData.pattern_summary.high_risk_count > 0 && (
                <p className="border-l-2 border-brand-500 pl-3 py-1 bg-brand-500/10 text-brand-200">
                  {historicalData.pattern_summary.high_risk_count} of {historicalData.pattern_summary.similar_count} similar opportunities were rated HIGH or CRITICAL risk.
                </p>
              )}
            </div>

            <h3 className="tech-label text-slate-500 mb-3 border-b border-surface-elevated pb-1">RELATED OPPORTUNITIES</h3>
            <div className="space-y-3">
              {historicalData.similar_opportunities.map((opp: { id: string; title: string; relevance: string; company: string; risk_level: string }) => (
                <Link 
                  href={`/analyze/result/${opp.id}`} 
                  key={opp.id} 
                  className="block p-3 border border-surface-elevated rounded hover:border-brand-500/30 bg-slate-900/50 group transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-mono text-sm text-brand-400 group-hover:text-brand-300 truncate">{opp.title || "Untitled Opportunity"}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-surface px-2 py-0.5 rounded text-slate-400">
                      {opp.relevance}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-500">{opp.company}</span>
                    <span className={
                      opp.risk_level === 'CRITICAL' || opp.risk_level === 'HIGH' 
                        ? 'text-risk-critical' 
                        : opp.risk_level === 'MODERATE' || opp.risk_level === 'SUSPICIOUS' 
                          ? 'text-risk-moderate' 
                          : 'text-risk-low'
                    }>
                      {opp.risk_level}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="panel p-6 border-brand-500/30">
          <h2 className="tech-label text-brand-500 border-b border-surface-elevated pb-2 mb-4">RECOMMENDED ACTIONS</h2>
          <ul className="space-y-3 font-mono text-sm text-slate-300">
            {result.signals.map((s: {type: string}) => getRecommendation(s.type)).filter(Boolean).map((rec: string, i: number) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="text-brand-500 mt-0.5">▸</span>
                <span>{rec}</span>
              </li>
            ))}
            {result.signals.length === 0 && (
              <li className="flex gap-3 items-start text-slate-400">
                <span>No immediate risk actions required. Proceed with normal caution.</span>
              </li>
            )}
          </ul>
        </div>
        
        {/* Report Component */}
        <div className="pt-4 border-t border-surface-elevated mt-8">
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
