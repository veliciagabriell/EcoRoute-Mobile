import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  namaLengkap: string;
  role: 'admin' | 'user';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<Array<{ email: string; password: string; namaLengkap: string; role: string }>>([
    // Demo user for testing
    { email: 'admin@ecoroute.com', password: 'password123', namaLengkap: 'Admin User', role: 'admin' }
  ]);

  // Simulate app startup check
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check if user exists in registered users
    const foundUser = registeredUsers.find(u => u.email === email && u.password === password);
    
    if (!foundUser) {
      setIsLoading(false);
      throw new Error('Email atau password salah');
    }

    setUser({
      id: email,
      email: foundUser.email,
      namaLengkap: foundUser.namaLengkap,
      role: (foundUser.role as 'admin' | 'user'),
    });
    setIsSignedIn(true);
    setIsLoading(false);
  };

  const register = async (email: string, password: string, namaLengkap: string, role: string) => {
    setIsLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check if email already exists
    if (registeredUsers.some(u => u.email === email)) {
      setIsLoading(false);
      throw new Error('Email sudah terdaftar');
    }

    // Add new user to registered users
    setRegisteredUsers([...registeredUsers, { email, password, namaLengkap, role }]);
    setIsLoading(false);
  };

  const logout = () => {
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
