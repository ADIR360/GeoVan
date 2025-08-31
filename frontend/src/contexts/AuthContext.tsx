import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  role: string;
  email: string;
  lastLogin: Date;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Hardcoded credentials for demo purposes
const VALID_CREDENTIALS = {
  username: 'root',
  password: 'root'
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        // Check if the session hasn't expired (24 hours)
        const lastLogin = new Date(userData.lastLogin);
        const now = new Date();
        if (now.getTime() - lastLogin.getTime() < 24 * 60 * 60 * 1000) {
          setUser(userData);
        } else {
          localStorage.removeItem('user');
        }
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
        const userData: User = {
          id: '1',
          username: username,
          role: 'admin',
          email: 'arush@geovan.dev',
          lastLogin: new Date(),
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        return { success: true, message: 'Login successful' };
      } else {
        return { success: false, message: 'Invalid username or password' };
      }
    } catch (error) {
      return { success: false, message: 'Login failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // Redirect to login page
    window.location.href = '/login';
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
