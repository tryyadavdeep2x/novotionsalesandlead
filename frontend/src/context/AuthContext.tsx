import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiFetch } from '../utils/api.js';

export interface UserContextType {
  role: 'LEAD_TEAM' | 'SALES_TEAM' | 'ADMIN';
  identifier: string;
}

interface AuthContextType {
  user: UserContextType | null;
  loading: boolean;
  creatorName: string | null;
  theme: 'light' | 'dark';
  loginKey: (accessKey: string) => Promise<void>;
  loginAdmin: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateCreatorName: (name: string) => void;
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserContextType | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatorName, setCreatorName] = useState<string | null>(
    localStorage.getItem('novotion_creator_name')
  );
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('novotion_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('novotion_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const data = await apiFetch<{ user: UserContextType }>('/api/auth/me');
      if (data.user) {
        setUser({
          role: data.user.role,
          identifier: data.user.identifier,
        });
      }
    } catch {
      localStorage.removeItem('novotion_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loginKey = async (accessKey: string) => {
    setLoading(true);
    try {
      const data = await apiFetch<{ token: string; user: UserContextType }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ type: 'KEY', accessKey }),
      });

      if (data.token) {
        localStorage.setItem('novotion_token', data.token);
      }
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const loginAdmin = async (username: string, password: string) => {
    setLoading(true);
    try {
      const data = await apiFetch<{ token: string; user: UserContextType }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ type: 'ADMIN', username, password }),
      });

      if (data.token) {
        localStorage.setItem('novotion_token', data.token);
      }
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout notice:', err);
    } finally {
      localStorage.removeItem('novotion_token');
      setUser(null);
      setLoading(false);
    }
  };

  const updateCreatorName = (name: string) => {
    setCreatorName(name);
    if (name) {
      localStorage.setItem('novotion_creator_name', name);
    } else {
      localStorage.removeItem('novotion_creator_name');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        creatorName,
        theme,
        loginKey,
        loginAdmin,
        logout,
        updateCreatorName,
        toggleTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
