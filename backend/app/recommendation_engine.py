# backend/app/recommendation_engine.py - SMART AI + ML VERSION

import openai
import os
import numpy as np
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, not_, func
import logging
import json
from statistics import mean
from datetime import datetime, timedelta
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
import pickle
import hashlib
from app.models import Song, UserSongRating

logger = logging.getLogger(__name__)

class SmartRecommendationEngine:
    def __init__(self):
        self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        # In-memory cache for taste profiles (use Redis in production)
        self.taste_cache = {}
        self.cache_duration = timedelta(hours=24)  # Cache for 24 hours
        
        # Feature weights for similarity calculation
        self.feature_weights = {
            'energy': 0.25,
            'valence': 0.25, 
            'danceability': 0.20,
            'acousticness': 0.15,
            'tempo': 0.10,
            'loudness': 0.05
        }
    
    def get_user_recommendations(self, db: Session, user_id: str, limit: int = 10) -> Dict:
        """
        Get smart AI + ML powered recommendations
        """
        start_time = datetime.now()
        
        try:
            # 1. Get user's rating history (4+ stars for quality data)
            user_ratings = self._get_user_ratings(db, user_id)
            
            print(f"🎵 Found {len(user_ratings)} highly-rated songs for user {user_id}")
            
            if len(user_ratings) < 2:
                # Not enough data - return diverse popular songs
                recommendations = self._get_smart_popular_songs(db, limit)
                return {
                    'recommendations': recommendations,
                    'total_user_ratings': len(user_ratings),
                    'taste_profile': None,
                    'message': f'Need more ratings! Rate 3+ songs (4-5 stars) to get AI-powered recommendations.'
                }
            
            # 2. Get or generate AI taste profile (with caching)
            taste_profile = self._get_cached_taste_profile(user_id, user_ratings)
            
            # 3. Get candidate songs for recommendation
            candidates = self._get_recommendation_candidates(db, user_id, limit * 4)  # Get 4x candidates
            
            if len(candidates) < limit:
                # Not enough candidates - supplement with popular songs
                popular_songs = self._get_smart_popular_songs(db, limit - len(candidates))
                candidates.extend(popular_songs)
            
            print(f"🔍 Analyzing {len(candidates)} candidate songs")
            
            # 4. Smart ML-based scoring
            scored_recommendations = self._score_candidates_ml(candidates, taste_profile, user_ratings)
            
            # 5. Apply diversity and quality filters
            final_recommendations = self._apply_smart_filters(scored_recommendations, limit)
            
            # 6. Convert to response format
            recommendations = self._format_recommendations(final_recommendations)
            
            elapsed = (datetime.now() - start_time).total_seconds()
            print(f"⚡ Generated {len(recommendations)} recommendations in {elapsed:.2f}s")
            
            return {
                'recommendations': recommendations,
                'total_user_ratings': len(user_ratings),
                'taste_profile': taste_profile.get('description', 'Music enthusiast'),
                'message': f'🎯 Found {len(recommendations)} AI-powered recommendations in {elapsed:.1f}s!'
            }
            
        except Exception as e:
            logger.error(f"Smart recommendation error for user {user_id}: {str(e)}")
            print(f"❌ ERROR: {str(e)}")
            
            # Fallback to basic popular songs
            recommendations = self._get_smart_popular_songs(db, limit)
            return {
                'recommendations': recommendations,
                'total_user_ratings': 0,
                'taste_profile': None,
                'message': 'AI temporarily unavailable. Showing quality popular songs.'
            }
    
    def _get_user_ratings(self, db: Session, user_id: str) -> List[Dict]:
        """Get user's highly-rated songs for taste analysis"""
        ratings = db.query(UserSongRating, Song).join(
            Song, UserSongRating.song_id == Song.id
        ).filter(
            UserSongRating.user_id == user_id,
            UserSongRating.rating >= 4.0  # Only high-quality ratings
        ).order_by(UserSongRating.rating.desc()).limit(25).all()
        
        user_ratings = []
        for rating, song in ratings:
            user_ratings.append({
                'song_id': song.id,
                'title': song.title,
                'rating': rating.rating,
                'energy': song.energy,
                'valence': song.valence,
                'danceability': song.danceability,
                'acousticness': song.acousticness,
                'tempo': song.tempo / 200.0,  # Normalize tempo to 0-1 range
                'loudness': (song.loudness + 30) / 30.0,  # Normalize loudness to 0-1 range
                'instrumentalness': song.instrumentalness,
                'liveness': song.liveness,
                'key': song.key,
                'mode': song.mode
            })
        
        return user_ratings
    
    def _get_cached_taste_profile(self, user_id: str, user_ratings: List[Dict]) -> Dict:
        """Get AI taste profile with smart caching"""
        # Create cache key based on user ratings
        ratings_hash = hashlib.md5(
            json.dumps([f"{r['song_id']}:{r['rating']}" for r in user_ratings], sort_keys=True).encode()
        ).hexdigest() 
        
        cache_key = f"{user_id}_{ratings_hash}"
        
        # Check cache first
        if cache_key in self.taste_cache:
            cached_profile, timestamp = self.taste_cache[cache_key]
            if datetime.now() - timestamp < self.cache_duration:
                print("📋 Using cached taste profile")
                return cached_profile
        
        # Generate new AI profile
        print("🧠 Generating AI taste profile...")
        taste_profile = self._analyze_taste_with_ai(user_ratings)
        
        # Cache the result
        self.taste_cache[cache_key] = (taste_profile, datetime.now())
        
        return taste_profile
    
    def _analyze_taste_with_ai(self, user_ratings: List[Dict]) -> Dict:
        """Use OpenAI to analyze user's music taste"""
        try:
            # Calculate user's average preferences
            avg_features = {
                'energy': mean([r['energy'] for r in user_ratings]),
                'valence': mean([r['valence'] for r in user_ratings]),
                'danceability': mean([r['danceability'] for r in user_ratings]),
                'acousticness': mean([r['acousticness'] for r in user_ratings]),
                'tempo': mean([r['tempo'] for r in user_ratings]) * 200,  # Denormalize for AI
                'instrumentalness': mean([r['instrumentalness'] for r in user_ratings]),
            }
            
            # Get top-rated songs for context
            top_songs = [r['title'] for r in sorted(user_ratings, key=lambda x: x['rating'], reverse=True)[:8]]
            
            prompt = f"""Analyze this user's music taste based on their top-rated songs:

Favorite Songs: {', '.join(top_songs)}

Audio Feature Analysis:
- Energy: {avg_features['energy']:.3f} (0=calm, 1=intense)
- Valence: {avg_features['valence']:.3f} (0=sad, 1=happy)
- Danceability: {avg_features['danceability']:.3f} (0=not danceable, 1=very danceable)
- Acousticness: {avg_features['acousticness']:.3f} (0=electronic, 1=acoustic)
- Tempo: {avg_features['tempo']:.0f} BPM
- Instrumentalness: {avg_features['instrumentalness']:.3f} (0=vocal, 1=instrumental)

Create a detailed music taste profile. Return ONLY valid JSON:
{{
  "description": "Brief, engaging description of user's taste",
  "preferred_ranges": {{
    "energy": [min, max],
    "valence": [min, max],
    "danceability": [min, max],
    "acousticness": [min, max],
    "tempo": [min, max],
    "instrumentalness": [min, max]
  }},
  "style_keywords": ["keyword1", "keyword2", "keyword3"],
  "avoid_features": {{
    "energy": [avoid_min, avoid_max],
    "valence": [avoid_min, avoid_max]
  }}
}}"""

            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert music analyst. Generate precise taste profiles and return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.3
            )
            
            profile = json.loads(response.choices[0].message.content.strip())
            print(f"🎯 AI Profile: {profile['description']}")
            
            return profile
            
        except Exception as e:
            print(f"⚠️ AI analysis failed: {e}, using mathematical fallback")
            return self._generate_mathematical_profile(user_ratings)
    
    def _generate_mathematical_profile(self, user_ratings: List[Dict]) -> Dict:
        """Fallback: Generate taste profile using statistics"""
        if not user_ratings:
            return {"description": "Music explorer", "preferred_ranges": {}}
        
        # Calculate statistical preferences
        features = ['energy', 'valence', 'danceability', 'acousticness', 'tempo', 'instrumentalness']
        preferred_ranges = {}
        
        for feature in features:
            values = [r[feature] for r in user_ratings]
            mean_val = mean(values)
            std_val = np.std(values) if len(values) > 1 else 0.2
            
            # Create preference range (mean ± 1 std dev, clamped to [0,1])
            min_val = max(0, mean_val - std_val)
            max_val = min(1, mean_val + std_val)
            preferred_ranges[feature] = [min_val, max_val]
        
        # Generate description based on features
        avg_energy = mean([r['energy'] for r in user_ratings])
        avg_valence = mean([r['valence'] for r in user_ratings])
        avg_dance = mean([r['danceability'] for r in user_ratings])
        
        style_parts = []
        if avg_energy > 0.7: style_parts.append("high-energy")
        elif avg_energy < 0.3: style_parts.append("chill")
        
        if avg_valence > 0.7: style_parts.append("upbeat")
        elif avg_valence < 0.3: style_parts.append("emotional")
        
        if avg_dance > 0.7: style_parts.append("danceable")
        
        description = f"Enjoys {' '.join(style_parts)} music" if style_parts else "Diverse music taste"
        
        return {
            "description": description,
            "preferred_ranges": preferred_ranges,
            "style_keywords": style_parts,
            "avoid_features": {}
        }
    
    def _get_recommendation_candidates(self, db: Session, user_id: str, limit: int) -> List[Song]:
        """Get smart candidate songs for recommendation"""
        # Get songs user hasn't rated
        rated_song_ids = db.query(UserSongRating.song_id).filter(
            UserSongRating.user_id == user_id
        ).subquery()
        
        # Smart filtering: Get diverse candidates across different audio features
        candidates = db.query(Song).filter(
            not_(Song.id.in_(rated_song_ids))
        ).order_by(
            func.random()  # Randomize to avoid always getting same songs
        ).limit(limit).all()
        
        return candidates
    
    def _score_candidates_ml(self, candidates: List[Song], taste_profile: Dict, user_ratings: List[Dict]) -> List[Tuple[Song, float, str]]:
        """Score candidates using machine learning algorithms"""
        if not candidates or not user_ratings:
            return [(song, 50.0, "Popular choice") for song in candidates]
        
        scored_songs = []
        preferred_ranges = taste_profile.get('preferred_ranges', {})
        
        # Create user preference vector from their ratings
        user_features = []
        for rating_data in user_ratings:
            user_features.append([
                rating_data['energy'],
                rating_data['valence'], 
                rating_data['danceability'],
                rating_data['acousticness'],
                rating_data['tempo'],
                rating_data['instrumentalness']
            ])
        
        # Calculate user's centroid (average preferences)
        user_centroid = np.mean(user_features, axis=0) if user_features else np.array([0.5] * 6)
        
        for song in candidates:
            # Create song feature vector
            song_vector = np.array([
                song.energy,
                song.valence,
                song.danceability, 
                song.acousticness,
                song.tempo / 200.0,  # Normalize tempo
                song.instrumentalness
            ])
            
            # Calculate cosine similarity
            similarity = cosine_similarity([user_centroid], [song_vector])[0][0]
            
            # Apply preference range scoring
            range_score = self._calculate_range_score(song, preferred_ranges)
            
            # Combine scores with weights
            final_score = (similarity * 0.6 + range_score * 0.4) * 100
            
            # Add small popularity boost for well-rated songs
            if song.rating_count > 0:
                popularity_boost = min(5, song.average_rating)
                final_score += popularity_boost
            
            # Generate intelligent reason
            reason = self._generate_smart_reason(song, taste_profile, similarity)
            
            scored_songs.append((song, final_score, reason))
        
        # Sort by score
        scored_songs.sort(key=lambda x: x[1], reverse=True)
        return scored_songs
    
    def _calculate_range_score(self, song: Song, preferred_ranges: Dict) -> float:
        """Calculate how well song fits user's preferred ranges"""
        if not preferred_ranges:
            return 0.7  # Neutral score
        
        feature_scores = []
        song_features = {
            'energy': song.energy,
            'valence': song.valence,
            'danceability': song.danceability,
            'acousticness': song.acousticness,
            'tempo': song.tempo / 200.0,
            'instrumentalness': song.instrumentalness
        }
        
        for feature, value in song_features.items():
            if feature in preferred_ranges:
                min_pref, max_pref = preferred_ranges[feature]
                
                if min_pref <= value <= max_pref:
                    feature_scores.append(1.0)  # Perfect match
                else:
                    # Calculate penalty based on distance from range
                    if value < min_pref:
                        distance = min_pref - value
                    else:
                        distance = value - max_pref
                    
                    # Exponential decay penalty
                    penalty = np.exp(-distance * 3)
                    feature_scores.append(penalty)
        
        return mean(feature_scores) if feature_scores else 0.7
    
    def _generate_smart_reason(self, song: Song, taste_profile: Dict, similarity: float) -> str:
        """Generate intelligent reason based on AI profile and similarity"""
        style_keywords = taste_profile.get('style_keywords', [])
        
        reasons = []
        
        # Feature-based reasons
        if song.energy > 0.7 and 'high-energy' in style_keywords:
            reasons.append("matches your high-energy preference")
        elif song.energy < 0.3 and 'chill' in style_keywords:
            reasons.append("fits your chill music taste")
        
        if song.valence > 0.7 and 'upbeat' in style_keywords:
            reasons.append("upbeat vibe like your favorites")
        elif song.valence < 0.3 and 'emotional' in style_keywords:
            reasons.append("emotional depth you enjoy")
        
        if song.danceability > 0.7 and 'danceable' in style_keywords:
            reasons.append("great danceability match")
        
        if song.acousticness > 0.5:
            reasons.append("acoustic elements")
        
        # Similarity-based reasons
        if similarity > 0.8:
            reasons.append("very similar to your top songs")
        elif similarity > 0.6:
            reasons.append("similar to songs you love")
        
        if not reasons:
            if similarity > 0.5:
                reasons = ["good match for your taste"]
            else:
                reasons = ["might expand your musical horizons"]
        
        return f"Recommended for its {' and '.join(reasons[:2])}"
    
    def _apply_smart_filters(self, scored_songs: List[Tuple[Song, float, str]], limit: int) -> List[Tuple[Song, float, str]]:
        """Apply diversity and quality filters"""
        if len(scored_songs) <= limit:
            return scored_songs
        
        filtered_songs = []
        used_keys = set()
        used_tempos = set()
        
        for song, score, reason in scored_songs:
            # Diversity filters
            tempo_range = int(song.tempo // 20) * 20  # Group by 20 BPM ranges
            
            # Skip if we already have too many songs in same key or tempo range
            if len(filtered_songs) >= limit // 2:  # Apply diversity after getting half
                if song.key in used_keys and len([s for s in filtered_songs if s[0].key == song.key]) >= 2:
                    continue
                if tempo_range in used_tempos and len([s for s in filtered_songs if int(s[0].tempo // 20) * 20 == tempo_range]) >= 2:
                    continue
            
            filtered_songs.append((song, score, reason))
            used_keys.add(song.key)
            used_tempos.add(tempo_range)
            
            if len(filtered_songs) >= limit:
                break
        
        return filtered_songs
    
    def _format_recommendations(self, scored_songs: List[Tuple[Song, float, str]]) -> List[Dict]:
        """Format recommendations for API response"""
        recommendations = []
        
        for song, score, reason in scored_songs:
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
                'average_rating': song.average_rating,
                'rating_count': song.rating_count,
                'created_at': song.created_at,
                'updated_at': song.updated_at,
                'match_score': min(99, max(60, int(score))),  # Clamp to 60-99 range
                'reason': reason
            })
        
        return recommendations
    
    def _get_smart_popular_songs(self, db: Session, limit: int) -> List[Dict]:
        """Get diverse popular songs as fallback"""
        popular_songs = db.query(Song).filter(
            Song.rating_count > 0
        ).order_by(
            Song.average_rating.desc(),
            Song.rating_count.desc()
        ).limit(limit * 2).all()  # Get more to ensure diversity
        
        # Apply diversity to popular songs
        diverse_songs = []
        used_keys = set()
        
        for song in popular_songs:
            if len(diverse_songs) >= limit:
                break
                
            # Ensure diversity in popular recommendations too
            if len(diverse_songs) >= limit // 2 and song.key in used_keys:
                continue
                
            diverse_songs.append(song)
            used_keys.add(song.key)
        
        recommendations = []
        for i, song in enumerate(diverse_songs[:limit]):
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
                'average_rating': song.average_rating,
                'rating_count': song.rating_count,
                'created_at': song.created_at,
                'updated_at': song.updated_at,
                'match_score': 85 - (i * 2),  # Decreasing scores for popular songs
                'reason': f"Popular {'and well-rated' if song.average_rating > 4 else ''} song"
            })
        
        return recommendations

# Global instance
recommendation_engine = SmartRecommendationEngine()