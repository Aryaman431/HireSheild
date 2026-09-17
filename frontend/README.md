# HireShield Frontend

Next.js 16 (React 19 App Router) threat-intelligence UI for HireShield.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (Turbopack) |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion 13 |
| Icons | Lucide React |
| Auth | Clerk (`@clerk/nextjs`) |

## Local Development

```bash
# From the repo root, copy and configure environment:
cp .env.example .env
# Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, NEXT_PUBLIC_API_URL, etc.

# Install dependencies:
npm install

# Start dev server (http://localhost:3000):
npm run dev
```

> When running outside Docker, set `NEXT_PUBLIC_API_URL=http://localhost:8000`
> in `frontend/.env.local` so SSR requests reach the backend correctly.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Start production server (after build) |
| `npm run lint` | ESLint |

## Component Architecture

```
app/
├── page.tsx                  # Homepage (animated, 'use client')
├── layout.tsx                # Root layout; passes userId to Navigation
├── globals.css               # Design system tokens + animation keyframes
├── analyze/
│   ├── page.tsx              # Job analysis input
│   └── result/[id]/page.tsx  # Risk report
├── dashboard/page.tsx        # Intelligence command center
├── community/
│   ├── page.tsx              # Threat report feed
│   └── reports/[id]/page.tsx # Report detail + confirmation
├── companies/[id]/page.tsx   # Company dossier
├── recruiters/[id]/page.tsx  # Recruiter dossier
├── sign-in/[[...sign-in]]/   # Clerk-managed
└── sign-up/[[...sign-up]]/   # Clerk-managed

components/
├── Navigation.tsx            # Glassmorphism nav + logo pulse + underline-draw links
├── AnimatedBackground.tsx    # Canvas scanline sweep
├── HeroSection.tsx           # Staggered headline + cursor spotlight
├── SectionReveal.tsx         # whileInView fade/translate wrapper
├── RiskCard.tsx              # SVG ring + count-up score + badge glow
├── SignalCard.tsx            # Severity hover glow + card lift
├── CrossCheckRow.tsx         # Sequential reveal + activating dot
├── FlowSteps.tsx             # Step light-up + SVG line draw-in
├── TypewriterText.tsx        # Terminal typewriter + cursor blink
├── RiskVisualization.tsx     # Reusable risk score display (result pages)
├── VerificationPanel.tsx     # Verification checks panel
├── RiskSignalRow.tsx         # Signal row for result reports
└── ReportOpportunityForm.tsx # Community report submission form
```

## Design System

Colors are defined as CSS variables in `@theme` inside `globals.css`:

| Token | Value | Usage |
|---|---|---|
| `--color-risk-critical` | `#ff2a2a` | HIGH risk signals |
| `--color-risk-suspicious` | `#ffb703` | MED risk signals |
| `--color-risk-low` | `#10b981` | Verified / LOW |
| `--color-surface` | `#0f172a` | Card backgrounds |
| `--color-surface-raised` | `#1e293b` | Panel headers |
| `--color-surface-elevated` | `#334155` | Borders, dividers |

### Utility classes

| Class | Purpose |
|---|---|
| `.panel` | Standard investigation panel |
| `.tech-label` | Monospace uppercase label |
| `.badge` `.badge-critical/suspicious/low/verified` | Severity badges |
| `.btn-primary` | Filled primary button |
| `.btn-ghost` | Bordered ghost button |
| `.intel-grid` | CSS dot-grid background |
| `.glitch-hover` | RGB-split glitch on hover (data-text required) |

## Animation Guidelines

- All animations use `transform` / `opacity` only (GPU-composited, no layout thrash).
- `whileInView` always uses `{ once: true }` — never re-triggers on scroll-back.
- All Framer Motion variants check `useReducedMotion()` and fall back to opacity fades.
- Canvas background uses `cancelAnimationFrame` cleanup to prevent memory leaks.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
