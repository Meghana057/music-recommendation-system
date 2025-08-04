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
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  MusicNote as MusicNoteIcon,
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
  placeholder = "Search for songs... (e.g., '21 guns', 'afterlif', 'beautiful')",
  onRatingUpdate
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchSuggestions, setSearchSuggestions] = useState<Song[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);

  const { searchResult, searching, searchError, searchSong, clearSearch, updateSearchResult } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  // Simple search - just call the API once
  const fetchSuggestions = async (query: string): Promise<Song[]> => {
    if (!query.trim()) return [];

    try {
      const result = await ApiService.searchSong(query);
      
      // Backend returns single song, wrap in array for dropdown
      if (result && result.found && result.song) {
        return [result.song];
      }
      
      return [];
    } catch (error) {
      return [];
    }
  };

  // Live search for suggestions - NO debouncing, NO minimum characters
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

    const searchForSuggestions = async () => {
      setIsLoadingSuggestions(true);
      
      // Only show suggestions if input is focused
      if (document.activeElement === inputRef.current) {
        setShowSuggestions(true);
      }
      
      try {
        const results = await fetchSuggestions(searchTerm);
        setSearchSuggestions(results);
      } catch (error) {
        console.error('Suggestion search error:', error);
        setSearchSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    searchForSuggestions();
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
  const handleSuggestionClick = useCallback(async (suggestion: Song) => {
    setShowSuggestions(false);
    setSearchSuggestions([]);
    setSearchTerm(suggestion.title);
    
    await searchSong(suggestion.title);
    
    if (onSongFound) {
      onSongFound(suggestion);
    }
  }, [searchSong, onSongFound]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
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
    if (searchTerm.trim() && (!searchResult || searchResult.title !== searchTerm.trim())) {
      setShowSuggestions(true);
    }
  }, [searchTerm, searchResult]);

  const handleClear = useCallback(() => {
    setSearchTerm('');
    setShowSuggestions(false);
    setSearchSuggestions([]);
    clearSearch();
  }, [clearSearch]);

  const handleRatingSuccess = useCallback((songId: string, newUserRating: number, newAverage: number, newCount: number) => {
    updateSearchResult(songId, newUserRating, newAverage, newCount);
    
    if (onRatingUpdate) {
      onRatingUpdate(songId, newUserRating, newAverage, newCount);
    }
  }, [updateSearchResult, onRatingUpdate]);

  const formatDuration = (durationMs: number): string => {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const hasResults = searchSuggestions.length > 0;
  const shouldShowSuggestions = showSuggestions && (hasResults || isLoadingSuggestions);

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
      {/* Search Input */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={1} alignItems="center">
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
                  </>
                )}

                {/* No Results */}
                {!hasResults && !isLoadingSuggestions && searchTerm.trim() && (
                  <MenuItem disabled>
                    <ListItemText 
                      primary={`No songs found for "${searchTerm}"`}
                      secondary="Try '3AM', 'beautiful', or 'afterlif'"
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
                    onRatingChange={() => {}}
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
            <strong>Enhanced Search:</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Partial matches work: "afterlif" finds "Afterlife"
            <br />
            • Try "3AM", "beautiful", "american", or any song title
            <br />
            • Start typing to see live suggestions
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default SearchBar;