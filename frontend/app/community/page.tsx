import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { getServerApiUrl } from '@/lib/api'

async function getCommunityFeed(page = 1) {
  const { getToken } = await auth()
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

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { userId } = await auth()
  const page = Number((await searchParams).page) || 1
  const feed = await getCommunityFeed(page)
  
  if (!feed) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-8 flex items-center justify-center">
        <p className="font-mono text-slate-500">Failed to load community intelligence.</p>
      </div>
    )
  }

  return (
    <div className="app-page">
      <div className="page-wrap max-w-5xl">
        <header className="page-heading">
          <div>
            <p className="eyebrow">Shared intelligence</p>
            <h1 className="text-3xl font-light tracking-wide text-white sm:text-4xl">Community reports</h1>
            <p className="mt-2 text-sm text-slate-400">Shared threat intelligence, with contributor identities protected.</p>
          </div>
          {!userId && (
            <Link href="/sign-in" className="btn-primary text-xs">
              AUTHENTICATE TO REPORT
            </Link>
          )}
        </header>

        <div className="panel p-0 border-brand-500/25">
          <h2 className="mb-0 flex items-center justify-between border-b border-surface-elevated p-5 text-xs font-mono uppercase tracking-widest text-brand-400 sm:p-6">
            <span>Active threat reports</span>
            <span className="rounded-full bg-brand-500/10 px-2.5 py-1 text-[10px] text-brand-300">{feed.total} total</span>
          </h2>
          
          {feed.reports.length === 0 ? (
            <p className="text-slate-500 font-mono text-sm p-6">No community reports found.</p>
          ) : (
            <div className="flex flex-col">
              {feed.reports.map((report: any, idx: number) => (
                <Link
                  href={`/community/reports/${report.id}`}
                  key={report.id}
                  className={`group flex flex-col items-start justify-between gap-4 p-5 transition hover:bg-surface-raised/50 sm:p-6 md:flex-row md:items-center ${idx !== feed.reports.length - 1 ? 'border-b border-surface-elevated/50' : ''}`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                        CASE #{report.id.substring(0, 8).toUpperCase()}
                      </span>
                      <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="font-mono text-sm font-bold uppercase tracking-wide text-slate-200 transition group-hover:text-brand-300">
                      {report.category.replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm font-mono text-slate-400">
                      <span className="text-slate-600 uppercase tracking-widest text-xs mr-2">Target Entity:</span>
                      <span className="text-brand-300">{report.company_name || 'Unknown Entity'}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-start md:items-end gap-2 min-w-[150px]">
                    <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">STATUS</div>
                    <div className="badge badge-verified">APPROVED</div>
                    
                    <div className="mt-2 flex items-center gap-2 text-xs font-mono text-slate-400">
                      <span className="text-brand-500">[{report.confirmations_count}]</span>
                      <span>CONFIRMATIONS</span>
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
