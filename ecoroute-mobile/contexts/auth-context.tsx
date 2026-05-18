import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import Constants from 'expo-constants';
import { post, setAccessToken } from '@/utils/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'umum' | 'petugas' | 'admin';
  work_area?: string | null;
}

interface AuthContextType {
  isLoading: boolean;
  isSignedIn: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, namaLengkap: string, role: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const isMountedRef = useRef(true);

  const demoLoginEnabled = (Constants.expoConfig as any)?.extra?.DEMO_LOGIN !== false;

  const applyDemoLogin = (email: string) => {
    setAccessToken('demo-access-token');
    setUser({
      id: 'demo-user',
      email,
      name: 'Demo Admin',
      role: 'admin',
      work_area: null,
    });
    setIsSignedIn(true);
  };

  useEffect(() => {
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

    if (demoLoginEnabled) {
      console.log('[Auth] Demo login enabled - skipping API call');
      setIsLoading(true);
      applyDemoLogin(email);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    console.log('[Auth] Starting login for:', email);
    try {
      const data = await post('/auth/login', { email, password });
      console.log('[Auth] Login response:', data);
      
      if (!isMountedRef.current) {
        console.log('[Auth] Component unmounted after login response');
        return;
      }
      
      if (data?.access_token && data?.user) {
        setAccessToken(data.access_token);
        console.log('[Auth] Setting user:', data.user);
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          work_area: data.user.work_area,
        });
        setIsSignedIn(true);
      } else {
        throw new Error('Response tidak valid');
      }
    } catch (err: any) {
      console.error('[Auth] Login error:', err);
      const message = typeof err?.message === 'string' ? err.message : '';
      const isTimeout = message.toLowerCase().includes('timeout');
      const isFetchError = message.toLowerCase().includes('failed to fetch');

      if (demoLoginEnabled && (isTimeout || isFetchError)) {
        console.warn('[Auth] Login failed - using demo login fallback');
        applyDemoLogin(email);
        return;
      }
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
      const registerResp = await post('/auth/register', {
        name: namaLengkap,
        email,
        password,
        role: backendRole,
      });
      
      console.log('[Auth] Register response:', registerResp);
      if (!isMountedRef.current) return;
      
      // Auto-login after successful registration
      console.log('[Auth] Auto-logging in after register...');
      const loginResp = await post('/auth/login', { email, password });
      
      if (!isMountedRef.current) return;
      
      if (loginResp?.access_token && loginResp?.user) {
        setAccessToken(loginResp.access_token);
        console.log('[Auth] Setting user after register:', loginResp.user);
        setUser({
          id: loginResp.user.id,
          email: loginResp.user.email,
          name: loginResp.user.name,
          role: loginResp.user.role,
          work_area: loginResp.user.work_area,
        });
        setIsSignedIn(true);
      }
    } catch (err: any) {
      console.error('[Auth] Register error:', err);
      const message = typeof err?.message === 'string' ? err.message : '';
      const isTimeout = message.toLowerCase().includes('timeout');
      const isFetchError = message.toLowerCase().includes('failed to fetch');

      if (demoLoginEnabled && (isTimeout || isFetchError)) {
        console.warn('[Auth] Register failed - using demo login fallback');
        applyDemoLogin(email);
        return;
      }
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
    setAccessToken('');
    setUser(null);
    setIsSignedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoading, isSignedIn, user, login, register, logout }}>
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
