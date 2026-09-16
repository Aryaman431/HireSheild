import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { SignOutButton } from '@clerk/nextjs'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/')
  }

  return (
    <div className="app-page">
      <div className="page-wrap">
        <header className="page-heading">
          <div>
            <p className="eyebrow">Private workspace</p>
            <h1 className="text-3xl font-light tracking-wide text-white sm:text-4xl">Your command center</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-400">Start a new investigation or review the intelligence shared by the community.</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs font-mono text-slate-500 sm:block">{user.primaryEmailAddress?.emailAddress}</span>
            <SignOutButton>
              <button className="btn-ghost text-xs border border-risk-critical/30 text-risk-critical hover:bg-risk-critical/10">
                TERMINATE SESSION
              </button>
            </SignOutButton>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
          <div className="panel overflow-hidden p-7 sm:p-9">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-brand-400/10" />
            <p className="eyebrow">Ready when you are</p>
            <h2 className="max-w-lg text-2xl font-light leading-tight text-white sm:text-3xl">Turn a questionable opportunity into clear next steps.</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">Paste a job post, email, or message. HireShield extracts claims, checks identities, and presents the evidence behind every risk signal.</p>
            <Link href="/analyze" className="btn-primary mt-7 inline-flex items-center gap-2">Start an investigation <span aria-hidden="true">→</span></Link>
          </div>
          <div className="panel p-6">
            <p className="tech-label text-slate-500">Workspace status</p>
            <div className="mt-5 space-y-3">
              <div className="data-card flex items-center justify-between"><span className="text-sm text-slate-300">Account protection</span><span className="badge badge-verified">Active</span></div>
              <div className="data-card"><p className="text-sm text-slate-300">Investigation history</p><p className="mt-1 text-xs leading-5 text-slate-500">Results and entity dossiers appear here as you analyze opportunities.</p></div>
            </div>
          </div>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          {[
            ['01', 'Collect', 'Paste a job post, recruiter message, or document.'],
            ['02', 'Verify', 'Compare the company, recruiter, and claims with evidence.'],
            ['03', 'Decide', 'Use a transparent risk assessment to respond safely.'],
          ].map(([step, title, description]) => <div key={step} className="data-card"><span className="font-mono text-xs text-brand-400">{step}</span><h3 className="mt-4 text-base font-semibold text-slate-200">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></div>)}
        </section>
      </div>
    </div>
  )
}
