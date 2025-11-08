import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, LoginCredentials, RegisterCredentials } from '../types/auth';
import apiService from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on app load
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      apiService.setAuthToken(storedToken);
    }
    
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    
    try {
      const authResponse = await apiService.login(credentials);
      
      // Store token and get user info
      const { access_token } = authResponse;
      localStorage.setItem('token', access_token);
      apiService.setAuthToken(access_token);
      
      // Get current user info
      const userInfo = await apiService.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(userInfo));
      
      setToken(access_token);
      setUser(userInfo);
      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false);
      // Make sure to re-throw the error so components can handle it
      throw error;
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<void> => {
    setIsLoading(true);
    
    try {
      const authResponse = await apiService.register(credentials);
      
      // Store token and get user info
      const { access_token } = authResponse;
      localStorage.setItem('token', access_token);
      apiService.setAuthToken(access_token);
      
      // Get current user info
      const userInfo = await apiService.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(userInfo));
      
      setToken(access_token);
      setUser(userInfo);
      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false);
      // Make sure to re-throw the error so components can handle it
      throw error;
    }
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    apiService.removeAuthToken();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async (): Promise<void> => {
    if (!token) return;
    
    try {
      const userInfo = await apiService.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(userInfo));
      setUser(userInfo);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If refresh fails, user might need to login again
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    refreshUser,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};