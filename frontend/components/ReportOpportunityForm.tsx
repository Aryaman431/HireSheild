'use client'

import { useState } from 'react'
import { getBrowserApiUrl } from '@/lib/api'

interface Props {
  jobId: string
  companyId?: string
  recruiterId?: string
  accessToken: string
}

export default function ReportOpportunityForm({ jobId, companyId, recruiterId, accessToken }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('SUSPICIOUS_JOB')
  const [description, setDescription] = useState('')
  const [evidence, setEvidence] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')

    const apiUrl = getBrowserApiUrl()
    const payload = {
      job_posting_id: jobId,
      company_id: companyId || null,
      recruiter_id: recruiterId || null,
      reason,
      description,
      evidence: evidence || null
    }

    try {
      const res = await fetch(`${apiUrl}/api/v1/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setStatus('success')
      } else {
        const data = await res.json()
        setErrorMsg(data.detail || 'Failed to submit report')
        setStatus('error')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error')
      setStatus('error')
    }
    setSubmitting(false)
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full mt-6 border border-risk-critical/50 text-risk-critical hover:bg-risk-critical/10 p-3 rounded-sm font-mono text-xs font-bold tracking-widest uppercase transition-colors"
      >
        REPORT THIS OPPORTUNITY
      </button>
    )
  }

  if (status === 'success') {
    return (
      <div className="w-full mt-6 border border-risk-critical/30 bg-risk-critical/5 p-4 rounded font-mono">
        <h3 className="text-risk-critical font-bold mb-2">REPORT SUBMITTED</h3>
        <p className="text-text-muted text-sm">
          Thank you for contributing to community intelligence. 
          Your report is currently PENDING review.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full mt-6 border border-risk-critical/50 bg-surface p-6 rounded-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="tech-label text-risk-critical border-b border-border pb-1 w-full text-left">REPORT OPPORTUNITY</h3>
        <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-text ml-4">✕</button>
      </div>

      <p className="text-xs text-text-muted font-mono mb-4 bg-surface-raised p-2 border-l-2 border-slate-500">
        Reports are reviewed before being included in community intelligence.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 font-mono text-sm">
        <div>
          <label className="block text-text-muted mb-1">Why are you reporting this?</label>
          <select 
            value={reason} 
            onChange={e => setReason(e.target.value)}
            className="w-full bg-surface-elevated border border-surface-raised text-text p-2 rounded-sm"
          >
            <option value="SUSPICIOUS_JOB">Suspicious Job</option>
            <option value="UPFRONT_PAYMENT">Upfront Payment Requested</option>
            <option value="COMPANY_IMPERSONATION">Company Impersonation</option>
            <option value="PHISHING">Phishing Link</option>
            <option value="PERSONAL_INFORMATION_SCAM">Personal Information Scam</option>
            <option value="FAKE_JOB_POSTING">Fake Job Posting</option>
            <option value="MISLEADING_RECRUITMENT">Misleading Recruitment</option>
            <option value="SUSPICIOUS_RECRUITER">Suspicious Recruiter</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-text-muted mb-1">What happened?</label>
          <textarea 
            required
            minLength={10}
            maxLength={2000}
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-surface border border-border text-text p-2 rounded-sm h-24"
            placeholder="Describe your experience..."
          />
        </div>

        <div>
          <label className="block text-text-muted mb-1">Evidence (Optional)</label>
          <textarea 
            value={evidence}
            onChange={e => setEvidence(e.target.value)}
            className="w-full bg-surface border border-border text-text p-2 rounded-sm h-20"
            placeholder="Paste text evidence (emails, URLs, messages)"
          />
        </div>

        {status === 'error' && (
          <div className="text-risk-critical text-xs p-2 bg-risk-critical/10 border-l-2 border-risk-critical">
            {errorMsg}
          </div>
        )}

        <div className="flex gap-4 pt-2">
          <button 
            type="submit" 
            disabled={submitting}
            className="btn-primary w-full bg-risk-critical hover:bg-risk-critical/80 text-white"
          >
            {submitting ? 'SUBMITTING...' : 'SUBMIT REPORT'}
          </button>
        </div>
      </form>
    </div>
  )
}
