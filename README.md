 dev
# Test change

# Music Recommendation System

Full-stack music recommendation application with React TypeScript frontend and FastAPI Python backend.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Material-UI + Chart.js
- **Backend**: FastAPI + PostgreSQL + SQLAlchemy + AI/ML
- **Database**: Supabase (PostgreSQL with authentication)
- **AI**: scikit-learn + OpenAI GPT integration

## Prerequisites

- **Node.js 16+** and **npm**
- **Python 3.9+** and **pip**
- **Supabase account** (free tier)

## Setup Instructions

### 1. Clone Repository

```bash
git clone <your-repository-url>
cd music-recommendation-system
```

### 2. Supabase Database Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for project setup to complete
3. Go to **Project Settings → API** and copy:
   - Project URL
   - anon/public key
   - service_role key
4. Go to **Project Settings → API → JWT Settings** and copy:
   - JWT Secret

### 3. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
touch .env
```

**Edit `.env` file:**
```env
DATABASE_URL=postgresql://postgres:[password]@[host]:6543/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here
OPENAI_API_KEY=your_openai_key_here
PROJECT_NAME="Music Recommendation System"
API_V1_STR="/api/v1"
```

**Load data and start backend:**
```bash
# Load sample songs into database
python scripts/load_data.py

# Start API server
uvicorn app.main:app --reload
```

Backend will run at: http://localhost:8000

### 4. Frontend Setup

```bash
# Open new terminal
cd frontend

# Install dependencies
npm install

# Create environment file
touch .env.local
```

**Edit `.env.local` file:**
```env
REACT_APP_API_BASE_URL=http://localhost:8000/api/v1
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

**Start frontend:**
```bash
npm start
```

Frontend will open at: http://localhost:3000

## Verification

1. Visit http://localhost:3000 (frontend should load)
2. Visit http://localhost:8000/docs (API documentation)
3. Visit http://localhost:8000/health (should return {"status": "healthy"})
4. Sign up for an account in the frontend
5. Rate some songs and get recommendations

## Development Commands

### Backend
```bash
cd backend
uvicorn app.main:app --reload  # Start server
pytest tests/ -v              # Run tests
python scripts/load_data.py   # Reload data
```

### Frontend
```bash
cd frontend
npm start      # Start development server
npm test       # Run tests
npm run build  # Build for production
```

## Environment Variables Reference

### Backend (.env)
```env
DATABASE_URL=postgresql://postgres:[password]@[host]:6543/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key  # Optional
PROJECT_NAME="Music Recommendation System"
API_V1_STR="/api/v1"
```

### Frontend (.env.local)
```env
REACT_APP_API_BASE_URL=http://localhost:8000/api/v1
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

## Troubleshooting

**Backend won't start:**
- Check `.env` file has correct Supabase credentials
- Ensure virtual environment is activated

**Frontend won't connect:**
- Make sure backend is running on port 8000
- Check `.env.local` has correct API URL

**Database connection failed:**
- Verify DATABASE_URL format is correct
- Ensure Supabase project is active

**Authentication not working:**
- Verify all Supabase credentials match between frontend and backend
- Check SUPABASE_JWT_SECRET is correct

