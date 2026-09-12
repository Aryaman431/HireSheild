# HireShield

"Protect your next career move."

## Setup Instructions

### Environment Variables
1. Copy `.env.example` to `.env`.
2. Do not commit `.env` to version control.

### Authentication Setup (Supabase)
HireShield uses Supabase for authentication. You must configure the following in your `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
```

- **Frontend Authentication**: The Next.js app uses `@supabase/ssr` to manage cookies and session state. The `/login` and `/signup` pages handle authentication. 
- **Protected Routes**: Protected routes (like `/dashboard`) are enforced using Next.js Middleware (`frontend/middleware.ts`), which automatically redirects unauthenticated users to `/login`.
- **Backend Authentication**: The FastAPI backend extracts the JWT from the `Authorization: Bearer <token>` header and validates it using the `SUPABASE_JWT_SECRET`.
- **Testing Auth Locally**: Start the Next.js development server and navigate to `http://localhost:3000/login` or `/signup` to test authentication flows.

### AI Analysis Setup (Gemini)
HireShield uses Google Gemini to extract structured risk signals from job opportunities.

```env
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
```
- **Analysis Architecture**: The analysis flow ensures the AI acts only as an extractor, never as the final authority on risk.
  - **AI Provider Layer**: (`backend/app/ai/`) Communicates with the LLM to extract structured entities (Pydantic `JobExtraction`) and risk signals. It operates strictly on evidence-based extraction (must quote the text).
  - **Deterministic Risk Engine**: (`backend/app/risk/engine.py`) Assigns weighted scores to each extracted signal. The final risk score and confidence are clamped deterministically. This guarantees reproducible, explainable scoring.
  - **API Endpoint**: The authenticated `POST /api/v1/jobs/analyze` endpoint invokes the `AnalysisService`, records the execution into the PostgreSQL DB (`AnalysisRun`, `RiskSignal`, `EvidenceItem`), and returns the job ID.
  - **Frontend UI**: Navigating to `/analyze` initiates the scanning process, rendering progressive stages before routing to `/analyze/result/[id]`.

### Running the App
1. Copy `.env.example` to `.env` and replace the Supabase and Gemini placeholders.
2. Start the local stack: `docker compose up --build`.
3. Open `http://localhost:3000`; the API health endpoint is `http://localhost:8000/health`.

Docker Compose waits for PostgreSQL to be ready, runs the schema migration, then
starts the API. Data is stored in the named `postgres_data` volume and survives
`docker compose down`; do not use `docker compose down -v` unless you intend to
erase local database data. `.env` is intentionally excluded from Docker build
contexts and version control.
# HireShield
