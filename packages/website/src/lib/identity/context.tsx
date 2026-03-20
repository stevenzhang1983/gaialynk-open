"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Single source for current user identity (T-5.3 token-based).
 * Identity is loaded from /api/auth/me (Bearer + refresh). Legacy signIn(userId) still supported for dev.
 */
export type IdentityContextValue = {
  userId: string | null;
  email: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (userId: string) => Promise<boolean>;
  signInWithPassword: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const defaultValue: IdentityContextValue = {
  userId: null,
  email: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
  signIn: async () => false,
  signInWithPassword: async () => false,
  signOut: async () => {},
  refresh: async () => {},
};

const IdentityContext = createContext<IdentityContextValue>(defaultValue);

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) {
        setUserId(null);
        setEmail(null);
        setRole(null);
        return;
      }
      const json = await res.json().catch(() => ({}));
      const data = json && typeof json === "object" && json.data && typeof json.data === "object" ? json.data : null;
      const id = data && typeof data.id !== "undefined" ? String(data.id) : null;
      const em = data && typeof data.email === "string" ? data.email : null;
      const r = data && typeof data.role === "string" ? data.role : null;
      setUserId(id);
      setEmail(em);
      setRole(r);
    } catch {
      setUserId(null);
      setEmail(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(async (nextUserId: string): Promise<boolean> => {
    const user = nextUserId.trim();
    if (!user) return false;
    try {
      const res = await fetch("/api/session/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ user_id: user }),
      });
      if (!res.ok) return false;
      await refresh();
      return true;
    } catch {
      return false;
    }
  }, [refresh]);

  const signInWithPassword = useCallback(async (em: string, password: string): Promise<boolean> => {
    if (!em.trim() || !password) return false;
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: em.trim(), password }),
      });
      if (!res.ok) return false;
      await refresh();
      return true;
    } catch {
      return false;
    }
  }, [refresh]);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      await refresh();
    }
  }, [refresh]);

  const value = useMemo<IdentityContextValue>(
    () => ({
      userId,
      email,
      role,
      isAuthenticated: !!userId,
      isLoading,
      signIn,
      signInWithPassword,
      signOut,
      refresh,
    }),
    [userId, email, role, isLoading, signIn, signInWithPassword, signOut, refresh],
  );
  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

export function useIdentity(): IdentityContextValue {
  return useContext(IdentityContext);
}

export { IdentityContext };
