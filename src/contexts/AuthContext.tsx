import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(() => {
    try {
      const stored = window.localStorage.getItem('espa_currentUser') || window.localStorage.getItem('ain_currentUser');
      if (stored && stored !== 'null' && stored !== 'undefined') {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && (parsed.id || parsed.email || parsed.username)) {
          return parsed;
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const syncUser = useCallback(() => {
    try {
      const stored = window.localStorage.getItem('espa_currentUser') || window.localStorage.getItem('ain_currentUser');
      let nextUser: any = null;
      if (stored && stored !== 'null' && stored !== 'undefined') {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && (parsed.id || parsed.email || parsed.username)) {
          nextUser = parsed;
        }
      }
      setUser((prev: any) => {
        if (JSON.stringify(prev) === JSON.stringify(nextUser)) {
          return prev;
        }
        return nextUser;
      });
    } catch (e) {
      setUser((prev: any) => (prev === null ? prev : null));
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      // Defer execution to avoid setState during another component's render
      setTimeout(syncUser, 0);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('espa_user_changed', handleStorageChange);
    window.addEventListener('ain_user_changed', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('espa_user_changed', handleStorageChange);
      window.removeEventListener('ain_user_changed', handleStorageChange);
    };
  }, [syncUser]);

  const isAuthenticated = !!(user && typeof user === 'object' && (user.id || user.email || user.username));

  const login = async (email: string, pass: string) => {
    // Legacy API login (mostly unused now)
    return false;
  };

  const logout = () => {
    setUser(null);
    try {
      window.localStorage.removeItem('espa_currentUser');
      window.localStorage.removeItem('ain_currentUser');
      setTimeout(() => {
        window.dispatchEvent(new Event('espa_user_changed'));
      }, 0);
    } catch (e) {}
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
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
