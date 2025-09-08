'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthService, PortalJWTClaims, CRMCapability, AuthContextType, mockAuthForDevelopment } from '@/lib/auth';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<PortalJWTClaims | null>(null);
  const [capabilities, setCapabilities] = useState<CRMCapability[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, []);

  // Token refresh timer
  useEffect(() => {
    if (user) {
      const timeUntilExpiry = (user.exp * 1000) - Date.now();
      const refreshTime = Math.max(timeUntilExpiry - (5 * 60 * 1000), 30 * 1000); // 5 min before expiry, min 30s
      
      const timer = setTimeout(() => {
        // In a real implementation, this would refresh the token
        // For now, just check if it's still valid
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) {
          handleLogout();
        }
      }, refreshTime);

      return () => clearTimeout(timer);
    }
  }, [user]);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      // Initialize mock auth for development
      if (process.env.NODE_ENV === 'development') {
        mockAuthForDevelopment();
      }
      
      // Initialize auth and handle URL tokens
      const hasValidToken = AuthService.initializeAuth();
      
      if (hasValidToken) {
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          const userCapabilities = await AuthService.getUserCapabilities(currentUser);
          setCapabilities(userCapabilities);
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      AuthService.handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    AuthService.redirectToLogin();
  };

  const handleLogout = () => {
    setUser(null);
    setCapabilities([]);
    AuthService.logout();
  };

  const hasCapability = (capability: CRMCapability): boolean => {
    return capabilities.includes(capability) || capabilities.includes('org:admin');
  };

  const hasAnyCapability = (caps: CRMCapability[]): boolean => {
    if (capabilities.includes('org:admin')) return true;
    return caps.some(cap => capabilities.includes(cap));
  };

  const hasAllCapabilities = (caps: CRMCapability[]): boolean => {
    if (capabilities.includes('org:admin')) return true;
    return caps.every(cap => capabilities.includes(cap));
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    capabilities,
    hasCapability,
    hasAnyCapability,
    hasAllCapabilities,
    login: handleLogin,
    logout: handleLogout,
    loading
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}