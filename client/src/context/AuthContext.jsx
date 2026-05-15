import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.api.js';
import { getItem, getJson, setItem, setJson, removeItem, clearSession } from '../lib/storage.js';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [agency, setAgency] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setAgency(null);
    setToken(null);
    window.location.replace('/login');
  }, []);

  useEffect(() => {
    const storedToken = getItem('token');
    const storedUser = getJson('user');
    const storedAgency = getJson('agency');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
      setAgency(storedAgency);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleForceLogout = () => logout();
    window.addEventListener('force-logout', handleForceLogout);
    return () => window.removeEventListener('force-logout', handleForceLogout);
  }, [logout]);

  const setSession = useCallback((sessionData) => {
    const { token: newToken, user: newUser, agency: newAgency } = sessionData;
    setToken(newToken);
    setUser(newUser);
    setAgency(newAgency || null);

    if (newToken) {
      setItem('token', newToken);
      setJson('user', newUser);
      if (newAgency) {
        setJson('agency', newAgency);
      } else {
        removeItem('agency');
      }
    }
  }, []);

  const login = async (email, password, subdomain, rememberMe) => {
    try {
      const response = await authApi.login({ email, password, subdomain, rememberMe });
      const { token: authToken, user: authUser, agency: authAgency, mustChangePassword } = response.data;
      setSession({ token: authToken, user: authUser, agency: authAgency });
      return { success: true, mustChangePassword: !!mustChangePassword };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      throw new Error(message);
    }
  };

  const register = async (data) => {
    const response = await authApi.registerAgency(data);
    const { token: authToken, user: authUser, agency: authAgency } = response.data;
    setSession({ token: authToken, user: authUser, agency: authAgency });
    return { success: true };
  };

  const registerPublic = async (data) => {
    const response = await authApi.registerAgencyPublic(data);
    const { token: authToken, user: authUser, agency: authAgency } = response.data;
    setSession({ token: authToken, user: authUser, agency: authAgency });
    return { success: true };
  };

  const fetchUser = async () => {
    try {
      const response = await authApi.getMe();
      const { user: authUser, agency: authAgency } = response.data;
      setSession({ token: token || getItem('token'), user: authUser, agency: authAgency });
      return response.data;
    } catch (err) {
      logout();
      throw err;
    }
  };

  const value = {
    user,
    agency,
    token,
    loading,
    login,
    register,
    registerPublic,
    logout,
    fetchUser,
    setSession,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};