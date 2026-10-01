import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMe, login as apiLogin, logout as apiLogout, register as apiRegister } from '../utils/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `checking` blocks protected-route rendering until the cookie has been probed.
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchMe();
      setUser(data.user);
      return data.user;
    } catch {
      // 401/403 simply means "not signed in" — not an error worth surfacing.
      setUser(null);
      return null;
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (credentials) => {
    setError(null);
    const data = await apiLogin(credentials);
    setUser(data.user);
    setChecking(false);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    setError(null);
    const data = await apiRegister(payload);
    setUser(data.user);
    setChecking(false);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      checking,
      error,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      refresh
    }),
    [user, checking, error, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an <AuthProvider>');
  return context;
}

export default AuthContext;
