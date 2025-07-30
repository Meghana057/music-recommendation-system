# Create a new file: scripts/simple_load.py

import sys
import os
from pathlib import Path

# Add the parent directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.database import SessionLocal, create_tables
from app.utils.data_processor import load_json_data, normalize_json_to_songs
from app import crud


def main():
    """Simple data loading without FastAPI"""
    
    print("🔧 Creating database tables...")
    create_tables()
    
    print("📁 Loading JSON data...")
    try:
        json_data = load_json_data("data/playlist.json")
        print(f"✅ Successfully loaded JSON data")
        
        # Normalize data
        print("🔄 Normalizing data...")
        songs = normalize_json_to_songs(json_data)
        print(f"✅ Successfully normalized {len(songs)} songs")
        
        # Save to database
        print("💾 Saving to database...")
        db = SessionLocal()
        
        try:
            # Check if data already exists
            existing_count = crud.get_songs_count(db)
            if existing_count > 0:
                print(f"⚠️  Database already contains {existing_count} songs.")
                response = input("Do you want to continue? (y/N): ")
                if response.lower() != 'y':
                    print("❌ Operation cancelled")
                    return
            
            # Bulk insert songs
            created_songs = crud.bulk_create_songs(db, songs)
            print(f"✅ Successfully saved {len(created_songs)} songs to database")
            
            # Show sample data
            print("\n📋 Sample songs loaded:")
            for i, song in enumerate(created_songs[:3]):
                print(f"  {i+1}. {song.title} (ID: {song.id})")
            
            if len(created_songs) > 3:
                print(f"  ... and {len(created_songs) - 3} more songs")
                
        except Exception as e:
            print(f"❌ Database error: {e}")
            db.rollback()
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    main()