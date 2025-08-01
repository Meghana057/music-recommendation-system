from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime


class SongBase(BaseModel):
    id: str = Field(..., min_length=1, max_length=50, description="Unique song identifier")
    title: str = Field(..., min_length=1, max_length=200, description="Song title")
    danceability: float = Field(..., ge=0.0, le=1.0, description="Danceability score (0-1)")
    energy: float = Field(..., ge=0.0, le=1.0, description="Energy score (0-1)")
    key: int = Field(..., ge=0, le=11, description="Musical key (0-11)")
    loudness: float = Field(..., description="Loudness in dB")
    mode: int = Field(..., ge=0, le=1, description="Mode (0=minor, 1=major)")
    acousticness: float = Field(..., ge=0.0, le=1.0, description="Acousticness score (0-1)")
    instrumentalness: float = Field(..., ge=0.0, le=1.0, description="Instrumentalness score (0-1)")
    liveness: float = Field(..., ge=0.0, le=1.0, description="Liveness score (0-1)")
    valence: float = Field(..., ge=0.0, le=1.0, description="Valence score (0-1)")
    tempo: float = Field(..., gt=0, description="Tempo in BPM")
    duration_ms: int = Field(..., gt=0, description="Duration in milliseconds")
    time_signature: int = Field(..., ge=1, le=7, description="Time signature")
    num_bars: int = Field(..., gt=0, description="Number of bars")
    num_sections: int = Field(..., gt=0, description="Number of sections")
    num_segments: int = Field(..., gt=0, description="Number of segments")
    class_label: int = Field(..., description="Classification label")


class SongCreate(SongBase):
    """Schema for creating new songs (no rating fields needed)"""
    pass


class Song(SongBase):
    """Basic song schema with community ratings"""
    index: int
    average_rating: float = Field(..., ge=0.0, le=5.0, description="Average rating from all users")
    rating_count: int = Field(..., ge=0, description="Number of user ratings")
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class SongWithUserRating(SongBase):
    """Song schema with user-specific rating information"""
    index: int
    average_rating: float = Field(..., ge=0.0, le=5.0, description="Average rating from all users")
    rating_count: int = Field(..., ge=0, description="Number of user ratings")
    user_rating: Optional[float] = Field(None, description="Current user's rating")
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class SongRating(BaseModel):
    rating: float = Field(..., ge=0.0, le=5.0, description="Song rating (0-5 stars)")

    @validator('rating')
    def validate_rating(cls, v):
        """Ensure rating is a valid decimal (e.g., 4.5, 3.0)"""
        if not isinstance(v, (int, float)):
            raise ValueError('Rating must be a number')
        
        # Round to 1 decimal place for consistency
        return round(float(v), 1)


class UserSongRatingCreate(BaseModel):
    song_id: str = Field(..., min_length=1, description="Song ID")
    rating: float = Field(..., ge=0.0, le=5.0, description="Rating (0-5 stars)")


class UserSongRatingResponse(BaseModel):
    id: int
    user_id: str
    song_id: str
    rating: float
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class PaginatedSongs(BaseModel):
    items: List[SongWithUserRating]
    page: int = Field(..., ge=1, description="Current page number")
    limit: int = Field(..., ge=1, le=100, description="Items per page")
    total: int = Field(..., ge=0, description="Total number of songs")
    pages: int = Field(..., ge=0, description="Total number of pages")
    has_next: bool = Field(..., description="Whether there is a next page")
    has_prev: bool = Field(..., description="Whether there is a previous page")


class SongSearchResponse(BaseModel):
    song: Optional[SongWithUserRating] = None
    found: bool = Field(..., description="Whether the song was found")
    message: str = Field(..., description="Response message")


class SongStatsResponse(BaseModel):
    song_id: str
    title: str
    average_rating: float
    rating_count: int
    ratings_breakdown: dict = Field(..., description="Breakdown of ratings by star count")


class User(BaseModel):
    id: str
    email: str
    created_at: str


#SCHEMAS FOR MUSIC RECOMMENDATIONS:

class SongRecommendation(SongBase):
    """Song recommendation with match score and reasoning"""
    index: int
    average_rating: float = Field(..., ge=0.0, le=5.0, description="Average rating from all users")
    rating_count: int = Field(..., ge=0, description="Number of user ratings")
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    match_score: int = Field(..., ge=0, le=100, description="Match percentage (0-100)")
    reason: str = Field(..., description="Why this song was recommended")

    class Config:
        from_attributes = True


class RecommendationsResponse(BaseModel):
    """Response for music recommendations"""
    recommendations: List[SongRecommendation]
    total_user_ratings: int = Field(..., description="Number of songs the user has rated")
    taste_profile: Optional[str] = Field(None, description="AI-generated description of user's music taste")
    message: str = Field(..., description="Explanation message")