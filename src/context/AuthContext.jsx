import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth state from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (userStr && token) {
      setUser(JSON.parse(userStr));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('accessToken', res.data.accessToken);
    }
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data;
  };

  const verifyOTP = async (email, otp) => {
    const res = await api.post('/auth/verify-otp', { email, otp });
    return res.data;
  };

  const resendOTP = async (email) => {
    const res = await api.post('/auth/resend-otp', { email });
    return res.data;
  };

  const googleLogin = async (token) => {
    const res = await api.post('/auth/google', { token });
    if (res.data.success) {
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('accessToken', res.data.accessToken);
    }
    return res.data;
  };

  const updateTokenUser = (updatedData) => {
    setUser(updatedData);
    localStorage.setItem('user', JSON.stringify(updatedData));
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/users/profile');
      if (res.data.success) {
        updateTokenUser(res.data.data);
      }
      return res.data;
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, register, verifyOTP, resendOTP, logout, updateTokenUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
