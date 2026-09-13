# HireShield 🛡️

**"Protect your next career move."**

HireShield is an application designed to help job seekers identify potential red flags and assess the risk of job opportunities. It uses Google Gemini AI to analyze job descriptions and extract structured risk signals, which are then evaluated by a deterministic risk engine to provide an objective score.

## Features ✨
- **AI Job Analysis**: Extracts structured risk signals and required skills from job postings using Google Gemini.
- **Deterministic Risk Engine**: Calculates a reproducible and explainable risk score based on AI-extracted evidence.
- **Community Reports**: Allows users to view and share analyzed job reports.
- **Secure Authentication**: User management and authentication powered by [Clerk](https://clerk.com/).

## Tech Stack 🛠️

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Authentication**: [Clerk](https://clerk.com/)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Database**: PostgreSQL with `asyncpg` and `pgvector`
- **ORM**: [SQLAlchemy](https://www.sqlalchemy.org/) & [Alembic](https://alembic.sqlalchemy.org/) (Migrations)
- **AI Integration**: Google Generative AI (Gemini)

## Setup Instructions 🚀

### 1. Environment Variables
Copy the example environment file and fill in your keys:
```bash
cp .env.example .env
```
Ensure you provide valid values for Clerk and Gemini keys in your `.env` file:
```env
# Database
DATABASE_URI=postgresql+asyncpg://postgres:postgres@db:5432/hireshield

# Authentication (Clerk)
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_JWKS_URL=your_clerk_jwks_url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# AI Analysis (Gemini)
GEMINI_API_KEY=your_gemini_api_key
```
*Note: Do not commit `.env` to version control.*

### 2. Running the Application via Docker (Recommended)
You can start the entire stack using Docker Compose:
```bash
docker compose up --build
```
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Health Check**: http://localhost:8000/health

Docker Compose automatically waits for PostgreSQL to be ready, applies schema migrations, and starts the API. Database data is persisted in a Docker volume (`postgres_data`).

### 3. Local Development (Without Docker)

#### Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Architecture Overview 🏗️
The analysis flow ensures the AI acts solely as an information extractor, while the backend maintains authority over risk assessment:

- **AI Provider Layer (`backend/app/ai/`)**: Communicates with the LLM to extract structured entities and risk signals from job descriptions. It operates strictly on evidence-based extraction (it must quote the text).
- **Deterministic Risk Engine (`backend/app/risk/engine.py`)**: Assigns weighted scores to each extracted signal. The final risk score and confidence are calculated deterministically, ensuring reproducible and explainable scoring.
- **API Endpoint**: The authenticated `POST /api/v1/jobs/analyze` endpoint invokes the `AnalysisService`, records the execution into the PostgreSQL database, and returns an analysis ID.
- **Frontend UI**: Users can initiate a scan at `/analyze`, which renders progressive stages before routing to the detailed report.
