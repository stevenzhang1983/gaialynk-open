import type { Locale } from "@/lib/i18n/locales";
import { NOW_CAPABILITY_PATHS } from "./now-capability-endpoints";

export type CapabilityStatus = "Now" | "In Progress" | "Coming Soon" | "Research";
export const CAPABILITY_STATUSES: CapabilityStatus[] = ["Now", "In Progress", "Coming Soon", "Research"];

export type VisionTrack = {
  track: string;
  pageModule: string;
  status: CapabilityStatus;
  cta: string;
  productPath: string;
  requiredApiCapabilities: string[];
};

/** Now capabilities use endpoint from single source (now-capability-endpoints.ts). */
const NOW_ENTRIES: Record<string, { status: "Now"; endpoint: string }> = Object.fromEntries(
  Object.entries(NOW_CAPABILITY_PATHS).map(([key, endpoint]) => [key, { status: "Now" as const, endpoint }]),
);

export const PRODUCT_API_CAPABILITIES: Record<string, { status: CapabilityStatus; endpoint: string }> = {
  ...NOW_ENTRIES,
  askRouteV1: { status: "In Progress", endpoint: "/api/v1/ask/route" },
  fallbackActionsV1: { status: "In Progress", endpoint: "/api/v1/ask/fallback-actions" },
  hitlActionsV1: { status: "In Progress", endpoint: "/api/v1/review-queue/actions" },
  taskInstancesV1: { status: "Coming Soon", endpoint: "/api/v1/task-instances" },
  connectorAuthV1: { status: "Coming Soon", endpoint: "/api/v1/connectors/authorizations" },
  localActionReceiptsV1: { status: "Coming Soon", endpoint: "/api/v1/connectors/local-action-receipts" },
  managedCloudOrchestration: { status: "In Progress", endpoint: "/api/v1/cloud/orchestration" },
  revenueOpsAutomation: { status: "Research", endpoint: "/api/v1/automation/revenue-ops" },
};

export const VISION_TRACKS_BY_LOCALE: Record<Locale, VisionTrack[]> = {
  en: [
    {
      track: "Developer Co-Building",
      pageModule: "Developers Quickstart + Docs Redirect",
      status: "Now",
      cta: "Start Building",
      productPath: "/en/developers -> /en/docs",
      requiredApiCapabilities: ["conversations", "invocations", "receipts"],
    },
    {
      track: "Enterprise Governance",
      pageModule: "Trust Flow + High-risk Approval Use Case",
      status: "Now",
      cta: "See Trust Flow",
      productPath: "/en/trust -> /en/use-cases/high-risk-approval",
      requiredApiCapabilities: ["reviewQueue", "receipts"],
    },
    {
      track: "Node Collaboration",
      pageModule: "Use Cases Node Collaboration",
      status: "Coming Soon",
      cta: "Book a Demo",
      productPath: "/en/use-cases/node-collaboration",
      requiredApiCapabilities: ["nodes", "invocations"],
    },
    {
      track: "Managed Cloud Orchestration",
      pageModule: "Developers OSS/Cloud Boundary + Waitlist",
      status: "In Progress",
      cta: "Join Waitlist",
      productPath: "/en/waitlist",
      requiredApiCapabilities: ["managedCloudOrchestration"],
    },
    {
      track: "Ask Main Path",
      pageModule: "Ask Path Demo",
      status: "In Progress",
      cta: "Explore Ask",
      productPath: "/en/ask",
      requiredApiCapabilities: ["askRouteV1"],
    },
    {
      track: "Failure Recovery + HITL",
      pageModule: "Recovery and HITL Page",
      status: "In Progress",
      cta: "Review Fallbacks",
      productPath: "/en/recovery-hitl",
      requiredApiCapabilities: ["fallbackActionsV1", "hitlActionsV1"],
    },
    {
      track: "Recurring Task Lifecycle",
      pageModule: "Subscriptions Value Page",
      status: "Coming Soon",
      cta: "See Lifecycle",
      productPath: "/en/subscriptions",
      requiredApiCapabilities: ["taskInstancesV1"],
    },
    {
      track: "Connector Governance",
      pageModule: "Connector Governance Page",
      status: "Coming Soon",
      cta: "View Controls",
      productPath: "/en/connectors-governance",
      requiredApiCapabilities: ["connectorAuthV1", "localActionReceiptsV1"],
    },
    {
      track: "Autonomous Business Ops",
      pageModule: "Use Cases Expansion",
      status: "Research",
      cta: "Book a Demo",
      productPath: "/en/demo",
      requiredApiCapabilities: ["revenueOpsAutomation"],
    },
    {
      track: "Marketplace Ecosystem",
      pageModule: "Future partner and extension surface",
      status: "Coming Soon",
      cta: "Join Waitlist",
      productPath: "/en/waitlist",
      requiredApiCapabilities: [],
    },
  ],
  "zh-Hant": [
    {
      track: "開發者共建工作流",
      pageModule: "Developers 快速開始 + Docs 入口",
      status: "Now",
      cta: "開始構建",
      productPath: "/zh-Hant/developers -> /zh-Hant/docs",
      requiredApiCapabilities: ["conversations", "invocations", "receipts"],
    },
    {
      track: "企業治理與風控",
      pageModule: "Trust 流程 + 高風險審批場景",
      status: "Now",
      cta: "查看信任流程",
      productPath: "/zh-Hant/trust -> /zh-Hant/use-cases/high-risk-approval",
      requiredApiCapabilities: ["reviewQueue", "receipts"],
    },
    {
      track: "節點跨邊界協作",
      pageModule: "Use Cases Node Collaboration",
      status: "Coming Soon",
      cta: "預約 Demo",
      productPath: "/zh-Hant/use-cases/node-collaboration",
      requiredApiCapabilities: ["nodes", "invocations"],
    },
    {
      track: "雲端託管編排能力",
      pageModule: "Waitlist + 能力邊界頁",
      status: "In Progress",
      cta: "加入等待名單",
      productPath: "/zh-Hant/waitlist",
      requiredApiCapabilities: ["managedCloudOrchestration"],
    },
    {
      track: "Ask 主路徑",
      pageModule: "Ask 主路徑演示頁",
      status: "In Progress",
      cta: "查看 Ask",
      productPath: "/zh-Hant/ask",
      requiredApiCapabilities: ["askRouteV1"],
    },
    {
      track: "失敗回退 + HITL",
      pageModule: "回退與 HITL 說明頁",
      status: "In Progress",
      cta: "查看回退",
      productPath: "/zh-Hant/recovery-hitl",
      requiredApiCapabilities: ["fallbackActionsV1", "hitlActionsV1"],
    },
    {
      track: "訂閱任務生命週期",
      pageModule: "訂閱任務價值頁",
      status: "Coming Soon",
      cta: "查看生命週期",
      productPath: "/zh-Hant/subscriptions",
      requiredApiCapabilities: ["taskInstancesV1"],
    },
    {
      track: "連接器治理",
      pageModule: "連接器治理頁",
      status: "Coming Soon",
      cta: "查看控制面",
      productPath: "/zh-Hant/connectors-governance",
      requiredApiCapabilities: ["connectorAuthV1", "localActionReceiptsV1"],
    },
    {
      track: "自主業務協作場景",
      pageModule: "Use Cases 擴展",
      status: "Research",
      cta: "預約 Demo",
      productPath: "/zh-Hant/demo",
      requiredApiCapabilities: ["revenueOpsAutomation"],
    },
    {
      track: "生態夥伴市集",
      pageModule: "未來夥伴與擴展能力入口",
      status: "Coming Soon",
      cta: "加入等待名單",
      productPath: "/zh-Hant/waitlist",
      requiredApiCapabilities: [],
    },
  ],
  "zh-Hans": [
    {
      track: "开发者共建工作流",
      pageModule: "Developers 快速开始 + Docs 入口",
      status: "Now",
      cta: "开始构建",
      productPath: "/zh-Hans/developers -> /zh-Hans/docs",
      requiredApiCapabilities: ["conversations", "invocations", "receipts"],
    },
    {
      track: "企业治理与风控",
      pageModule: "Trust 流程 + 高风险审批场景",
      status: "Now",
      cta: "查看信任流程",
      productPath: "/zh-Hans/trust -> /zh-Hans/use-cases/high-risk-approval",
      requiredApiCapabilities: ["reviewQueue", "receipts"],
    },
    {
      track: "节点跨边界协作",
      pageModule: "Use Cases Node Collaboration",
      status: "Coming Soon",
      cta: "预约 Demo",
      productPath: "/zh-Hans/use-cases/node-collaboration",
      requiredApiCapabilities: ["nodes", "invocations"],
    },
    {
      track: "云托管编排能力",
      pageModule: "Waitlist + 能力边界页",
      status: "In Progress",
      cta: "加入等待名单",
      productPath: "/zh-Hans/waitlist",
      requiredApiCapabilities: ["managedCloudOrchestration"],
    },
    {
      track: "Ask 主路径",
      pageModule: "Ask 主路径演示页",
      status: "In Progress",
      cta: "查看 Ask",
      productPath: "/zh-Hans/ask",
      requiredApiCapabilities: ["askRouteV1"],
    },
    {
      track: "失败回退 + HITL",
      pageModule: "回退与 HITL 说明页",
      status: "In Progress",
      cta: "查看回退",
      productPath: "/zh-Hans/recovery-hitl",
      requiredApiCapabilities: ["fallbackActionsV1", "hitlActionsV1"],
    },
    {
      track: "订阅任务生命周期",
      pageModule: "订阅任务价值页",
      status: "Coming Soon",
      cta: "查看生命周期",
      productPath: "/zh-Hans/subscriptions",
      requiredApiCapabilities: ["taskInstancesV1"],
    },
    {
      track: "连接器治理",
      pageModule: "连接器治理页",
      status: "Coming Soon",
      cta: "查看控制面",
      productPath: "/zh-Hans/connectors-governance",
      requiredApiCapabilities: ["connectorAuthV1", "localActionReceiptsV1"],
    },
    {
      track: "自主业务协作场景",
      pageModule: "Use Cases 扩展",
      status: "Research",
      cta: "预约 Demo",
      productPath: "/zh-Hans/demo",
      requiredApiCapabilities: ["revenueOpsAutomation"],
    },
    {
      track: "生态伙伴市集",
      pageModule: "未来伙伴与扩展能力入口",
      status: "Coming Soon",
      cta: "加入等待名单",
      productPath: "/zh-Hans/waitlist",
      requiredApiCapabilities: [],
    },
  ],
};

export function getVisionTracks(locale: Locale): VisionTrack[] {
  return VISION_TRACKS_BY_LOCALE[locale];
}
