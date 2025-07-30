// src/components/SearchBar.tsx

import React, { useState, useCallback } from 'react';
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
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  MusicNote as MusicNoteIcon,
} from '@mui/icons-material';
import { useSearch } from '../hooks/useSearch';
// import { debounce } from '../utils';
import StarRating from './StarRating';

interface SearchBarProps {
  onSongFound?: (song: any) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSongFound,
  placeholder = "Enter song title to search..."
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { searchResult, searching, searchError, searchSong, clearSearch } = useSearch();

  const handleSearch = useCallback(async () => {
    if (searchTerm.trim()) {
      await searchSong(searchTerm.trim());
      if (searchResult && onSongFound) {
        onSongFound(searchResult);
      }
    }
  }, [searchTerm, searchSong, searchResult, onSongFound]);

//   const debouncedSearch = useCallback(
//     debounce((term: string) => {
//       if (term.trim()) {
//         searchSong(term.trim());
//       }
//     }, 500),
//     [searchSong]
//   );

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    
    // Optional: Auto-search as user types
    // debouncedSearch(value);
  }, []);

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  }, [handleSearch]);

  const handleClear = useCallback(() => {
    setSearchTerm('');
    clearSearch();
  }, [clearSearch]);

  const handleRatingChange = useCallback((newRating: number) => {
    // Update the search result with new rating
    if (searchResult) {
      // The rating update is handled by the StarRating component
      // This callback can be used for additional UI updates if needed
    }
  }, [searchResult]);

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
            disabled={searching}
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
                onClick={clearSearch}
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
                    currentRating={searchResult.user_rating||0}
                    averageRating={searchResult.average_rating}
                    ratingCount={searchResult.rating_count}
                    onRatingChange={handleRatingChange}
                    size="medium"
                  />
                  
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={clearSearch}
                    startIcon={<ClearIcon />}
                  >
                    Clear Result
                  </Button>
                </Box>

                {/* Additional song details in collapsed format */}
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
            <strong>Search Tips:</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Try searching for songs like "3AM", "4 Walls", or "11:11"
            <br />
            • Search is case-insensitive and matches exact titles
            <br />
            • Press Enter or click "Get Song" to search
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default SearchBar;