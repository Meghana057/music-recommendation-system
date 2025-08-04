#SQLAlchemy DB interaction functions
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models, schemas
from typing import List, Optional, Tuple
from sqlalchemy import func, or_
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
    """Get a song by its title with simple fuzzy matching"""
    return db.query(models.Song).filter(
        or_(
            func.lower(models.Song.title) == func.lower(title),  # Exact match first
            models.Song.title.ilike(f"{title}%"),               # Starts with
            models.Song.title.ilike(f"%{title}%")               # Contains
        )
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
    # Calculate offset/ how many rows to skip
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


# User Rating Functions (Updated for Trigger Support)

def get_user_song_rating(db: Session, user_id: str, song_id: str) -> Optional[models.UserSongRating]:
    """Get user's rating for a specific song"""
    return db.query(models.UserSongRating).filter(
        models.UserSongRating.user_id == user_id,
        models.UserSongRating.song_id == song_id
    ).first()


def create_or_update_user_rating(db: Session, user_id: str, song_id: str, rating: float) -> models.UserSongRating:
    """Create or update user's rating for a song (database triggers handle average updates automatically)"""
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
    
    # Note: Database triggers automatically update song's average rating and count
    # No need to manually call update_song_average_rating(db, song_id)
    
    return result


# Note: No delete_user_rating function needed since the UI only allows editing ratings, not deleting them


def get_songs_with_user_ratings(db: Session, user_id: Optional[str], page: int = 1, limit: int = 10):
    """Get songs with user's ratings if authenticated"""
    offset = (page - 1) * limit
    
    # Base query for songs
    songs_query = db.query(models.Song).order_by(models.Song.index).offset(offset).limit(limit)
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


# Legacy/Utility Functions (for manual operations when needed)

def calculate_average_rating(db: Session, song_id: str) -> Tuple[float, int]:
    """
    Calculate average rating and count for a song (LEGACY FUNCTION)
    Note: With database triggers, this is automatically maintained.
    This function is kept for manual verification or data migration purposes.
    """
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
    """
    Update the average rating for a song (LEGACY FUNCTION)
    Note: With database triggers, this is automatically maintained.
    This function is kept for manual data fixes or migrations.
    """
    avg_rating, rating_count = calculate_average_rating(db, song_id)
    
    # Update song table with new average
    db.query(models.Song).filter(models.Song.id == song_id).update({
        "average_rating": avg_rating,
        "rating_count": rating_count,
        "updated_at": func.now()
    })
    db.commit()


def recalculate_all_song_averages(db: Session) -> int:
    """
    Manually recalculate all song averages (useful for data migration/fixes)
    Returns: Number of songs updated
    """
    print("🔄 Recalculating all song averages...")
    
    # Get all songs
    songs = db.query(models.Song).all()
    updated_count = 0
    
    for song in songs:
        avg_rating, rating_count = calculate_average_rating(db, song.id)
        
        # Only update if values are different (to avoid unnecessary writes)
        if song.average_rating != avg_rating or song.rating_count != rating_count:
            song.average_rating = avg_rating
            song.rating_count = rating_count
            song.updated_at = func.now()
            updated_count += 1
    
    db.commit()
    print(f"✅ Updated averages for {updated_count} songs (out of {len(songs)} total)")
    
    return updated_count


def verify_rating_consistency(db: Session) -> bool:
    """
    Verify that all song average ratings match calculated averages
    Returns: True if all ratings are consistent, False otherwise
    """
    print("🔍 Verifying rating consistency...")
    
    songs = db.query(models.Song).all()
    inconsistent_songs = []
    
    for song in songs:
        calculated_avg, calculated_count = calculate_average_rating(db, song.id)
        
        if (abs(song.average_rating - calculated_avg) > 0.1 or 
            song.rating_count != calculated_count):
            inconsistent_songs.append({
                'song_id': song.id,
                'title': song.title,
                'stored_avg': song.average_rating,
                'calculated_avg': calculated_avg,
                'stored_count': song.rating_count,
                'calculated_count': calculated_count
            })
    
    if inconsistent_songs:
        print(f"❌ Found {len(inconsistent_songs)} songs with inconsistent ratings:")
        for song in inconsistent_songs[:5]:  # Show first 5
            print(f"  - {song['title']}: stored={song['stored_avg']}/{song['stored_count']}, "
                  f"calculated={song['calculated_avg']}/{song['calculated_count']}")
        if len(inconsistent_songs) > 5:
            print(f"  ... and {len(inconsistent_songs) - 5} more")
        return False
    else:
        print("✅ All song ratings are consistent!")
        return True


# Utility function for batch rating operations (useful for testing)
def batch_rate_songs(db: Session, user_id: str, ratings: List[Tuple[str, float]]) -> List[models.UserSongRating]:
    """
    Batch rate multiple songs for a user
    ratings: List of (song_id, rating) tuples
    Returns: List of created/updated UserSongRating objects
    """
    results = []
    
    for song_id, rating in ratings:
        # Verify song exists
        if not song_exists(db, song_id):
            print(f"Warning: Song {song_id} does not exist, skipping...")
            continue
        
        result = create_or_update_user_rating(db, user_id, song_id, rating)
        results.append(result)
    
    print(f"✅ Batch rated {len(results)} songs for user {user_id}")
    return results