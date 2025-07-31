// src/contexts/ThemeContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeMode } from '../types';
import getTheme from '../theme';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  resetTheme: () => void; // New function for logout
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeContextProviderProps {
  children: ReactNode;
}

export const ThemeContextProvider: React.FC<ThemeContextProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    // Get theme from localStorage or default to light
    const savedTheme = localStorage.getItem('theme-mode') as ThemeMode;
    return savedTheme || 'light';
  });

  const toggleTheme = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme-mode', newMode);
      return newMode;
    });
  };

  const resetTheme = () => {
    // Reset to default theme (light)
    setMode('light');
    localStorage.removeItem('theme-mode');
    console.log('🎨 Theme reset to light mode');
  };

  const theme = getTheme(mode);

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem('theme-mode', mode);
  }, [mode]);

  // Listen for logout event to reset theme
  useEffect(() => {
    const handleLogout = () => {
      resetTheme();
    };

    // Listen for custom logout event
    window.addEventListener('user-logout', handleLogout);
    
    return () => {
      window.removeEventListener('user-logout', handleLogout);
    };
  }, []);

  const contextValue: ThemeContextType = {
    mode,
    toggleTheme,
    resetTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useThemeContext = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeContextProvider');
  }
  return context;
};