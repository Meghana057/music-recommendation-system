from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

# Add connection args for Supabase
engine = create_engine(
    DATABASE_URL,
    connect_args={
        "sslmode": "require",       # (Secure Sockets Layer) is a security protocol that encrypts the connection between two computers
        "host": "aws-0-us-east-1.pooler.supabase.com",
        "port": "6543"          #PostgreSQL defaults to 5432, but Supabase uses a custom one (6543 here) for load balancing or routing.
    }
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency to get DB session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def setup_rating_triggers():
    """Set up automatic rating update triggers"""
    print("🔧 Setting up automatic rating triggers...")
    
    try:
        db = SessionLocal()
        
        # Drop existing triggers/functions if they exist
        drop_commands = [
            "DROP TRIGGER IF EXISTS trigger_update_song_average_rating ON user_song_ratings;",
            "DROP FUNCTION IF EXISTS update_song_average_rating() CASCADE;",
        ]
        
        for cmd in drop_commands:
            try:
                db.execute(text(cmd))
            except Exception:
                pass  # Ignore errors if they don't exist
        
        # Create the trigger function
        trigger_function = """
        CREATE OR REPLACE FUNCTION update_song_average_rating()
        RETURNS TRIGGER AS $$
        DECLARE
            song_id_to_update TEXT;
            new_avg_rating NUMERIC;
            new_rating_count INTEGER;
        BEGIN
            -- Determine which song to update based on the operation
            IF TG_OP = 'DELETE' THEN
                song_id_to_update = OLD.song_id;
            ELSE
                song_id_to_update = NEW.song_id;
            END IF;
            
            -- Calculate the new average and count
            SELECT 
                COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0),
                COUNT(*)
            INTO new_avg_rating, new_rating_count
            FROM user_song_ratings 
            WHERE song_id = song_id_to_update;
            
            -- Update the song table
            UPDATE songs 
            SET 
                average_rating = new_avg_rating,
                rating_count = new_rating_count,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = song_id_to_update;
            
            RETURN COALESCE(NEW, OLD);
        END;
        $$ LANGUAGE plpgsql;
        """
        
        db.execute(text(trigger_function))
        
        # Create the trigger
        create_trigger = """
        CREATE TRIGGER trigger_update_song_average_rating
            AFTER INSERT OR UPDATE OR DELETE ON user_song_ratings
            FOR EACH ROW
            EXECUTE FUNCTION update_song_average_rating();
        """
        
        db.execute(text(create_trigger))
        db.commit()
        
        print("✅ Rating triggers set up successfully")
        
    except Exception as e:
        print(f"⚠️ Warning: Could not set up triggers: {e}")
        print("   (Triggers will be set up when first rating is created)")
    finally:
        db.close()


def create_tables():
    """Create all tables in the database and set up triggers"""
    print("📋 Creating database tables...")
    
    # Create tables from models
    Base.metadata.create_all(bind=engine)
    
    # Set up automatic triggers
    setup_rating_triggers()
    
    print("✅ Database setup complete")