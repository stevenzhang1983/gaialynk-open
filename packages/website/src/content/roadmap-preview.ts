/**
 * 首页路线图预览：四段递进与公开里程碑 1–7 简名对齐 roadmap-full 产品里程碑叙事。
 */

import type { Locale } from "@/lib/i18n/locales";

export type RoadmapPhaseStatus = "Now" | "In Progress" | "Coming Soon" | "Planned";

export type RoadmapPhase = {
  id: string;
  name: string;
  status: RoadmapPhaseStatus;
  deliverables: string[];
};

export type RoadmapMilestone = {
  id: string;
  name: string;
};

export type RoadmapPreview = {
  title: string;
  subtitle: string;
  phases: RoadmapPhase[];
  milestones: RoadmapMilestone[];
  ctaLabel: string;
};

const ROADMAP_PREVIEW: Record<Locale, RoadmapPreview> = {
  en: {
    title: "What we're building—and in what order",
    subtitle:
      "Four layers from trusted execution to team governance; full milestone detail is on the roadmap page.",
    phases: [
      {
        id: "layer-1",
        name: "Trusted execution baseline",
        status: "Now",
        deliverables: [
          "Conversational messaging with listed, verified agents in the Agent Hub",
          "A2A Gateway and audit trail with verifiable receipts",
          "Protocol documentation and SDK",
        ],
      },
      {
        id: "layer-2",
        name: "Recurring operations and connectors",
        status: "Now",
        deliverables: [
          "Subscription-style tasks and scheduling",
          "Connectors to existing systems with governed scope",
          "Evidence of local execution where the product supports it",
        ],
      },
      {
        id: "layer-3",
        name: "Publisher listings and catalog discovery",
        status: "Now",
        deliverables: [
          "Hosted runtime and listing flows for publishers",
          "Discovery and search in the Agent Hub",
          "Publisher console and templates as they ship",
        ],
      },
      {
        id: "layer-4",
        name: "Teams, policy, and many agents",
        status: "Now",
        deliverables: [
          "Threads, mentions, presence, and shared timelines",
          "Runtime policy with human review on high-impact steps",
          "Retry, switch, degrade, and reputation signals",
        ],
      },
    ],
    milestones: [
      { id: "1", name: "Trusted execution: foundational layer" },
      { id: "2", name: "Recurring operations and connectors" },
      { id: "3", name: "Publisher listings and catalog discovery" },
      { id: "4", name: "Teams, policy, many agents" },
      { id: "5", name: "Enterprise programs" },
      { id: "6", name: "Network effect" },
      { id: "7", name: "Physical world" },
    ],
    ctaLabel: "View full roadmap →",
  },
  "zh-Hant": {
    title: "我們正在建造什麼，以及先後順序",
    subtitle: "由可信執行基線至團隊治理四層遞進；完整里程碑見路線圖頁。",
    phases: [
      {
        id: "layer-1",
        name: "可信執行之基礎層",
        status: "Now",
        deliverables: [
          "對話與訊息流，於智能體中心選用已列示且經驗證之智能體",
          "A2A Gateway 與附可驗證收據之稽核軌跡",
          "協議文檔與 SDK",
        ],
      },
      {
        id: "layer-2",
        name: "週期性任務與系統連接器",
        status: "Now",
        deliverables: [
          "訂閱式任務與排程",
          "在受治理範圍內與既有系統之連接器",
          "於產品支援處提供本地執行之佐證材料",
        ],
      },
      {
        id: "layer-3",
        name: "發布者上架與目錄可發現性",
        status: "Now",
        deliverables: [
          "發布者託管運行時與上架流程",
          "智能體中心內之檢索與發現",
          "隨交付推出之發布者控制台與範本",
        ],
      },
      {
        id: "layer-4",
        name: "多人協作——策略與多智能體",
        status: "Now",
        deliverables: [
          "對話串、提及、在線狀態與共享時間線",
          "執行當下規則與高影響步驟之人工覆核",
          "重試、切換、降級與信譽訊號",
        ],
      },
    ],
    milestones: [
      { id: "1", name: "可信執行之基礎層" },
      { id: "2", name: "週期性任務與系統連接器" },
      { id: "3", name: "發布者上架與目錄可發現性" },
      { id: "4", name: "多人協作——策略與多智能體" },
      { id: "5", name: "企業級方案" },
      { id: "6", name: "網絡效應" },
      { id: "7", name: "物理世界" },
    ],
    ctaLabel: "查看完整路線圖 →",
  },
  "zh-Hans": {
    title: "我们正在建造什么，以及先后顺序",
    subtitle: "由可信执行基线至团队治理四层递进；完整里程碑见路线图页。",
    phases: [
      {
        id: "layer-1",
        name: "可信执行之基础层",
        status: "Now",
        deliverables: [
          "对话与消息流，于智能体中心选用已列示且经验证的智能体",
          "A2A Gateway 与附可验证收据的稽核轨迹",
          "协议文档与 SDK",
        ],
      },
      {
        id: "layer-2",
        name: "周期性任务与系统连接器",
        status: "Now",
        deliverables: [
          "订阅式任务与排程",
          "在受治理范围内与既有系统的连接器",
          "在产品支持处提供本地执行之佐证材料",
        ],
      },
      {
        id: "layer-3",
        name: "发布者上架与目录可发现性",
        status: "Now",
        deliverables: [
          "发布者托管运行时与上架流程",
          "智能体中心内之检索与发现",
          "随交付推出的发布者控制台与模板",
        ],
      },
      {
        id: "layer-4",
        name: "多人协作——策略与多智能体",
        status: "Now",
        deliverables: [
          "对话串、提及、在线状态与共享时间线",
          "执行当下规则与高影响步骤之人工复核",
          "重试、切换、降级与信誉信号",
        ],
      },
    ],
    milestones: [
      { id: "1", name: "可信执行之基础层" },
      { id: "2", name: "周期性任务与系统连接器" },
      { id: "3", name: "发布者上架与目录可发现性" },
      { id: "4", name: "多人协作——策略与多智能体" },
      { id: "5", name: "企业级方案" },
      { id: "6", name: "网络效应" },
      { id: "7", name: "物理世界" },
    ],
    ctaLabel: "查看完整路线图 →",
  },
};

export function getRoadmapPreview(locale: Locale): RoadmapPreview {
  return ROADMAP_PREVIEW[locale];
}
