# backend/app/recommendation_engine.py - FINAL OPTIMIZED VERSION

import openai
import os
import numpy as np
import hashlib
import json
from typing import List, Dict, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import not_, func
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.tree import DecisionTreeClassifier
from statistics import mean
from app.models import Song, UserSongRating

class MLRecommendationEngine:
    def __init__(self):
        # Initialize OpenAI client if available
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            self.client = openai.OpenAI(api_key=openai_key)
            self.openai_available = True
        else:
            self.client = None
            self.openai_available = False
        
        self.decision_tree = None
        self.taste_descriptions = {}  # Simple cache for descriptions
    
    def get_user_recommendations(self, db: Session, user_id: str, limit: int = 10) -> Dict:
        """Get ML-powered recommendations"""
        
        # 1. Get user's rating data
        user_ratings = self._get_user_ratings(db, user_id)
        
        if len(user_ratings) < 3:
            return {
                'recommendations': [],
                'total_user_ratings': len(user_ratings),
                'taste_profile': 'Rate some songs to get started!',
                'message': 'Rate 3+ songs (4-5 stars) to get personalized recommendations'
            }
        
        # 2. Train decision tree + cosine profile
        user_profile = self._train_user_model(user_ratings)
        
        # 3. Get unrated songs and score them
        candidates = self._get_unrated_songs(db, user_id)
        scored_songs = self._score_songs(candidates, user_profile)
        
        # 4. Apply diversity filter and get top recommendations
        final_recommendations = self._apply_diversity_filter(scored_songs, limit)
        
        # 5. Generate taste description (cached)
        taste_description = self._get_taste_description(user_ratings)
        
        # 6. Format response
        recommendations = self._format_recommendations(final_recommendations)
        
        return {
            'recommendations': recommendations,
            'total_user_ratings': len(user_ratings),
            'taste_profile': taste_description,
            'message': f'Based on {len(user_ratings)} rated songs'
        }
    
    def _get_user_ratings(self, db: Session, user_id: str) -> List[Dict]:
        """Get user ratings for ML training"""
        ratings = db.query(UserSongRating, Song).join(
            Song, UserSongRating.song_id == Song.id
        ).filter(
            UserSongRating.user_id == user_id
        ).all()
        
        user_data = []
        for rating, song in ratings:
            user_data.append({
                'song_id': song.id,
                'title': song.title,
                'rating': rating.rating,
                'energy': song.energy,
                'valence': song.valence,
                'danceability': song.danceability,
                'acousticness': song.acousticness,
                'tempo': song.tempo / 200.0,
                'instrumentalness': song.instrumentalness,
                'liked': 1 if rating.rating >= 4.0 else 0
            })
        
        return user_data
    
    def _train_user_model(self, user_ratings: List[Dict]) -> Dict:
        """Train decision tree + calculate cosine profile"""
        liked_songs = [r for r in user_ratings if r['liked'] == 1]
        
        # Calculate cosine similarity profile
        cosine_profile = self._calculate_cosine_profile(liked_songs)
        
        # Train decision tree if enough data
        if len(user_ratings) >= 5:
            try:
                features = [[r['energy'], r['valence'], r['danceability'], 
                           r['acousticness'], r['tempo'], r['instrumentalness']] 
                          for r in user_ratings]
                labels = [r['liked'] for r in user_ratings]
                
                dt = DecisionTreeClassifier(max_depth=4, min_samples_split=3, random_state=42)
                dt.fit(features, labels)
                self.decision_tree = dt
                
                return {
                    'method': 'decision_tree',
                    'tree_model': dt,
                    'cosine_profile': cosine_profile
                }
            except:
                pass
        
        return {
            'method': 'simple',
            'cosine_profile': cosine_profile
        }
    
    def _calculate_cosine_profile(self, liked_songs: List[Dict]) -> np.array:
        """Calculate average profile of liked songs"""
        if not liked_songs:
            return np.array([0.5] * 6)      
        features = []
        for song in liked_songs:
            weight = song['rating'] / 5.0
            features.append([
                song['energy'] * weight,
                song['valence'] * weight,
                song['danceability'] * weight,
                song['acousticness'] * weight,
                song['tempo'] * weight,
                song['instrumentalness'] * weight
            ])
        
        return np.mean(features, axis=0)
    
    def _get_unrated_songs(self, db: Session, user_id: str) -> List[Song]:
        """Get songs user hasn't rated"""
        rated_song_results = db.query(UserSongRating.song_id).filter(
            UserSongRating.user_id == user_id
        ).all()
        
        rated_song_ids = [r.song_id for r in rated_song_results]
        
        if rated_song_ids:
            return db.query(Song).filter(not_(Song.id.in_(rated_song_ids))).limit(200).all()
        else:
            return db.query(Song).limit(200).all()
    
    def _score_songs(self, candidates: List[Song], user_profile: Dict) -> List[Tuple]:
        """Score songs with proper weighted scoring"""
        scored_songs = []
        cosine_profile = user_profile['cosine_profile']
        
        for song in candidates:
            song_features = [
                song.energy, song.valence, song.danceability,
                song.acousticness, song.tempo / 200.0, song.instrumentalness
            ]
            
            # Cosine similarity score
            cosine_score = cosine_similarity([cosine_profile], [song_features])[0][0]
            
            # Decision tree score
            dt_score = 0.5
            if user_profile['method'] == 'decision_tree' and self.decision_tree:
                try:
                    dt_prob = self.decision_tree.predict_proba([song_features])[0]
                    dt_score = dt_prob[1] if len(dt_prob) > 1 else dt_prob[0]
                except:
                    dt_score = 0.5
            
            # Popularity score (normalized to 0-1 range)
            popularity_score = 0
            if song.rating_count and song.average_rating:
                popularity_score = min(1.0, song.average_rating / 5.0)  # Normalize to 0-1
            
            # PROPER WEIGHTED COMBINATION (adds up to 1.0)
            if user_profile['method'] == 'decision_tree':
                raw_score = (dt_score * 0.5) + (cosine_score * 0.3) + (popularity_score * 0.2)
            else:
                raw_score = (cosine_score * 0.7) + (popularity_score * 0.3)
            
            # Amplify differences
            final_score = raw_score ** 1.5
            
            scored_songs.append((song, final_score))
        
        scored_songs.sort(key=lambda x: x[1], reverse=True)
        return scored_songs
    
    def _apply_diversity_filter(self, scored_songs: List[Tuple], limit: int) -> List[Tuple]:
        """Apply diversity filter"""
        if len(scored_songs) <= limit:
            return scored_songs
        
        diverse_songs = []
        used_keys = set()
        used_tempos = set()
        
        for song, score in scored_songs:
            # Apply diversity after getting half the songs
            if len(diverse_songs) >= limit // 2:
                tempo_bucket = int(song.tempo // 30) * 30
                
                # Skip if too many in same key or tempo range
                if song.key in used_keys and len([s for s in diverse_songs if s[0].key == song.key]) >= 2:
                    continue
                if tempo_bucket in used_tempos and len([s for s in diverse_songs if int(s[0].tempo // 30) * 30 == tempo_bucket]) >= 2:
                    continue
            
            diverse_songs.append((song, score))
            used_keys.add(song.key)
            if len(diverse_songs) >= limit // 2:  # Only track tempos after half
                used_tempos.add(int(song.tempo // 30) * 30)
            
            if len(diverse_songs) >= limit:
                break
        
        return diverse_songs
    
    def _get_taste_description(self, user_ratings: List[Dict]) -> str:
        """Generate cached taste description"""
        liked_songs = [r for r in user_ratings if r['rating'] >= 4.0]
        
        if not liked_songs:
            return "Still discovering your preferences"
        
        # Create cache key from liked songs
        cache_key = hashlib.md5(
            json.dumps([f"{s['song_id']}:{s['rating']}" for s in liked_songs], sort_keys=True).encode()
        ).hexdigest()
        
        # Check cache first
        if cache_key in self.taste_descriptions:
            return self.taste_descriptions[cache_key]
        
        # Generate new description
        if self.openai_available and self.client:
            try:
                top_songs = [s['title'] for s in liked_songs[:4]]
                
                prompt = f"""A user loves these songs: {', '.join(top_songs)}

Write one natural sentence describing their music taste. Make it conversational and friendly. Start with "You" and keep it under 15 words.

Examples:
- "You love emotional indie rock with meaningful lyrics"
- "You're into upbeat pop songs that make you dance"
- "You prefer mellow acoustic tracks with soulful vocals"

Don't mention specific songs."""

                response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "Describe music taste in a friendly, natural way."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=30,
                    temperature=0.8
                )
                
                description = response.choices[0].message.content.strip()
                
                # Cache the result
                self.taste_descriptions[cache_key] = description
                return description
                
            except Exception as e:
                print(f"OpenAI failed: {e}")
        
        # Simple fallback
        avg_energy = mean([s['energy'] for s in liked_songs])
        avg_valence = mean([s['valence'] for s in liked_songs])
        
        if avg_energy > 0.6 and avg_valence > 0.6:
            description = "You love energetic, upbeat music"
        elif avg_energy < 0.4 and avg_valence < 0.4:
            description = "You prefer mellow, emotional songs"
        elif avg_energy > 0.6:
            description = "You're drawn to high-energy music"
        elif avg_valence > 0.6:
            description = "You enjoy positive, uplifting songs"
        else:
            description = "You have diverse musical tastes"
        
        self.taste_descriptions[cache_key] = description
        return description
    
    def _format_recommendations(self, scored_songs: List[Tuple]) -> List[Dict]:
        """Format with better score distribution"""
        recommendations = []
        
        # Calculate percentile-based scores for better distribution
        scores = [score for _, score in scored_songs]
        max_score = max(scores) if scores else 1.0
        min_score = min(scores) if scores else 0.0
        
        for i, (song, score) in enumerate(scored_songs):
            # BETTER SCORE DISTRIBUTION: Use percentile ranking
            if max_score > min_score:
                normalized_score = (score - min_score) / (max_score - min_score)
                match_score = int(60 + (normalized_score * 35))  # 60-95 range
            else:
                match_score = 90 - (i * 3)  # Decreasing scores if all similar
            
            recommendations.append({
                'index': song.index,
                'id': song.id,
                'title': song.title,
                'danceability': song.danceability,
                'energy': song.energy,
                'key': song.key,
                'loudness': song.loudness,
                'mode': song.mode,
                'acousticness': song.acousticness,
                'instrumentalness': song.instrumentalness,
                'liveness': song.liveness,
                'valence': song.valence,
                'tempo': song.tempo,
                'duration_ms': song.duration_ms,
                'time_signature': song.time_signature,
                'num_bars': song.num_bars,
                'num_sections': song.num_sections,
                'num_segments': song.num_segments,
                'class_label': song.class_label,
                'average_rating': song.average_rating or 0.0,
                'rating_count': song.rating_count or 0,
                'created_at': song.created_at,
                'updated_at': song.updated_at,
                'match_score': match_score,
                'reason': 'Recommended for you'
            })
        
        return recommendations
    
# Global instance
recommendation_engine = MLRecommendationEngine()