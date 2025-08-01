// src/components/MusicRecommendations.tsx - STABLE VERSION

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  Alert,
  Paper,
  Skeleton,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  MusicNote as MusicNoteIcon,
} from '@mui/icons-material';
import { ApiService } from '../services/api';
import { SongRecommendation, RecommendationsResponse, ApiError } from '../types';
import { formatDuration, formatNumber, getKeyName, getModeName } from '../utils';
import { useAuth } from '../contexts/AuthContext';

type ComponentState = 'loading' | 'no-user' | 'error' | 'no-data' | 'success';

const MusicRecommendations: React.FC = () => {
  const [state, setState] = useState<ComponentState>('loading');
  const [recommendations, setRecommendations] = useState<SongRecommendation[]>([]);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const { user, loading: authLoading } = useAuth();

  const fetchRecommendations = useCallback(async () => {
    // Don't fetch if no user or auth still loading
    if (authLoading || !user) {
      if (!authLoading && !user) {
        setState('no-user');
      }
      return;
    }

    setState('loading');
    
    try {
      const response: RecommendationsResponse = await ApiService.getRecommendations(12);
      
      setRecommendations(response.recommendations);
      setMessage(response.message);
      
      // Set final state based on results
      if (response.recommendations.length > 0) {
        setState('success');
      } else {
        setState('no-data');
      }
      
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.detail || 'Failed to get recommendations');
      setState('error');
    }
  }, [user, authLoading]);

  // Single effect to handle all state changes
  useEffect(() => {
    if (authLoading) {
      setState('loading');
    } else if (!user) {
      setState('no-user');
    } else {
      // User is available, fetch recommendations
      fetchRecommendations();
    }
  }, [user, authLoading, fetchRecommendations]);

  const handleRefresh = () => {
    if (user && !authLoading) {
      fetchRecommendations();
    }
  };

  // Render based on single state
  switch (state) {
    case 'loading':
      return (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight="600">
              Music Recommendations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI-powered suggestions based on your ratings
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card elevation={2}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Skeleton variant="text" width="70%" height={32} />
                      <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
                    </Box>
                    <Skeleton variant="rectangular" height={40} sx={{ mb: 2, borderRadius: 1 }} />
                    <Box display="flex" gap={1} mb={2}>
                      <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                      <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                      <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                    </Box>
                    <Skeleton variant="text" width="100%" />
                    <Skeleton variant="text" width="80%" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      );

    case 'no-user':
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <Paper elevation={2} sx={{ p: 4, textAlign: 'center', maxWidth: 600 }}>
            <MusicNoteIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Sign In for Recommendations
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Get AI-powered music recommendations based on your ratings!
            </Typography>
          </Paper>
        </Box>
      );

    case 'error':
      return (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight="600">
              Music Recommendations
            </Typography>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
            >
              Try Again
            </Button>
          </Box>
          
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        </Box>
      );

    case 'no-data':
      return (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h5" fontWeight="600" gutterBottom>
                Music Recommendations
              </Typography>
              <Typography variant="body2" color="text.secondary">
                AI-powered suggestions based on your ratings
              </Typography>
            </Box>
            
            <Tooltip title="Get fresh recommendations">
              <IconButton onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {message && (
            <Alert severity="info" sx={{ mb: 3 }}>
              {message}
            </Alert>
          )}

          <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
            <MusicNoteIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Recommendations Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Rate more songs (4-5 stars) to get personalized recommendations!
            </Typography>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
            >
              Check Again
            </Button>
          </Paper>

          <Paper elevation={1} sx={{ p: 3, mt: 4, backgroundColor: 'background.default' }}>
            <Typography variant="body2" color="text.secondary">
              <strong>💡 Tip:</strong> Rate more songs to improve your recommendations. 
              The AI analyzes your highly-rated songs to find similar music you might enjoy.
            </Typography>
          </Paper>
        </Box>
      );

    case 'success':
      return (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h5" fontWeight="600" gutterBottom>
                Music Recommendations
              </Typography>
              <Typography variant="body2" color="text.secondary">
                AI-powered suggestions based on your ratings
              </Typography>
            </Box>
            
            <Tooltip title="Get fresh recommendations">
              <IconButton onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {message && (
            <Alert severity="info" sx={{ mb: 3 }}>
              {message}
            </Alert>
          )}

          <Grid container spacing={3}>
            {recommendations.map((song) => (
              <Grid item xs={12} sm={6} md={4} key={song.id}>
                <Card 
                  elevation={2}
                  sx={{ 
                    height: '100%',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    }
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" fontWeight="600" sx={{ flex: 1, mr: 1 }}>
                        {song.title}
                      </Typography>
                      <Chip
                        label={`${song.match_score}%`}
                        size="small"
                        color={song.match_score >= 90 ? 'success' : song.match_score >= 75 ? 'info' : 'warning'}
                        variant="filled"
                      />
                    </Box>

                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        fontStyle: 'italic',
                        mb: 2,
                        backgroundColor: 'action.hover',
                        p: 1,
                        borderRadius: 1,
                      }}
                    >
                      {song.reason}
                    </Typography>

                    <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                      <Chip
                        label={`Energy: ${formatNumber(song.energy)}`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`Dance: ${formatNumber(song.danceability)}`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`${Math.round(song.tempo)} BPM`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>

                    <Typography variant="caption" color="text.secondary" display="block">
                      {formatDuration(song.duration_ms)} • {getKeyName(song.key)} {getModeName(song.mode)}
                    </Typography>
                    
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      {song.average_rating > 0 
                        ? `★ ${song.average_rating.toFixed(1)} (${song.rating_count} ratings)`
                        : 'No ratings yet'
                      }
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Paper elevation={1} sx={{ p: 3, mt: 4, backgroundColor: 'background.default' }}>
            <Typography variant="body2" color="text.secondary">
              <strong>💡 Tip:</strong> Rate more songs to improve your recommendations. 
              The AI analyzes your highly-rated songs to find similar music you might enjoy.
            </Typography>
          </Paper>
        </Box>
      );

    default:
      return null;
  }
};

export default MusicRecommendations;