// src/components/SongsTable.tsx

import React, { useState, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Box,
  Chip,
  Typography,
  IconButton,
  Tooltip,
  Skeleton,
  Alert,
  TableSortLabel,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { Song, SortConfig } from '../types';
import { formatDuration, formatNumber, getKeyName, getModeName } from '../utils';
import { useAuth } from '../contexts/AuthContext';
import StarRating from './StarRating';

interface SongsTableProps {
  songs: Song[];
  loading: boolean;
  error: string | null;
  totalSongs: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  sortConfig: SortConfig | null;
  onSort: (field: keyof Song) => void;
  onRefresh: () => void;
  onExport: () => void;
  exportLoading?: boolean;
}

const SongsTable: React.FC<SongsTableProps> = ({
  songs,
  loading,
  error,
  totalSongs,
  currentPage,
  totalPages,
  onPageChange,
  sortConfig,
  onSort,
  onRefresh,
  onExport,
  exportLoading = false,
}) => {
  const [rowsPerPage] = useState(10); // Fixed to match backend pagination
  const { user } = useAuth();

  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    onPageChange(newPage + 1); // Convert from 0-based to 1-based
  }, [onPageChange]);

  const handleSort = useCallback((field: keyof Song) => {
    onSort(field);
  }, [onSort]);

  const getSortDirection = (field: keyof Song): 'asc' | 'desc' | false => {
    if (sortConfig?.field === field) {
      return sortConfig.direction;
    }
    return false;
  };

  const handleRatingChange = useCallback((songIndex: number, newRating: number) => {
    // This would ideally trigger a refetch or update the local state
    // For now, the StarRating component handles the API call
  }, []);
  const handleRatingSuccess = useCallback(() => {
    // Refresh data after successful rating
    onRefresh();
  }, [onRefresh]);

  const getPopularityLevel = (ratingCount: number): { color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error', label: string } => {
    if (ratingCount === 0) return { color: 'default', label: 'New' };
    if (ratingCount < 5) return { color: 'primary', label: 'Rising' };
    if (ratingCount < 15) return { color: 'secondary', label: 'Popular' };
    if (ratingCount < 30) return { color: 'warning', label: 'Trending' };
    return { color: 'success', label: 'Hit' };
  };

  if (error) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <IconButton onClick={onRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          }
        >
          {error}
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={2}>
      {/* Table Header with Actions */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        p={2}
        borderBottom={1}
        borderColor="divider"
      >
        <Box>
          <Typography variant="h6">
            Songs ({totalSongs} total)
          </Typography>
          {user && (
            <Typography variant="body2" color="text.secondary">
              Showing your personal ratings and community averages
            </Typography>
          )}
        </Box>
        
        <Box display="flex" gap={1}>
          <Tooltip title="Refresh data">
            <IconButton onClick={onRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Export as CSV">
            <IconButton 
              onClick={onExport} 
              disabled={exportLoading || loading}
              color="primary"
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortConfig?.field === 'index'}
                  direction={getSortDirection('index') || 'asc'}
                  onClick={() => handleSort('index')}
                >
                  #
                </TableSortLabel>
              </TableCell>
              
              <TableCell>
                <TableSortLabel
                  active={sortConfig?.field === 'title'}
                  direction={getSortDirection('title') || 'asc'}
                  onClick={() => handleSort('title')}
                >
                  Title
                </TableSortLabel>
              </TableCell>
              
              <TableCell align="center">
                <TableSortLabel
                  active={sortConfig?.field === 'danceability'}
                  direction={getSortDirection('danceability') || 'asc'}
                  onClick={() => handleSort('danceability')}
                >
                  Dance
                </TableSortLabel>
              </TableCell>
              
              <TableCell align="center">
                <TableSortLabel
                  active={sortConfig?.field === 'energy'}
                  direction={getSortDirection('energy') || 'asc'}
                  onClick={() => handleSort('energy')}
                >
                  Energy
                </TableSortLabel>
              </TableCell>
              
              <TableCell align="center">
                <TableSortLabel
                  active={sortConfig?.field === 'valence'}
                  direction={getSortDirection('valence') || 'asc'}
                  onClick={() => handleSort('valence')}
                >
                  Valence
                </TableSortLabel>
              </TableCell>
              
              <TableCell align="center">
                <TableSortLabel
                  active={sortConfig?.field === 'tempo'}
                  direction={getSortDirection('tempo') || 'asc'}
                  onClick={() => handleSort('tempo')}
                >
                  Tempo
                </TableSortLabel>
              </TableCell>
              
              <TableCell align="center">
                <TableSortLabel
                  active={sortConfig?.field === 'duration_ms'}
                  direction={getSortDirection('duration_ms') || 'asc'}
                  onClick={() => handleSort('duration_ms')}
                >
                  Duration
                </TableSortLabel>
              </TableCell>
              
              <TableCell align="center">Key</TableCell>
              
              <TableCell align="center">
                <TableSortLabel
                  active={sortConfig?.field === 'acousticness'}
                  direction={getSortDirection('acousticness') || 'asc'}
                  onClick={() => handleSort('acousticness')}
                >
                  Acoustic
                </TableSortLabel>
              </TableCell>

              <TableCell align="center">
                <TableSortLabel
                  active={sortConfig?.field === 'average_rating'}
                  direction={getSortDirection('average_rating') || 'asc'}
                  onClick={() => handleSort('average_rating')}
                >
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <TrendingUpIcon fontSize="small" />
                    Popularity
                  </Box>
                </TableSortLabel>
              </TableCell>
              
              <TableCell align="center">
                <TableSortLabel
                  active={sortConfig?.field === 'user_rating'}
                  direction={getSortDirection('user_rating') || 'asc'}
                  onClick={() => handleSort('user_rating')}
                >
                  Your Rating
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {loading ? (
              // Loading skeleton
              Array.from({ length: rowsPerPage }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {Array.from({ length: 11 }).map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : songs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No songs found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              songs.map((song, index) => {
                const popularity = getPopularityLevel(song.rating_count);
                
                return (
                  <TableRow 
                    key={song.id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      <Typography variant="body2" fontWeight="medium">
                        {song.index}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium" noWrap>
                          {song.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {song.id.substring(0, 8)}...
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Chip
                        label={formatNumber(song.danceability)}
                        size="small"
                        color={song.danceability > 0.7 ? 'success' : song.danceability > 0.4 ? 'warning' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    
                    <TableCell align="center">
                      <Chip
                        label={formatNumber(song.energy)}
                        size="small"
                        color={song.energy > 0.7 ? 'error' : song.energy > 0.4 ? 'warning' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    
                    <TableCell align="center">
                      <Chip
                        label={formatNumber(song.valence)}
                        size="small"
                        color={song.valence > 0.7 ? 'success' : song.valence > 0.4 ? 'info' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    
                    <TableCell align="center">
                      <Typography variant="body2">
                        {Math.round(song.tempo)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        BPM
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Typography variant="body2">
                        {formatDuration(song.duration_ms)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Typography variant="body2">
                        {getKeyName(song.key)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getModeName(song.mode)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Chip
                        label={formatNumber(song.acousticness)}
                        size="small"
                        color={song.acousticness > 0.7 ? 'info' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                        <Chip
                          label={popularity.label}
                          size="small"
                          color={popularity.color}
                          variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {song.average_rating > 0 ? `${song.average_rating.toFixed(1)}★` : 'No ratings'}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell align="center">
                      <StarRating
                        songId={song.id}
                        songTitle={song.title}
                        currentRating={song.user_rating||0}
                        averageRating={song.average_rating}
                        ratingCount={song.rating_count}
                        onRatingChange={(newRating) => handleRatingChange(index, newRating)}
                        onRatingSuccess={handleRatingSuccess}
                        size="small"
                        showAverage={false} // We show it in the popularity column
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={totalSongs}
        page={currentPage - 1} // Convert to 0-based for MUI
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[10]} // Fixed rows per page
        showFirstButton
        showLastButton
        sx={{
          borderTop: 1,
          borderColor: 'divider',
        }}
      />
    </Paper>
  );
};

export default SongsTable;