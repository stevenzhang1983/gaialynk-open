"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Single source for current user identity. No hardcoded or user-editable user id.
 * Identity is loaded from server session cookie via /api/session/me.
 */
export type IdentityContextValue = {
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (userId: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const defaultValue: IdentityContextValue = {
  userId: null,
  isAuthenticated: false,
  isLoading: true,
  signIn: async () => false,
  signOut: async () => {},
  refresh: async () => {},
};

const IdentityContext = createContext<IdentityContextValue>(defaultValue);

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/session/me", { cache: "no-store" });
      if (!res.ok) {
        setUserId(null);
        return;
      }
      const json = await res.json().catch(() => ({}));
      const uid =
        json && typeof json === "object" && "data" in json && json.data && typeof json.data.user_id === "string"
          ? json.data.user_id
          : null;
      setUserId(uid);
    } catch {
      setUserId(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(async (nextUserId: string): Promise<boolean> => {
    const user = nextUserId.trim();
    if (!user) {
      return false;
    }
    try {
      const res = await fetch("/api/session/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ user_id: user }),
      });
      if (!res.ok) {
        return false;
      }
      await refresh();
      return true;
    } catch {
      return false;
    }
  }, [refresh]);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/session/logout", { method: "POST" });
    } finally {
      await refresh();
    }
  }, [refresh]);

  const value = useMemo<IdentityContextValue>(
    () => ({
      userId,
      isAuthenticated: !!userId,
      isLoading,
      signIn,
      signOut,
      refresh,
    }),
    [userId, isLoading, signIn, signOut, refresh],
  );
  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

export function useIdentity(): IdentityContextValue {
  return useContext(IdentityContext);
}

export { IdentityContext };
