# HireShield 🛡️

> **"Protect your next career move."**

HireShield is a **threat-intelligence platform** for job seekers. It analyzes job postings for scam signals — domain mismatches, unrealistic compensation, upfront payment requests — and returns an evidence-backed risk score displayed in a security-console UI.

---

## Features ✨

- **AI-Powered Analysis** — Google Gemini extracts structured risk signals and entities from raw job text, PDFs, or screenshots.
- **Deterministic Risk Engine** — A reproducible, explainable score calculated from weighted signal categories; no black-box outputs.
- **Animated Threat Console UI** — Framer Motion animations, SVG ring risk gauge, typewriter evidence display, and cursor-reactive spotlight — built on a dark SOC-dashboard aesthetic.
- **Community Intelligence** — Users submit and confirm threat reports; corroborated reports surface in cross-checks.
- **Entity Dossiers** — Company and recruiter profile pages aggregate historical risk across all analyzed postings.
- **Secure Auth** — Clerk-powered authentication with per-route server-side checks.
- **Document Upload** — PDF parsing with page-count limits; SSRF-hardened URL verification.

---

## Tech Stack 🛠️

### Frontend
| | |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (React 19, App Router) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Animation | [Framer Motion](https://www.framer.com/motion/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Auth | [Clerk](https://clerk.com/) |

### Backend
| | |
|---|---|
| Framework | [FastAPI](https://fastapi.tiangolo.com/) |
| Database | PostgreSQL 15 + `pgvector` (via `ankane/pgvector`) |
| ORM | [SQLAlchemy](https://www.sqlalchemy.org/) (async) + [Alembic](https://alembic.sqlalchemy.org/) |
| AI | Google Generative AI (Gemini 1.5 Flash / Pro) |
| Auth | Clerk JWT verification |

---

## Quick Start 🚀

### Prerequisites
- Docker & Docker Compose v2
- A [Clerk](https://clerk.com/) project (free tier works)
- A [Google AI Studio](https://aistudio.google.com/) API key for Gemini

### 1. Configure environment
```bash
cp .env.example .env
```

Open `.env` and fill in:
```env
CLERK_SECRET_KEY=sk_...
CLERK_JWKS_URL=https://<your-clerk-domain>.clerk.accounts.dev/.well-known/jwks.json
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
GEMINI_API_KEY=AI...
```

> **Never commit `.env` to version control.**

### 2. Start the full stack
```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Health Check | http://localhost:8000/health |

Docker Compose will:
1. Start PostgreSQL with `pgvector` and wait for it to be healthy.
2. Build and start the FastAPI backend; Alembic migrations run automatically on startup.
3. Build and start the Next.js frontend.

---

## Local Development (Without Docker)

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# Set DATABASE_URI in your shell or .env pointing at a local Postgres instance
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                         # http://localhost:3000
```

> Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in `frontend/.env.local` when running without Docker.

---

## Architecture Overview 🏗️

```
Browser (Next.js)
    │
    ├── /analyze          → Job input form → POST /api/v1/jobs/analyze
    ├── /analyze/result/[id] → Animated risk report (RiskCard, SignalCard, etc.)
    ├── /dashboard        → Intelligence command center
    ├── /community        → Threat report feed
    ├── /companies/[id]   → Company dossier (historical risk)
    └── /recruiters/[id]  → Recruiter dossier
          │
          │  (Clerk JWT in Authorization header)
          ▼
FastAPI Backend
    ├── POST /api/v1/jobs/analyze
    │       └── AnalysisService
    │               ├── AI Provider (Gemini) → signal extraction
    │               └── Risk Engine (deterministic) → score + confidence
    ├── GET  /api/v1/jobs/{id}
    ├── GET  /api/v1/community
    ├── GET  /api/v1/companies/{id}
    └── GET  /api/v1/recruiters/{id}
          │
          ▼
PostgreSQL + pgvector
    ├── job_postings
    ├── risk_signals
    ├── companies / recruiters
    ├── verification_checks
    └── community_reports
```

### Key design decisions
- **AI is extraction-only.** Gemini quotes evidence verbatim; it never assigns scores.
- **Risk scoring is deterministic.** `backend/app/risk/engine.py` applies fixed weights per signal category, producing reproducible scores.
- **SSRF protection.** All external URLs are validated against an allowlist before fetching.
- **Reduced-motion support.** All Framer Motion animations respect `prefers-reduced-motion`.

---

## Frontend Component Reference

| Component | Purpose |
|---|---|
| `HeroSection` | Staggered word-reveal headline, cursor spotlight, shine-sweep CTAs |
| `AnimatedBackground` | Canvas scanline sweep (low CPU, GPU-composited) |
| `RiskCard` | Count-up score + SVG severity ring + single-shot badge glow |
| `SignalCard` | Hover severity glow border + card lift |
| `CrossCheckRow` | Sequential left-to-right reveal with activating dot |
| `FlowSteps` | Sequential step light-up + SVG dashed line draw-in |
| `TypewriterText` | Terminal typewriter with blinking cursor, scroll-triggered |
| `SectionReveal` | `whileInView` fade + translate-y wrapper (fires once) |
| `Navigation` | Glassmorphism on scroll + underline-draw nav links + logo pulse |

---

## Environment Variables Reference

| Variable | Where used | Description |
|---|---|---|
| `DATABASE_URI` | Backend | Full asyncpg connection string |
| `POSTGRES_USER/PASSWORD/DB` | Docker Compose | Postgres credentials |
| `CLERK_SECRET_KEY` | Backend | Server-side JWT verification |
| `CLERK_JWKS_URL` | Backend | Clerk JWKS endpoint |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Frontend | Client-side Clerk init |
| `GEMINI_API_KEY` | Backend | Google AI API key |
| `CORS_ORIGINS` | Backend | Comma-separated allowed origins |
| `NEXT_PUBLIC_API_URL` | Frontend (browser) | Public-facing API URL |
| `INTERNAL_API_URL` | Frontend (SSR) | Container-internal API URL |
| `MAX_UPLOAD_SIZE_MB` | Backend | Max file upload size (default: 10) |
| `MAX_PDF_PAGES` | Backend | Max pages per PDF (default: 20) |

---

## Contributing

This is a hackathon project. The codebase is structured for extensibility — new signal categories can be added to `backend/app/risk/engine.py`, and new UI panels drop in as isolated `SectionReveal`-wrapped components.
