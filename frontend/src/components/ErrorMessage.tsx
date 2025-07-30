// src/components/ErrorMessage.tsx

import React from 'react';
import {
  Alert,
  AlertTitle,
  Button,
  Typography,
  Paper,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  showIcon?: boolean;
  severity?: 'error' | 'warning' | 'info';
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try Again",
  showIcon = true,
  severity = 'error',
}) => {
  return (
    <Paper elevation={2} sx={{ p: 3, my: 2 }}>
      <Alert
        severity={severity}
        icon={showIcon ? <ErrorIcon /> : false}
        action={
          onRetry && (
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
            >
              {retryLabel}
            </Button>
          )
        }
      >
        <AlertTitle>{title}</AlertTitle>
        <Typography variant="body2">
          {message}
        </Typography>
      </Alert>
    </Paper>
  );
};

export default ErrorMessage;