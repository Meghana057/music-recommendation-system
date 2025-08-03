from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body
from sqlalchemy.orm import Session
from app import crud, schemas
from app.database import get_db
from app.auth import get_current_user, get_current_user_optional, User
from app.recommendation_engine import recommendation_engine
from typing import Optional, List
import math

router = APIRouter(prefix="/songs", tags=["songs"])


@router.get("/", response_model=schemas.PaginatedSongs)
def get_songs(
    page: int = Query(1, ge=1, description="Page number (starts from 1)"),
    limit: int = Query(10, ge=1, le=100, description="Number of items per page"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Get all songs with pagination. Shows user's ratings if authenticated.
    
    - **page**: Page number (minimum 1)
    - **limit**: Number of songs per page (1-100)
    """
    user_id = current_user.id if current_user else None
    songs, total = crud.get_songs_with_user_ratings(db, user_id, page=page, limit=limit)
    
    # Calculate pagination metadata
    total_pages = math.ceil(total / limit) if total > 0 else 0
    has_next = page < total_pages
    has_prev = page > 1
    
    return schemas.PaginatedSongs(
        items=songs,
        page=page,
        limit=limit,
        total=total,
        pages=total_pages,
        has_next=has_next,
        has_prev=has_prev
    )


# SPECIFIC ROUTES FIRST (before generic /{song_id})

@router.get("/test-simple")
def test_simple():
    """Simplest possible test endpoint"""
    return {"message": "Simple test works!", "status": "success"}


@router.get("/search/{title}", response_model=schemas.SongSearchResponse)
def get_song_by_title(
    title: str = Path(..., min_length=1, max_length=200, description="Song title to search for"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Get song details by title (case-insensitive search)
    
    - **title**: The exact title of the song to search for
    """
    song = crud.get_song_by_title(db, title=title)
    
    if song:
        # Add user rating if authenticated
        user_id = current_user.id if current_user else None
        if user_id:
            user_rating = crud.get_user_song_rating(db, user_id, song.id)
            song.user_rating = user_rating.rating if user_rating else None
        else:
            song.user_rating = None
            
        return schemas.SongSearchResponse(
            song=song,
            found=True,
            message=f"Song '{title}' found successfully"
        )
    else:
        return schemas.SongSearchResponse(
            song=None,
            found=False,
            message=f"Song with title '{title}' not found"
        )


@router.get("/user/ratings", response_model=List[schemas.UserSongRatingResponse])
def get_user_ratings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns all the songs rated by the currently logged-in user.
    """
    ratings = crud.get_user_ratings(db, current_user.id)
    return ratings


@router.get("/user/profile")
def get_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get current user profile information
    """
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "created_at": current_user.created_at
    }


# NEW RECOMMENDATIONS ENDPOINT
@router.get("/recommendations", response_model=schemas.RecommendationsResponse)
def get_recommendations(
    limit: int = Query(10, ge=1, le=20, description="Number of recommendations to return"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get personalized music recommendations based on user's rating history
    
    - **limit**: Number of recommendations to return (1-20)
    
    Requires authentication. Analyzes user's highly-rated songs to find similar unrated songs.
    """
    try:
        result = recommendation_engine.get_user_recommendations(db, current_user.id, limit)
        
        return schemas.RecommendationsResponse(
            recommendations=result['recommendations'],
            total_user_ratings=result['total_user_ratings'],
            taste_profile=result['taste_profile'],
            message=result['message']
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to generate recommendations: {str(e)}"
        )


@router.get("/stats/count")
def get_songs_count(db: Session = Depends(get_db)):
    """Get total number of songs in the database"""
    count = crud.get_songs_count(db)
    return {"total_songs": count}


# GENERIC ROUTES LAST (these catch-all patterns go at the end)

@router.get("/{song_id}", response_model=schemas.SongWithUserRating)
def get_song_by_id(
    song_id: str = Path(..., min_length=1, description="Spotify song ID"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Get song details by Spotify ID. Shows user's rating if authenticated.
    
    - **song_id**: The Spotify ID of the song
    """
    user_id = current_user.id if current_user else None
    song = crud.get_song_with_user_rating(db, song_id, user_id)
    
    if not song:
        raise HTTPException(
            status_code=404, 
            detail=f"Song with ID '{song_id}' not found"
        )
    
    return song


@router.post("/{song_id}/rate", response_model=schemas.UserSongRatingResponse)
def rate_song(
    song_id: str = Path(..., min_length=1, description="Spotify song ID"),
    rating_data: schemas.SongRating = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rate a song"""
    # Check if song exists
    existing_song = crud.get_song_by_id(db, song_id)
    if not existing_song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    # Create or update rating
    try:
        user_rating = crud.create_or_update_user_rating(
            db, 
            user_id=current_user.id,
            song_id=song_id, 
            rating=rating_data.rating
        )
        return user_rating
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save rating: {str(e)}")


@router.get("/{song_id}/stats", response_model=schemas.SongStatsResponse)
def get_song_stats(
    song_id: str = Path(..., min_length=1, description="Spotify song ID"),
    db: Session = Depends(get_db)
):
    """
    Get song rating statistics including breakdown by star rating
    
    - **song_id**: The Spotify ID of the song
    """
    song = crud.get_song_by_id(db, song_id)
    if not song:
        raise HTTPException(
            status_code=404, 
            detail=f"Song with ID '{song_id}' not found"
        )
    
    ratings_breakdown = crud.get_ratings_breakdown(db, song_id)
    
    return schemas.SongStatsResponse(
        song_id=song_id,
        title=song.title,
        average_rating=song.average_rating,
        rating_count=song.rating_count,
        ratings_breakdown=ratings_breakdown
    )