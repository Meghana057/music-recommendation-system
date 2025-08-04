# Music Recommendation System

Full-stack music recommendation application with React TypeScript frontend and FastAPI Python backend.

## Live Demo

**Frontend:** https://music-recommendation-system-six.vercel.app/  


**Backend API:** https://music-recommendation-system-production-82c1.up.railway.app  
**API Docs:** https://music-recommendation-system-production-82c1.up.railway.app/docs  

**Important Notes:**
- Email verification may take time due to Supabase free tier
- First API call may take 50 seconds (server wake-up time)
- Song data is from a fixed dataset (no provision to add new songs)

## Tech Stack

- **Frontend:** React 18 + TypeScript + Material-UI + Chart.js
- **Backend:** FastAPI + PostgreSQL + SQLAlchemy + AI/ML  
- **Database:** Supabase (PostgreSQL with authentication)
- **AI:** scikit-learn + OpenAI GPT integration
- **Deployment:** Vercel (frontend) + Railway (backend)
- **CI/CD:** GitHub Actions with automated testing

## Branch Strategy & Workflow

```
Development Flow:
dev branch → Automatic staging deployment → Create PR → Approval → main branch → Production deployment
```

- **dev branch:** Development environment with automatic staging deployments
- **main branch:** Production environment (protected with branch rules)
- **Pull Request Required:** All changes to production must go through PR approval process
- **Automated Testing:** CI/CD pipeline runs tests on every push before deployment

## Features

- Browse 100 songs with detailed audio features
- Rate songs (1-5 stars) with login required
- View average ratings from other users
- AI-powered personalized recommendations
- Interactive data visualizations
- Real-time song search
- CSV data export
- Responsive design

## Local Development

### Prerequisites
- Node.js 16+ and npm
- Python 3.9+ and pip  
- Supabase account (free)

### 1. Clone & Setup
```bash
git clone https://github.com/your-username/music-recommendation-system.git
cd music-recommendation-system
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
touch .env
```

**Backend .env:**
```env
DATABASE_URL=postgresql://postgres:[password]@[host]:6543/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key
```

**Start backend:**
```bash
python scripts/load_data.py  # Load sample data
uvicorn app.main:app --reload  # Start server
```
Backend runs at: http://localhost:8000

### 3. Frontend Setup
```bash
cd frontend
npm install

# Create .env.local file
touch .env.local
```

**Frontend .env.local:**
```env
REACT_APP_API_BASE_URL=http://localhost:8000/api/v1
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

**Start frontend:**
```bash
npm start
```
Frontend runs at: http://localhost:3000

### 4. Verify Setup
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs  
- Health Check: http://localhost:8000/health

## Development Commands

**Backend:**
```bash
uvicorn app.main:app --reload  # Start server
pytest tests/ -v              # Run tests
```

**Frontend:**
```bash
npm start      # Start dev server
npm test       # Run tests  
npm run build  # Build for production
```

## Deployment

- **Frontend:** Auto-deploys to Vercel on push to main
- **Backend:** Auto-deploys to Railway on push to main
- **Workflow:** Push to dev → Create PR → Merge to main → Production

## Troubleshooting

**Backend won't start:** Check .env file and virtual environment  
**Frontend won't connect:** Ensure backend is running on port 8000  
**Auth issues:** Verify Supabase credentials match between frontend/backend

