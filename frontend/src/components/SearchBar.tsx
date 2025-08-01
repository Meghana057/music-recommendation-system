// src/components/SearchBar.tsx

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Fade,
  Chip,
  Popper,
  ClickAwayListener,
  MenuList,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  MusicNote as MusicNoteIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useSearch } from '../hooks/useSearch';
import { ApiService } from '../services/api';
import { Song } from '../types';
import StarRating from './StarRating';

interface SearchBarProps {
  onSongFound?: (song: any) => void;
  placeholder?: string;
  onRatingUpdate?: (songId: string, newUserRating: number, newAverage: number, newCount: number) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSongFound,
  placeholder = "Search for songs... (e.g., '21 guns', 'beautiful', 'cold')",
  onRatingUpdate
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchSuggestions, setSearchSuggestions] = useState<Song[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);

  
  const { searchResult, searching, searchError, searchSong, clearSearch, updateSearchResult } = useSearch();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Common song suggestions for autocomplete (from your playlist data)
  const commonSongs = [
    "3AM", "4 Walls", "11:11", "21 Guns", "21", "24/7", "24K Magic",
    "All Mine", "All Night", "American Idiot", "Bad Romance", "Beautiful Day",
    "Believer", "Blank Space", "Call Me Baby", "Castle on the Hill", 
    "Chasing Cars", "Closer", "Cold", "Beautiful Girls", "Bleeding Love",
    "BOOMBAYAH", "Breakeven", "Breathe Again", "Burning Up (Fire)",
    "Can't Fight The Moonlight", "Car Radio", "Celebration Song"
  ];

  // Get search suggestions based on input
  const getSearchSuggestions = (input: string): string[] => {
    if (!input.trim()) return [];
    return commonSongs
      .filter(song => song.toLowerCase().includes(input.toLowerCase()))
      .slice(0, 5);
  };

  // Smart search with multiple strategies using your ApiService
  const smartSearch = async (query: string): Promise<Song[]> => {
    if (!query.trim()) return [];

    const strategies = [
      query,                          // Exact: "21 guns"
      query.replace(/\s+/g, ''),     // No spaces: "21guns"  
      query.split(' ')[0],           // First word: "21"
      query.split(' ').pop() || '',  // Last word: "guns"
      query.toLowerCase(),           // Lowercase: "21 guns"
      query.charAt(0).toUpperCase() + query.slice(1).toLowerCase(), // Title case
      ...query.split(' ').filter(word => word.length > 2), // Individual words > 2 chars
    ];

    const allResults: Song[] = [];
    
    for (const searchTerm of strategies) {
      if (!searchTerm || searchTerm.length < 1) continue;
      
      try {
        const result = await ApiService.searchSong(searchTerm);
        if (result.found && result.song) {
          allResults.push(result.song);
        }
      } catch (e) {
        // Continue with next strategy if this one fails
        continue;
      }
    }

    // Remove duplicates based on song ID
    const uniqueResults = allResults.filter((song, index, arr) => 
      arr.findIndex(s => s.id === song.id) === index
    );

    return uniqueResults;
  };

  // Live search for suggestions (debounced)
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Don't show suggestions if there's already a search result with the same title
    if (searchResult && searchResult.title === searchTerm.trim()) {
      setShowSuggestions(false);
      return;
    }

    const delayedSearch = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      
      // Only show suggestions if input is focused and no search result matches
      if (document.activeElement === inputRef.current && (!searchResult || searchResult.title !== searchTerm.trim())) {
        setShowSuggestions(true);
      }
      
      try {
        const results = await smartSearch(searchTerm);
        setSearchSuggestions(results.slice(0, 5)); // Show max 5 suggestions
      } catch (error) {
        console.error('Suggestion search error:', error);
        setSearchSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, searchResult]);

  // Handle main search (Get Song button)
  const handleSearch = useCallback(async () => {
    if (searchTerm.trim()) {
      setShowSuggestions(false);
      await searchSong(searchTerm.trim());
      
      if (searchResult && onSongFound) {
        onSongFound(searchResult);
      }
    }
  }, [searchTerm, searchSong, searchResult, onSongFound]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback(async (suggestion: Song | string) => {
    const title = typeof suggestion === 'string' ? suggestion : suggestion.title;
    
    // Immediately close dropdown and clear suggestions
    setShowSuggestions(false);
    setSearchSuggestions([]);
    setSearchTerm(title);
    
    // Perform the search
    await searchSong(title);
    
    // If it's a song object and we have onSongFound callback
    if (typeof suggestion === 'object' && onSongFound) {
      onSongFound(suggestion);
    }
  }, [searchSong, onSongFound]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
  }, []);

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (searchSuggestions.length > 0 && showSuggestions) {
        handleSuggestionClick(searchSuggestions[0]);
      } else {
        handleSearch();
      }
    } else if (event.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [handleSearch, searchSuggestions, showSuggestions, handleSuggestionClick]);

  const handleInputFocus = useCallback(() => {
    // Only show suggestions if there's no current search result matching the input
    if (searchTerm.trim() && (!searchResult || searchResult.title !== searchTerm.trim())) {
      setShowSuggestions(true);
    }
  }, [searchTerm, searchResult]);

  // Updated handleClear to clear both search term AND search results
  const handleClear = useCallback(() => {
    setSearchTerm('');
    setShowSuggestions(false);
    setSearchSuggestions([]);
    clearSearch();
  }, [clearSearch]);

  const handleRatingChange = useCallback((newRating: number) => {
    // This is handled by the StarRating component with optimistic updates
  }, []);

  const handleRatingSuccess = useCallback((songId: string, newUserRating: number, newAverage: number, newCount: number) => {
    // Update the search result optimistically
    updateSearchResult(songId, newUserRating, newAverage, newCount);
    
    // Also update global state (table + analytics)
    if (onRatingUpdate) {
      onRatingUpdate(songId, newUserRating, newAverage, newCount);
    }
  }, [updateSearchResult, onRatingUpdate]);

  // Format duration helper
  const formatDuration = (durationMs: number): string => {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const textSuggestions = getSearchSuggestions(searchTerm);
  const hasResults = searchSuggestions.length > 0;
  const hasSuggestions = textSuggestions.length > 0;
  const shouldShowSuggestions = showSuggestions && (hasResults || hasSuggestions || isLoadingSuggestions);

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
      {/* Search Input */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={1} alignItems="center" ref={searchRef}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onFocus={handleInputFocus}
            disabled={searching}
            inputRef={inputRef}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              endAdornment: searchTerm && (
                <IconButton
                  size="small"
                  onClick={handleClear}
                  disabled={searching}
                >
                  <ClearIcon />
                </IconButton>
              ),
            }}
            inputProps={{
              autoComplete: 'off',
              'data-form-type': 'other',
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={searching || !searchTerm.trim()}
            startIcon={searching ? <CircularProgress size={18} /> : <SearchIcon />}
            sx={{ minWidth: 120 }}
          >
            {searching ? 'Searching...' : 'Get Song'}
          </Button>
        </Box>

        {/* Suggestions Dropdown */}
        <Popper
          open={shouldShowSuggestions}
          anchorEl={inputRef.current}
          placement="bottom-start"
          style={{ width: inputRef.current?.offsetWidth, zIndex: 1300 }}
        >
          <ClickAwayListener onClickAway={() => setShowSuggestions(false)}>
            <Paper elevation={8} sx={{ mt: 1, maxHeight: 300, overflow: 'auto' }}>
              <MenuList dense>
                {/* Loading */}
                {isLoadingSuggestions && (
                  <MenuItem disabled>
                    <ListItemIcon>
                      <CircularProgress size={20} />
                    </ListItemIcon>
                    <ListItemText primary="Searching..." />
                  </MenuItem>
                )}

                {/* Search Results */}
                {hasResults && !isLoadingSuggestions && (
                  <>
                    <MenuItem disabled>
                      <ListItemText 
                        primary="Found Songs" 
                        primaryTypographyProps={{ variant: 'caption', fontWeight: 'bold' }}
                      />
                    </MenuItem>
                    {searchSuggestions.map((song) => (
                      <MenuItem
                        key={song.id}
                        onClick={() => handleSuggestionClick(song)}
                        sx={{ pl: 3 }}
                      >
                        <ListItemIcon>
                          <MusicNoteIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={song.title}
                          secondary={`Energy: ${(song.energy * 100).toFixed(0)}% • Duration: ${formatDuration(song.duration_ms)}`}
                        />
                      </MenuItem>
                    ))}
                    {(hasSuggestions) && <Divider />}
                  </>
                )}

                {/* Text Suggestions */}
                {hasSuggestions && !isLoadingSuggestions && (
                  <>
                    <MenuItem disabled>
                      <ListItemText 
                        primary="Suggestions" 
                        primaryTypographyProps={{ variant: 'caption', fontWeight: 'bold' }}
                      />
                    </MenuItem>
                    {textSuggestions.map((suggestion) => (
                      <MenuItem
                        key={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        sx={{ pl: 3 }}
                      >
                        <ListItemIcon>
                          <TrendingUpIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={suggestion} />
                      </MenuItem>
                    ))}
                  </>
                )}

                {/* No Results */}
                {!hasResults && !hasSuggestions && !isLoadingSuggestions && searchTerm.trim() && (
                  <MenuItem disabled>
                    <ListItemText 
                      primary={`No songs found for "${searchTerm}"`}
                      secondary="Try searching for '21 guns', 'beautiful', or 'american'"
                    />
                  </MenuItem>
                )}
              </MenuList>
            </Paper>
          </ClickAwayListener>
        </Popper>
      </Paper>

      {/* Search Error */}
      {searchError && (
        <Fade in={true}>
          <Alert 
            severity="warning" 
            sx={{ mb: 2 }}
            action={
              <IconButton
                size="small"
                onClick={handleClear}
              >
                <ClearIcon />
              </IconButton>
            }
          >
            {searchError}
          </Alert>
        </Fade>
      )}

      {/* Search Result */}
      {searchResult && (
        <Fade in={true}>
          <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
            <Box display="flex" alignItems="flex-start" gap={2}>
              <MusicNoteIcon color="primary" sx={{ mt: 0.5 }} />
              
              <Box flex={1}>
                <Typography variant="h6" gutterBottom>
                  {searchResult.title}
                </Typography>
                
                <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                  <Chip 
                    label={`Energy: ${searchResult.energy.toFixed(3)}`} 
                    size="small" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={`Danceability: ${searchResult.danceability.toFixed(3)}`} 
                    size="small" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={`Tempo: ${Math.round(searchResult.tempo)} BPM`} 
                    size="small" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={`Valence: ${searchResult.valence.toFixed(3)}`} 
                    size="small" 
                    variant="outlined" 
                  />
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <StarRating
                    songId={searchResult.id}
                    songTitle={searchResult.title}
                    currentRating={searchResult.user_rating || 0}
                    averageRating={searchResult.average_rating}
                    ratingCount={searchResult.rating_count}
                    onRatingChange={handleRatingChange}
                    onRatingSuccess={handleRatingSuccess}
                    readOnly={false}
                    size="medium"
                  />
                  
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleClear}
                    startIcon={<ClearIcon />}
                  >
                    Clear Result
                  </Button>
                </Box>

                {/* Additional song details */}
                <Box sx={{ mt: 2, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Song Details:</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ID: {searchResult.id} • Duration: {Math.round(searchResult.duration_ms / 1000)}s • 
                    Key: {searchResult.key} • Mode: {searchResult.mode === 1 ? 'Major' : 'Minor'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Fade>
      )}

      {/* Quick Search Tips */}
      {!searchResult && !searchError && !searching && (
        <Paper elevation={1} sx={{ p: 2, backgroundColor: 'background.default' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Enhanced Search Tips:</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Start typing to see live suggestions (e.g., "gun" → finds "21 Guns")
            <br />
            • Use partial matches like "beautiful", "american", or "cold"
            <br />
            • Click suggestions or press Enter to search
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default SearchBar;