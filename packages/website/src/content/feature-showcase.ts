/**
 * T-6.2 特性展示区域（alma.now 风格）文案。
 * 五区块：智能对话 / Agent 准入 / Agent 市场 / 自动化任务 / 执行链路；三语完整。
 */

import type { Locale } from "@/lib/i18n/locales";

export type FeatureShowcaseBlock = {
  id: string;
  title: string;
  description: string;
};

export type FeatureShowcaseContent = {
  sectionTitle: string;
  sectionSubtitle: string;
  blocks: [
    FeatureShowcaseBlock,
    FeatureShowcaseBlock,
    FeatureShowcaseBlock,
    FeatureShowcaseBlock,
    FeatureShowcaseBlock,
  ];
};

const FEATURE_SHOWCASE: Record<Locale, FeatureShowcaseContent> = {
  en: {
    sectionTitle: "Product at a glance",
    sectionSubtitle: "Each capability shown with the real interface—screenshot or high-fidelity mockup.",
    blocks: [
      {
        id: "chat",
        title: "Beautiful Chat Interface",
        description:
          "Talk to multiple verified Agents in one thread. Messages, risk confirmations, and receipts live in the same flow—no context switching.",
      },
      {
        id: "trust",
        title: "Verified Agents, Trust as Policy",
        description:
          "Every Agent is identity-verified, capability-declared, and reputation-scored. High-risk actions trigger approval; malicious Agents stay out.",
      },
      {
        id: "marketplace",
        title: "Agent Marketplace",
        description:
          "Browse the directory of verified Agents. See status, reputation, and capabilities at a glance—enable with one click.",
      },
      {
        id: "automation",
        title: "Recurring Automation",
        description:
          "Set up tasks once and let the platform run them on a schedule. Policy and human review still apply to every run.",
      },
      {
        id: "evidence",
        title: "Evidence by Default",
        description:
          "Every invocation produces a signed receipt. Audit timelines link decisions, reviews, and outcomes so you can prove what happened.",
      },
    ],
  },
  "zh-Hant": {
    sectionTitle: "產品一覽",
    sectionSubtitle: "每個能力均以真實介面截圖或高保真 Mockup 呈現。",
    blocks: [
      {
        id: "chat",
        title: "優雅的對話介面",
        description:
          "在單一對話中與多個經過驗證的 Agent 協作。訊息、風險確認與收據同處一脈，無需切換情境。",
      },
      {
        id: "trust",
        title: "經過驗證的 Agent，策略即信任",
        description:
          "每個 Agent 均經身份驗證、能力聲明與信譽評分。高風險操作觸發人工審批，惡意 Agent 被擋在門外。",
      },
      {
        id: "marketplace",
        title: "Agent 目錄",
        description:
          "瀏覽經過驗證的 Agent 目錄，一眼看清狀態、信譽與能力，一鍵啟用。",
      },
      {
        id: "automation",
        title: "訂閱與自動化",
        description:
          "一次設定任務，由平台按排程執行。每次執行仍受策略與人工審批約束。",
      },
      {
        id: "evidence",
        title: "預設即有證據",
        description:
          "每次調用產生可驗證簽名收據。審計時間軸串起決策、審批與結果，可證明發生了什麼。",
      },
    ],
  },
  "zh-Hans": {
    sectionTitle: "产品一览",
    sectionSubtitle: "每个能力均以真实界面截图或高保真 Mockup 呈现。",
    blocks: [
      {
        id: "chat",
        title: "优雅的对话界面",
        description:
          "在单一对话中与多个经过验证的 Agent 协作。消息、风险确认与收据同处一脉，无需切换情境。",
      },
      {
        id: "trust",
        title: "经过验证的 Agent，策略即信任",
        description:
          "每个 Agent 均经身份验证、能力声明与信誉评分。高风险操作触发人工审批，恶意 Agent 被挡在门外。",
      },
      {
        id: "marketplace",
        title: "Agent 目录",
        description:
          "浏览经过验证的 Agent 目录，一眼看清状态、信誉与能力，一键启用。",
      },
      {
        id: "automation",
        title: "订阅与自动化",
        description:
          "一次设定任务，由平台按排程执行。每次执行仍受策略与人工审批约束。",
      },
      {
        id: "evidence",
        title: "默认即有证据",
        description:
          "每次调用产生可验证签名收据。审计时间轴串起决策、审批与结果，可证明发生了什么。",
      },
    ],
  },
};

export function getFeatureShowcase(locale: Locale): FeatureShowcaseContent {
  return FEATURE_SHOWCASE[locale];
}
