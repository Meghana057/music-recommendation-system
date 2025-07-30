"""
Migration script to add authentication and average rating features
Run this after updating models to add new tables and columns
"""

import sys
import os
from pathlib import Path

# Add the parent directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import SessionLocal, create_tables
from app import models


def migrate_authentication_and_ratings():
    """Add user_song_ratings table and average rating columns"""
    
    print("🔄 Starting authentication and rating migration...")
    
    # Create all tables (this will create new tables without affecting existing ones)
    print("📋 Creating database tables...")
    create_tables()
    
    db = SessionLocal()
    
    try:
        # Check if user_song_ratings table exists
        result = db.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'user_song_ratings'
            );
        """))
        
        if result.scalar():
            print("✅ user_song_ratings table already exists")
        else:
            print("❌ user_song_ratings table not found - please check models")
        
        # Add average rating columns to songs table if they don't exist
        print("🔄 Adding average rating columns to songs table...")
        
        # Check if columns already exist
        column_check = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='songs' AND column_name IN ('average_rating', 'rating_count');
        """))
        
        existing_columns = [row[0] for row in column_check.fetchall()]
        
        if 'average_rating' not in existing_columns:
            db.execute(text("ALTER TABLE songs ADD COLUMN average_rating FLOAT DEFAULT 0.0;"))
            print("✅ Added average_rating column")
        else:
            print("✅ average_rating column already exists")
            
        if 'rating_count' not in existing_columns:
            db.execute(text("ALTER TABLE songs ADD COLUMN rating_count INTEGER DEFAULT 0;"))
            print("✅ Added rating_count column")
        else:
            print("✅ rating_count column already exists")
        
        # Initialize average ratings for existing songs
        print("🔄 Initializing average ratings...")
        db.execute(text("""
            UPDATE songs 
            SET 
                average_rating = COALESCE(
                    (SELECT AVG(rating) FROM user_song_ratings WHERE song_id = songs.id), 
                    0.0
                ),
                rating_count = COALESCE(
                    (SELECT COUNT(*) FROM user_song_ratings WHERE song_id = songs.id), 
                    0
                )
            WHERE average_rating = 0.0 AND rating_count = 0;
        """))
        
        db.commit()
        print("✅ Successfully initialized average ratings")
        
        # Show summary
        total_songs = db.execute(text("SELECT COUNT(*) FROM songs;")).scalar()
        rated_songs = db.execute(text("SELECT COUNT(*) FROM songs WHERE rating_count > 0;")).scalar()
        total_ratings = db.execute(text("SELECT COUNT(*) FROM user_song_ratings;")).scalar()
        
        print("\n📊 Migration Summary:")
        print(f"  Total songs: {total_songs}")
        print(f"  Songs with ratings: {rated_songs}")
        print(f"  Total user ratings: {total_ratings}")
        
        if rated_songs > 0:
            print("\n🎵 Sample songs with ratings:")
            sample_results = db.execute(text("""
                SELECT title, average_rating, rating_count 
                FROM songs 
                WHERE rating_count > 0 
                ORDER BY rating_count DESC
                LIMIT 5;
            """))
            
            for row in sample_results:
                print(f"  {row.title}: {row.average_rating:.1f} ⭐ ({row.rating_count} ratings)")
        
        print("\n✅ Migration completed successfully!")
        print("\n🔧 Next steps:")
        print("  1. Restart your FastAPI server")
        print("  2. Test authentication endpoints")
        print("  3. Test rating functionality")
        print("  4. Verify average ratings update automatically")
        
    except Exception as e:
        print(f"❌ Migration error: {e}")
        db.rollback()
        return False
    finally:
        db.close()
    
    return True


def verify_migration():
    """Verify that migration was successful"""
    db = SessionLocal()
    
    try:
        # Check tables exist
        tables_check = db.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name IN ('songs', 'user_song_ratings');
        """))
        
        tables = [row[0] for row in tables_check.fetchall()]
        
        print("🔍 Verifying migration...")
        
        if 'songs' in tables:
            print("✅ songs table exists")
        else:
            print("❌ songs table missing")
            return False
            
        if 'user_song_ratings' in tables:
            print("✅ user_song_ratings table exists")
        else:
            print("❌ user_song_ratings table missing")
            return False
        
        # Check columns in songs table
        songs_columns = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='songs';
        """))
        
        column_names = [row[0] for row in songs_columns.fetchall()]
        required_columns = ['average_rating', 'rating_count']
        
        for col in required_columns:
            if col in column_names:
                print(f"✅ songs.{col} column exists")
            else:
                print(f"❌ songs.{col} column missing")
                return False
        
        print("✅ Migration verification successful!")
        return True
        
    except Exception as e:
        print(f"❌ Verification error: {e}")
        return False
    finally:
        db.close()


def main():
    """Run migration and verification"""
    print("🎵 Music Recommendation System - Authentication & Rating Migration")
    print("=" * 70)
    
    # Run migration
    success = migrate_authentication_and_ratings()
    
    if success:
        print("\n" + "=" * 70)
        # Verify migration
        verify_migration()
    else:
        print("\n❌ Migration failed. Please check the errors above.")
        sys.exit(1)


if __name__ == "__main__":
    main()