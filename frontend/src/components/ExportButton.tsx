// src/components/ExportButton.tsx

import React, { useState, useCallback } from 'react';
import {
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
  Box,
  Typography,
} from '@mui/material';
import {
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { ApiService } from '../services/api';
import { generateCSV, downloadCSV, getErrorMessage } from '../utils';

interface ExportButtonProps {
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  variant = 'contained',
  size = 'medium',
  fullWidth = false,
  disabled = false,
}) => {
  const [exporting, setExporting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    try {
      setExporting(true);
      setError(null);
      setSuccess(false);

      // Fetch all songs
      const allSongs = await ApiService.getAllSongs();
      
      if (allSongs.length === 0) {
        setError('No songs available to export');
        return;
      }

      // Generate CSV content
      const csvContent = generateCSV(allSongs);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `music-recommendations-${timestamp}.csv`;
      
      // Download the file
      downloadCSV(csvContent, filename);
      
      setSuccess(true);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setExporting(false);
    }
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSuccess(false);
    setError(null);
  }, []);

  return (
    <>
      <Tooltip 
        title={
          disabled 
            ? "Export not available" 
            : "Download all songs as CSV file"
        }
      >
        <span>
          <Button
            variant={variant}
            size={size}
            fullWidth={fullWidth}
            disabled={disabled || exporting}
            onClick={handleExport}
            startIcon={
              exporting ? (
                <CircularProgress size={18} />
              ) : success ? (
                <CheckCircleIcon />
              ) : (
                <DownloadIcon />
              )
            }
            sx={{
              minWidth: 120,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: disabled ? 'none' : 'translateY(-1px)',
              },
            }}
          >
            {exporting ? 'Exporting...' : success ? 'Exported!' : 'Export CSV'}
          </Button>
        </span>
      </Tooltip>

      {/* Success Snackbar */}
      <Snackbar
        open={success}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="success" 
          variant="filled"
        >
          <Box>
            <Typography variant="body2" fontWeight="medium">
              CSV Export Successful!
            </Typography>
            <Typography variant="caption">
              Your download should start automatically
            </Typography>
          </Box>
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="error" 
          variant="filled"
        >
          <Box>
            <Typography variant="body2" fontWeight="medium">
              Export Failed
            </Typography>
            <Typography variant="caption">
              {error}
            </Typography>
          </Box>
        </Alert>
      </Snackbar>
    </>
  );
};

export default ExportButton;