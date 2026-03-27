"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Locale } from "@/lib/i18n/locales";
import { useIdentity } from "@/lib/identity/context";

const STORAGE_KEY = "gaialynk_current_space_id";

export type ProductSpace = {
  id: string;
  name: string;
  type: "personal" | "team";
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type SpaceMemberRole = "owner" | "admin" | "member" | "guest";

export type SpaceMemberRow = {
  space_id: string;
  user_id: string;
  role: SpaceMemberRole;
  joined_at: string;
  /** E-11：成员列表展示 */
  display_name?: string | null;
  email_masked?: string | null;
  invited_by_actor_type?: string;
};

type SpaceContextValue = {
  locale: Locale;
  spaces: ProductSpace[];
  loading: boolean;
  currentSpaceId: string | null;
  currentSpace: ProductSpace | null;
  setCurrentSpaceId: (id: string) => void;
  refreshSpaces: () => Promise<void>;
  /** 当前用户在本 Space 的角色；未登录或未加入时为 null */
  myRole: SpaceMemberRole | null;
  roleLoading: boolean;
  canInviteToSpace: boolean;
  isGuestInSpace: boolean;
};

const SpaceContext = createContext<SpaceContextValue | null>(null);

export function SpaceProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const { isAuthenticated, userId } = useIdentity();
  const [spaces, setSpaces] = useState<ProductSpace[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSpaceId, setCurrentSpaceIdState] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<SpaceMemberRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  const refreshSpaces = useCallback(async () => {
    if (!isAuthenticated) {
      setSpaces([]);
      setCurrentSpaceIdState(null);
      setMyRole(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/mainline/spaces", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      const list = Array.isArray(json.data) ? (json.data as ProductSpace[]) : [];
      setSpaces(list);
      if (list.length === 0) {
        setCurrentSpaceIdState(null);
        return;
      }
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      const storedOk = Boolean(stored && list.some((s) => s.id === stored));
      const personal = list.find((s) => s.type === "personal");
      const fallbackId = personal?.id ?? list[0]!.id;
      setCurrentSpaceIdState((prev) => {
        if (prev && list.some((s) => s.id === prev)) {
          if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, prev);
          return prev;
        }
        const id = storedOk ? stored! : fallbackId;
        if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, id);
        return id;
      });
    } catch {
      setSpaces([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refreshSpaces();
  }, [refreshSpaces]);

  const setCurrentSpaceId = useCallback((id: string) => {
    setCurrentSpaceIdState(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, id);
    }
  }, []);

  const currentSpace = useMemo(
    () => spaces.find((s) => s.id === currentSpaceId) ?? null,
    [spaces, currentSpaceId],
  );

  useEffect(() => {
    if (!isAuthenticated || !userId || !currentSpaceId) {
      setMyRole(null);
      return;
    }
    let cancelled = false;
    setRoleLoading(true);
    void (async () => {
      try {
        const res = await fetch(`/api/mainline/spaces/${currentSpaceId}/members`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        const rows = Array.isArray(json.data) ? (json.data as SpaceMemberRow[]) : [];
        const me = rows.find((r) => r.user_id === userId);
        setMyRole(me?.role ?? null);
      } catch {
        if (!cancelled) setMyRole(null);
      } finally {
        if (!cancelled) setRoleLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, userId, currentSpaceId]);

  const canInviteToSpace = myRole === "owner" || myRole === "admin";
  const isGuestInSpace = myRole === "guest";

  const value = useMemo(
    (): SpaceContextValue => ({
      locale,
      spaces,
      loading,
      currentSpaceId,
      currentSpace,
      setCurrentSpaceId,
      refreshSpaces,
      myRole,
      roleLoading,
      canInviteToSpace,
      isGuestInSpace,
    }),
    [
      locale,
      spaces,
      loading,
      currentSpaceId,
      currentSpace,
      setCurrentSpaceId,
      refreshSpaces,
      myRole,
      roleLoading,
      canInviteToSpace,
      isGuestInSpace,
    ],
  );

  return <SpaceContext.Provider value={value}>{children}</SpaceContext.Provider>;
}

export function useSpace(): SpaceContextValue {
  const ctx = useContext(SpaceContext);
  if (!ctx) {
    throw new Error("useSpace must be used within SpaceProvider");
  }
  return ctx;
}
