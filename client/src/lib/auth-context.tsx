import React, { createContext, useContext, useState, useEffect } from "react";
import type { User } from "@shared/schema";
import { auth } from "./api";

interface AuthContextType {
  user: Partial<User> | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Inactivity timeout: 30 minutes (30 * 60 * 1000 ms)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Partial<User> | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { user: currentUser } = await auth.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const { user: loggedInUser } = await auth.login(email, password);
    // Update user state immediately from login response
    setUser(loggedInUser);
    
    // Wait a bit for session cookie to be set, then verify
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Verify session is working
    try {
      const { user: verifiedUser } = await auth.getCurrentUser();
      setUser(verifiedUser);
    } catch (error) {
      // If verification fails, still keep the user from login response
      // Session might take a moment to propagate
      console.warn('Session verification failed, but login user is set:', error);
    }
    
    setLoading(false);
  };

  const logout = async () => {
    await auth.logout();
    setUser(null);
  };

  // Inactivity timeout - logs user out after period of inactivity
  useEffect(() => {
    if (!user) return;

    let inactivityTimer: NodeJS.Timeout | null = null;

    const resetTimer = () => {
      // Clear existing timer
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      
      // Set new inactivity timer
      inactivityTimer = setTimeout(async () => {
        console.log('⏰ Inactivity timeout - logging out user');
        await logout();
        window.location.href = '/login?timeout=true';
      }, INACTIVITY_TIMEOUT);
    };

    // Activity events that reset the timer
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Set up activity listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    // Initial timer
    resetTimer();

    // Cleanup
    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Protected Route Component
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Always show loading while checking auth or if not authenticated
  if (loading || !user) {
    // If not loading and no user, redirect immediately
    if (!loading && !user) {
      window.location.href = "/login";
    }
    
    // Show loading spinner while redirecting
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

