"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ConversationLifecycleContextValue = {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  includeArchived: boolean;
  setIncludeArchived: (v: boolean) => void;
  /** 侧边栏列表刷新令牌（PATCH 会话后递增） */
  listVersion: number;
  bumpListVersion: () => void;
};

const ConversationLifecycleContext = createContext<ConversationLifecycleContextValue | null>(null);

export function ConversationLifecycleProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [listVersion, setListVersion] = useState(0);
  const bumpListVersion = useCallback(() => setListVersion((v) => v + 1), []);

  const value = useMemo(
    () => ({
      searchQuery,
      setSearchQuery,
      includeArchived,
      setIncludeArchived,
      listVersion,
      bumpListVersion,
    }),
    [searchQuery, includeArchived, listVersion, bumpListVersion],
  );

  return (
    <ConversationLifecycleContext.Provider value={value}>{children}</ConversationLifecycleContext.Provider>
  );
}

export function useConversationLifecycle(): ConversationLifecycleContextValue {
  const ctx = useContext(ConversationLifecycleContext);
  if (!ctx) {
    return {
      searchQuery: "",
      setSearchQuery: () => {},
      includeArchived: false,
      setIncludeArchived: () => {},
      listVersion: 0,
      bumpListVersion: () => {},
    };
  }
  return ctx;
}
