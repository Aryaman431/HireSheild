'use client'

import Link from 'next/link'
import AnimatedBackground from '@/components/AnimatedBackground'
import HeroSection from '@/components/HeroSection'
import SectionReveal from '@/components/SectionReveal'
import RiskCard from '@/components/RiskCard'
import SignalCard from '@/components/SignalCard'
import CrossCheckRow from '@/components/CrossCheckRow'
import FlowSteps from '@/components/FlowSteps'
import TypewriterText from '@/components/TypewriterText'
import { ArrowRight } from 'lucide-react'

const SIGNALS = [
  {
    severity: 'HIGH' as const,
    label: 'Recruiter domain mismatch',
    detail: 'Email "hr@acme-careers-apply.com" does not match company domain',
  },
  {
    severity: 'HIGH' as const,
    label: 'Unrealistic compensation',
    detail: '"$120k-180k for junior role with no experience required"',
  },
  {
    severity: 'MED' as const,
    label: 'Upfront payment request',
    detail: '"Equipment fee of $200 required before onboarding"',
  },
]

const CROSS_CHECKS = [
  {
    label: 'Company Verification',
    status: 'VERIFIED',
    color: 'text-risk-low',
    dotColor: '#10b981',
  },
  {
    label: 'Recruiter Identity',
    status: 'UNVERIFIED',
    color: 'text-risk-suspicious',
    dotColor: '#ffb703',
  },
  {
    label: 'Historical Intelligence',
    status: '4 MATCHES',
    color: 'text-risk-critical',
    dotColor: '#ff2a2a',
  },
]

const FLOW_STEPS = [
  { num: '01', label: 'INPUT', desc: 'Provide job text, screenshot, or PDF document.' },
  { num: '02', label: 'EXTRACT', desc: 'Isolate claims, entities, and suspicious demands.' },
  { num: '03', label: 'VERIFY', desc: 'Check domains and recruiter identities.' },
  { num: '04', label: 'CROSS-CHECK', desc: 'Match against community reports and history.' },
  { num: '05', label: 'ASSESS', desc: 'Produce an evidence-based risk assessment.' },
]

const EVIDENCE_TEXT = '"Congratulations! You have been selected for an exclusive remote position. Please submit a one-time equipment setup fee of $200 via Zelle to proceed with onboarding."'

export default function Home() {
  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-background intel-grid">
      {/* Animated canvas scanline background */}
      <AnimatedBackground />

      {/* ============================================================
          HERO SECTION
          ============================================================ */}
      <HeroSection />

      {/* ============================================================
          DEMO INVESTIGATION PANEL
          ============================================================ */}
      <section
        className="relative z-10 w-full max-w-6xl mx-auto px-6 py-12"
        aria-label="Sample investigation demonstration"
      >
        <SectionReveal className="mb-6 flex flex-col sm:flex-row justify-between sm:items-end gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-risk-critical animate-ping" />
              <h2 className="tech-label text-text-muted m-0">LIVE INVESTIGATION CASE PREVIEW</h2>
            </div>
            <p className="text-xs font-mono text-text-muted">
              Examining simulated fraudulent offer letter & domain cross-check
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest bg-surface-elevated/40 border border-border px-2.5 py-1 rounded-sm">
              SAMPLE THREAT FILE
            </span>
            <Link 
              href="/analyze" 
              className="text-xs font-mono text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
            >
              RUN YOUR OWN SCAN <span aria-hidden="true">→</span>
            </Link>
          </div>
        </SectionReveal>

        <SectionReveal delay={0.08}>
          <div className="panel overflow-visible">
            {/* Panel header with blinking cursor on STATUS */}
            <div className="panel-header">
              <div className="flex items-center gap-3">
                <span
                  className="glitch-hover"
                  data-text="CASE #4F8A2D"
                >
                  CASE #4F8A2D
                </span>
              </div>
              <span className="text-text-muted flex items-center gap-1">
                STATUS: COMPLETE
                <span
                  aria-hidden="true"
                  className="inline-block w-[2px] h-[1em] bg-text-muted align-middle ml-0.5 animate-[blink_1s_step-end_infinite]"
                />
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-surface-elevated">
              {/* LEFT: Target & Signals */}
              <div className="lg:col-span-7 p-5 md:p-6 space-y-6">
                {/* Target info */}
                <SectionReveal delay={0.1}>
                  <span className="tech-label text-text-muted mb-2">TARGET ENTITY</span>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-text tracking-wide uppercase">
                        Junior Software Developer
                      </h3>
                      <span className="text-sm font-mono text-text-muted">Acme Technologies</span>
                    </div>
                    <span className="badge badge-critical shrink-0 glitch-hover" data-text="UNVERIFIED DOMAIN">
                      UNVERIFIED DOMAIN
                    </span>
                  </div>
                </SectionReveal>

                <div className="border-t border-border" />

                {/* Risk signals */}
                <div>
                  <span className="tech-label text-risk-critical mb-3">OBSERVED SIGNALS</span>
                  <div className="space-y-3">
                    {SIGNALS.map((signal, i) => (
                      <SignalCard key={signal.label} signal={signal} index={i} />
                    ))}
                  </div>
                </div>

                {/* Evidence — typewriter effect */}
                <SectionReveal delay={0.2}>
                  <div className="bg-surface border border-border rounded-sm p-4">
                    <span className="tech-label text-text-muted mb-2">EXTRACTED EVIDENCE</span>
                    <p className="text-xs font-mono text-text border-l-2 border-border pl-3 py-1">
                      <TypewriterText text={EVIDENCE_TEXT} speed={22} startDelay={600} />
                    </p>
                  </div>
                </SectionReveal>
              </div>

              {/* RIGHT: Risk Score & Verification */}
              <div className="lg:col-span-5 p-5 md:p-6 flex flex-col gap-6">
                {/* Animated risk card */}
                <RiskCard score={72} level="HIGH RISK" confidence={87} />

                {/* Intelligence cross-check */}
                <div>
                  <span className="tech-label text-text-muted mb-3">INTELLIGENCE CROSS-CHECK</span>
                  <div className="space-y-2">
                    {CROSS_CHECKS.map((item, i) => (
                      <CrossCheckRow key={item.label} item={item} index={i} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* ============================================================
          INVESTIGATION PIPELINE
          ============================================================ */}
      <section
        id="how-it-works"
        className="relative z-10 w-full max-w-6xl mx-auto px-6 py-12 md:py-16 border-t border-border"
      >
        <SectionReveal className="mb-10">
          <span className="tech-label text-text-muted mb-2">INVESTIGATION FLOW</span>
          <h2 className="text-2xl md:text-3xl font-light text-text uppercase tracking-wide my-3">Automated Intelligence Pipeline</h2>
          <p className="text-xs font-mono text-text-muted mt-1">
            Five-stage automated analysis pipeline
          </p>
        </SectionReveal>

        <FlowSteps steps={FLOW_STEPS} />
      </section>

      {/* ============================================================
          FOOTER CTA
          ============================================================ */}
      <SectionReveal className="relative z-10 w-full max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center border-t border-border pt-12">
          <p className="text-text-muted font-mono text-sm mb-6 max-w-lg mx-auto">
            HireShield is an evidence-driven platform. Every risk score is explainable,
            every signal is traceable, and no claim goes unverified.
          </p>
          <Link
            href="/analyze"
            className="group relative overflow-hidden inline-flex items-center gap-2 px-10 py-3 rounded-sm bg-primary text-primary-foreground font-mono text-xs font-bold tracking-widest uppercase transition-all duration-200 hover:scale-[1.02] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
            <span className="relative z-10">ANALYZE A JOB</span>
            <ArrowRight size={13} className="relative z-10 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </SectionReveal>
    </div>
  )
}
