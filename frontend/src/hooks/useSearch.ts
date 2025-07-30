// src/hooks/useSearch.ts

import { useState, useCallback } from 'react';
import { Song, ApiError } from '../types';
import { ApiService } from '../services/api';

interface UseSearchReturn {
  searchResult: Song | null;
  searching: boolean;
  searchError: string | null;
  searchSong: (title: string) => Promise<void>;
  clearSearch: () => void;
  updateSearchResult: (songId: string, newUserRating: number, newAverage: number, newCount: number) => void;
}

export const useSearch = (): UseSearchReturn => {
  const [searchResult, setSearchResult] = useState<Song | null>(null);
  const [searching, setSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchSong = useCallback(async (title: string) => {
    if (!title.trim()) {
      setSearchError('Please enter a song title');
      return;
    }

    try {
      setSearching(true);
      setSearchError(null);
      setSearchResult(null);

      const response = await ApiService.searchSong(title);
      
      if (response.found && response.song) {
        setSearchResult(response.song);
      } else {
        setSearchError(response.message || `Song "${title}" not found`);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setSearchError(apiError.detail || 'Search failed');
    } finally {
      setSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResult(null);
    setSearchError(null);
  }, []);

  // New function to update search result optimistically
  const updateSearchResult = useCallback((songId: string, newUserRating: number, newAverage: number, newCount: number) => {
    setSearchResult(prevResult => {
      if (prevResult && prevResult.id === songId) {
        return {
          ...prevResult,
          user_rating: newUserRating,
          average_rating: newAverage,
          rating_count: newCount
        };
      }
      return prevResult;
    });
  }, []);

  return {
    searchResult,
    searching,
    searchError,
    searchSong,
    clearSearch,
    updateSearchResult,
  };
};