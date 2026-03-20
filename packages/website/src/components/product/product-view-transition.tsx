"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * T-6.1 产品区主内容：路由切换时轻量入场（Framer Motion），与侧边栏 layout 动画分工明确。
 */
export function ProductViewTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  /** T-6.3：聊天会话页全屏由 ChatWindow 内滚动；其它主区页面保留整页滚动 */
  const isChatConversation = /\/app\/chat\/[^/]+/.test(pathname);

  return (
    <motion.div
      key={pathname}
      className={`flex min-h-0 flex-1 flex-col ${
        isChatConversation ? "overflow-hidden" : "overflow-y-auto overscroll-y-contain"
      }`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
