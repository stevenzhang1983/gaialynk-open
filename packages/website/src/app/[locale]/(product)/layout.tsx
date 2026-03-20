import type { ReactNode } from "react";
import { getDictionary } from "@/content/dictionaries";
import { getAuthFormsCopy, getProductUiCopy } from "@/content/i18n/product-experience";
import { AgentDirectoryProvider } from "@/components/product/agent-directory-context";
import { PanelFocusProvider } from "@/components/product/context-panel/panel-focus-context";
import { ProductShell } from "@/components/product/shell";
import type { SidebarNavItem } from "@/components/product/sidebar";
import { isSupportedLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";

function cjkPrefer(locale: Locale): "tc" | "sc" | "latin" {
  if (locale === "zh-Hant") return "tc";
  if (locale === "zh-Hans") return "sc";
  return "latin";
}

function buildSidebarItems(
  locale: Locale,
  nav: ReturnType<typeof getDictionary>["nav"],
  chatLabel: string,
): SidebarNavItem[] {
  return [
    { key: "chat", href: `/${locale}/app/chat`, label: chatLabel },
    { key: "ask", href: `/${locale}/app/ask`, label: nav.ask },
    { key: "agents", href: `/${locale}/app/agents`, label: nav.agents ?? "Agents" },
    { key: "subscriptions", href: `/${locale}/app/subscriptions`, label: nav.tasks ?? "Tasks" },
    { key: "recovery-hitl", href: `/${locale}/app/recovery-hitl`, label: nav.approvals ?? "Approvals" },
    { key: "history", href: `/${locale}/app/history`, label: nav.history ?? "History" },
    { key: "connectors-governance", href: `/${locale}/app/connectors-governance`, label: nav.connector ?? "Connector" },
    { key: "settings", href: `/${locale}/app/settings`, label: nav.settings ?? "Settings" },
  ];
}

/**
 * 产品区 Layout（T-2.1 + T-2.3）
 * 使用 ProductShell：顶部导航 + 三栏 IM 布局（可折叠侧边栏 + 主区 + 可折叠右侧面板）+ 底部状态栏。
 */
export default async function ProductLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return <>{children}</>;
  }
  const dict = getDictionary(locale);
  const nav = dict.nav;
  const productUi = getProductUiCopy(locale);
  const authForms = getAuthFormsCopy(locale);
  const sidebarItems = buildSidebarItems(locale, nav, productUi.chat);
  const auth = dict.auth;

  return (
    <div data-cjk-prefer={cjkPrefer(locale)}>
      <AgentDirectoryProvider>
        <PanelFocusProvider>
          <ProductShell
          locale={locale}
          sidebarItems={sidebarItems}
          productUi={productUi}
          loginLabel={auth?.loginCta ?? authForms.login.signIn}
          settingsLabel={nav.settings ?? "Settings"}
        >
            {children}
          </ProductShell>
        </PanelFocusProvider>
      </AgentDirectoryProvider>
    </div>
  );
}
