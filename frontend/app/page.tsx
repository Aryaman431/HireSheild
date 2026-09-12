import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background aesthetics */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-20 pointer-events-none">
        <div className="w-[800px] h-[800px] border-[1px] border-surface-elevated rounded-full absolute" />
        <div className="w-[600px] h-[600px] border-[1px] border-surface-elevated rounded-full absolute" />
        <div className="w-[400px] h-[400px] border-[1px] border-brand-500/30 rounded-full absolute" />
        <div className="w-px h-full bg-surface-elevated absolute left-1/2 -translate-x-1/2" />
        <div className="h-px w-full bg-surface-elevated absolute top-1/2 -translate-y-1/2" />
      </div>

      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        
        <div className="mb-4">
          <span className="tech-label text-brand-500">HIRE SHIELD</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-light mb-6 tracking-wide text-slate-100">
          RECRUITMENT SECURITY INTELLIGENCE
        </h1>
        
        <p className="max-w-2xl text-slate-400 mb-10 text-lg">
          Analyze suspicious jobs, recruiters, and hiring opportunities before you trust them. 
          Our evidence-driven risk engine extracts claims, verifies domains, and compares patterns against historical threat intelligence.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link href="/analyze" className="btn-primary px-8 py-3 text-base">
            ANALYZE A JOB
          </Link>
          {!session && (
            <Link href="/login" className="btn-ghost border border-surface-elevated px-8 py-3 text-base">
              SYSTEM LOGIN
            </Link>
          )}
        </div>

        {/* Pipeline Visualization */}
        <div className="w-full max-w-4xl border border-surface-elevated bg-surface-raised/50 rounded-lg p-8 backdrop-blur-sm">
          <h2 className="tech-label text-center mb-10 border-b border-surface-elevated pb-4">INVESTIGATION PIPELINE</h2>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 font-mono text-xs text-slate-400">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded bg-surface border border-surface-elevated flex items-center justify-center text-brand-400">
                01
              </div>
              <span className="uppercase tracking-widest">Opportunity</span>
            </div>
            
            <div className="hidden md:block flex-1 h-px bg-surface-elevated mx-4 relative">
              <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-brand-500/50" />
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded bg-surface border border-surface-elevated flex items-center justify-center text-brand-400">
                02
              </div>
              <span className="uppercase tracking-widest">Extraction</span>
            </div>

            <div className="hidden md:block flex-1 h-px bg-surface-elevated mx-4 relative">
              <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-brand-500/50" />
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded bg-surface border border-brand-500/50 flex items-center justify-center text-brand-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                03
              </div>
              <span className="uppercase tracking-widest text-brand-300">Verification</span>
            </div>

            <div className="hidden md:block flex-1 h-px bg-surface-elevated mx-4 relative">
              <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-brand-500/50" />
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded bg-surface border border-surface-elevated flex items-center justify-center text-brand-400">
                04
              </div>
              <span className="uppercase tracking-widest">Intelligence</span>
            </div>

            <div className="hidden md:block flex-1 h-px bg-surface-elevated mx-4 relative">
              <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-risk-critical/50" />
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded bg-risk-critical/10 border border-risk-critical/30 flex items-center justify-center text-risk-critical">
                05
              </div>
              <span className="uppercase tracking-widest text-risk-critical">Risk Score</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
