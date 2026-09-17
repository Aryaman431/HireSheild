'use client'

import { useState, useEffect } from 'react'
import { getBrowserApiUrl } from '@/lib/api'

interface Check {
  id: string
  entity_type: string
  entity_id: string
  check_type: string
  result: string
  evidence: string
  checked_at: string
}

interface VerificationData {
  job_id: string
  company_id: string | null
  recruiter_id: string | null
  checks: Check[]
}

export default function VerificationPanel({ jobId, accessToken }: { jobId: string, accessToken: string }) {
  const [data, setData] = useState<VerificationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRechecking, setIsRechecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const apiUrl = getBrowserApiUrl()
        const res = await fetch(`${apiUrl}/api/v1/jobs/${jobId}/verification`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        if (!res.ok) throw new Error("Failed to load verification data")
        const result = await res.json()
        setData(result)
      } catch (err) {
        console.error(err)
        setError("Unable to load verification details.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchVerification()
  }, [jobId, accessToken])

  const handleRecheck = async () => {
    setIsRechecking(true)
    setError(null)
    try {
      const apiUrl = getBrowserApiUrl()
      const res = await fetch(`${apiUrl}/api/v1/jobs/${jobId}/verification/recheck`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || "Recheck failed")
      }
      const getRes = await fetch(`${apiUrl}/api/v1/jobs/${jobId}/verification`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      if (getRes.ok) {
        const result = await getRes.json()
        setData(result)
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Recheck failed")
    } finally {
      setIsRechecking(false)
    }
  }

  if (isLoading) {
    return <div className="text-slate-500 font-mono text-sm animate-pulse">Loading verification data...</div>
  }

  if (!data) {
    return <div className="text-risk-critical font-mono text-sm">Failed to load verification checks.</div>
  }


  const getResultIcon = (result: string) => {
    switch (result) {
      case 'VERIFIED': return '✓'
      case 'PARTIALLY_VERIFIED': return '!'
      case 'SUSPICIOUS': return '⚠'
      default: return '—'
    }
  }

  const getResultBadgeClass = (result: string) => {
    switch (result) {
      case 'VERIFIED': return 'badge-verified'
      case 'PARTIALLY_VERIFIED': return 'badge-suspicious'
      case 'SUSPICIOUS': return 'badge-critical'
      default: return 'bg-slate-800 text-slate-400 border border-slate-700'
    }
  }

  // Format checks by entity
  const companyChecks = data.checks.filter(c => c.entity_type === 'COMPANY')
  const recruiterChecks = data.checks.filter(c => c.entity_type === 'RECRUITER')
  const jobChecks = data.checks.filter(c => c.entity_type === 'JOB')
  
  const hasChecks = data.checks.length > 0
  const lastChecked = hasChecks ? new Date(data.checks[0].checked_at).toLocaleString() : 'Never'

  return (
    <div className="panel p-6 border-surface-elevated relative">
      <div className="flex justify-between items-center mb-6 border-b border-surface-elevated pb-2">
        <h2 className="tech-label text-slate-500 m-0">INDEPENDENT VERIFICATION</h2>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 font-mono">LAST CHECKED: {lastChecked}</span>
          <button 
            onClick={handleRecheck} 
            disabled={isRechecking}
            className="text-[10px] font-bold tracking-widest uppercase bg-surface-elevated hover:bg-slate-800 text-slate-300 px-3 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRechecking ? 'CHECKING...' : 'RECHECK'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-surface-elevated border border-surface-raised rounded-sm text-risk-critical text-sm font-mono">
          [SYSTEM_ERROR]: {error}
        </div>
      )}

      {!hasChecks && !isRechecking && (
        <div className="text-slate-400 font-mono text-sm py-2">
          No independent verification checks available for this opportunity.
        </div>
      )}

      <div className="space-y-6">
        {companyChecks.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Company Domain Checks</h3>
            <ul className="space-y-2">
              {companyChecks.map((c: Check) => (
                <li key={c.id} className="text-sm font-mono flex items-start gap-4 p-3 bg-surface-raised/30 border border-surface-elevated rounded-sm">
                  <span className={`badge ${getResultBadgeClass(c.result)}`}>{getResultIcon(c.result)}</span>
                  <div>
                    <div className="font-bold text-slate-200 tracking-wide text-xs mb-1">{c.check_type.replace(/_/g, ' ')}</div>
                    <div className="text-slate-400 text-xs">{c.evidence}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {recruiterChecks.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Recruiter Identity Checks</h3>
            <ul className="space-y-2">
              {recruiterChecks.map((c: Check) => (
                <li key={c.id} className="text-sm font-mono flex items-start gap-4 p-3 bg-surface-raised/30 border border-surface-elevated rounded-sm">
                  <span className={`badge ${getResultBadgeClass(c.result)}`}>{getResultIcon(c.result)}</span>
                  <div>
                    <div className="font-bold text-slate-200 tracking-wide text-xs mb-1">{c.check_type.replace(/_/g, ' ')}</div>
                    <div className="text-slate-400 text-xs">{c.evidence}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {jobChecks.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Application URL Checks</h3>
            <ul className="space-y-2">
              {jobChecks.map((c: Check) => (
                <li key={c.id} className="text-sm font-mono flex items-start gap-4 p-3 bg-surface-raised/30 border border-surface-elevated rounded-sm">
                  <span className={`badge ${getResultBadgeClass(c.result)}`}>{getResultIcon(c.result)}</span>
                  <div>
                    <div className="font-bold text-slate-200 tracking-wide text-xs mb-1">{c.check_type.replace(/_/g, ' ')}</div>
                    <div className="text-slate-400 text-xs">{c.evidence}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
