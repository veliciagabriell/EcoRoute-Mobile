import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { setAccessToken } from '@/utils/api';
import {
  clearSession,
  fetchMe,
  loadSession,
  loginUser,
  refreshAccessToken,
  registerUser,
  saveSession,
  type AuthUser,
} from '@/services/auth-service';

interface AuthContextType {
  isLoading: boolean;
  isRestoring: boolean;
  isSignedIn: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, namaLengkap: string, role: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    const restoreSession = async () => {
      setIsRestoring(true);
      try {
        const stored = await loadSession();
        if (!stored) {
          setIsSignedIn(false);
          setUser(null);
          return;
        }

        setAccessToken(stored.accessToken);

        try {
          const profile = await fetchMe();
          if (!isMountedRef.current) return;
          setUser(profile);
          setIsSignedIn(true);
          return;
        } catch {
          if (!stored.refreshToken) throw new Error('Missing refresh token');
          const newAccessToken = await refreshAccessToken(stored.refreshToken);
          setAccessToken(newAccessToken);
          const profile = await fetchMe();
          if (!isMountedRef.current) return;
          await saveSession({
            access_token: newAccessToken,
            refresh_token: stored.refreshToken,
            user: profile,
          });
          setUser(profile);
          setIsSignedIn(true);
        }
      } catch {
        await clearSession();
        if (isMountedRef.current) {
          setIsSignedIn(false);
          setUser(null);
        }
      } finally {
        if (isMountedRef.current) {
          setIsRestoring(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Login
   */
  const login = async (email: string, password: string) => {
    if (!isMountedRef.current) {
      console.log('[Auth] Component unmounted, skipping login');
      return;
    }

    setIsLoading(true);
    console.log('[Auth] Starting login for:', email);
    try {
      const data = await loginUser({ email, password });
      console.log('[Auth] Login response:', data);
      
      if (!isMountedRef.current) {
        console.log('[Auth] Component unmounted after login response');
        return;
      }
      
      if (data?.access_token && data?.user) {
        console.log('[Auth] Setting user:', data.user);
        setUser(data.user);
        setIsSignedIn(true);
      } else {
        throw new Error('Response tidak valid');
      }
    } catch (err: any) {
      console.error('[Auth] Login error:', err);
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        console.log('[Auth] Login finished');
      }
    }
  };

  /**
   * Register
   */
  const register = async (email: string, password: string, namaLengkap: string, role: string) => {
    if (!isMountedRef.current) return;
    setIsLoading(true);
    console.log('[Auth] Starting register:', { email, role });
    try {
      const backendRole = ['umum', 'petugas', 'admin'].includes(role) ? role : 'umum';
      const registerResp = await registerUser({
        name: namaLengkap,
        email,
        password,
        role: backendRole as 'umum' | 'petugas' | 'admin',
      });
      
      console.log('[Auth] Register response:', registerResp);
      if (!isMountedRef.current) return;
    } catch (err: any) {
      console.error('[Auth] Register error:', err);
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        console.log('[Auth] Register finished');
      }
    }
  };

  const logout = () => {
    clearSession();
    setUser(null);
    setIsSignedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoading, isRestoring, isSignedIn, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
