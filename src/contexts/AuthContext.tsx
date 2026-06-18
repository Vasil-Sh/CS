import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authService, type LoginResult } from '@/lib/authService';

interface AuthUser {
  username: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: AuthUser | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getStoredUser(): AuthUser | null {
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('userRole');
  const token = localStorage.getItem('authToken');
  if (username && role && token) {
    return { username, role: role as 'admin' | 'user' };
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const [isLoading, setIsLoading] = useState(false);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'authToken' && !e.newValue) {
        setUser(null);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const result = await authService.login(username, password);
      if (result.success) {
        const role = result.isAdmin ? 'admin' : 'user';
        setUser({ username, role });
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
