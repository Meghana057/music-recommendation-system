import json
from typing import List, Dict, Any
from app.schemas import SongCreate
import os


def load_json_data(file_path: str) -> Dict[str, Any]:
    """Load JSON data from file"""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"JSON file not found: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as file:
        return json.load(file)


def normalize_json_to_songs(json_data: Dict[str, Any]) -> List[SongCreate]:
    """
    Convert the nested JSON structure to normalized Song objects
    
    Expected JSON structure:
    {
        "id": {"0": "song_id_1", "1": "song_id_2", ...},
        "title": {"0": "title_1", "1": "title_2", ...},
        "danceability": {"0": 0.521, "1": 0.735, ...},
        ...
    }
    """
    songs = []
    
    # Get the first key to determine the number of songs
    first_key = next(iter(json_data.keys()))
    num_songs = len(json_data[first_key])
    
    # Required fields mapping - map JSON keys to our schema
    field_mapping = {
        'id': 'id',
        'title': 'title',
        'danceability': 'danceability',
        'energy': 'energy',
        'key': 'key',
        'loudness': 'loudness',
        'mode': 'mode',
        'acousticness': 'acousticness',
        'instrumentalness': 'instrumentalness',
        'liveness': 'liveness',
        'valence': 'valence',
        'tempo': 'tempo',
        'duration_ms': 'duration_ms',
        'time_signature': 'time_signature',
        'num_bars': 'num_bars',
        'num_sections': 'num_sections',
        'num_segments': 'num_segments',
        'class': 'class_label'  # 'class' is reserved keyword, map to 'class_label'
    }
    
    # Validate that all required fields are present
    missing_fields = []
    for json_key in field_mapping.keys():
        if json_key not in json_data:
            missing_fields.append(json_key)
    
    if missing_fields:
        raise ValueError(f"Missing required fields in JSON: {missing_fields}")
    
    # Process each song
    for i in range(num_songs):
        song_data = {}
        
        # Extract data for this song index
        for json_key, schema_key in field_mapping.items():
            index_str = str(i)
            if index_str not in json_data[json_key]:
                raise ValueError(f"Missing data for song index {i} in field '{json_key}'")
            
            value = json_data[json_key][index_str]
            
            # Type conversion and validation
            if schema_key in ['danceability', 'energy', 'acousticness', 'instrumentalness', 
                             'liveness', 'valence', 'loudness', 'tempo']:
                song_data[schema_key] = float(value)
            elif schema_key in ['key', 'mode', 'duration_ms', 'time_signature', 
                               'num_bars', 'num_sections', 'num_segments', 'class_label']:
                song_data[schema_key] = int(value)
            else:  # String fields like id, title
                song_data[schema_key] = str(value).strip()
        
        # Add default rating
        song_data['rating'] = 0.0
        
        # Create and validate the song object
        try:
            song = SongCreate(**song_data)
            songs.append(song)
        except Exception as e:
            print(f"Error creating song at index {i}: {e}")
            print(f"Song data: {song_data}")
            raise
    
    return songs


def validate_song_data(song_data: Dict[str, Any]) -> bool:
    """Validate individual song data"""
    required_fields = [
        'id', 'title', 'danceability', 'energy', 'key', 'loudness', 'mode',
        'acousticness', 'instrumentalness', 'liveness', 'valence', 'tempo',
        'duration_ms', 'time_signature', 'num_bars', 'num_sections', 
        'num_segments', 'class_label'
    ]
    
    for field in required_fields:
        if field not in song_data:
            return False
    
    return True


def get_sample_json_structure() -> str:
    """Return a sample JSON structure for documentation"""
    return """
    Expected JSON structure:
    {
        "id": {"0": "5vYA1mW9g2Coh1HUFUSmlb", "1": "2klCjJcucgGQysgH170npL", ...},
        "title": {"0": "3AM", "1": "4 Walls", ...},
        "danceability": {"0": 0.521, "1": 0.735, ...},
        "energy": {"0": 0.673, "1": 0.849, ...},
        "key": {"0": 8, "1": 4, ...},
        "loudness": {"0": -8.685, "1": -4.308, ...},
        "mode": {"0": 1, "1": 0, ...},
        "acousticness": {"0": 0.00573, "1": 0.212, ...},
        "instrumentalness": {"0": 0.0, "1": 0.0000294, ...},
        "liveness": {"0": 0.12, "1": 0.0608, ...},
        "valence": {"0": 0.543, "1": 0.223, ...},
        "tempo": {"0": 108.031, "1": 125.972, ...},
        "duration_ms": {"0": 225947, "1": 207477, ...},
        "time_signature": {"0": 4, "1": 4, ...},
        "num_bars": {"0": 100, "1": 107, ...},
        "num_sections": {"0": 8, "1": 7, ...},
        "num_segments": {"0": 830, "1": 999, ...},
        "class": {"0": 1, "1": 1, ...}
    }
    """