import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider, Theme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true; // Default to dark mode
  });

  const createAppTheme = (darkMode: boolean): Theme => {
    return createTheme({
      palette: {
        mode: darkMode ? 'dark' : 'light',
        primary: {
          main: '#2196f3',
          light: '#64b5f6',
          dark: '#1976d2',
        },
        secondary: {
          main: '#f50057',
          light: '#ff5983',
          dark: '#c51162',
        },
        background: {
          default: darkMode ? '#0a0a0a' : '#f5f5f5',
          paper: darkMode ? '#1a1a1a' : '#ffffff',
        },
        text: {
          primary: darkMode ? '#ffffff' : '#000000',
          secondary: darkMode ? '#b0b0b0' : '#666666',
        },
      },
      typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
          fontWeight: 600,
        },
        h6: {
          fontWeight: 500,
        },
      },
      components: {
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              boxShadow: darkMode 
                ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
                : '0 4px 20px rgba(0, 0, 0, 0.1)',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              textTransform: 'none',
              fontWeight: 500,
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
      },
    });
  };

  const theme = createAppTheme(isDarkMode);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const value: ThemeContextType = {
    isDarkMode,
    toggleTheme,
    theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
