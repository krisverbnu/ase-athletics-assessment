// Who is logged in, shared with every page through React Context.
// Any component can call useAuth() to get { user, login, register, logout }.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { TOKEN_KEY } from '../services/api';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null; // private mode or blocked storage
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "checking" while we ask the API whether a saved token is still valid
  const [status, setStatus] = useState(readToken() ? 'checking' : 'ready');

  const saveSession = useCallback(({ user: u, token }) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(u);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  // On first load: if a token is saved, check it's still valid and load the user
  useEffect(() => {
    if (!readToken()) return;
    authService
      .getMe()
      .then(setUser)
      .catch(clearSession)
      .finally(() => setStatus('ready'));
  }, [clearSession]);

  // The API service fires this event when any request gets a 401
  useEffect(() => {
    window.addEventListener('auth:expired', clearSession);
    return () => window.removeEventListener('auth:expired', clearSession);
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      isReady: status === 'ready',
      login: async (credentials) => saveSession(await authService.login(credentials)),
      register: async (details) => saveSession(await authService.register(details)),
      logout: async () => {
        await authService.logout();
        clearSession();
      },
    }),
    [user, status, saveSession, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
