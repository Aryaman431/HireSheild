import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { SignOutButton } from '@clerk/nextjs'

export default async function DashboardPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex justify-between items-center border-b border-surface-elevated pb-6">
          <h1 className="text-2xl font-light tracking-wide uppercase">Command Center</h1>
          <div className="flex items-center gap-4">
            <span className="tech-label m-0 text-brand-500">{user.primaryEmailAddress?.emailAddress}</span>
            <SignOutButton>
              <button className="btn-ghost text-xs border border-risk-critical/30 text-risk-critical hover:bg-risk-critical/10">
                TERMINATE SESSION
              </button>
            </SignOutButton>
          </div>
        </header>

        <div className="panel p-8 text-center text-slate-400">
          <p className="font-mono">[SECURE AREA] Authentication verified. Proceed to next phase for full dashboard implementation.</p>
        </div>
      </div>
    </div>
  )
}
