from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.api import songs
from app.database import create_tables
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title=os.getenv("PROJECT_NAME", "Music Recommendation System"),
    description="Backend API for Music Recommendation System with song data analysis",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables on startup
@app.on_event("startup")
def startup_event():
    """Create database tables when the application starts"""
    create_tables()


# Include API routers
api_v1_prefix = os.getenv("API_V1_STR", "/api/v1")
app.include_router(songs.router, prefix=api_v1_prefix)


# Root endpoint
@app.get("/")
def read_root():
    return {
        "message": "Welcome to Music Recommendation System API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "music-recommendation-api"}


# API info endpoint
@app.get(f"{api_v1_prefix}/info")
def api_info():
    return {
        "api_version": "v1",
        "endpoints": {
            "songs": f"{api_v1_prefix}/songs",
            "search": f"{api_v1_prefix}/songs/search/{{title}}",
            "rate": f"{api_v1_prefix}/songs/{{song_id}}/rate",
            "song_by_id": f"{api_v1_prefix}/songs/{{song_id}}"
        },
        "features": [
            "Paginated song listing",
            "Song search by title",
            "Song rating system",
            "RESTful API design"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)