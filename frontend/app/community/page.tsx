import { getAuth } from '@/lib/auth-server'
import Link from 'next/link'
import { getServerApiUrl } from '@/lib/api'
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Community Reports | HireShield",
  description: "Shared threat intelligence and community fraud reports.",
}

async function getCommunityFeed(page = 1) {
  const { getToken } = await getAuth()
  const token = await getToken()

  const apiUrl = getServerApiUrl()
  try {
    const response = await fetch(`${apiUrl}/api/v1/community?page=${page}`, {
      cache: 'no-store',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    })

    if (!response.ok) {
      return null
    }
    return response.json()
  } catch {
    return null
  }
}

import { ShieldAlert } from 'lucide-react'

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { userId } = await getAuth()
  const page = Number((await searchParams).page) || 1
  const feed = await getCommunityFeed(page)
  
  if (!feed) {
    return (
      <div className="app-page">
        <div className="page-wrap max-w-2xl py-16">
          <div className="panel p-8 border-border text-center space-y-4">
            <div className="inline-flex p-3 rounded-full bg-surface-elevated text-text-muted border border-surface-raised mb-2">
              <ShieldAlert size={24} className="text-amber-400" />
            </div>
            <h1 className="text-xl font-light uppercase tracking-wider text-text">
              COMMUNITY INTELLIGENCE FEED UNAVAILABLE
            </h1>
            <p className="font-mono text-xs text-text-muted leading-relaxed max-w-md mx-auto">
              Unable to synchronize with the community threat database. Please verify the backend connection or return to active analysis.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link href="/analyze" className="btn-primary text-xs">← INITIATE AUDIT</Link>
              <Link href="/dashboard" className="btn-ghost text-xs border border-border">DASHBOARD</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-page">
      <div className="page-wrap max-w-5xl">
        <header className="page-heading">
          <div>
            <p className="eyebrow">SHARED INTELLIGENCE</p>
            <h1 className="text-3xl font-light tracking-wide text-white uppercase sm:text-4xl">Community Reports</h1>
            <p className="mt-2 text-sm text-text-muted font-mono">Shared threat intelligence, with contributor identities protected.</p>
          </div>
          {!userId && (
            <Link href="/sign-in" className="btn-primary text-xs">
              AUTHENTICATE TO REPORT
            </Link>
          )}
        </header>

        <div className="panel p-0 border-border">
          <h2 className="mb-0 flex items-center justify-between border-b border-border p-5 text-xs font-mono uppercase tracking-widest text-text sm:p-6">
            <span>ACTIVE THREAT REPORTS</span>
            <span className="rounded-sm bg-surface-elevated px-2.5 py-1 text-[10px] text-text">{feed.total} TOTAL</span>
          </h2>
          
          {feed.reports.length === 0 ? (
            <p className="text-text-muted font-mono text-sm p-6">No community reports found.</p>
          ) : (
            <div className="flex flex-col">
              {feed.reports.map((report: any, idx: number) => (
                <Link
                  href={`/community/reports/${report.id}`}
                  key={report.id}
                  className={`group flex flex-col items-start justify-between gap-4 p-5 transition hover:bg-surface-raised/50 sm:p-6 md:flex-row md:items-center ${idx !== feed.reports.length - 1 ? 'border-b border-border/50' : ''}`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-text-muted bg-surface-elevated px-2 py-0.5 rounded-sm border border-surface-raised">
                        CASE #{report.id.substring(0, 8).toUpperCase()}
                      </span>
                      <span className="text-xs font-mono text-text-muted uppercase tracking-widest">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="font-mono text-sm font-bold uppercase tracking-wide text-text transition group-hover:text-text">
                      {report.category.replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm font-mono text-text-muted">
                      <span className="text-text-muted uppercase tracking-widest text-xs mr-2">Target Entity:</span>
                      <span className="text-text">{report.company_name || 'Unknown Entity'}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-start md:items-end gap-2 min-w-[150px]">
                    <div className="text-xs font-mono text-text-muted uppercase tracking-widest">STATUS</div>
                    <div className="badge badge-verified">APPROVED</div>
                    
                    <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-text-muted font-bold tracking-widest uppercase">
                      <span>[{report.confirmations_count}] CONFIRMATIONS</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
