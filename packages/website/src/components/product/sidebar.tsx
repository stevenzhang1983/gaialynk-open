"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/locales";
import { ConversationList } from "./sidebar/conversation-list";
import { NewConversation } from "./sidebar/new-conversation";

export type SidebarNavItem = {
  key: string;
  href: string;
  label: string;
};

type SidebarProps = {
  locale: Locale;
  items: SidebarNavItem[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  /** 移动端抽屉是否打开 */
  mobileOpen: boolean;
  onMobileClose: () => void;
};

function NavIcon({ name }: { name: string }) {
  const icon = (() => {
    switch (name) {
      case "chat":
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case "ask":
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      case "agents":
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case "subscriptions":
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      case "recovery-hitl":
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "history":
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "connectors-governance":
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
      case "settings":
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return (
          <span className="flex h-5 w-5 items-center justify-center text-xs" aria-hidden>
            •
          </span>
        );
    }
  })();
  return icon;
}

/**
 * 产品区左侧边栏（T-2.3）
 * 可折叠 260-280px；移动端为抽屉，打开后点击链接或遮罩关闭。
 */
export function ProductSidebar({
  locale,
  items,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname() ?? "";
  const activeConversationId = (() => {
    const m = pathname.match(/\/app\/chat\/([^/]+)$/);
    return m ? m[1] : null;
  })();

  const linkContent = (item: SidebarNavItem, forceExpand = false) => {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const showLabel = forceExpand || !collapsed;
    return (
      <Link
        href={item.href}
        onClick={onMobileClose}
        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
          active ? "bg-surface-raised text-primary font-medium" : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"
        } ${!showLabel ? "justify-center" : ""}`}
      >
        <NavIcon name={item.key} />
        {showLabel && <span>{item.label}</span>}
      </Link>
    );
  };

  const sidebarContent = (
    <>
      <div className="flex shrink-0 items-center justify-between border-b border-border p-2">
        {!collapsed && <span className="text-xs font-medium text-muted-foreground">对话</span>}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="rounded p-1.5 text-muted-foreground hover:bg-surface-raised hover:text-foreground"
          aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 border-b border-border p-2">
        <NewConversation locale={locale} collapsed={collapsed} onMobileClose={onMobileClose} />
        <div className="min-h-0 flex-1 overflow-auto">
          <ConversationList
            locale={locale}
            activeId={activeConversationId}
            collapsed={collapsed}
            onMobileClose={onMobileClose}
          />
        </div>
      </div>
      {!collapsed && (
        <div className="shrink-0 border-b border-border px-2 pt-2">
          <span className="text-xs font-medium text-muted-foreground">导航</span>
        </div>
      )}
      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-auto p-2" aria-label="Product navigation">
        {items.map((item) => (
          <div key={item.key}>{linkContent(item, false)}</div>
        ))}
      </nav>
    </>
  );

  return (
    <>
      {/* 桌面端：侧边栏（可折叠，layout 宽度过渡由 Framer Motion 驱动） */}
      <motion.aside
        layout
        className={`hidden shrink-0 flex-col border-r border-border bg-surface md:flex ${
          collapsed ? "w-14" : "w-[260px] lg:w-[280px]"
        }`}
        transition={{ layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
        aria-label="侧边栏"
      >
        {sidebarContent}
      </motion.aside>

      {/* 移动端：抽屉（入场/退场纯 Framer Motion，不用 translate CSS transition） */}
      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              key="product-sidebar-backdrop"
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              role="button"
              tabIndex={-1}
              aria-label="关闭菜单"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onMobileClose}
              onKeyDown={(e) => e.key === "Escape" && onMobileClose()}
            />
            <motion.aside
              key="product-sidebar-drawer"
              className="fixed left-0 top-0 z-50 flex h-full w-[260px] flex-col border-r border-border bg-surface shadow-elevated md:hidden"
              aria-label="导航菜单"
              aria-modal="true"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-border p-3">
                <span className="text-sm font-medium text-foreground">菜单</span>
                <button
                  type="button"
                  onClick={onMobileClose}
                  className="rounded p-2 text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                  aria-label="关闭"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-2 border-b border-border p-2">
                <NewConversation locale={locale} collapsed={false} onMobileClose={onMobileClose} />
                <div className="min-h-0 flex-1 overflow-auto">
                  <ConversationList
                    locale={locale}
                    activeId={activeConversationId}
                    collapsed={false}
                    onMobileClose={onMobileClose}
                  />
                </div>
              </div>
              <div className="shrink-0 border-b border-border px-2 pt-2">
                <span className="text-xs font-medium text-muted-foreground">导航</span>
              </div>
              <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-auto p-2" aria-label="Product navigation">
                {items.map((item) => (
                  <div key={item.key}>{linkContent(item, true)}</div>
                ))}
              </nav>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
