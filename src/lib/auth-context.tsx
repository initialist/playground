"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authFetch, setAuthToken, clearAuthToken, getAuthToken } from "./api";

export interface UserProfile {
  id: string;
  username: string;
  avatar?: string | null;
  createdAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await authFetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
      } else {
        setUser(null);
        clearAuthToken();
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const initAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        if (!isCancelled) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const res = await authFetch("/api/auth/me");
        if (res.ok && !isCancelled) {
          const data = await res.json();
          setUser(data.user || null);
        } else if (!isCancelled) {
          setUser(null);
          clearAuthToken();
        }
      } catch {
        if (!isCancelled) setUser(null);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    initAuth();
    return () => {
      isCancelled = true;
    };
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await authFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }
      if (data.token) {
        setAuthToken(data.token);
      }
      setUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: "Network error occurred." };
    }
  };

  const signup = async (username: string, password: string) => {
    try {
      const res = await authFetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Signup failed" };
      }
      if (data.token) {
        setAuthToken(data.token);
      }
      setUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: "Network error occurred." };
    }
  };

  const logout = async () => {
    clearAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
