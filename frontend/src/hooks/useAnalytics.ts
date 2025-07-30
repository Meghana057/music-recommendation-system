// src/hooks/useAnalytics.ts

import { useState, useEffect, useCallback } from 'react';
import { Song, ApiError, UserRating } from '../types';
import { ApiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface AnalyticsData {
  allSongs: Song[];
  totalRatedSongs: number;
  userRatings: UserRating[];
}

interface UseAnalyticsReturn {
  analyticsData: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateRatedSongsCount: (songId: string, newUserRating: number, oldUserRating: number) => void;
}

export const useAnalytics = (): UseAnalyticsReturn => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all songs for charts (using limit 100 to get all songs)
      const allSongsResponse = await ApiService.getSongs(1, 100);
      
      // Fetch user ratings for total count (only if authenticated)
      let userRatings: UserRating[] = [];
      let totalRatedSongs = 0;
      
      if (user) {
        try {
          userRatings = await ApiService.getUserRatings();
          totalRatedSongs = userRatings.filter(rating => rating.rating > 0).length;
        } catch (ratingsError) {
          console.warn('Failed to fetch user ratings (probably not authenticated)');
          // If not authenticated, count rated songs from current page only
          totalRatedSongs = allSongsResponse.items.filter(song => song.user_rating && song.user_rating > 0).length;
        }
      }

      setAnalyticsData({
        allSongs: allSongsResponse.items,
        totalRatedSongs,
        userRatings
      });

    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.detail || 'Failed to fetch analytics data');
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Optimistic update for rated songs count
  const updateRatedSongsCount = useCallback((songId: string, newUserRating: number, oldUserRating: number) => {
    setAnalyticsData(prevData => {
      if (!prevData) return prevData;

      // Calculate the change in rated songs count
      const wasRatedBefore = oldUserRating > 0;
      const isRatedNow = newUserRating > 0;
      
      let countChange = 0;
      if (!wasRatedBefore && isRatedNow) {
        countChange = 1; // New rating
      } else if (wasRatedBefore && !isRatedNow) {
        countChange = -1; // Rating removed (if that's possible)
      }
      // If was rated before and still rated, no count change

      return {
        ...prevData,
        totalRatedSongs: Math.max(0, prevData.totalRatedSongs + countChange),
        allSongs: prevData.allSongs.map(song =>
          song.id === songId
            ? { ...song, user_rating: newUserRating }
            : song
        )
      };
    });
  }, []);

  const refetch = useCallback(() => fetchAnalyticsData(), [fetchAnalyticsData]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  return {
    analyticsData,
    loading,
    error,
    refetch,
    updateRatedSongsCount,
  };
};