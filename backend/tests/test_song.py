import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import get_db, Base
from app import crud, schemas
import tempfile
import os

# Create a temporary database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(scope="module")
def setup_database():
    """Set up test database"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    """Get database session for testing"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_song_data():
    """Sample song data for testing"""
    return {
        "id": "test_song_123",
        "title": "Test Song",
        "danceability": 0.75,
        "energy": 0.85,
        "key": 5,
        "loudness": -5.5,
        "mode": 1,
        "acousticness": 0.15,
        "instrumentalness": 0.0,
        "liveness": 0.12,
        "valence": 0.65,
        "tempo": 120.0,
        "duration_ms": 210000,
        "time_signature": 4,
        "num_bars": 100,
        "num_sections": 8,
        "num_segments": 850,
        "class_label": 1,
        "rating": 0.0
    }


class TestSongsAPI:
    """Test cases for Songs API endpoints"""
    
    def test_read_root(self, setup_database):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
    
    def test_health_check(self, setup_database):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
    
    def test_get_songs_empty_database(self, setup_database):
        """Test getting songs from empty database"""
        response = client.get("/api/v1/songs/")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["items"] == []
        assert data["page"] == 1
    
    def test_create_song(self, setup_database, sample_song_data):
        """Test creating a new song"""
        response = client.post("/api/v1/songs/", json=sample_song_data)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == sample_song_data["title"]
        assert data["id"] == sample_song_data["id"]
    
    def test_create_duplicate_song(self, setup_database, sample_song_data):
        """Test creating a song with duplicate ID"""
        # Create first song
        client.post("/api/v1/songs/", json=sample_song_data)
        
        # Try to create duplicate
        response = client.post("/api/v1/songs/", json=sample_song_data)
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]
    
    def test_get_songs_with_data(self, setup_database, sample_song_data):
        """Test getting songs when database has data"""
        # Create a song first
        client.post("/api/v1/songs/", json=sample_song_data)
        
        # Get songs
        response = client.get("/api/v1/songs/")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["title"] == sample_song_data["title"]
    
    def test_get_songs_pagination(self, setup_database, sample_song_data):
        """Test pagination functionality"""
        # Create multiple songs
        for i in range(15):
            song_data = sample_song_data.copy()
            song_data["id"] = f"test_song_{i}"
            song_data["title"] = f"Test Song {i}"
            client.post("/api/v1/songs/", json=song_data)
        
        # Test first page
        response = client.get("/api/v1/songs/?page=1&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 15
        assert len(data["items"]) == 10
        assert data["page"] == 1
        assert data["has_next"] is True
        assert data["has_prev"] is False
        
        # Test second page
        response = client.get("/api/v1/songs/?page=2&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 5
        assert data["page"] == 2
        assert data["has_next"] is False
        assert data["has_prev"] is True
    
    def test_get_song_by_id(self, setup_database, sample_song_data):
        """Test getting song by ID"""
        # Create a song first
        client.post("/api/v1/songs/", json=sample_song_data)
        
        # Get song by ID
        response = client.get(f"/api/v1/songs/{sample_song_data['id']}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_song_data["id"]
        assert data["title"] == sample_song_data["title"]
    
    def test_get_nonexistent_song_by_id(self, setup_database):
        """Test getting nonexistent song by ID"""
        response = client.get("/api/v1/songs/nonexistent_id")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]
    
    def test_search_song_by_title(self, setup_database, sample_song_data):
        """Test searching song by title"""
        # Create a song first
        client.post("/api/v1/songs/", json=sample_song_data)
        
        # Search by exact title
        response = client.get(f"/api/v1/songs/search/{sample_song_data['title']}")
        assert response.status_code == 200
        data = response.json()
        assert data["found"] is True
        assert data["song"]["title"] == sample_song_data["title"]
    
    def test_search_song_case_insensitive(self, setup_database, sample_song_data):
        """Test case-insensitive title search"""
        # Create a song first
        client.post("/api/v1/songs/", json=sample_song_data)
        
        # Search with different case
        response = client.get(f"/api/v1/songs/search/{sample_song_data['title'].upper()}")
        assert response.status_code == 200
        data = response.json()
        assert data["found"] is True
    
    def test_search_nonexistent_song(self, setup_database):
        """Test searching for nonexistent song"""
        response = client.get("/api/v1/songs/search/Nonexistent Song")
        assert response.status_code == 200
        data = response.json()
        assert data["found"] is False
        assert data["song"] is None
    
    def test_rate_song(self, setup_database, sample_song_data):
        """Test rating a song"""
        # Create a song first
        client.post("/api/v1/songs/", json=sample_song_data)
        
        # Rate the song
        rating_data = {"rating": 4.5}
        response = client.post(f"/api/v1/songs/{sample_song_data['id']}/rate", json=rating_data)
        assert response.status_code == 200
        data = response.json()
        assert data["rating"] == 4.5
    
    def test_rate_nonexistent_song(self, setup_database):
        """Test rating a nonexistent song"""
        rating_data = {"rating": 4.5}
        response = client.post("/api/v1/songs/nonexistent_id/rate", json=rating_data)
        assert response.status_code == 404
    
    def test_invalid_rating(self, setup_database, sample_song_data):
        """Test invalid rating values"""
        # Create a song first
        client.post("/api/v1/songs/", json=sample_song_data)
        
        # Test rating too high
        rating_data = {"rating": 6.0}
        response = client.post(f"/api/v1/songs/{sample_song_data['id']}/rate", json=rating_data)
        assert response.status_code == 422
        
        # Test negative rating
        rating_data = {"rating": -1.0}
        response = client.post(f"/api/v1/songs/{sample_song_data['id']}/rate", json=rating_data)
        assert response.status_code == 422
    
    def test_get_songs_count(self, setup_database, sample_song_data):
        """Test getting total songs count"""
        # Initially should be 0
        response = client.get("/api/v1/songs/stats/count")
        assert response.status_code == 200
        assert response.json()["total_songs"] == 0
        
        # Create a song
        client.post("/api/v1/songs/", json=sample_song_data)
        
        # Count should be 1
        response = client.get("/api/v1/songs/stats/count")
        assert response.status_code == 200
        assert response.json()["total_songs"] == 1


class TestDataProcessor:
    """Test cases for data processing utilities"""
    
    def test_invalid_json_structure(self):
        """Test handling of invalid JSON structure"""
        from app.utils.data_processor import normalize_json_to_songs
        
        invalid_json = {"invalid": "structure"}
        
        with pytest.raises(ValueError):
            normalize_json_to_songs(invalid_json)
    
    def test_missing_required_fields(self):
        """Test handling of missing required fields"""
        from app.utils.data_processor import normalize_json_to_songs
        
        incomplete_json = {
            "id": {"0": "test_id"},
            "title": {"0": "test_title"}
            # Missing other required fields
        }
        
        with pytest.raises(ValueError):
            normalize_json_to_songs(incomplete_json)


if __name__ == "__main__":
    pytest.main([__file__])