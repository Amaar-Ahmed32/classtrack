// Auth state: user + tokens (localStorage so a refresh keeps the teacher logged in).
import { createContext, useContext, useEffect, useState } from 'react';
import { api, setTokens, clearTokens } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On first load, validate the stored token instead of trusting it.
    if (!localStorage.getItem('ct_access')) {
      setLoading(false);
      return;
    }
    api.me()
      .then(({ user: u }) => setUser(u))
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await api.login(email, password);
    setTokens(data);
    setUser(data.user);
  }

  async function register(payload) {
    const data = await api.register(payload);
    setTokens(data);
    setUser(data.user);
  }

  function logout() {
    clearTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
