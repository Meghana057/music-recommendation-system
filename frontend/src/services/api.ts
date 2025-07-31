// src/services/api.ts

import axios, { AxiosResponse } from 'axios';
import { supabase } from '../config/supabase';
import { Song, PaginatedResponse, SearchResponse, RatingRequest, ApiError, UserProfile, UserRating } from '../types';
import { API_BASE_URL, HEALTH_CHECK_URL } from '../config/constants';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to get auth headers
// In src/services/api.ts, update getAuthHeaders function:
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } 

    return headers;
  } catch (error) {
    console.error('Error getting auth headers:', error);
    return { 'Content-Type': 'application/json' };
  }
};

// Request interceptor to add auth headers
apiClient.interceptors.request.use(
  async (config) => {
    const authHeaders = await getAuthHeaders();
    config.headers = { ...config.headers, ...authHeaders } as any;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const apiError: ApiError = {
      detail: error.response?.data?.detail || error.message || 'An unknown error occurred',
      status: error.response?.status || 500,
    };
    return Promise.reject(apiError);
  }
);

export class ApiService {
  /**
   * Fetch paginated songs with user ratings if authenticated
   */
  static async getSongs(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Song>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Song>>('/songs/', {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      throw new Error((error as any)?.detail || 'API error');
    }
  }

  /**
   * Search for a song by title with user rating if authenticated
   */
  static async searchSong(title: string): Promise<SearchResponse> {
    try {
      const encodedTitle = encodeURIComponent(title.trim());
      const response = await apiClient.get<SearchResponse>(`/songs/search/${encodedTitle}`);
      return response.data;
    } catch (error) {
      throw new Error((error as any)?.detail || 'API error');
    }
  }

  /**
   * Rate a song (requires authentication)
   */
  static async rateSong(songId: string, rating: number): Promise<Song> {
    try {
      const ratingData: RatingRequest = { rating };
      const response = await apiClient.post<Song>(`/songs/${songId}/rate`, ratingData);
      return response.data;
    } catch (error) {
      throw new Error((error as any)?.detail || 'API error');
    }
  }

  /**
   * Get song by ID with user rating if authenticated
   */
  static async getSongById(songId: string): Promise<Song> {
    try {
      const response = await apiClient.get<Song>(`/songs/${songId}`);
      return response.data;
    } catch (error) {
      throw new Error((error as any)?.detail || 'API error');
    }
  }

  /**
   * Get songs count
   */
  static async getSongsCount(): Promise<{ total_songs: number }> {
    try {
      const response = await apiClient.get<{ total_songs: number }>('/songs/stats/count');
      return response.data;
    } catch (error) {
      throw new Error((error as any)?.detail || 'API error');
    }
  }

  /**
   * Get all user's ratings (requires authentication)
   */
  static async getUserRatings(): Promise<UserRating[]> {
    try {
      const response = await apiClient.get<UserRating[]>('/songs/user/ratings');
      return response.data;
    } catch (error) {
      throw new Error((error as any)?.detail || 'API error');
    }
  }

  /**
   * Get user profile (requires authentication)
   */
  static async getUserProfile(): Promise<UserProfile> {
    try {
      const response = await apiClient.get<UserProfile>('/songs/user/profile');
      return response.data;
    } catch (error) {
      throw new Error((error as any)?.detail || 'API error');
    }
  }

  /**
   * Health check (no authentication required)
   */
  static async healthCheck(): Promise<{ status: string; service: string }> {
    try {
      const response = await axios.get<{ status: string; service: string }>(HEALTH_CHECK_URL, {
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      throw new Error((error as any)?.detail || 'API error');
    }
  }

  /**
   * Get all songs for CSV export (paginated approach to avoid memory issues)
   */
  static async getAllSongs(): Promise<Song[]> {
    try {
      const allSongs: Song[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const data = await this.getSongs(page, 100); // Max limit
        allSongs.push(...data.items);
        hasMore = data.has_next;
        page++;
        
        // Safety check to prevent infinite loops
        if (page > data.pages) {
          break;
        }
      }

      return allSongs;
    } catch (error) {
      throw new Error((error as any)?.detail || 'API error');
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session?.access_token;
    } catch (error) {
      return false;
    }
  }
}