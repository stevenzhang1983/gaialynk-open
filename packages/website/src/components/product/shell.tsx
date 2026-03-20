"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { ProductUiCopy } from "@/content/i18n/product-experience";
import type { Locale } from "@/lib/i18n/locales";
import { useIdentity } from "@/lib/identity/context";
import { ContextPanel } from "./context-panel";
import { ContextPanelContent } from "./context-panel/context-panel-content";
import { ProductViewTransition } from "./product-view-transition";
import { ProductSidebar, type SidebarNavItem } from "./sidebar";
import { StatusBar } from "./status-bar";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const set = () => setIsMobile(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);
  return isMobile;
}

export type ProductShellProps = {
  locale: Locale;
  sidebarItems: SidebarNavItem[];
  productUi: ProductUiCopy;
  /** 未登录时“登录”按钮/链接文案 */
  loginLabel?: string;
  /** 设置文案 */
  settingsLabel?: string;
  children: React.ReactNode;
};

/**
 * 产品区 Shell（T-2.3）
 * 顶部导航 + 三栏布局（可折叠侧边栏 + 主区 + 可折叠右侧面板）+ 底部状态栏。
 * 移动端：侧边栏为抽屉，右侧面板默认收起；未登录可正常浏览，不弹登录。
 */
export function ProductShell({
  locale,
  sidebarItems,
  productUi,
  loginLabel = "Sign in",
  settingsLabel = "Settings",
  children,
}: ProductShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname() ?? "";
  const { isAuthenticated, email, signOut } = useIdentity();
  const loginReturnUrl = pathname ? `${pathname}` : `/${locale}/app`;
  const loginHref = `/${locale}/app/login?return_url=${encodeURIComponent(loginReturnUrl)}`;

  const toggleSidebar = useCallback(() => setSidebarCollapsed((p) => !p), []);
  const togglePanel = useCallback(() => setPanelCollapsed((p) => !p), []);
  const closeMobileDrawer = useCallback(() => setMobileDrawerOpen(false), []);

  return (
    <div className="flex h-screen min-h-screen flex-col overflow-x-hidden bg-background font-sans text-foreground">
      {/* 顶部导航 */}
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="flex rounded p-2 text-muted-foreground hover:bg-surface-raised hover:text-foreground md:hidden"
            aria-label={productUi.ariaOpenMenu}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link
            href={`/${locale}/app`}
            className="text-sm font-semibold text-foreground hover:text-primary"
          >
            GaiaLynk
          </Link>
          <Link
            href={`/${locale}`}
            className="hidden text-xs text-muted-foreground hover:text-foreground sm:inline"
          >
            {productUi.backToMarketing}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {isMobile && (
            <button
              type="button"
              onClick={togglePanel}
              className="rounded p-2 text-muted-foreground hover:bg-surface-raised hover:text-foreground"
              aria-label={productUi.ariaOpenContextPanel}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </button>
          )}
          {isAuthenticated ? (
            <>
              <span className="max-w-[120px] truncate text-xs text-muted-foreground" title={email ?? undefined}>
                {email ?? productUi.accountFallback}
              </span>
              <Link
                href={`/${locale}/app/settings`}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {settingsLabel}
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {productUi.signOut}
              </button>
            </>
          ) : (
            <>
              <Link href={loginHref} className="text-xs font-medium text-primary hover:underline">
                {loginLabel}
              </Link>
              <Link
                href={`/${locale}/app/settings`}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {settingsLabel}
              </Link>
            </>
          )}
        </div>
      </header>

      {/* 三栏：侧边栏 + 主区 + 右侧面板 */}
      <div className="flex min-h-0 flex-1">
        <ProductSidebar
          locale={locale}
          items={sidebarItems}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          mobileOpen={mobileDrawerOpen}
          onMobileClose={closeMobileDrawer}
        />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <ProductViewTransition>{children}</ProductViewTransition>
        </main>
        <ContextPanel
          collapsed={panelCollapsed}
          onToggleCollapse={togglePanel}
          mobileOverlay={isMobile}
        >
          <ContextPanelContent />
        </ContextPanel>
      </div>

      {/* T-6.3 移动端底部快捷栏：Chat / Agents / More（打开抽屉），与抽屉式侧边栏互补 */}
      {isMobile && (
        <nav
          className="flex shrink-0 border-t border-border bg-surface md:hidden"
          aria-label={productUi.mobileQuickNavAria}
        >
          <Link
            href={`/${locale}/app/chat`}
            className={`flex-1 border-r border-border py-2.5 text-center text-xs font-medium transition-colors ${
              pathname.includes("/app/chat") ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {productUi.chat}
          </Link>
          <Link
            href={`/${locale}/app/agents`}
            className={`flex-1 border-r border-border py-2.5 text-center text-xs font-medium transition-colors ${
              pathname.includes("/app/agents") ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {sidebarItems.find((i) => i.key === "agents")?.label ?? "Agents"}
          </Link>
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="flex-1 py-2.5 text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {productUi.mobileMore}
          </button>
        </nav>
      )}

      <StatusBar
        connectionStatus={productUi.statusDisconnected}
        agentsOnlineLabel={productUi.statusAgentsOnline}
        defaultSpaceLabel={productUi.statusDefaultSpace}
        ariaLabel={productUi.statusBarAria}
      />
    </div>
  );
}
