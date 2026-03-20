"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { Agent } from "@/lib/product/agent-types";

export type PanelFocus =
  | { type: "conversation"; conversationId: string }
  | { type: "agent"; agent: Agent }
  | { type: "approval"; approvalId: string }
  | { type: "receipt"; receiptId: string }
  | null;

type PanelFocusContextValue = {
  focus: PanelFocus;
  setFocus: (focus: PanelFocus) => void;
};

const PanelFocusContext = createContext<PanelFocusContextValue | null>(null);

export function usePanelFocus(): PanelFocusContextValue {
  const ctx = useContext(PanelFocusContext);
  if (!ctx) {
    return {
      focus: null,
      setFocus: () => {},
    };
  }
  return ctx;
}

type PanelFocusProviderProps = {
  children: React.ReactNode;
};

/**
 * T-4.4 右侧面板焦点：对话 / Agent / 审批 / 收据。根据焦点动态切换面板内容。
 */
export function PanelFocusProvider({ children }: PanelFocusProviderProps) {
  const [focus, setFocusState] = useState<PanelFocus>(null);
  const setFocus = useCallback((f: PanelFocus) => setFocusState(f), []);
  return (
    <PanelFocusContext.Provider value={{ focus, setFocus }}>
      {children}
    </PanelFocusContext.Provider>
  );
}
