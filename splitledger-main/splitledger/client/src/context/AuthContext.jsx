import React, { createContext, useState, useEffect } from 'react';
import { connectSocket, disconnectSocket } from '../socket';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('token');
    disconnectSocket();
    setToken(null);
    setCurrentUser(null);
  };

  useEffect(() => {
    if (token) {
      connectSocket(token);

      fetch('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Invalid token');
        return res.json();
      })
      .then(data => {
        setCurrentUser(data.user);
      })
      .catch(err => {
        console.error(err);
        logout();
      })
      .finally(() => setLoading(false));
    } else {
      disconnectSocket();
      setLoading(false);
    }
  }, [token]);

  const login = async (identifier, password) => {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await res.json();
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setCurrentUser(data.user);
  };

  const register = async (username, email, password, name) => {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, name })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await res.json();
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setCurrentUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ currentUser, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
