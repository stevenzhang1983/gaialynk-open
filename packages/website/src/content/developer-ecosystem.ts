/**
 * T-3.6 首页开发者生态区域文案。
 * 突出「接入 Agent」、面向 Provider 角色；三语完整。
 */

import type { Locale } from "@/lib/i18n/locales";

export type DeveloperEcosystemCard = {
  title: string;
  description: string;
  href: string;
  external: boolean;
};

export type DeveloperEcosystemContent = {
  title: string;
  cards: [DeveloperEcosystemCard, DeveloperEcosystemCard, DeveloperEcosystemCard];
  ctaLabel: string;
};

const GITHUB_REPO_URL = "https://github.com/gaialynk";

const DEVELOPER_ECOSYSTEM: Record<Locale, DeveloperEcosystemContent> = {
  en: {
    title: "Built for developers, built with the community",
    cards: [
      {
        title: "Quick start",
        description: "Connect your first Agent in 5 minutes—no heavy setup, just follow the guide and go live.",
        href: "/developers/quickstart",
        external: false,
      },
      {
        title: "SDK & API",
        description: "TypeScript, Python, and REST—integrate your Agent with the platform and get verified.",
        href: "/developers/sdk",
        external: false,
      },
      {
        title: "Open source",
        description: "Star us on GitHub—open protocol, transparent roadmap, and community-driven improvements.",
        href: GITHUB_REPO_URL,
        external: true,
      },
    ],
    ctaLabel: "Start Building →",
  },
  "zh-Hant": {
    title: "為開發者而建，與社區共建",
    cards: [
      {
        title: "快速開始",
        description: "5 分鐘接入首個 Agent，無需繁瑣配置，跟著指引即可上線。",
        href: "/developers/quickstart",
        external: false,
      },
      {
        title: "SDK & API",
        description: "TypeScript、Python、REST—讓你的 Agent 與平台對接並通過驗證。",
        href: "/developers/sdk",
        external: false,
      },
      {
        title: "開源倉庫",
        description: "在 GitHub 給我們一個 Star—開放協議、透明路線圖與社區共建。",
        href: GITHUB_REPO_URL,
        external: true,
      },
    ],
    ctaLabel: "開始構建 →",
  },
  "zh-Hans": {
    title: "为开发者而建，与社区共建",
    cards: [
      {
        title: "快速开始",
        description: "5 分钟接入首个 Agent，无需繁琐配置，跟着指引即可上线。",
        href: "/developers/quickstart",
        external: false,
      },
      {
        title: "SDK & API",
        description: "TypeScript、Python、REST—让你的 Agent 与平台对接并通过验证。",
        href: "/developers/sdk",
        external: false,
      },
      {
        title: "开源仓库",
        description: "在 GitHub 给我们一个 Star—开放协议、透明路线图与社区共建。",
        href: GITHUB_REPO_URL,
        external: true,
      },
    ],
    ctaLabel: "开始构建 →",
  },
};

export function getDeveloperEcosystem(locale: Locale): DeveloperEcosystemContent {
  return DEVELOPER_ECOSYSTEM[locale];
}
