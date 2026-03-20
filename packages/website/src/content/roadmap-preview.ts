/**
 * T-3.5 首页路线图预览数据。
 * 数据源：CTO-Product-Mainline-and-Roadmap-v1.md
 * 状态标签：Now（绿）/ In Progress（蓝）/ Coming Soon（橙）/ Planned（灰）
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
    title: "The future we're building",
    subtitle: "From trusted Agent access to the Agent Internet",
    phases: [
      {
        id: "phase-0",
        name: "Agent access & call closure",
        status: "Now",
        deliverables: [
          "A2A extension & identity model, receipt model, structured channels",
          "Session CRUD + message flow, Agent directory, A2A Gateway, minimal audit + receipts",
          "Protocol docs, SDK, developer quickstart",
          "Minimal console for end-to-end demo",
          "Structured channels, SDK anti-injection, high-risk default deny",
        ],
      },
      {
        id: "phase-1",
        name: "Collaborative governance & automation start",
        status: "In Progress",
        deliverables: [
          "Threads, @ mentions, presence, invite flow",
          "Trust Policy + HITL, approval history, verifiable receipts",
          "Retry / switch / degrade fallbacks, A2A visualization L1+L2",
          "One-click deploy first Agent, subscription task MVP",
          "Connector MVP: 1–2 local actions, 3-layer auth, execution evidence",
        ],
      },
      {
        id: "phase-2",
        name: "Automation + ecosystem + node start",
        status: "Coming Soon",
        deliverables: [
          "Subscription tasks: params, alerts, templates, notification policy",
          "Agent hosted runtime, template instantiation, lifecycle",
          "Agent market v1: listing, health check, capability verification",
          "Node–Hub protocol v1: registration, heartbeat, directory sync, relay MVP",
          "IM bridge v1, Bridge API v1",
        ],
      },
      {
        id: "phase-3",
        name: "Network effect + enterprise governance",
        status: "Planned",
        deliverables: [
          "Node ecosystem: node revenue share, connection wizard, reputation",
          "Orchestration DSL + runtime, template library, advanced intent routing",
          "Visual low-code orchestration editor",
          "Compliance reports, tamper-evident storage, TEE (optional), enterprise SLA",
          "Enterprise white-label: custom domain, branding, dedicated support",
        ],
      },
    ],
    milestones: [
      { id: "M1", name: "Agent access closure" },
      { id: "M2", name: "Collaborative governance" },
      { id: "M3", name: "Automation" },
      { id: "M4", name: "Open ecosystem" },
      { id: "M5", name: "Network effect" },
      { id: "M6", name: "Enterprise governance" },
      { id: "M7", name: "Physical world" },
    ],
    ctaLabel: "View full roadmap →",
  },
  "zh-Hant": {
    title: "我們正在建造的未來",
    subtitle: "從可信 Agent 准入到 Agent 互聯網",
    phases: [
      {
        id: "phase-0",
        name: "Agent 准入與調用閉環",
        status: "Now",
        deliverables: [
          "A2A 擴展與身份模型、收據模型、結構化通道",
          "會話 CRUD + 消息流、Agent 目錄、A2A Gateway、最小審計與收據",
          "協議文檔、SDK、開發者快速開始",
          "極簡控制台，可運行端到端 demo",
          "結構化通道落地、SDK 防注入、高風險預設拒絕",
        ],
      },
      {
        id: "phase-1",
        name: "協作風控 + 自動化起步",
        status: "In Progress",
        deliverables: [
          "線程、@ 提及、在線狀態、邀請流程增強",
          "Trust Policy + HITL、審批歷史、可驗證收據正式版",
          "重試/切換/降級回退、A2A 可視化 L1+L2",
          "一鍵部署首個 Agent、訂閱任務 MVP",
          "連接器 MVP：1–2 個本地高價值動作、三層授權、執行證據",
        ],
      },
      {
        id: "phase-2",
        name: "自動化完善 + 開放生態 + 節點起步",
        status: "Coming Soon",
        deliverables: [
          "訂閱任務完善：參數修改、異常通知、模板化、通知策略",
          "Agent 託管運行時、模板實例化、生命週期管理",
          "Agent 市場 v1：上架、健康檢查、能力驗證",
          "Node–Hub 協議 v1：節點註冊、心跳、目錄同步、跨節點中繼 MVP",
          "IM 橋 v1、Bridge API v1",
        ],
      },
      {
        id: "phase-3",
        name: "網絡效應 + 企業治理",
        status: "Planned",
        deliverables: [
          "節點生態：節點分成、連接嚮導、節點信譽",
          "編排 DSL + 運行時、模板庫、高級意圖路由",
          "可視化低代碼編排編輯器",
          "合規報表、不可篡改存儲、TEE（可選）、企業 SLA",
          "企業白標：獨立域名、品牌定制、專屬支持",
        ],
      },
    ],
    milestones: [
      { id: "M1", name: "Agent 准入閉環" },
      { id: "M2", name: "協作風控" },
      { id: "M3", name: "自動化" },
      { id: "M4", name: "開放生態" },
      { id: "M5", name: "網絡效應" },
      { id: "M6", name: "企業治理" },
      { id: "M7", name: "物理世界" },
    ],
    ctaLabel: "查看完整路線圖 →",
  },
  "zh-Hans": {
    title: "我们正在建造的未来",
    subtitle: "从可信 Agent 准入到 Agent 互联网",
    phases: [
      {
        id: "phase-0",
        name: "Agent 准入与调用闭环",
        status: "Now",
        deliverables: [
          "A2A 扩展与身份模型、收据模型、结构化通道",
          "会话 CRUD + 消息流、Agent 目录、A2A Gateway、最小审计与收据",
          "协议文档、SDK、开发者快速开始",
          "极简控制台，可运行端到端 demo",
          "结构化通道落地、SDK 防注入、高风险默认拒绝",
        ],
      },
      {
        id: "phase-1",
        name: "协作风控 + 自动化起步",
        status: "In Progress",
        deliverables: [
          "线程、@ 提及、在线状态、邀请流程增强",
          "Trust Policy + HITL、审批历史、可验证收据正式版",
          "重试/切换/降级回退、A2A 可视化 L1+L2",
          "一键部署首个 Agent、订阅任务 MVP",
          "连接器 MVP：1–2 个本地高价值动作、三层授权、执行证据",
        ],
      },
      {
        id: "phase-2",
        name: "自动化完善 + 开放生态 + 节点起步",
        status: "Coming Soon",
        deliverables: [
          "订阅任务完善：参数修改、异常通知、模板化、通知策略",
          "Agent 托管运行时、模板实例化、生命周期管理",
          "Agent 市场 v1：上架、健康检查、能力验证",
          "Node–Hub 协议 v1：节点注册、心跳、目录同步、跨节点中继 MVP",
          "IM 桥 v1、Bridge API v1",
        ],
      },
      {
        id: "phase-3",
        name: "网络效应 + 企业治理",
        status: "Planned",
        deliverables: [
          "节点生态：节点分成、连接向导、节点信誉",
          "编排 DSL + 运行时、模板库、高级意图路由",
          "可视化低代码编排编辑器",
          "合规报表、不可篡改存储、TEE（可选）、企业 SLA",
          "企业白标：独立域名、品牌定制、专属支持",
        ],
      },
    ],
    milestones: [
      { id: "M1", name: "Agent 准入闭环" },
      { id: "M2", name: "协作风控" },
      { id: "M3", name: "自动化" },
      { id: "M4", name: "开放生态" },
      { id: "M5", name: "网络效应" },
      { id: "M6", name: "企业治理" },
      { id: "M7", name: "物理世界" },
    ],
    ctaLabel: "查看完整路线图 →",
  },
};

export function getRoadmapPreview(locale: Locale): RoadmapPreview {
  return ROADMAP_PREVIEW[locale];
}
