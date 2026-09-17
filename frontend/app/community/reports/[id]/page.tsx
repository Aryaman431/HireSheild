'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getBrowserApiUrl } from '@/lib/api'
import { Loader2, ShieldAlert } from 'lucide-react'

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const { getToken, isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    async function load() {
      if (!isLoaded) return
      
      const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
      const isRealClerk = pubKey.startsWith('pk_test_') && !pubKey.includes('example') && !pubKey.includes('your_')
      if (isRealClerk && !isSignedIn) {
        router.push('/sign-in')
        return
      }

      let token: string | null = null
      try {
        token = await getToken()
      } catch {
        token = null
      }
      if (!token) {
        token = "demo_token"
      }
      const apiUrl = getBrowserApiUrl()
      const response = await fetch(`${apiUrl}/api/v1/community/reports/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setReport(data)
      }
      setLoading(false)
    }
    load()
  }, [params.id, router, isLoaded, isSignedIn, getToken])

  const handleConfirm = async (responseType: 'HAPPENED_TO_ME' | 'DID_NOT_HAPPEN_TO_ME') => {
    setConfirming(true)
    let token: string | null = null
    try {
      token = await getToken()
    } catch {
      token = null
    }
    if (!token) {
      token = "demo_token"
    }
    const apiUrl = getBrowserApiUrl()
    const res = await fetch(`${apiUrl}/api/v1/community/reports/${params.id}/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ response: responseType })
    })

    if (res.ok) {
      // Refresh
      const detailRes = await fetch(`${apiUrl}/api/v1/community/reports/${params.id}`, {
        headers: { 
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      if (detailRes.ok) {
        setReport(await detailRes.json())
      }
    }
    setConfirming(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 font-mono text-sm text-slate-400">
          <Loader2 size={20} className="animate-spin text-brand-400" />
          <span>Synchronizing community threat intelligence...</span>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background text-slate-200 p-8 flex items-center justify-center">
        <div className="panel max-w-lg w-full p-8 border-surface-elevated text-center space-y-4">
          <div className="inline-flex p-3 rounded-full bg-risk-critical/10 text-risk-critical border border-risk-critical/30 mb-2">
            <ShieldAlert size={24} />
          </div>
          <h1 className="text-xl font-light uppercase tracking-wider text-slate-100">
            COMMUNITY REPORT NOT FOUND
          </h1>
          <p className="font-mono text-xs text-slate-400 leading-relaxed">
            The requested community report record could not be found or has been removed from the registry.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link href="/community" className="btn-primary text-xs">← BACK TO FEED</Link>
            <Link href="/dashboard" className="btn-ghost text-xs border border-surface-elevated">DASHBOARD</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-slate-200 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-surface-elevated pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-light tracking-wide uppercase text-slate-100">REPORT INTELLIGENCE</h1>
            <p className="text-slate-400 font-mono text-xs mt-2">ID: {report.id}</p>
          </div>
          <Link href="/community" className="btn-ghost text-sm">← COMMUNITY</Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 panel p-6 border-surface-elevated space-y-6">
            <div>
              <h2 className="tech-label text-slate-500 mb-2 border-b border-surface-elevated pb-1">REPORT CATEGORY</h2>
              <div className="font-bold text-risk-moderate text-xl tracking-wide">{report.reason.replace(/_/g, ' ')}</div>
            </div>

            <div>
              <h2 className="tech-label text-slate-500 mb-2 border-b border-surface-elevated pb-1">DESCRIPTION</h2>
              <p className="font-mono text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{report.description}</p>
            </div>

            {report.evidence && (
              <div>
                <h2 className="tech-label text-slate-500 mb-2 border-b border-surface-elevated pb-1">PROVIDED EVIDENCE</h2>
                <div className="bg-surface-raised border-l-2 border-slate-500 p-3 text-sm text-slate-300 font-mono whitespace-pre-wrap">
                  {report.evidence}
                </div>
              </div>
            )}
            
            <div className="text-xs text-slate-500 font-mono pt-4 border-t border-surface-elevated">
              Submitted on {new Date(report.created_at).toLocaleDateString()}
            </div>
          </div>

          <div className="md:col-span-1 space-y-6">
            <div className="panel p-6 border-surface-elevated text-center">
              <h2 className="tech-label text-slate-400 mb-4">COMMUNITY CONFIRMATIONS</h2>
              <div className="flex justify-around items-center mb-6">
                <div>
                  <span className="block text-2xl font-light text-slate-300">{report.confirmations.happened_to_me}</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">Confirmed</span>
                </div>
                <div>
                  <span className="block text-2xl font-light text-slate-500">{report.confirmations.did_not_happen_to_me}</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">Disputed</span>
                </div>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-surface-elevated">
                <p className="text-xs text-slate-400 font-mono mb-2">Have you experienced something similar?</p>
                <button 
                  onClick={() => handleConfirm('HAPPENED_TO_ME')}
                  disabled={confirming}
                  className="w-full btn-primary text-xs"
                >
                  HAPPENED TO ME
                </button>
                <button 
                  onClick={() => handleConfirm('DID_NOT_HAPPEN_TO_ME')}
                  disabled={confirming}
                  className="w-full btn-ghost border border-surface-elevated text-xs text-slate-400"
                >
                  DID NOT HAPPEN TO ME
                </button>
              </div>
            </div>

            <div className="panel p-6 border-surface-elevated">
              <h2 className="tech-label text-slate-500 border-b border-surface-elevated pb-2 mb-4">ASSOCIATED ENTITIES</h2>
              <ul className="space-y-3 font-mono text-xs">
                {report.company_id && (
                  <li>
                    <span className="text-slate-500 block mb-1">Company</span>
                    <Link href={`/companies/${report.company_id}`} className="text-slate-400 hover:underline break-all">
                      {report.company_id}
                    </Link>
                  </li>
                )}
                {report.recruiter_id && (
                  <li>
                    <span className="text-slate-500 block mb-1">Recruiter</span>
                    <Link href={`/recruiters/${report.recruiter_id}`} className="text-slate-400 hover:underline break-all">
                      {report.recruiter_id}
                    </Link>
                  </li>
                )}
                {report.job_posting_id && (
                  <li>
                    <span className="text-slate-500 block mb-1">Opportunity</span>
                    <Link href={`/analyze/result/${report.job_posting_id}`} className="text-slate-400 hover:underline break-all">
                      {report.job_posting_id}
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
