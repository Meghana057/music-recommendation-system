from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models, schemas
from typing import List, Optional, Tuple
import math


def create_song(db: Session, song: schemas.SongCreate) -> models.Song:
    """Create a new song in the database"""
    db_song = models.Song(**song.model_dump())
    db.add(db_song)
    db.commit()
    db.refresh(db_song)
    return db_song


def get_song_by_id(db: Session, song_id: str) -> Optional[models.Song]:
    """Get a song by its Spotify ID"""
    return db.query(models.Song).filter(models.Song.id == song_id).first()


def get_song_by_title(db: Session, title: str) -> Optional[models.Song]:
    """Get a song by its title (case-insensitive)"""
    return db.query(models.Song).filter(
        func.lower(models.Song.title) == func.lower(title)
    ).first()


def get_songs(
    db: Session, 
    page: int = 1, 
    limit: int = 10
) -> Tuple[List[models.Song], int]:
    """
    Get paginated list of songs
    Returns: (songs_list, total_count)
    """
    # Calculate offset
    offset = (page - 1) * limit
    
    # Get total count
    total = db.query(models.Song).count()
    
    # Get paginated songs
    songs = (
        db.query(models.Song)
        .offset(offset)
        .limit(limit)
        .all()
    )
    
    return songs, total


# def update_song_rating(db: Session, song_id: str, rating: float) -> Optional[models.Song]:
#     """Update the rating of a song (deprecated - use user-specific ratings)"""
#     db_song = get_song_by_id(db, song_id)
#     if db_song:
#         db_song.rating = rating
#         db.commit()
#         db.refresh(db_song)
#     return db_song


def bulk_create_songs(db: Session, songs: List[schemas.SongCreate]) -> List[models.Song]:
    """Bulk create multiple songs"""
    db_songs = [models.Song(**song.model_dump()) for song in songs]
    db.add_all(db_songs)
    db.commit()
    
    # Refresh all objects to get their IDs
    for song in db_songs:
        db.refresh(song)
    
    return db_songs


def song_exists(db: Session, song_id: str) -> bool:
    """Check if a song exists by its ID"""
    return db.query(models.Song).filter(models.Song.id == song_id).first() is not None


def get_songs_count(db: Session) -> int:
    """Get total number of songs in the database"""
    return db.query(models.Song).count()


# User Rating Functions

def get_user_song_rating(db: Session, user_id: str, song_id: str) -> Optional[models.UserSongRating]:
    """Get user's rating for a specific song"""
    return db.query(models.UserSongRating).filter(
        models.UserSongRating.user_id == user_id,
        models.UserSongRating.song_id == song_id
    ).first()


def calculate_average_rating(db: Session, song_id: str) -> Tuple[float, int]:
    """Calculate average rating and count for a song"""
    result = db.query(
        func.avg(models.UserSongRating.rating).label('avg_rating'),
        func.count(models.UserSongRating.rating).label('rating_count')
    ).filter(
        models.UserSongRating.song_id == song_id
    ).first()
    
    avg_rating = float(result.avg_rating) if result.avg_rating else 0.0
    rating_count = int(result.rating_count) if result.rating_count else 0
    
    return round(avg_rating, 1), rating_count


def update_song_average_rating(db: Session, song_id: str):
    """Update the average rating for a song"""
    avg_rating, rating_count = calculate_average_rating(db, song_id)
    
    # Update song table with new average
    db.query(models.Song).filter(models.Song.id == song_id).update({
        "average_rating": avg_rating,
        "rating_count": rating_count,
        "updated_at": func.now()
    })
    db.commit()


def create_or_update_user_rating(db: Session, user_id: str, song_id: str, rating: float) -> models.UserSongRating:
    """Create or update user's rating for a song and update song average"""
    existing_rating = get_user_song_rating(db, user_id, song_id)
    
    if existing_rating:
        existing_rating.rating = rating
        existing_rating.updated_at = func.now()
        db.commit()
        db.refresh(existing_rating)
        result = existing_rating
    else:
        new_rating = models.UserSongRating(
            user_id=user_id,
            song_id=song_id,
            rating=rating
        )
        db.add(new_rating)
        db.commit()
        db.refresh(new_rating)
        result = new_rating
    
    # Update song's average rating
    update_song_average_rating(db, song_id)
    
    return result


def get_songs_with_user_ratings(db: Session, user_id: Optional[str], page: int = 1, limit: int = 10):
    """Get songs with user's ratings if authenticated"""
    offset = (page - 1) * limit
    
    # Base query for songs
    songs_query = db.query(models.Song).offset(offset).limit(limit)
    songs = songs_query.all()
    total = db.query(models.Song).count()
    
    # If user is authenticated, get their ratings
    if user_id:
        song_ids = [song.id for song in songs]
        user_ratings = db.query(models.UserSongRating).filter(
            models.UserSongRating.user_id == user_id,
            models.UserSongRating.song_id.in_(song_ids)
        ).all()
        
        # Create a mapping of song_id -> user_rating
        rating_map = {rating.song_id: rating.rating for rating in user_ratings}
        
        # Add user ratings to songs
        for song in songs:
            song.user_rating = rating_map.get(song.id)
    else:
        # No user, set user_rating to None for all songs
        for song in songs:
            song.user_rating = None
    
    return songs, total


def get_song_with_user_rating(db: Session, song_id: str, user_id: Optional[str]) -> Optional[models.Song]:
    """Get song with user's rating if authenticated"""
    song = db.query(models.Song).filter(models.Song.id == song_id).first()
    
    if song and user_id:
        user_rating = get_user_song_rating(db, user_id, song_id)
        song.user_rating = user_rating.rating if user_rating else None
    elif song:
        song.user_rating = None
        
    return song


def get_user_ratings(db: Session, user_id: str) -> List[models.UserSongRating]:
    """Get all ratings by a specific user"""
    return db.query(models.UserSongRating).filter(
        models.UserSongRating.user_id == user_id
    ).all()


def get_ratings_breakdown(db: Session, song_id: str) -> dict:
    """Get breakdown of ratings (how many 1-star, 2-star, etc.)"""
    breakdown = db.query(
        models.UserSongRating.rating,
        func.count(models.UserSongRating.rating).label('count')
    ).filter(
        models.UserSongRating.song_id == song_id
    ).group_by(models.UserSongRating.rating).all()
    
    return {float(rating): count for rating, count in breakdown}