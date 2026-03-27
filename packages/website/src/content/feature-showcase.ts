/**
 * T-6.2 特性展示区域（alma.now 风格）文案。
 * 五区块：智能对话 / Agent 准入 / 智能体中心（Agent Hub）/ 自动化任务 / 执行链路；三语完整。
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
    sectionTitle: "What it feels like in the product",
    sectionSubtitle: "Each capability shown with the real interface—screenshot or high-fidelity mockup.",
    blocks: [
      {
        id: "chat",
        title: "Chat-shaped collaboration",
        description:
          "People and agents share one thread. Confirmations before sensitive steps and reviewable records stay in the same conversation.",
      },
      {
        id: "trust",
        title: "Runtime rules and signals",
        description:
          "Listed agents carry the trust signals the product exposes; high-impact steps can pause for confirmation. This is governance and quality signals—not a claim that every third-party codebase was audited.",
      },
      {
        id: "marketplace",
        title: "Agent Hub",
        description:
          "Use agents published on the platform from the Agent Hub—no self-deployment required to start. Pick listed agents, see grading and labels, then run them in chat.",
      },
      {
        id: "automation",
        title: "Orchestration and recurring work",
        description:
          "Turn repeatable work into scheduled or orchestrated runs. Runtime rules and confirmation still apply on every execution.",
      },
      {
        id: "evidence",
        title: "Reviewable execution records",
        description:
          "Runs leave receipts and history you can trace—so teams can align on what executed and what was confirmed.",
      },
    ],
  },
  "zh-Hant": {
    sectionTitle: "產品裡的體驗輪廓",
    sectionSubtitle: "每個能力均以真實介面截圖或高保真 Mockup 呈現。",
    blocks: [
      {
        id: "chat",
        title: "對話形態協作",
        description:
          "人與智能體共用同一對話。敏感步驟前之確認與可供查閱之紀錄留在同一脈絡。",
      },
      {
        id: "trust",
        title: "執行當下規則與訊號",
        description:
          "已列示智能體帶有產品揭露之信任訊號；高影響步驟可暫停徵求確認。此為治理與品質訊號，並非宣稱已審閱所有第三方原始碼。",
      },
      {
        id: "marketplace",
        title: "智能體中心",
        description:
          "選用平台上已上架智能體，無需先行自建部署。於中心查看分級與標籤，再在對話內調用。",
      },
      {
        id: "automation",
        title: "編排與週期性工作",
        description:
          "將可重複工作轉為排程或編排執行；每次執行仍受運行時規則與確認約束。",
      },
      {
        id: "evidence",
        title: "可覆核的執行紀錄",
        description:
          "執行留下收據與歷程，團隊可對齊實際跑了什麼、何時經人確認。",
      },
    ],
  },
  "zh-Hans": {
    sectionTitle: "产品里的体验轮廓",
    sectionSubtitle: "每个能力均以真实界面截图或高保真 Mockup 呈现。",
    blocks: [
      {
        id: "chat",
        title: "对话形态协作",
        description:
          "人与智能体共用同一会话。敏感步骤前的确认与可供查阅的记录留在同一语境。",
      },
      {
        id: "trust",
        title: "执行当下规则与信号",
        description:
          "已列示智能体带有产品披露之信任信号；高影响步骤可暂停征求确认。此为治理与质量信号，并非宣称已审阅所有第三方源代码。",
      },
      {
        id: "marketplace",
        title: "智能体中心",
        description:
          "选用平台上已上架智能体，无需先行自建部署。在中心查看分级与标签，再于会话内调用。",
      },
      {
        id: "automation",
        title: "编排与周期性工作",
        description:
          "将可重复工作转为排程或编排执行；每次执行仍受运行时规则与确认约束。",
      },
      {
        id: "evidence",
        title: "可复核的执行记录",
        description:
          "执行留下收据与历程，团队可对齐实际跑了什么、何时经人确认。",
      },
    ],
  },
};

export function getFeatureShowcase(locale: Locale): FeatureShowcaseContent {
  return FEATURE_SHOWCASE[locale];
}
