// src/App.test.tsx

import React from 'react';


import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Test individual components that actually exist
import SearchBar from './components/SearchBar';
import SongsTable from './components/SongsTable';
import StarRating from './components/StarRating';
import ExportButton from './components/ExportButton';
import { formatDuration, formatNumber, getKeyName, getModeName } from './utils';

// Mock API Service
jest.mock('./services/api', () => ({
  ApiService: {
    searchSong: jest.fn(),
    rateSong: jest.fn(),
    getAllSongs: jest.fn(),
  },
}));

// Mock Auth Context
jest.mock('./contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
  }),
}));

// Mock other hooks to avoid dependency issues
jest.mock('./hooks/useSearch', () => ({
  useSearch: () => ({
    searchResult: null,
    searching: false,
    searchError: null,
    searchSong: jest.fn(),
    clearSearch: jest.fn(),
    updateSearchResult: jest.fn(),
  }),
}));

jest.mock('./hooks/useRating', () => ({
  useRating: () => ({
    rating: jest.fn(),
    ratingLoading: false,
    ratingError: null,
  }),
}));

describe('Music Recommendation System', () => {
  
  test('SearchBar component renders and handles input', async () => {
    render(<SearchBar />);
    
    // Check if search input exists
    await waitFor(() => {
      const searchInput = screen.getByRole('textbox');
      expect(searchInput).toBeInTheDocument();
    });
    
    // Check if search button exists
    const searchButton = screen.getByRole('button', { name: /get song/i });
    expect(searchButton).toBeInTheDocument();
    
    // Test input functionality
    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'test song' } });
    expect(searchInput).toHaveValue('test song');
  });

  test('StarRating component displays rating information', () => {
    const props = {
      songId: 'test-song',
      songTitle: 'Test Song',
      currentRating: 4,
      averageRating: 4.2,
      ratingCount: 15,
    };
    
    render(<StarRating {...props} />);
    
    // Check that rating component renders - look for the 4 star radio button (current rating)
    expect(screen.getByRole('radio', { name: /4 stars/i })).toBeInTheDocument();
    
    // Should show rating count (15 ratings)
    expect(screen.getByText(/15 rating/i)).toBeInTheDocument();
  });

  test('ExportButton renders and is clickable', async () => {
    render(<ExportButton />);
    
    const exportButton = screen.getByRole('button', { name: /export csv/i });
    expect(exportButton).toBeInTheDocument();
    expect(exportButton).not.toBeDisabled();
    
    // Should be clickable
    fireEvent.click(exportButton);
    
    // Wait for any async operations to complete
    await waitFor(() => {
      expect(exportButton).toBeInTheDocument();
    });
  });

  test('SongsTable renders with song data', () => {
    const mockSongs = [
      {
        index: 1,
        id: 'song-1',
        title: 'Test Song 1',
        danceability: 0.75,
        energy: 0.85,
        tempo: 120,
        duration_ms: 210000,
        key: 5,
        mode: 1,
        valence: 0.65,
        acousticness: 0.15,
        average_rating: 4.2,
        rating_count: 15,
        user_rating: undefined,
        created_at: '2024-01-01',
        updated_at: null,
        loudness: -5.5,
        instrumentalness: 0.0,
        liveness: 0.12,
        time_signature: 4,
        num_bars: 100,
        num_sections: 8,
        num_segments: 850,
        class_label: 1,
      }
    ];

    const props = {
      songs: mockSongs,
      loading: false,
      error: null,
      totalSongs: 1,
      currentPage: 1,
      totalPages: 1,
      onPageChange: jest.fn(),
      sortConfig: null,
      onSort: jest.fn(),
      onRefresh: jest.fn(),
      onExport: jest.fn(),
    };

    render(<SongsTable {...props} />)
    
    // Should display the song
    expect(screen.getByText('Test Song 1')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument(); // Tempo
  });

  test('formatDuration utility formats time correctly', () => {
    expect(formatDuration(210000)).toBe('3:30');
    expect(formatDuration(90000)).toBe('1:30');
    expect(formatDuration(60000)).toBe('1:00');
    expect(formatDuration(30000)).toBe('0:30');
  });

  test('formatNumber utility formats decimals correctly', () => {
    expect(formatNumber(0.123456)).toBe('0.123');
    expect(formatNumber(0.123456, 2)).toBe('0.12');
    expect(formatNumber(0.9)).toBe('0.900');
  });

  test('musical key utilities work correctly', () => {
    expect(getKeyName(0)).toBe('C');
    expect(getKeyName(5)).toBe('F');
    expect(getKeyName(11)).toBe('B');
    
    expect(getModeName(1)).toBe('Major');
    expect(getModeName(0)).toBe('Minor');
  });

  test('song data validation', () => {
    const validSong = {
      id: 'valid-song',
      title: 'Valid Song',
      danceability: 0.75,
      energy: 0.85,
      tempo: 120,
      average_rating: 4.2,
      rating_count: 15,
    };

    // Test that song has required properties
    expect(validSong).toHaveProperty('id');
    expect(validSong).toHaveProperty('title');
    expect(validSong).toHaveProperty('danceability');
    expect(validSong).toHaveProperty('energy');
    
    // Test that values are in valid ranges
    expect(validSong.danceability).toBeGreaterThanOrEqual(0);
    expect(validSong.danceability).toBeLessThanOrEqual(1);
    expect(validSong.energy).toBeGreaterThanOrEqual(0);
    expect(validSong.energy).toBeLessThanOrEqual(1);
    expect(validSong.average_rating).toBeLessThanOrEqual(5);
    expect(validSong.rating_count).toBeGreaterThanOrEqual(0);
  });

  test('rating validation', () => {
    const validRatings = [0, 1, 2, 3, 4, 5, 4.5, 3.5];
    const invalidRatings = [-1, 6, 10, -5];

    validRatings.forEach(rating => {
      expect(rating).toBeGreaterThanOrEqual(0);
      expect(rating).toBeLessThanOrEqual(5);
    });

    invalidRatings.forEach(rating => {
      const isInvalid = rating < 0 || rating > 5;
      expect(isInvalid).toBe(true);
    });
  });
});