import { useState, useEffect, useCallback } from 'react';
import { apiLogin, apiRegister, apiLogout, apiMe, apiSync, isLoggedIn } from '../api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check token on mount
  useEffect(() => {
    if (!isLoggedIn()) { setLoading(false); return; }
    apiMe()
      .then(setUser)
      .catch(() => { apiLogout(); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await apiRegister(name, email, password);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  const syncFromServer = useCallback(async () => {
    if (!isLoggedIn()) return null;
    try {
      return await apiSync();
    } catch {
      return null;
    }
  }, []);

  return { user, loading, login, register, logout, syncFromServer, isAuthenticated: !!user };
}
