import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'


async function getCommunityFeed(token: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const response = await fetch(`${apiUrl}/api/v1/community`, {
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

export default async function CommunityPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  const feed = await getCommunityFeed(session.access_token)
  
  if (!feed) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-8 flex items-center justify-center">
        <p className="font-mono text-slate-500">Failed to load community intelligence.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-surface-elevated pb-6">
          <h1 className="text-3xl font-light tracking-wide uppercase text-brand-100">COMMUNITY INTELLIGENCE</h1>
          <p className="text-slate-400 font-mono text-xs mt-2">Shared threat intelligence. Identity protected.</p>
        </header>

        <div className="panel p-0 border-brand-500/30">
          <h2 className="tech-label text-brand-500 border-b border-surface-elevated p-6 mb-0 flex justify-between items-center">
            <span>ACTIVE THREAT REPORTS</span>
            <span className="text-slate-500 font-mono text-xs">TOTAL: {feed.total}</span>
          </h2>
          
          {feed.reports.length === 0 ? (
            <p className="text-slate-500 font-mono text-sm p-6">No community reports found.</p>
          ) : (
            <div className="flex flex-col">
              {feed.reports.map((report: unknown, idx: number) => (
                <div 
                  key={report.id}
                  className={`p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${idx !== feed.reports.length - 1 ? 'border-b border-surface-elevated/50' : ''} hover:bg-surface-raised/50 transition-colors`}
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
                    <div className="font-mono text-sm font-bold text-slate-200 tracking-wide uppercase">
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
                    
                    <div className="mt-2 text-xs font-mono text-slate-400 flex items-center gap-2">
                      <span className="text-brand-500">[{report.confirmations_count}]</span>
                      <span>CONFIRMATIONS</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
