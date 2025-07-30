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
  onRatingSuccess?: () => void; // NEW: Simple callback when rating succeeds
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
  onRatingSuccess, // NEW
  readOnly = false,
  size = 'medium',
  showAverage = true,
}) => {
  const [hoverRating, setHoverRating] = useState<number>(-1);
  const [isUpdating, setIsUpdating] = useState<boolean>(false); // NEW: Local loading state
  const { user } = useAuth();
  const { rating, ratingLoading, ratingError } = useRating();

  const handleRatingChange = useCallback(async (event: React.SyntheticEvent, newValue: number | null) => {
    if (readOnly || newValue === null || isUpdating) return;

    if (!user) {
      alert('Please sign in to rate songs');
      return;
    }

    setIsUpdating(true);
    
    try {
      const success = await rating(songId, newValue);
      if (success) {
        // Immediate callback
        if (onRatingChange) {
          onRatingChange(newValue);
        }
        
        // Trigger refresh after a short delay
        if (onRatingSuccess) {
          setTimeout(() => {
            onRatingSuccess();
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error updating rating:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [songId, rating, onRatingChange, onRatingSuccess, readOnly, user, isUpdating]);

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

  // Show updating state
  if (isUpdating) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          Updating...
        </Typography>
      </Box>
    );
  }

  // Show loading state from hook
  if (ratingLoading) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          Updating...
        </Typography>
      </Box>
    );
  }

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
              readOnly={readOnly || !user || isUpdating}
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
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: '2em' }}>
              {currentRating > 0 ? currentRating.toFixed(1) : user ? '—' : '?'}
            </Typography>
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