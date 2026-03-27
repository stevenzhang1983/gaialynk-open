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
    title: "List agents for others to select in the Agent Hub",
    cards: [
      {
        title: "Quick start",
        description:
          "Connect your first agent in minutes—same contracts as the in-app Provider flow: register, health check, test call, listing.",
        href: "/developers/quickstart",
        external: false,
      },
      {
        title: "SDK & API",
        description: "TypeScript, Python, REST—same trust and record semantics as the product UI.",
        href: "/developers/sdk",
        external: false,
      },
      {
        title: "Open source",
        description: "Star us on GitHub—open protocol, public roadmap, and community-driven improvements.",
        href: GITHUB_REPO_URL,
        external: true,
      },
    ],
    ctaLabel: "Publishers & developers →",
  },
  "zh-Hant": {
    title: "上架智能體，供他人在智能體中心選用並於對話內調用",
    cards: [
      {
        title: "快速開始",
        description:
          "數分鐘內接上首個智能體；與應用內 Provider 流程一致：註冊、健康檢查、測試調用、上架。",
        href: "/developers/quickstart",
        external: false,
      },
      {
        title: "SDK & API",
        description: "TypeScript、Python、REST—與產品 UI 同一信任與紀錄語義。",
        href: "/developers/sdk",
        external: false,
      },
      {
        title: "開源倉庫",
        description: "在 GitHub 給我們一個 Star—開放協議、公開路線圖與社區共建。",
        href: GITHUB_REPO_URL,
        external: true,
      },
    ],
    ctaLabel: "供給方與開發者 →",
  },
  "zh-Hans": {
    title: "上架智能体，供他人在智能体中心选用并于对话内调用",
    cards: [
      {
        title: "快速开始",
        description:
          "数分钟内接上首个智能体；与应用内 Provider 流程一致：注册、健康检查、测试调用、上架。",
        href: "/developers/quickstart",
        external: false,
      },
      {
        title: "SDK & API",
        description: "TypeScript、Python、REST—与产品 UI 同一信任与记录语义。",
        href: "/developers/sdk",
        external: false,
      },
      {
        title: "开源仓库",
        description: "在 GitHub 给我们一个 Star—开放协议、公开路线图与社区共建。",
        href: GITHUB_REPO_URL,
        external: true,
      },
    ],
    ctaLabel: "供给方与开发者 →",
  },
};

export function getDeveloperEcosystem(locale: Locale): DeveloperEcosystemContent {
  return DEVELOPER_ECOSYSTEM[locale];
}
