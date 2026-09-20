import { getCurrentUser } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { SignOutButton } from '@/lib/auth'
import Link from 'next/link'
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Intelligence Console | HireShield",
  description: "Manage investigations and review extracted claims.",
}

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  return (
    <div className="app-page">
      <div className="page-wrap">
        <header className="page-heading">
          <div>
            <p className="eyebrow">ACTIVE SESSION</p>
            <h1 className="text-3xl font-light tracking-wide text-white uppercase sm:text-4xl">Intelligence Console</h1>
            <p className="mt-2 max-w-xl font-mono text-sm text-text-muted">Manage investigations, review extracted claims, and access community risk data.</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="hidden text-xs font-mono text-text-muted sm:block">USER: {user.primaryEmailAddress?.emailAddress}</span>
            <SignOutButton>
              <button className="text-[10px] font-mono tracking-widest text-text-muted hover:text-text uppercase transition-colors">
                [ TERMINATE SESSION ]
              </button>
            </SignOutButton>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
          <div className="panel p-7 sm:p-9 border-border">
            <p className="eyebrow">NEW INVESTIGATION</p>
            <h2 className="max-w-lg text-2xl font-light leading-tight text-white uppercase sm:text-3xl mb-4">Validate an opportunity.</h2>
            <p className="max-w-xl font-mono text-sm leading-relaxed text-text-muted mb-8">
              Submit a job posting, recruiter email, or offer document. The system will extract claims, perform identity checks against the recruiter and company, and surface critical risk patterns.
            </p>
            <Link href="/analyze" className="btn-primary inline-flex items-center gap-2">
              INITIATE ANALYSIS <span aria-hidden="true" className="text-text-muted">→</span>
            </Link>
          </div>
          <div className="panel p-6 border-border flex flex-col gap-6">
            <div>
              <p className="tech-label text-text-muted mb-4">SYSTEM STATUS</p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between font-mono text-xs p-3 bg-surface border border-border rounded-sm">
                  <span className="text-text-muted">ACCOUNT ACCESS</span>
                  <span className="text-text">[ SECURE ]</span>
                </div>
                <div className="flex items-center justify-between font-mono text-xs p-3 bg-surface border border-border rounded-sm">
                  <span className="text-text-muted">COMMUNITY DB</span>
                  <span className="text-text">[ ONLINE ]</span>
                </div>
              </div>
            </div>
            
            <div>
              <p className="tech-label text-text-muted mb-4">INVESTIGATION HISTORY</p>
              <div className="p-4 bg-surface-raised/30 border border-border rounded-sm text-center">
                <p className="font-mono text-xs leading-5 text-text-muted">No active cases.</p>
                <p className="font-mono text-[10px] leading-5 text-text-muted mt-1">Run an analysis to generate a case ID.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5">
          <p className="tech-label text-text-muted mb-4">ANALYSIS PROTOCOL</p>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['01', 'COLLECT', 'Submit raw text, PDFs, or images.'],
              ['02', 'VERIFY', 'Cross-reference entities with authoritative data.'],
              ['03', 'ASSESS', 'Review algorithmic risk score and critical signals.'],
            ].map(([step, title, description]) => (
              <div key={step} className="p-5 border border-border bg-surface rounded-sm">
                <span className="font-mono text-xs text-text-muted">[{step}]</span>
                <h3 className="mt-3 font-mono text-sm font-bold tracking-wide text-text">{title}</h3>
                <p className="mt-2 font-mono text-xs leading-relaxed text-text-muted">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
