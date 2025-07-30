// src/theme/index.ts

import { createTheme, Theme } from '@mui/material/styles';
import { ThemeMode } from '../types';

declare module '@mui/material/styles' {
  interface Theme {
    custom: {
      chart: {
        primary: string;
        secondary: string;
        accent: string;
        grid: string;
      };
    };
  }

  interface ThemeOptions {
    custom?: {
      chart?: {
        primary?: string;
        secondary?: string;
        accent?: string;
        grid?: string;
      };
    };
  }
}

const getTheme = (mode: ThemeMode): Theme => {
  const isLight = mode === 'light';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isLight ? '#1976d2' : '#90caf9',
        light: isLight ? '#42a5f5' : '#bbdefb',
        dark: isLight ? '#1565c0' : '#64b5f6',
      },
      secondary: {
        main: isLight ? '#dc004e' : '#f48fb1',
        light: isLight ? '#ff5983' : '#fce4ec',
        dark: isLight ? '#9a0036' : '#f06292',
      },
      background: {
        default: isLight ? '#fafafa' : '#121212',
        paper: isLight ? '#ffffff' : '#1e1e1e',
      },
      text: {
        primary: isLight ? '#212121' : '#ffffff',
        secondary: isLight ? '#757575' : '#b0b0b0',
      },
      divider: isLight ? '#e0e0e0' : '#333333',
      error: {
        main: isLight ? '#d32f2f' : '#f44336',
      },
      warning: {
        main: isLight ? '#ed6c02' : '#ff9800',
      },
      info: {
        main: isLight ? '#0288d1' : '#29b6f6',
      },
      success: {
        main: isLight ? '#2e7d32' : '#66bb6a',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 600,
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.5,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.6,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.43,
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 500,
            padding: '8px 16px',
          },
          contained: {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: isLight 
              ? '0 2px 8px rgba(0,0,0,0.1)' 
              : '0 2px 8px rgba(0,0,0,0.3)',
            borderRadius: 12,
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: isLight ? '#f5f5f5' : '#2c2c2c',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 600,
            fontSize: '0.875rem',
            color: isLight ? '#424242' : '#e0e0e0',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
    custom: {
      chart: {
        primary: isLight ? '#1976d2' : '#90caf9',
        secondary: isLight ? '#dc004e' : '#f48fb1',
        accent: isLight ? '#ff9800' : '#ffb74d',
        grid: isLight ? '#e0e0e0' : '#333333',
      },
    },
  });
};

export default getTheme;