"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { Agent } from "@/lib/product/agent-types";

type AgentDirectoryContextValue = {
  selectedAgent: Agent | null;
  setSelectedAgent: (agent: Agent | null) => void;
};

const AgentDirectoryContext = createContext<AgentDirectoryContextValue | null>(null);

export function useAgentDirectory(): AgentDirectoryContextValue {
  const ctx = useContext(AgentDirectoryContext);
  if (!ctx) {
    return {
      selectedAgent: null,
      setSelectedAgent: () => {},
    };
  }
  return ctx;
}

type AgentDirectoryProviderProps = {
  children: React.ReactNode;
};

/**
 * T-4.1 提供目录选中 Agent 状态，供主区卡片与右侧详情面板共享。
 * 离开 /app/agents 时清空选中。
 */
export function AgentDirectoryProvider({ children }: AgentDirectoryProviderProps) {
  const [selectedAgent, setSelectedAgentState] = useState<Agent | null>(null);
  const pathname = usePathname();

  const setSelectedAgent = useCallback((agent: Agent | null) => {
    setSelectedAgentState(agent);
  }, []);

  useEffect(() => {
    if (!pathname?.includes("/agents")) {
      setSelectedAgentState(null);
    }
  }, [pathname]);

  return (
    <AgentDirectoryContext.Provider value={{ selectedAgent, setSelectedAgent }}>
      {children}
    </AgentDirectoryContext.Provider>
  );
}
