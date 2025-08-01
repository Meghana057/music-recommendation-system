#boots the FastAPI app
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
    description="Backend API for Music Recommendation System with song data analysis and user authentication",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],  # Important for Authorization header
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
        "version": "2.0.0",
        "features": [
            "User Authentication (Supabase)",
            "User-specific Song Ratings", 
            "Average Rating System",
            "Real-time Rating Updates",
            "RESTful API Design"
        ],
        "docs": "/docs",
        "redoc": "/redoc"
    }


# Health check endpoint
@app.get("/health")
def health_check():
    return {
        "status": "healthy", 
        "service": "music-recommendation-api",
        "version": "2.0.0",
        "features": {
            "authentication": "enabled",
            "user_ratings": "enabled", 
            "average_ratings": "enabled"
        }
    }


# API info endpoint
@app.get(f"{api_v1_prefix}/info")
def api_info():
    return {
        "api_version": "v1",
        "authentication": "Supabase Auth (JWT)",
        "database": "PostgreSQL (Supabase)",
        "endpoints": {
            "songs": f"{api_v1_prefix}/songs",
            "search": f"{api_v1_prefix}/songs/search/{{title}}",
            "rate": f"{api_v1_prefix}/songs/{{song_id}}/rate",
            "song_stats": f"{api_v1_prefix}/songs/{{song_id}}/stats",
            "user_ratings": f"{api_v1_prefix}/songs/user/ratings",
            "user_profile": f"{api_v1_prefix}/songs/user/profile",
            "songs_count": f"{api_v1_prefix}/songs/stats/count"
        },
        "features": [
            "User authentication via Supabase",
            "User-specific song ratings",
            "Automatic average rating calculation",
            "Protected routes for authenticated users",
            "Rating statistics and breakdown",
            "Paginated song listing",
            "Song search by title",
            "Backward compatible with existing endpoints"
        ],
        "authentication": {
            "type": "Bearer JWT",
            "header": "Authorization: Bearer <jwt_token>",
            "provider": "Supabase Auth",
            "protected_endpoints": [
                "POST /songs/{song_id}/rate",
                "GET /songs/user/ratings", 
                "GET /songs/user/profile"
            ],
            "optional_auth_endpoints": [
                "GET /songs/",
                "GET /songs/{song_id}",
                "GET /songs/search/{title}"
            ]
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)