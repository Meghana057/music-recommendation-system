// src/components/StarRating.tsx

import React, { useState, useCallback } from 'react';
import { Box, Rating, Typography, Tooltip, CircularProgress, Chip, Divider } from '@mui/material';
import { Star, StarBorder, People as PeopleIcon, Person as PersonIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useRating } from '../hooks/useRating';

interface StarRatingProps {
  songId: string;
  songTitle: string;
  currentRating: number; // User's personal rating
  averageRating: number; // Community average rating
  ratingCount: number; // Total number of ratings
  onRatingChange?: (newRating: number) => void;
  onRatingSuccess?: (songId: string, newUserRating: number, newAverage: number, newCount: number) => void; // Enhanced callback
  readOnly?: boolean;
  size?: 'small' | 'medium' | 'large';
  showAverage?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
  songId,
  songTitle,
  currentRating,
  averageRating,
  ratingCount,
  onRatingChange,
  onRatingSuccess,
  readOnly = false,
  size = 'medium',
  showAverage = true,
}) => {
  const [hoverRating, setHoverRating] = useState<number>(-1);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const { user } = useAuth();
  const { rating, ratingLoading, ratingError } = useRating();

  const calculateNewAverage = (oldAverage: number, oldCount: number, oldUserRating: number, newUserRating: number) => {
    if (oldCount === 0) {
      return newUserRating;
    }
    
    // If user had no previous rating, add to count
    if (oldUserRating === 0) {
      return ((oldAverage * oldCount) + newUserRating) / (oldCount + 1);
    }
    
    // If user is updating existing rating
    return ((oldAverage * oldCount) - oldUserRating + newUserRating) / oldCount;
  };

  const handleRatingChange = useCallback(async (event: React.SyntheticEvent, newValue: number | null) => {
    if (readOnly || newValue === null || isUpdating) return;

    if (!user) {
      alert('Please sign in to rate songs');
      return;
    }

    setIsUpdating(true);
    
    // Calculate optimistic updates
    const wasFirstRating = currentRating === 0;
    const newCount = wasFirstRating ? ratingCount + 1 : ratingCount;
    const newAverage = calculateNewAverage(averageRating, ratingCount, currentRating, newValue);
    
    // Immediate optimistic update
    if (onRatingSuccess) {
      onRatingSuccess(songId, newValue, newAverage, newCount);
    }
    
    if (onRatingChange) {
      onRatingChange(newValue);
    }
    
    try {
      const success = await rating(songId, newValue);
      if (!success) {
        // If API call failed, we might want to revert the optimistic update
        // For now, we'll let the error show and the user can try again
        console.error('Rating API call failed');
      }
    } catch (error) {
      console.error('Error updating rating:', error);
      // In a production app, you might want to revert the optimistic update here
    } finally {
      setIsUpdating(false);
    }
  }, [songId, rating, onRatingChange, onRatingSuccess, readOnly, user, isUpdating, currentRating, averageRating, ratingCount]);

  const handleMouseEnter = useCallback((event: React.SyntheticEvent, newValue: number) => {
    if (!readOnly && user && !isUpdating) {
      setHoverRating(newValue);
    }
  }, [readOnly, user, isUpdating]);

  const handleMouseLeave = useCallback(() => {
    if (!readOnly && !isUpdating) {
      setHoverRating(-1);
    }
  }, [readOnly, isUpdating]);

  const displayRating = hoverRating !== -1 ? hoverRating : currentRating;

  // Show updating state (but don't block the UI completely)
  const showLoadingIndicator = isUpdating || ratingLoading;

  return (
    <Box display="flex" flexDirection="column" alignItems="flex-start" gap={1}>
      {/* Personal Rating */}
      <Box display="flex" alignItems="center" gap={1}>
        <PersonIcon fontSize="small" color="action" />
        <Tooltip
          title={
            !user
              ? 'Sign in to rate songs'
              : readOnly
              ? `Your rating: ${currentRating}/5 stars`
              : `Rate "${songTitle}" (${displayRating}/5 stars)`
          }
          arrow
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Rating
              name={`personal-rating-${songId}`}
              value={currentRating}
              onChange={handleRatingChange}
              onChangeActive={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              readOnly={readOnly || !user}
              precision={0.5}
              size={size}
              icon={<Star fontSize="inherit" />}
              emptyIcon={<StarBorder fontSize="inherit" />}
              sx={{
                '& .MuiRating-iconFilled': {
                  color: '#ffd700',
                },
                '& .MuiRating-iconHover': {
                  color: '#ffed4e',
                },
                '& .MuiRating-iconEmpty': {
                  color: user ? 'action.disabled' : 'action.disabled',
                  opacity: user ? 1 : 0.3,
                },
              }}
            />
            <Box display="flex" alignItems="center" gap={0.5} sx={{ minWidth: '3em' }}>
              <Typography variant="body2" color="text.secondary">
                {currentRating > 0 ? currentRating.toFixed(1) : user ? '—' : '?'}
              </Typography>
              {showLoadingIndicator && <CircularProgress size={12} />}
            </Box>
          </Box>
        </Tooltip>
      </Box>

      {/* Community Average Rating */}
      {showAverage && (
        <>
          <Divider sx={{ width: '100%', my: 0.5 }} />
          <Box display="flex" alignItems="center" gap={1}>
            <PeopleIcon fontSize="small" color="action" />
            <Tooltip
              title={`Community average: ${averageRating.toFixed(1)}/5 stars from ${ratingCount} ${ratingCount === 1 ? 'rating' : 'ratings'}`}
              arrow
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Rating
                  value={averageRating}
                  readOnly
                  precision={0.1}
                  size={size === 'large' ? 'medium' : 'small'}
                  icon={<Star fontSize="inherit" />}
                  emptyIcon={<StarBorder fontSize="inherit" />}
                  sx={{
                    '& .MuiRating-iconFilled': {
                      color: '#ff9800', // Different color for community rating
                    },
                    '& .MuiRating-iconEmpty': {
                      color: 'action.disabled',
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: '2em' }}>
                  {averageRating > 0 ? averageRating.toFixed(1) : '—'}
                </Typography>
                <Chip
                  label={`${ratingCount} ${ratingCount === 1 ? 'rating' : 'ratings'}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              </Box>
            </Tooltip>
          </Box>
        </>
      )}
      
      {/* Error Display */}
      {ratingError && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
          {ratingError}
        </Typography>
      )}

      {/* Authentication Prompt */}
      {!user && (
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          Sign in to rate
        </Typography>
      )}
    </Box>
  );
};

export default StarRating;