// src/types/index.ts

export interface Song {
  index: number;
  id: string;
  title: string;
  danceability: number;
  energy: number;
  key: number;
  loudness: number;
  mode: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  valence: number;
  tempo: number;
  duration_ms: number;
  time_signature: number;
  num_bars: number;
  num_sections: number;
  num_segments: number;
  class_label: number;
  user_rating?: number;
  average_rating: number; // Community average rating
  rating_count: number; // Total number of ratings
  created_at: string;
  updated_at: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface SearchResponse {
  song: Song | null;
  found: boolean;
  message: string;
}

export interface RatingRequest {
  rating: number;
}

export interface ApiError {
  detail: string;
  status: number;
}

export interface ChartDataPoint {
  x: number;
  y: number;
  title?: string;
}

export interface HistogramData {
  label: string;
  count: number;
  range: string;
}

export interface BarChartData {
  label: string;
  value: number;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: keyof Song;
  direction: SortDirection;
}

export type ThemeMode = 'light' | 'dark';

// Authentication types
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    [key: string]: any;
  };
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: AuthUser;
}

export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  total_ratings: number;
  average_rating_given: number;
  created_at: string;
}

export interface UserRating {
  song_id: string;
  song_title: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

// TYPES FOR MUSIC RECOMMENDATIONS:

export interface SongRecommendation extends Song {
  match_score: number; // 0-100 percentage match
  reason: string; // Why this song was recommended
}

export interface RecommendationsResponse {
  recommendations: SongRecommendation[];
  total_user_ratings: number;
  taste_profile: string | null;
  message: string;
}