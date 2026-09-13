import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden intel-grid">
      {/* Radial overlay for depth */}
      <div className="absolute inset-0 intel-radial pointer-events-none" />

      {/* Geometric background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Concentric investigation rings */}
        <div className="absolute top-[10%] right-[5%] w-[300px] h-[300px] opacity-[0.04]">
          <div className="w-full h-full border border-brand-500 rounded-full" />
          <div className="absolute inset-[25%] border border-brand-500 rounded-full" />
          <div className="absolute inset-[50%] border border-brand-500 rounded-full" />
          {/* Crosshairs */}
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-brand-500" />
          <div className="absolute left-0 right-0 top-1/2 h-px bg-brand-500" />
        </div>

        {/* Small node cluster bottom-left */}
        <div className="absolute bottom-[15%] left-[8%] opacity-[0.06]">
          <div className="w-2 h-2 rounded-full bg-brand-500 absolute top-0 left-0" />
          <div className="w-2 h-2 rounded-full bg-brand-500 absolute top-8 left-12" />
          <div className="w-2 h-2 rounded-full bg-brand-500 absolute top-16 left-4" />
          <div className="absolute top-[4px] left-[4px] w-[48px] h-[32px] border-t border-l border-brand-500 opacity-50" />
          <div className="absolute top-[36px] left-[16px] w-[48px] h-[32px] border-b border-r border-brand-500 opacity-50" />
        </div>
      </div>

      {/* ============================================
          HERO SECTION
          ============================================ */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-16 pb-10 md:pt-24 md:pb-14">
        <div className="flex flex-col items-start max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 rounded-full bg-brand-500 signal-dot" />
            <span className="tech-label text-brand-500 mb-0">RECRUITMENT THREAT DETECTION</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-[3.4rem] font-light tracking-wide text-white leading-[1.15] mb-5">
            INVESTIGATE BEFORE<br />
            <span className="text-brand-400">YOU TRUST</span>
          </h1>

          <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
            Paste a suspicious job posting. HireShield extracts claims, verifies company domains
            and recruiter identities, cross-references historical threat intelligence, and
            calculates an evidence-based risk score.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Link
              href="/analyze"
              className="btn-primary px-8 py-3 text-base flex items-center gap-2"
              id="hero-cta-analyze"
            >
              <span>START INVESTIGATION</span>
              <span className="text-brand-200">→</span>
            </Link>
            {!userId && (
              <Link
                href="/sign-in"
                className="btn-ghost border border-surface-elevated px-8 py-3 text-base"
                id="hero-cta-login"
              >
                SYSTEM LOGIN
              </Link>
            )}
          </div>
        </div>

        {/* Capability tags — below hero text, above investigation panel */}
        <div className="flex flex-wrap gap-3 mt-10" aria-label="Platform capabilities">
          {[
            "EVIDENCE-DRIVEN",
            "DOMAIN VERIFICATION",
            "HISTORICAL INTELLIGENCE",
            "EXPLAINABLE RISK",
            "RECRUITER IDENTITY CHECK",
          ].map((label) => (
            <span
              key={label}
              className="text-[10px] font-mono uppercase tracking-widest text-slate-500 border border-surface-elevated px-3 py-1.5 bg-surface/50"
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* ============================================
          SAMPLE INVESTIGATION PANEL
          ============================================ */}
      <section
        className="relative z-10 w-full max-w-6xl mx-auto px-6 pb-12"
        aria-label="Sample investigation demonstration"
      >
        <div className="panel panel-chrome overflow-visible">
          {/* Panel header bar */}
          <div className="px-5 py-3 border-b border-surface-elevated bg-surface-raised/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5" aria-hidden="true">
                <div className="w-2.5 h-2.5 rounded-full bg-risk-critical/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-risk-suspicious/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-risk-low/60" />
              </div>
              <span className="tech-label text-brand-400 mb-0">LIVE INVESTIGATION — SAMPLE</span>
            </div>
            <span className="text-[10px] font-mono text-slate-600 hidden sm:inline">
              CASE #4F8A2D · DEMO DATA
            </span>
          </div>

          {/* Scan line animation */}
          <div className="scan-line" aria-hidden="true" />

          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-surface-elevated">
            {/* LEFT: Target & Signals */}
            <div className="lg:col-span-7 p-5 md:p-6 space-y-5">
              {/* Target info */}
              <div>
                <span className="tech-label text-slate-500 mb-2">TARGET OPPORTUNITY</span>
                <h3 className="text-lg font-semibold text-slate-100 tracking-wide">
                  Junior Software Developer
                </h3>
                <span className="text-sm font-mono text-slate-400">
                  Acme Technologies · <span className="text-brand-400">acme-tech.careers.io</span>
                </span>
              </div>

              {/* Separator */}
              <div className="border-t border-surface-elevated" />

              {/* Risk signals */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="tech-label text-risk-critical mb-0">3 RISK SIGNALS DETECTED</span>
                  <span className="text-[10px] font-mono text-slate-600 uppercase">EXTRACTION COMPLETE</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    {
                      severity: "HIGH",
                      label: "Recruiter domain mismatch",
                      detail: 'Email "hr@acme-careers-apply.com" does not match company domain',
                      badgeClass: "badge-critical",
                    },
                    {
                      severity: "HIGH",
                      label: "Unrealistic compensation",
                      detail: '"$120k-180k for junior role with no experience required"',
                      badgeClass: "badge-critical",
                    },
                    {
                      severity: "MED",
                      label: "Upfront payment request",
                      detail: '"Equipment fee of $200 required before onboarding"',
                      badgeClass: "badge-suspicious",
                    },
                  ].map((signal) => (
                    <div
                      key={signal.label}
                      className="flex items-start gap-3 p-3 bg-slate-950/50 border border-surface-elevated rounded"
                    >
                      <span className={`badge ${signal.badgeClass} shrink-0 mt-0.5`}>
                        {signal.severity}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
                          {signal.label}
                        </div>
                        <div className="text-xs font-mono text-slate-500 mt-0.5 truncate">
                          {signal.detail}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence excerpt */}
              <div className="bg-slate-950/60 border border-surface-elevated rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    EXTRACTED EVIDENCE
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-400 italic leading-relaxed">
                  &ldquo;Congratulations! You have been selected for an exclusive remote position.
                  Please submit a one-time equipment setup fee of $200 via Zelle to
                  proceed with onboarding.&rdquo;
                </p>
              </div>
            </div>

            {/* RIGHT: Risk Score & Verification */}
            <div className="lg:col-span-5 p-5 md:p-6 flex flex-col justify-between space-y-5">
              {/* Risk gauge */}
              <div className="flex flex-col items-center text-center">
                <span className="tech-label text-slate-500 mb-3">RISK ASSESSMENT</span>
                <div className="relative w-28 h-28 mb-3">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full -rotate-90"
                    aria-label="Risk score: 72 out of 100"
                  >
                    {/* Background ring */}
                    <circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke="currentColor"
                      className="text-surface-elevated"
                      strokeWidth="4"
                    />
                    {/* Score ring */}
                    <circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke="currentColor"
                      className="text-risk-critical risk-gauge-ring"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * 72) / 100}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-light text-risk-critical leading-none">72</span>
                    <span className="text-[10px] font-mono text-slate-600 mt-0.5">/ 100</span>
                  </div>
                </div>
                <span className="text-sm font-bold font-mono tracking-widest text-risk-critical uppercase">
                  HIGH RISK
                </span>
                <span className="text-[10px] font-mono text-slate-600 mt-1 uppercase tracking-widest">
                  CONFIDENCE: 87%
                </span>
              </div>

              {/* Verification matrix */}
              <div>
                <span className="tech-label text-slate-500 mb-3">VERIFICATION STATUS</span>
                <div className="space-y-2">
                  {[
                    {
                      label: "Company domain",
                      status: "VERIFIED",
                      statusClass: "text-risk-low",
                      icon: "✓",
                    },
                    {
                      label: "Recruiter identity",
                      status: "UNVERIFIED",
                      statusClass: "text-risk-suspicious",
                      icon: "⚠",
                    },
                    {
                      label: "Historical reports",
                      status: "4 MATCHES",
                      statusClass: "text-risk-critical",
                      icon: "!",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between py-2 px-3 bg-slate-950/40 border border-surface-elevated rounded text-xs font-mono"
                    >
                      <span className="text-slate-400 uppercase tracking-wider">
                        {item.label}
                      </span>
                      <span className={`${item.statusClass} font-bold flex items-center gap-1.5`}>
                        <span aria-hidden="true">{item.icon}</span>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <Link
                href="/analyze"
                className="btn-primary w-full text-center py-3 flex items-center justify-center gap-2"
                id="sample-cta-analyze"
              >
                <span>VIEW INVESTIGATION</span>
                <span className="text-brand-200">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          INVESTIGATION PIPELINE
          ============================================ */}
      <section
        className="relative z-10 w-full max-w-6xl mx-auto px-6 py-12 md:py-16"
        aria-label="Investigation pipeline"
      >
        <div className="text-center mb-10">
          <span className="tech-label text-brand-500 mb-2">HOW IT WORKS</span>
          <h2 className="text-2xl md:text-3xl font-light tracking-wide text-slate-100 uppercase">
            Investigation Pipeline
          </h2>
        </div>

        {/* Pipeline stages */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-0">
          {[
            {
              num: "01",
              label: "OPPORTUNITY",
              desc: "Paste job text, upload screenshot, or PDF",
              active: false,
              terminal: false,
            },
            {
              num: "02",
              label: "EXTRACTION",
              desc: "Claims, entities, and signals identified",
              active: false,
              terminal: false,
            },
            {
              num: "03",
              label: "VERIFICATION",
              desc: "Domain, recruiter, and company checks",
              active: true,
              terminal: false,
            },
            {
              num: "04",
              label: "INTELLIGENCE",
              desc: "Historical patterns and community reports",
              active: false,
              terminal: false,
            },
            {
              num: "05",
              label: "RISK SCORE",
              desc: "Deterministic, evidence-based assessment",
              active: false,
              terminal: true,
            },
          ].map((stage, idx) => (
            <div key={stage.num} className="flex flex-col md:flex-row items-center flex-1">
              {/* Stage node */}
              <div className="flex flex-col items-center text-center w-full md:w-auto px-2">
                <div
                  className={`
                    w-14 h-14 rounded-lg flex items-center justify-center font-mono text-sm font-bold
                    ${stage.terminal
                      ? "bg-risk-critical/15 border-2 border-risk-critical/50 text-risk-critical shadow-[0_0_20px_rgba(255,42,42,0.15)]"
                      : stage.active
                        ? "bg-brand-500/15 border border-brand-500/50 text-brand-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                        : "bg-surface border border-surface-elevated text-slate-500"
                    }
                  `}
                >
                  {stage.num}
                </div>
                <span
                  className={`
                    text-[10px] font-mono uppercase tracking-widest mt-2.5 mb-1
                    ${stage.terminal ? "text-risk-critical font-bold" : stage.active ? "text-brand-400" : "text-slate-400"}
                  `}
                >
                  {stage.label}
                </span>
                <span className="text-[10px] text-slate-600 max-w-[130px] leading-tight hidden md:block">
                  {stage.desc}
                </span>
              </div>

              {/* Connector (not after last stage) */}
              {idx < 4 && (
                <div className="hidden md:flex flex-1 items-center justify-center px-1 min-w-[20px]" aria-hidden="true">
                  <div className="h-px flex-1 bg-surface-elevated relative">
                    <div
                      className={`
                        absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full connector-dot
                        ${idx === 3 ? "bg-risk-critical/60" : "bg-brand-500/50"}
                      `}
                      style={{ animationDelay: `${idx * 0.5}s` }}
                    />
                  </div>
                </div>
              )}
              {/* Mobile connector */}
              {idx < 4 && (
                <div className="md:hidden h-6 w-px bg-surface-elevated my-1 relative" aria-hidden="true">
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-500/50 connector-dot"
                    style={{ animationDelay: `${idx * 0.5}s` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Terminal risk output */}
        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-6 px-6 py-4 bg-surface border border-risk-critical/20 rounded-lg">
            <div className="text-center">
              <span className="text-4xl font-light text-risk-critical leading-none">72</span>
              <span className="text-xs font-mono text-slate-600 block mt-0.5">/ 100</span>
            </div>
            <div className="w-px h-10 bg-surface-elevated" />
            <div>
              <span className="text-sm font-bold font-mono tracking-widest text-risk-critical uppercase">
                HIGH RISK
              </span>
              <span className="text-[10px] font-mono text-slate-600 block mt-0.5 uppercase tracking-wider">
                3 SIGNALS · 87% CONFIDENCE
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          PLATFORM CAPABILITIES GRID
          ============================================ */}
      <section
        className="relative z-10 w-full max-w-6xl mx-auto px-6 pb-16"
        aria-label="Platform capabilities"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-surface-elevated/30 border border-surface-elevated rounded-lg overflow-hidden">
          {[
            {
              title: "Risk Extraction",
              desc: "Structured extraction of claims, compensation, urgency signals, and payment requests from any job posting format.",
              stat: "12+",
              statLabel: "SIGNAL TYPES",
            },
            {
              title: "Entity Verification",
              desc: "Automated domain verification, recruiter identity validation, and company registration cross-referencing.",
              stat: "3-LAYER",
              statLabel: "VERIFICATION",
            },
            {
              title: "Historical Intelligence",
              desc: "Pattern matching against previously analyzed opportunities. Recurring threat actors are flagged automatically.",
              stat: "PATTERN",
              statLabel: "MATCHING",
            },
            {
              title: "Community Reports",
              desc: "Anonymous, moderated threat reports from the community. Identity-protected intelligence sharing.",
              stat: "CROWD",
              statLabel: "INTEL",
            },
          ].map((cap) => (
            <div
              key={cap.title}
              className="bg-surface p-5 md:p-6 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-sm font-semibold text-slate-200 tracking-wide uppercase mb-2">
                  {cap.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {cap.desc}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-surface-elevated">
                <span className="text-lg font-mono font-bold text-brand-400 leading-none">
                  {cap.stat}
                </span>
                <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest block mt-0.5">
                  {cap.statLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================
          FOOTER CTA
          ============================================ */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center border-t border-surface-elevated pt-12">
          <p className="text-slate-500 font-mono text-sm mb-6 max-w-lg mx-auto">
            HireShield is an evidence-driven platform. Every risk score is explainable,
            every signal is traceable, and no claim goes unverified.
          </p>
          <Link
            href="/analyze"
            className="btn-primary px-10 py-3 text-base inline-flex items-center gap-2"
            id="footer-cta-analyze"
          >
            <span>ANALYZE A JOB</span>
            <span className="text-brand-200">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
