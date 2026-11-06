import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem('subsync_token') || null
  );
  const [loading, setLoading] = useState(true);

  // Fetch current user details on mount if token exists
  const fetchCurrentUser = async () => {
    const savedToken = localStorage.getItem('subsync_token');
    if (!savedToken) {
      setUser(null);
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        setSubscription(res.data.subscription);
      }
    } catch (err) {
      console.warn('Authentication token verification failed:', err.response?.data?.message || err.message);
      localStorage.removeItem('subsync_token');
      localStorage.removeItem('subsync_user');
      setUser(null);
      setSubscription(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const receivedToken = res.data.token;
      const receivedUser = res.data.user;

      localStorage.setItem('subsync_token', receivedToken);
      localStorage.setItem('subsync_user', JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);

      // Fetch active subscription for user
      await fetchCurrentUser();
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data.success) {
      const receivedToken = res.data.token;
      const receivedUser = res.data.user;

      localStorage.setItem('subsync_token', receivedToken);
      localStorage.setItem('subsync_user', JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);

      await fetchCurrentUser();
      return res.data;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('subsync_token');
    localStorage.removeItem('subsync_user');
    setToken(null);
    setUser(null);
    setSubscription(null);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
