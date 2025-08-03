"""
Script to load JSON playlist data into the PostgreSQL database
Everything is set up automatically - just run this once!

Usage:
    python scripts/load_data.py
"""

import sys
import os
from pathlib import Path

# Add the parent directory to Python path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.database import SessionLocal, create_tables
from app.utils.data_processor import load_json_data, normalize_json_to_songs
from app import crud
import json


def load_playlist_data(json_file_path: str = "data/playlist.json"):
    """Load playlist data from JSON file into database"""
    
    print("🎵 Music Recommendation System - Complete Setup")
    print("=" * 50)
    
    # Step 1: Create tables (includes rating tables + triggers automatically)
    print("📋 Creating database tables and setting up rating system...")
    create_tables()  # This now handles EVERYTHING automatically
    
    # Check if JSON file exists
    if not os.path.exists(json_file_path):
        print(f"❌ Error: JSON file not found at {json_file_path}")
        print("Please ensure the playlist.json file is in the data/ directory")
        return False
    
    print(f"📁 Loading data from: {json_file_path}")
    
    try:
        # Load and validate JSON data
        json_data = load_json_data(json_file_path)
        print(f"✅ Successfully loaded JSON data")
        
        # Show some stats about the data
        if json_data:
            first_key = next(iter(json_data.keys()))
            num_songs = len(json_data[first_key])
            print(f"📊 Found {num_songs} songs in the dataset")
        
        # Normalize data to Song objects
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
                response = input(f"⚠️  Database already contains {existing_count} songs. Do you want to continue? (y/N): ")
                if response.lower() != 'y':
                    print("❌ Operation cancelled by user")
                    return False
            
            # Bulk insert songs
            created_songs = crud.bulk_create_songs(db, songs)
            print(f"✅ Successfully saved {len(created_songs)} songs to database")
            
            print("\n🎉 Setup completed successfully!")
            print("=" * 50)
            print("✅ Complete system ready:")
            print("  ✓ Songs loaded with rating support")
            print("  ✓ User authentication ready")
            print("  ✓ Automatic rating updates enabled")
            print("  ✓ All triggers configured")
            
            print("\n🚀 Next Steps:")
            print("  1. Start your FastAPI server:")
            print("     uvicorn app.main:app --reload")
            print("  2. Visit http://localhost:8000/docs")
            print("  3. Test the rating functionality")
            
            # Show some sample data
            print("\n📋 Sample songs loaded:")
            for i, song in enumerate(created_songs[:3]):
                print(f"  {i+1}. {song.title} - Rating: {song.average_rating}/5.0 ({song.rating_count} ratings)")
            
            if len(created_songs) > 3:
                print(f"  ... and {len(created_songs) - 3} more songs")
            
            return True
            
        except Exception as e:
            print(f"❌ Database error: {e}")
            db.rollback()
            return False
        finally:
            db.close()
            
    except FileNotFoundError as e:
        print(f"❌ File error: {e}")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing error: {e}")
        return False
    except ValueError as e:
        print(f"❌ Data validation error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False


def validate_environment():
    """Validate that all required environment variables are set"""
    from dotenv import load_dotenv
    load_dotenv()
    
    required_vars = ["DATABASE_URL"]
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        print("Please ensure your .env file is properly configured")
        return False
    
    return True


def main():
    """Main function to run the data loading process"""
    print("🎵 Music Recommendation System - One-Command Setup")
    print("This will set up everything you need!")
    print("=" * 50)
    
    # Validate environment
    print("🔍 Validating environment...")
    if not validate_environment():
        return
    
    # Load data (everything else is automatic)
    success = load_playlist_data()
    
    if success:
        print("\n🎉 🎉 🎉 SETUP COMPLETE! 🎉 🎉 🎉")
        print("Your Music Recommendation System is ready to use!")
    else:
        print("\n❌ Setup failed. Please check the errors above.")


if __name__ == "__main__":
    main()