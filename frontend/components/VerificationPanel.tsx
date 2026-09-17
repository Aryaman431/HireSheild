'use client'

import { useState, useEffect } from 'react'
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  RefreshCw, 
  Globe, 
  UserCheck, 
  ExternalLink,
  ShieldCheck,
  AlertOctagon,
  Building2,
  Mail
} from 'lucide-react'
import { getBrowserApiUrl } from '@/lib/api'

export interface Check {
  id: string
  entity_type: string
  entity_id: string
  check_type: string
  result: string
  evidence: string
  checked_at: string
}

export interface VerificationData {
  job_id: string
  company_id: string | null
  recruiter_id: string | null
  checks: Check[]
}

interface VerificationPanelProps {
  jobId: string
  accessToken: string
  initialData?: VerificationData | null
  company?: { id?: string; name?: string; domain?: string; verification_status?: string } | null
  recruiter?: { id?: string; name?: string; email?: string; verification_status?: string } | null
  sourceUrl?: string | null
}

type VerificationStatusType = 'Verified' | 'Suspicious' | 'Unknown'

export default function VerificationPanel({ 
  jobId, 
  accessToken,
  initialData,
  company,
  recruiter,
  sourceUrl
}: VerificationPanelProps) {
  const [data, setData] = useState<VerificationData | null>(initialData || null)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [isRechecking, setIsRechecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialData) return

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
  }, [jobId, accessToken, initialData])

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

  const checks = data?.checks || []

  // 1. Company Status
  const getCompanyStatus = (): { status: VerificationStatusType; badgeClass: string; textClass: string; detail: string; target: string } => {
    const compCheck = checks.find(c => c.entity_type === 'COMPANY' && c.check_type === 'COMPANY_DOMAIN')
    const statusRaw = company?.verification_status || compCheck?.result
    const target = company?.name || "Company Unspecified"
    
    if (statusRaw === 'VERIFIED') {
      return { 
        status: 'Verified', 
        badgeClass: 'badge-verified', 
        textClass: 'text-emerald-400', 
        detail: compCheck?.evidence || `Official domain (${company?.domain || 'active'}) is valid & reachable.`,
        target 
      }
    }
    if (statusRaw === 'SUSPICIOUS') {
      return { 
        status: 'Suspicious', 
        badgeClass: 'badge-critical', 
        textClass: 'text-risk-critical', 
        detail: compCheck?.evidence || 'Domain unreachable or suspicious registry profile.',
        target 
      }
    }
    return { 
      status: 'Unknown', 
      badgeClass: 'bg-slate-800 text-slate-400 border border-slate-700', 
      textClass: 'text-slate-400', 
      detail: compCheck?.evidence || 'No authoritative corporate domain registered.',
      target 
    }
  }

  // 2. Recruiter Status
  const getRecruiterStatus = (): { status: VerificationStatusType; badgeClass: string; textClass: string; detail: string; target: string } => {
    const statusRaw = recruiter?.verification_status
    const target = recruiter?.name || (recruiter?.email ? recruiter.email.split('@')[0] : "Recruiter Identity")
    
    if (statusRaw === 'VERIFIED') {
      return { 
        status: 'Verified', 
        badgeClass: 'badge-verified', 
        textClass: 'text-emerald-400', 
        detail: 'Recruiter identity matched to known verified corporate representative.',
        target 
      }
    }
    if (statusRaw === 'SUSPICIOUS') {
      return { 
        status: 'Suspicious', 
        badgeClass: 'badge-critical', 
        textClass: 'text-risk-critical', 
        detail: 'Recruiter operates via unverified email channel or alias.',
        target 
      }
    }
    return { 
      status: 'Unknown', 
      badgeClass: 'bg-slate-800 text-slate-400 border border-slate-700', 
      textClass: 'text-slate-400', 
      detail: recruiter?.name ? 'Unauthenticated identity profile.' : 'No recruiter identity declared in submission.',
      target 
    }
  }

  // 3. Email / Domain Status
  const getEmailDomainStatus = (): { status: VerificationStatusType; badgeClass: string; textClass: string; detail: string; target: string } => {
    const emailCheck = checks.find(c => c.check_type === 'RECRUITER_EMAIL_DOMAIN')
    const resultRaw = emailCheck?.result
    const target = recruiter?.email || (company?.domain ? `@${company.domain}` : "No Email Channel")

    if (resultRaw === 'VERIFIED') {
      return { 
        status: 'Verified', 
        badgeClass: 'badge-verified', 
        textClass: 'text-emerald-400', 
        detail: emailCheck?.evidence || 'Email domain matches official company domain.',
        target 
      }
    }
    if (resultRaw === 'SUSPICIOUS') {
      return { 
        status: 'Suspicious', 
        badgeClass: 'badge-critical', 
        textClass: 'text-risk-critical', 
        detail: emailCheck?.evidence || 'Public webmail provider or domain mismatch detected.',
        target 
      }
    }
    if (recruiter?.email && /@(gmail|yahoo|hotmail|outlook)\.com$/i.test(recruiter.email)) {
      return { 
        status: 'Suspicious', 
        badgeClass: 'badge-critical', 
        textClass: 'text-risk-critical', 
        detail: 'Using free public webmail address instead of official corporate domain.',
        target 
      }
    }
    return { 
      status: 'Unknown', 
      badgeClass: 'bg-slate-800 text-slate-400 border border-slate-700', 
      textClass: 'text-slate-400', 
      detail: emailCheck?.evidence || 'No recruiter email address provided for MX cross-check.',
      target 
    }
  }

  // 4. Application URL Status
  const getAppUrlStatus = (): { status: VerificationStatusType; badgeClass: string; textClass: string; detail: string; target: string } => {
    const urlCheck = checks.find(c => c.check_type === 'APPLICATION_URL')
    const resultRaw = urlCheck?.result
    const target = sourceUrl || (company?.domain ? `https://${company.domain}` : "Direct Submission")

    if (resultRaw === 'VERIFIED') {
      return { 
        status: 'Verified', 
        badgeClass: 'badge-verified', 
        textClass: 'text-emerald-400', 
        detail: urlCheck?.evidence || 'Application endpoint verified on official corporate domain.',
        target 
      }
    }
    if (resultRaw === 'SUSPICIOUS' || resultRaw === 'PARTIALLY_VERIFIED') {
      return { 
        status: 'Suspicious', 
        badgeClass: 'badge-critical', 
        textClass: 'text-risk-critical', 
        detail: urlCheck?.evidence || 'Application link redirects to an unverified third-party host.',
        target 
      }
    }
    return { 
      status: 'Unknown', 
      badgeClass: 'bg-slate-800 text-slate-400 border border-slate-700', 
      textClass: 'text-slate-400', 
      detail: sourceUrl ? 'URL provided; verification check unconfirmed.' : 'No external portal URL provided in submission.',
      target 
    }
  }

  const companyStatus = getCompanyStatus()
  const recruiterStatus = getRecruiterStatus()
  const emailDomainStatus = getEmailDomainStatus()
  const appUrlStatus = getAppUrlStatus()

  if (isLoading) {
    return (
      <div className="panel p-6 border-surface-elevated flex items-center gap-3">
        <RefreshCw size={16} className="text-brand-400 animate-spin" />
        <span className="text-slate-400 font-mono text-xs">Querying verification registries & DNS records...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="panel p-6 border-surface-elevated">
        <div className="flex items-center gap-2 text-risk-critical font-mono text-xs">
          <AlertOctagon size={16} />
          <span>Failed to load independent verification checks.</span>
        </div>
      </div>
    )
  }

  const getResultDetails = (result: string) => {
    switch (result) {
      case 'VERIFIED':
        return {
          icon: CheckCircle2,
          badgeClass: 'badge-verified',
          textClass: 'text-emerald-400',
          label: 'VERIFIED'
        }
      case 'PARTIALLY_VERIFIED':
        return {
          icon: Info,
          badgeClass: 'badge-suspicious',
          textClass: 'text-brand-400',
          label: 'PARTIAL'
        }
      case 'SUSPICIOUS':
        return {
          icon: AlertTriangle,
          badgeClass: 'badge-critical',
          textClass: 'text-risk-critical',
          label: 'SUSPICIOUS'
        }
      default:
        return {
          icon: XCircle,
          badgeClass: 'bg-slate-800 text-slate-400 border border-slate-700',
          textClass: 'text-slate-500',
          label: result || 'UNVERIFIED'
        }
    }
  }

  const companyChecks = checks.filter(c => c.entity_type === 'COMPANY')
  const recruiterChecks = checks.filter(c => c.entity_type === 'RECRUITER')
  const jobChecks = checks.filter(c => c.entity_type === 'JOB')
  
  const hasChecks = checks.length > 0
  const lastChecked = hasChecks ? new Date(checks[0].checked_at).toLocaleTimeString() : 'Never'

  return (
    <div className="panel p-6 border-surface-elevated relative bg-surface">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 border-b border-surface-elevated pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={16} className="text-brand-400" />
            <h2 className="tech-label text-slate-300 m-0">INDEPENDENT VERIFICATION MATRIX</h2>
          </div>
          <p className="text-xs font-mono text-slate-500">
            Real-time DNS, MX, domain registry, and identity cross-checks
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="text-[11px] text-slate-500 font-mono bg-surface-raised/40 px-2.5 py-1 rounded-sm border border-surface-elevated">
            AUDITED: {lastChecked}
          </span>
          <button 
            onClick={handleRecheck} 
            disabled={isRechecking}
            className="flex items-center gap-1.5 text-xs font-bold font-mono tracking-wider uppercase bg-surface-elevated hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-sm transition-all border border-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <RefreshCw size={12} className={isRechecking ? 'animate-spin text-cyan-400' : ''} />
            <span>{isRechecking ? 'VERIFYING...' : 'RE-RUN VERIFICATION'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-risk-critical/10 border border-risk-critical/30 rounded text-risk-critical text-xs font-mono flex items-center gap-2">
          <AlertOctagon size={14} />
          <span>[SYSTEM_ERROR]: {error}</span>
        </div>
      )}

      {/* ============================================================
          THE 4-PART VERIFICATION MATRIX
          ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        
        {/* 1. Company */}
        <div className="p-3.5 rounded border border-surface-elevated bg-surface-raised/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Building2 size={13} className="text-slate-400" />
                <span>COMPANY</span>
              </span>
              <span className={`badge ${companyStatus.badgeClass} text-[10px] py-0 px-2`}>
                {companyStatus.status}
              </span>
            </div>
            <div className="font-mono text-xs font-bold text-slate-100 truncate" title={companyStatus.target}>
              {companyStatus.target}
            </div>
          </div>
          <p className="text-[11px] font-mono text-slate-400 mt-2.5 pt-2 border-t border-surface-elevated/60 leading-relaxed">
            {companyStatus.detail}
          </p>
        </div>

        {/* 2. Recruiter */}
        <div className="p-3.5 rounded border border-surface-elevated bg-surface-raised/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <UserCheck size={13} className="text-slate-400" />
                <span>RECRUITER</span>
              </span>
              <span className={`badge ${recruiterStatus.badgeClass} text-[10px] py-0 px-2`}>
                {recruiterStatus.status}
              </span>
            </div>
            <div className="font-mono text-xs font-bold text-slate-100 truncate" title={recruiterStatus.target}>
              {recruiterStatus.target}
            </div>
          </div>
          <p className="text-[11px] font-mono text-slate-400 mt-2.5 pt-2 border-t border-surface-elevated/60 leading-relaxed">
            {recruiterStatus.detail}
          </p>
        </div>

        {/* 3. Email / Domain */}
        <div className="p-3.5 rounded border border-surface-elevated bg-surface-raised/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Mail size={13} className="text-slate-400" />
                <span>EMAIL/DOMAIN</span>
              </span>
              <span className={`badge ${emailDomainStatus.badgeClass} text-[10px] py-0 px-2`}>
                {emailDomainStatus.status}
              </span>
            </div>
            <div className="font-mono text-xs font-bold text-slate-100 truncate" title={emailDomainStatus.target}>
              {emailDomainStatus.target}
            </div>
          </div>
          <p className="text-[11px] font-mono text-slate-400 mt-2.5 pt-2 border-t border-surface-elevated/60 leading-relaxed">
            {emailDomainStatus.detail}
          </p>
        </div>

        {/* 4. Application URL */}
        <div className="p-3.5 rounded border border-surface-elevated bg-surface-raised/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Globe size={13} className="text-slate-400" />
                <span>APPLICATION URL</span>
              </span>
              <span className={`badge ${appUrlStatus.badgeClass} text-[10px] py-0 px-2`}>
                {appUrlStatus.status}
              </span>
            </div>
            <div className="font-mono text-xs font-bold text-slate-100 truncate" title={appUrlStatus.target}>
              {appUrlStatus.target}
            </div>
          </div>
          <p className="text-[11px] font-mono text-slate-400 mt-2.5 pt-2 border-t border-surface-elevated/60 leading-relaxed">
            {appUrlStatus.detail}
          </p>
        </div>

      </div>

      {!hasChecks && !isRechecking && (
        <div className="text-slate-400 font-mono text-xs py-4 text-center bg-surface-raised/20 rounded border border-surface-elevated">
          No external verification checks available for this opportunity.
        </div>
      )}

      <div className="space-y-6">
        {/* Company Domain Checks */}
        {companyChecks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Globe size={13} className="text-slate-400" />
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                Company Domain & DNS Checks
              </h3>
            </div>
            <div className="space-y-2">
              {companyChecks.map((c: Check) => {
                const details = getResultDetails(c.result)
                const StatusIcon = details.icon

                return (
                  <div key={c.id} className="text-xs font-mono flex items-start gap-3.5 p-3.5 bg-surface-raised/30 border border-surface-elevated rounded-sm hover:border-slate-600 transition-colors">
                    <span className={`badge ${details.badgeClass} mt-0.5 flex items-center gap-1 shrink-0`}>
                      <StatusIcon size={11} />
                      <span>{details.label}</span>
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-200 tracking-wide text-xs mb-1">
                        {c.check_type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-slate-400 leading-relaxed break-words">
                        {c.evidence}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recruiter Identity Checks */}
        {recruiterChecks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <UserCheck size={13} className="text-slate-400" />
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                Recruiter Identity & Email Checks
              </h3>
            </div>
            <div className="space-y-2">
              {recruiterChecks.map((c: Check) => {
                const details = getResultDetails(c.result)
                const StatusIcon = details.icon

                return (
                  <div key={c.id} className="text-xs font-mono flex items-start gap-3.5 p-3.5 bg-surface-raised/30 border border-surface-elevated rounded-sm hover:border-slate-600 transition-colors">
                    <span className={`badge ${details.badgeClass} mt-0.5 flex items-center gap-1 shrink-0`}>
                      <StatusIcon size={11} />
                      <span>{details.label}</span>
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-200 tracking-wide text-xs mb-1">
                        {c.check_type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-slate-400 leading-relaxed break-words">
                        {c.evidence}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Job / URL Checks */}
        {jobChecks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ExternalLink size={13} className="text-slate-400" />
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                Application URL & Redirection Checks
              </h3>
            </div>
            <div className="space-y-2">
              {jobChecks.map((c: Check) => {
                const details = getResultDetails(c.result)
                const StatusIcon = details.icon

                return (
                  <div key={c.id} className="text-xs font-mono flex items-start gap-3.5 p-3.5 bg-surface-raised/30 border border-surface-elevated rounded-sm hover:border-slate-600 transition-colors">
                    <span className={`badge ${details.badgeClass} mt-0.5 flex items-center gap-1 shrink-0`}>
                      <StatusIcon size={11} />
                      <span>{details.label}</span>
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-200 tracking-wide text-xs mb-1">
                        {c.check_type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-slate-400 leading-relaxed break-words">
                        {c.evidence}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

