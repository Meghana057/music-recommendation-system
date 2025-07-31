// src/App.tsx

import React, { useEffect, useState } from 'react';
import { Box, Container, Snackbar, Alert } from '@mui/material';
import { ThemeContextProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ApiService } from './services/api';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import LoginForm from './components/auth/LoginForm';
import SignUpForm from './components/auth/SignUpForm';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';

const AppContent: React.FC = () => {
  const [appLoading, setAppLoading] = useState<boolean>(true);
  const [appError, setAppError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [welcomeMessage, setWelcomeMessage] = useState<string>('');

  const { user, loading: authLoading } = useAuth();

  // Initialize app and check backend health
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setAppLoading(true);
        setAppError(null);

        // Check backend health
        await ApiService.healthCheck();
        setHealthStatus(true);

      } catch (error) {
        console.error('App initialization failed:', error);
        setAppError(
          'Unable to connect to the backend server. Please ensure the backend is running on http://localhost:8000'
        );
        setHealthStatus(false);
      } finally {
        setAppLoading(false);
      }
    };

    // Only initialize once auth is loaded
    if (!authLoading) {
      initializeApp();
    }
  }, [authLoading]);

  // Show welcome message when user signs in
  useEffect(() => {
    if (user && !authLoading) {
      const displayName = user.email?.split('@')[0] || 'User';
      setWelcomeMessage(`Welcome back, ${displayName}!`);
      
      // Clear welcome message after 3 seconds
      const timer = setTimeout(() => {
        setWelcomeMessage('');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [user, authLoading]);

  const handleRefresh = async () => {
    await initializeApp();
  };

  const handleToggleAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
  };

  

  // Show loading screen during app initialization
  if (appLoading || authLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <LoadingSpinner 
          message="Connecting to music service..." 
          size={60}
          fullHeight 
        />
      </Container>
    );
  }

  // Show error screen if backend is not available
  if (appError) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <ErrorMessage
          title="Backend Connection Failed"
          message={appError}
          onRetry={handleRefresh}
          retryLabel="Retry Connection"
        />
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {user ? (
        // Show dashboard for authenticated users
        <>
          <Header />
          <Box component="main" sx={{ flexGrow: 1 }}>
            <Dashboard />
          </Box>
        </>
      ) : (
        // Show authentication forms for unauthenticated users
        <Container maxWidth="sm" sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          py: 4 
        }}>
          {authMode === 'login' ? (
            <LoginForm 
              onToggleMode={handleToggleAuthMode}
            />
          ) : (
            <SignUpForm 
              onToggleMode={handleToggleAuthMode}
            />
          )}
        </Container>
      )}

      {/* Welcome Message */}
      <Snackbar
        open={!!welcomeMessage}
        autoHideDuration={3000}
        onClose={() => setWelcomeMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled">
          {welcomeMessage}
        </Alert>
      </Snackbar>

      {/* Connection Status Indicator */}
      <Snackbar
        open={!healthStatus && !appLoading && user !== null}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert severity="warning" variant="filled">
          Backend connection lost. Some features may not work properly.
        </Alert>
      </Snackbar>
    </Box>
  );

  // Helper function for re-initialization
  async function initializeApp() {
    try {
      setAppLoading(true);
      setAppError(null);

      await ApiService.healthCheck();
      setHealthStatus(true);

    } catch (error) {
      console.error('App initialization failed:', error);
      setAppError(
        'Unable to connect to the backend server. Please ensure the backend is running on http://localhost:8000'
      );
      setHealthStatus(false);
    } finally {
      setAppLoading(false);
    }
  }
};

const App: React.FC = () => {
  return (
    <ThemeContextProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeContextProvider>
  );
};

export default App;