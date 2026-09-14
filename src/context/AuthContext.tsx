import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: UserRole, phone?: string) => Promise<void>;
  logout: () => void;
  quickDemoLogin: (role: UserRole) => Promise<void>;
  unreadNotifsCount: number;
  refreshNotifications: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_EMAILS: Record<UserRole, string> = {
  admin: 'admin@luxurystay.com',
  manager: 'manager@luxurystay.com',
  receptionist: 'reception@luxurystay.com',
  housekeeping: 'housekeeping@luxurystay.com',
  guest: 'guest@luxurystay.com',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('luxurystay_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('luxurystay_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);

  useEffect(() => {
    async function verifySession() {
      const storedToken = localStorage.getItem('luxurystay_token');
      if (storedToken) {
        try {
          const res = await api.get<{ success: boolean; user: User }>('/auth/me');
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('luxurystay_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Session expired or invalid. Logging out.');
          logout();
        }
      }
      setLoading(false);
    }
    verifySession();
  }, []);

  const refreshNotifications = async () => {
    if (!token) return;
    try {
      const res = await api.get<{ success: boolean; unreadCount: number }>('/notifications');
      if (res.success) {
        setUnreadNotifsCount(res.unreadCount || 0);
      }
    } catch {
      // ignore silently
    }
  };

  useEffect(() => {
    if (user && token) {
      refreshNotifications();
      const interval = setInterval(refreshNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user, token]);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ success: boolean; token: string; user: User }>('/auth/login', {
      email,
      password,
    });
    if (res.success && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('luxurystay_token', res.token);
      localStorage.setItem('luxurystay_user', JSON.stringify(res.user));
      refreshNotifications();
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole = 'guest', phone?: string) => {
    const res = await api.post<{ success: boolean; token: string; user: User }>('/auth/register', {
      name,
      email,
      password,
      role,
      phone,
    });
    if (res.success && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('luxurystay_token', res.token);
      localStorage.setItem('luxurystay_user', JSON.stringify(res.user));
    }
  };

  const quickDemoLogin = async (role: UserRole) => {
    const email = DEMO_EMAILS[role];
    await login(email, 'password123');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('luxurystay_token');
    localStorage.removeItem('luxurystay_user');
    setUnreadNotifsCount(0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        quickDemoLogin,
        unreadNotifsCount,
        refreshNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
