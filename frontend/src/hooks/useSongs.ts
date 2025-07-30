// src/hooks/useSongs.ts

import { useState, useEffect, useCallback } from 'react';
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

  const fetchSongs = useCallback(async (page: number = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.getSongs(page, limit);
      
      let { items } = response;
      
      // Apply client-side sorting if configured
      if (sortConfig) {
        items = sortSongs(items, sortConfig.field, sortConfig.direction);
      }
      
      setSongs(items);
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
      setSongs([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, sortConfig]);

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

  const refetch = useCallback(() => fetchSongs(currentPage), [fetchSongs, currentPage]);

  // Fixed useEffect dependency
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
  };
};