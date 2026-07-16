import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  axios.defaults.baseURL = 'http://localhost:5000';

  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (err) => Promise.reject(err)
    );
    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, []);

  const verifyUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.get('/api/auth/me');
      setUser(data.user);
      setRole(data.role);
    } catch (err) {
      console.error('Session verification failed:', err.response?.data?.message || err.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyUser();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      setUser(data);
      setRole(data.role);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const registerDoctor = async (name, email, password, specialization) => {
    setError(null);
    try {
      const { data } = await axios.post('/api/auth/register/doctor', {
        name,
        email,
        password,
        specialization,
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      setUser(data);
      setRole(data.role);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Doctor registration failed.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const registerAdmin = async (name, email, password) => {
    setError(null);
    try {
      const { data } = await axios.post('/api/auth/register/admin', {
        name,
        email,
        password,
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      setUser(data);
      setRole(data.role);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Admin registration failed.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        error,
        login,
        registerDoctor,
        registerAdmin,
        logout,
        verifyUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export default AuthProvider;

