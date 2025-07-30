// src/hooks/useSongs.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { Song, PaginatedResponse, ApiError, SortConfig } from '../types';
import { ApiService } from '../services/api';
import { sortSongs } from '../utils';

interface UseSongsReturn {
  songs: Song[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  totalSongs: number;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  sortConfig: SortConfig | null;
  handleSort: (field: keyof Song) => void;
  updateSongRating: (songId: string, newUserRating: number, newAverage: number, newCount: number) => void;
}

export const useSongs = (initialPage: number = 1, limit: number = 10): UseSongsReturn => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [paginationData, setPaginationData] = useState<Omit<PaginatedResponse<Song>, 'items'>>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    has_next: false,
    has_prev: false,
  });
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  
  // Store raw data separately from sorted data
  const [rawSongs, setRawSongs] = useState<Song[]>([]);
  
  // Use ref to get current sortConfig without causing useCallback to recreate
  const sortConfigRef = useRef<SortConfig | null>(null);
  sortConfigRef.current = sortConfig;

  const fetchSongs = useCallback(async (page: number = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.getSongs(page, limit);
      
      // Store raw data
      setRawSongs(response.items);
      
      setPaginationData({
        page: response.page,
        limit: response.limit,
        total: response.total,
        pages: response.pages,
        has_next: response.has_next,
        has_prev: response.has_prev,
      });
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.detail || 'Failed to fetch songs');
      setRawSongs([]);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit]); // Removed sortConfig dependency

  // Separate effect to handle sorting when rawSongs or sortConfig changes
  useEffect(() => {
    if (rawSongs.length > 0) {
      let sortedSongs = [...rawSongs];
      
      if (sortConfigRef.current) {
        sortedSongs = sortSongs(sortedSongs, sortConfigRef.current.field, sortConfigRef.current.direction);
      }
      
      setSongs(sortedSongs);
    } else {
      setSongs([]);
    }
  }, [rawSongs, sortConfig]);

  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSort = useCallback((field: keyof Song) => {
    setSortConfig(prevConfig => {
      if (prevConfig?.field === field) {
        // Toggle direction if same field
        const newDirection = prevConfig.direction === 'asc' ? 'desc' : 'asc';
        return { field, direction: newDirection };
      } else {
        // New field, start with ascending
        return { field, direction: 'asc' };
      }
    });
  }, []);

  // Optimistic update for song ratings
  const updateSongRating = useCallback((songId: string, newUserRating: number, newAverage: number, newCount: number) => {
    const updateSongInArray = (songsArray: Song[]) => 
      songsArray.map(song => 
        song.id === songId 
          ? { 
              ...song, 
              user_rating: newUserRating,
              average_rating: newAverage,
              rating_count: newCount
            }
          : song
      );

    // Update both raw and sorted data
    setRawSongs(prevRaw => updateSongInArray(prevRaw));
    setSongs(prevSongs => updateSongInArray(prevSongs));
  }, []);

  const refetch = useCallback(() => fetchSongs(currentPage), [fetchSongs, currentPage]);

  // Initial fetch
  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  return {
    songs,
    loading,
    error,
    totalPages: paginationData.pages,
    currentPage,
    hasNext: paginationData.has_next,
    hasPrev: paginationData.has_prev,
    totalSongs: paginationData.total,
    refetch,
    setPage,
    sortConfig,
    handleSort,
    updateSongRating,
  };
};