import Link from 'next/link'
import { signup } from './actions'

export default function SignupPage({
  searchParams,
}: {
  searchParams: { message?: string }
}) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md panel">
        <div className="panel-header justify-center border-brand-500/30">
          <span className="text-brand-500 font-bold">INITIALIZE ACCESS</span>
        </div>
        
        <div className="panel-body flex flex-col gap-6 p-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-light tracking-wide text-slate-100 uppercase">HireShield</h1>
            <p className="text-xs font-mono text-slate-400">Recruitment intelligence and protection platform</p>
          </div>

          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="tech-label" htmlFor="email">Email Identifier</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="bg-slate-900 border border-surface-elevated rounded p-2 text-sm font-mono text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="agent@example.com"
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="tech-label" htmlFor="password">Create Credential</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="bg-slate-900 border border-surface-elevated rounded p-2 text-sm font-mono text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {searchParams?.message && (
              <div className="p-3 bg-risk-critical/10 border border-risk-critical/30 rounded text-risk-critical text-sm font-mono mt-2">
                [SYSTEM_NOTICE]: {searchParams.message}
              </div>
            )}

            <button formAction={signup} className="btn-primary mt-4 w-full">
              Register Identity
            </button>
          </form>

          <div className="text-center mt-4 border-t border-surface-elevated pt-6">
            <p className="text-sm text-slate-400">
              Already possess clearance?{' '}
              <Link href="/login" className="text-brand-500 hover:text-brand-400 font-mono tracking-wider transition-colors">
                AUTHENTICATE
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
