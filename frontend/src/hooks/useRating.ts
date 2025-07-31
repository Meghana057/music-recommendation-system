// src/hooks/useRating.ts

import { useState, useCallback } from 'react';
import { ApiError } from '../types';
import { ApiService } from '../services/api';

interface UseRatingReturn {
  rating: (songId: string, rating: number) => Promise<boolean>;
  ratingLoading: boolean;
  ratingError: string | null;
}

export const useRating = (): UseRatingReturn => {
  const [ratingLoading, setRatingLoading] = useState<boolean>(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  const rating = useCallback(async (songId: string, ratingValue: number): Promise<boolean> => {
    if (ratingValue < 0 || ratingValue > 5) {
      setRatingError('Rating must be between 0 and 5');
      return false;
    }

    try {
      setRatingLoading(true);
      setRatingError(null);

      const result = await ApiService.rateSong(songId, ratingValue);
      
      // Validate response has required rating field
      if (result && typeof result === 'object' && 'rating' in result && result.rating !== undefined) {
        return true;
      } else {
        setRatingError('Invalid response from server');
        return false;
      }
    } catch (err) {
      const apiError = err as ApiError;
      setRatingError(apiError.detail || 'Failed to rate song');
      return false;
    } finally {
      setRatingLoading(false);
    }
  }, []);

  return {
    rating,
    ratingLoading,
    ratingError,
  };
};