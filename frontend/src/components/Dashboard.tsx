// src/components/Dashboard.tsx

import React, { useState, useCallback } from 'react';
import {
  Container,
  Grid,
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
} from '@mui/material';
import {
  TableChart as TableIcon,
  BarChart as ChartIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useSongs } from '../hooks/useSongs';
import { useAnalytics } from '../hooks/useAnalytics';
import { generateAcousticsData, generateTempoData } from '../utils';
import SongsTable from './SongsTable';
import SearchBar from './SearchBar';
import ExportButton from './ExportButton';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { ScatterChart, Histogram, BarChart } from './charts';
import { useAuth } from '../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState<number>(0);
  const { user } = useAuth();
  
  // Main songs data for table
  const {
    songs,
    loading,
    error,
    totalPages,
    currentPage,
    totalSongs,
    refetch,
    setPage,
    sortConfig,
    handleSort,
    updateSongRating,
  } = useSongs(1, 10);

  // Analytics data for charts and stats
  const {
    analyticsData,
    loading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
    updateRatedSongsCount
  } = useAnalytics();

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setPage(page);
  }, [setPage]);

  const handleRefresh = useCallback(() => {
    refetch();
    refetchAnalytics(); // Also refresh analytics data
  }, [refetch, refetchAnalytics]);

  const handleExport = useCallback(() => {
    // Export functionality is handled by ExportButton component internally
  }, []);

  // Simple callback that SongsTable can use for optimistic updates
  const handleSongRatingUpdate = useCallback((
    songId: string, 
    newUserRating: number, 
    newAverage: number, 
    newCount: number
  ) => {
    if (updateSongRating) {
      updateSongRating(songId, newUserRating, newAverage, newCount);
      
      // Update analytics data optimistically if available
      if (analyticsData?.allSongs && user) {
        const currentSong = analyticsData.allSongs.find(song => song.id === songId);
        const oldUserRating = currentSong?.user_rating || 0;
        
        // Update the rated songs count optimistically
        updateRatedSongsCount(songId, newUserRating, oldUserRating);
      }
    } else {
      // Fallback to refresh if no optimistic updates
      setTimeout(() => {
        handleRefresh();
      }, 500);
    }
  }, [updateSongRating, handleRefresh, analyticsData, user, updateRatedSongsCount]);

  // New: Global rating update handler for ALL components
  const handleGlobalRatingUpdate = useCallback((
    songId: string, 
    newUserRating: number, 
    newAverage: number, 
    newCount: number
  ) => {
    // Update main table data
    if (updateSongRating) {
      updateSongRating(songId, newUserRating, newAverage, newCount);
    }
    
    // Update analytics data
    if (analyticsData?.allSongs && user) {
      const currentSong = analyticsData.allSongs.find(song => song.id === songId);
      const oldUserRating = currentSong?.user_rating || 0;
      updateRatedSongsCount(songId, newUserRating, oldUserRating);
    }
    
    // Note: Search results will be updated by SearchBar's own callback
  }, [updateSongRating, analyticsData, user, updateRatedSongsCount]);

  // Generate chart data from ALL songs (not just current page)
  const chartSongs = analyticsData?.allSongs || [];
  const acousticsData = generateAcousticsData(chartSongs);
  const tempoData = generateTempoData(chartSongs);

  if (loading && songs.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <LoadingSpinner message="Loading music data..." fullHeight />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Music Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Explore and analyze your music collection with interactive charts and detailed data.
        </Typography>
        
        {/* Quick Stats */}
        <Paper elevation={1} sx={{ p: 2, mt: 2, backgroundColor: 'background.default' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Typography variant="h6" color="primary">
                {totalSongs}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Songs
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="h6" color="secondary">
                {totalPages}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Pages
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h6" color="success.main">
                  {analyticsLoading ? '...' : (analyticsData?.totalRatedSongs || 0)}
                </Typography>
                {analyticsLoading && (
                  <LoadingSpinner size={16} />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {user ? 'Rated Songs (Total)' : 'Rated Songs (This Page)'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Navigation Tabs */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '1rem',
              fontWeight: 500,
            },
          }}
        >
          <Tab
            icon={<TableIcon />}
            label="Songs Table"
            iconPosition="start"
            id="dashboard-tab-0"
            aria-controls="dashboard-tabpanel-0"
          />
          <Tab
            icon={<SearchIcon />}
            label="Search Songs"
            iconPosition="start"
            id="dashboard-tab-1"
            aria-controls="dashboard-tabpanel-1"
          />
          <Tab
            icon={<ChartIcon />}
            label="Analytics"
            iconPosition="start"
            id="dashboard-tab-2"
            aria-controls="dashboard-tabpanel-2"
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        {/* Songs Table Tab */}
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight="600">
              Songs Collection
            </Typography>
            <ExportButton variant="contained" />
          </Box>
          
          {error ? (
            <ErrorMessage
              message={error}
              onRetry={handleRefresh}
              retryLabel="Reload Songs"
            />
          ) : (
            <SongsTable
              songs={songs}
              loading={loading}
              error={error}
              totalSongs={totalSongs}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              sortConfig={sortConfig}
              onSort={handleSort}
              onRefresh={handleRefresh}
              onSongRatingUpdate={handleSongRatingUpdate}
              onExport={handleExport}
            />
          )}
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Search Tab */}
        <Box>
          <Typography variant="h5" fontWeight="600" gutterBottom>
            Search Songs
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Find specific songs by title and rate them.
          </Typography>
          
          <SearchBar
            placeholder="Enter song title (e.g., '3AM', '4 Walls', '11:11')..."
            onSongFound={(song) => {
              // Optional: Handle when a song is found
              console.log('Song found:', song);
            }}
            onRatingUpdate={handleGlobalRatingUpdate} // Pass global rating handler
          />
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Analytics Tab */}
        <Box>
          <Typography variant="h5" fontWeight="600" gutterBottom>
            Music Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={4}>
            Visualize patterns and trends in your music collection.
          </Typography>

          {analyticsError ? (
            <ErrorMessage
              message={analyticsError}
              onRetry={refetchAnalytics}
              retryLabel="Reload Analytics"
            />
          ) : analyticsLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <LoadingSpinner message="Loading analytics data..." />
            </Box>
          ) : (
            <Grid container spacing={4}>
              {/* Scatter Chart */}
              <Grid item xs={12} lg={6}>
                <ScatterChart
                  songs={chartSongs}
                  title="Danceability vs Energy"
                  height={350}
                />
              </Grid>

              {/* Duration Histogram */}
              <Grid item xs={12} lg={6}>
                <Histogram
                  songs={chartSongs}
                  title="Song Duration Distribution"
                  height={350}
                />
              </Grid>

              {/* Acoustics Bar Chart */}
              <Grid item xs={12} lg={6}>
                <BarChart
                  data={acousticsData}
                  title="Acoustics Distribution"
                  xAxisLabel="Acoustics Range"
                  yAxisLabel="Number of Songs"
                  height={350}
                  color="#2196f3"
                />
              </Grid>

              {/* Tempo Bar Chart */}
              <Grid item xs={12} lg={6}>
                <BarChart
                  data={tempoData}
                  title="Tempo Distribution"
                  xAxisLabel="Tempo Range (BPM)"
                  yAxisLabel="Number of Songs"
                  height={350}
                  color="#ff9800"
                />
              </Grid>
            </Grid>
          )}

          {/* Charts Note */}
          <Paper elevation={1} sx={{ p: 3, mt: 4, backgroundColor: 'background.default' }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Analytics:</strong> Charts display data from all {chartSongs.length} songs in your collection.
              {analyticsData && user && (
                <> You have rated {analyticsData.totalRatedSongs} songs total.</>
              )}
              {!user && (
                <> Sign in to see your personal rating statistics.</>
              )}
            </Typography>
          </Paper>
        </Box>
      </TabPanel>
    </Container>
  );
};

export default Dashboard;