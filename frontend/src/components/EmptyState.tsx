// src/components/EmptyState.tsx

import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import {
  MusicNote as MusicNoteIcon,
//   Search as SearchIcon,
} from '@mui/icons-material';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No songs found",
  message = "Try adjusting your search or refresh the data",
  actionLabel = "Refresh",
  onAction,
  icon = <MusicNoteIcon sx={{ fontSize: 64, color: 'text.disabled' }} />,
}) => {
  return (
    <Paper elevation={1} sx={{ p: 6, textAlign: 'center', my: 4 }}>
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        {icon}
        
        <Typography variant="h6" color="text.primary" gutterBottom>
          {title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" maxWidth={400}>
          {message}
        </Typography>
        
        {onAction && (
          <Button
            variant="contained"
            onClick={onAction}
            sx={{ mt: 2 }}
          >
            {actionLabel}
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default EmptyState;