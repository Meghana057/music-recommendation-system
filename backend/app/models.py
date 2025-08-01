# defines SQLAlchemy DB models (i.e., how the DB table is structured)
from sqlalchemy import Column, Integer, String, Float, BigInteger, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Song(Base):
    __tablename__ = "songs"

    index = Column(Integer, primary_key=True, index=True)
    id = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, index=True, nullable=False)
    danceability = Column(Float, nullable=False)
    energy = Column(Float, nullable=False)
    key = Column(Integer, nullable=False)
    loudness = Column(Float, nullable=False)
    mode = Column(Integer, nullable=False)
    acousticness = Column(Float, nullable=False)
    instrumentalness = Column(Float, nullable=False)
    liveness = Column(Float, nullable=False)
    valence = Column(Float, nullable=False)
    tempo = Column(Float, nullable=False)
    duration_ms = Column(BigInteger, nullable=False)
    time_signature = Column(Integer, nullable=False)
    num_bars = Column(Integer, nullable=False)
    num_sections = Column(Integer, nullable=False)
    num_segments = Column(Integer, nullable=False)
    class_label = Column(Integer, nullable=False)  # 'class' is a reserved keyword
    
    # Rating fields
    # rating = Column(Float, default=0.0)  # Keep for backward compatibility
    average_rating = Column(Float, default=0.0)  # Average of all user ratings
    rating_count = Column(Integer, default=0)    # Number of ratings
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Song(id='{self.id}', title='{self.title}')>"


class UserSongRating(Base):
    __tablename__ = "user_song_ratings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)  # Supabase user ID
    song_id = Column(String, ForeignKey("songs.id"), nullable=False)
    rating = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to song
    song = relationship("Song")
    
    # Ensure one rating per user per song
    __table_args__ = (
        Index('idx_user_song_unique', 'user_id', 'song_id', unique=True),
    )

    def __repr__(self):
        return f"<UserSongRating(user_id='{self.user_id}', song_id='{self.song_id}', rating={self.rating})>"