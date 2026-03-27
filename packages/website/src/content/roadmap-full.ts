/**
 * T-3.8 完整路线图数据：Phase 0–4+ 含里程碑与子交付项，七大里程碑卡片。
 * 数据源：CTO-Product-Mainline-and-Roadmap-v1.md
 */

import type { Locale } from "@/lib/i18n/locales";
import type { VisionStatus } from "@/content/i18n/vision-status";

export type RoadmapPhaseStatus = "Now" | "In Progress" | "Coming Soon" | "Planned" | "Research";

export type PhaseMilestone = {
  id: string;
  name: string;
  status: RoadmapPhaseStatus;
  deliverables: string[];
};

export type RoadmapPhaseFull = {
  id: string;
  name: string;
  status: RoadmapPhaseStatus;
  oneLiner?: string;
  milestones: PhaseMilestone[];
};

export type MilestoneCardData = {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  /** 与主规格一致的消费侧状态徽记 */
  consumerStatus: VisionStatus;
};

export type RoadmapJourneySection = {
  title: string;
  tagline: string;
  milestoneIds: readonly string[];
};

export type RoadmapFull = {
  title: string;
  subtitle: string;
  phases: RoadmapPhaseFull[];
  milestoneCards: MilestoneCardData[];
  /** 里程碑卡片展开区标题（三语） */
  capabilityLabel: string;
  /** 对外分组（里程碑呈现顺序，编号 1–7） */
  journeySections: RoadmapJourneySection[];
  milestonesHeading: string;
  /** Phase 时间线区块标题 */
  phasesSectionHeading: string;
  phasesSectionLead: string;
};

export function milestoneById(cards: MilestoneCardData[]): Map<string, MilestoneCardData> {
  return new Map(cards.map((m) => [m.id, m]));
}

export function milestonesInOrder(
  cards: MilestoneCardData[],
  ids: readonly string[],
): MilestoneCardData[] {
  const map = milestoneById(cards);
  return ids.map((id) => {
    const m = map.get(id);
    if (!m) throw new Error(`roadmap-full: missing milestone id "${id}"`);
    return m;
  });
}

const ROADMAP_FULL: Record<Locale, RoadmapFull> = {
  en: {
    title: "What we're building—and in what order",
    subtitle:
      "GaiaLynk keeps governed collaboration in one chat-shaped workspace. You start from agents listed in the Agent Hub; self-hosting is not required to begin.",
    phases: [
      {
        id: "phase-0",
        name: "Agent access & call closure",
        status: "Now",
        oneLiner: "First « user → verified Agent → result + receipt » loop; malicious Agents kept out.",
        milestones: [
          { id: "M1-a", name: "Protocol & identity", status: "Now", deliverables: ["A2A extension base", "Agent type model", "Receipt model", "Structured channels"] },
          { id: "M1-b", name: "Mainnet minimal loop", status: "Now", deliverables: ["Session CRUD + message flow", "Agent Hub + query", "A2A Gateway", "Minimal audit + receipts"] },
          { id: "M1-c", name: "Developer entry", status: "Now", deliverables: ["Protocol docs", "SDK", "Developer quickstart"] },
          { id: "M1-d", name: "Minimal console", status: "Now", deliverables: ["Thin UI / console", "End-to-end demo"] },
          { id: "M1-e", name: "Security baseline", status: "Now", deliverables: ["Structured channels", "SDK anti-injection helper", "High-risk default deny"] },
        ],
      },
      {
        id: "phase-1",
        name: "Collaborative governance & automation start",
        status: "In Progress",
        oneLiner: "Multi-Agent collaboration with risk visibility; human review and fallbacks; automation begins.",
        milestones: [
          { id: "M2-a", name: "Session experience", status: "In Progress", deliverables: ["Threads", "@ mentions", "Presence", "Invite flow"] },
          { id: "M2-b", name: "Trust Policy + HITL", status: "In Progress", deliverables: ["Trust policy engine", "Human review workflow", "Approval history", "Verifiable receipts"] },
          { id: "M2-c", name: "Failure fallback", status: "In Progress", deliverables: ["Retry / switch / degrade", "A2A visualization L1+L2"] },
          { id: "M2-d", name: "Off-chain reputation v1", status: "In Progress", deliverables: ["Reputation profile", "Injection detection v1", "Data boundary policy"] },
          { id: "M3-a", name: "One-click deploy first Agent", status: "In Progress", deliverables: ["Onboarding → template → config → deploy"] },
          { id: "M3-b", name: "Subscription task MVP", status: "Coming Soon", deliverables: ["Create / pause / delete", "Basic scheduling", "History view"] },
          { id: "M3-c", name: "Connector MVP", status: "Coming Soon", deliverables: ["1–2 local actions", "3-layer auth", "Execution evidence"] },
        ],
      },
      {
        id: "phase-2",
        name: "Automation + ecosystem + node start",
        status: "Coming Soon",
        oneLiner: "Automation reliable; Agent market open to third parties; self-hosted nodes can join.",
        milestones: [
          { id: "M3-d", name: "Subscription tasks complete", status: "Coming Soon", deliverables: ["Params", "Alerts", "Templates", "Notification policy"] },
          { id: "M3-e", name: "Connector enhancement", status: "Coming Soon", deliverables: ["More action types", "Auth expiry", "Offline fallback", "Privacy mode"] },
          { id: "M4-a", name: "Agent hosted runtime", status: "Coming Soon", deliverables: ["Code upload + template instantiation", "Lifecycle management"] },
          { id: "M4-b", name: "Agent market v1", status: "Coming Soon", deliverables: ["Listing flow", "Health check", "Capability verification", "Browse & search"] },
          { id: "M4-c", name: "Billing & invoicing", status: "Coming Soon", deliverables: ["Usage billing", "Invoice generation", "Payment integration"] },
          { id: "M4-d", name: "Publisher panel", status: "Coming Soon", deliverables: ["Call volume", "Success rate", "Revenue", "Version management"] },
          { id: "M5-a", name: "Node–Hub protocol v1", status: "Coming Soon", deliverables: ["Node registration", "Heartbeat", "Agent Hub sync", "Cross-node relay MVP"] },
          { id: "M5-b", name: "IM bridge v1", status: "Coming Soon", deliverables: ["Official 1–2 connectors", "Bridge API v1"] },
        ],
      },
      {
        id: "phase-3",
        name: "Network effect + enterprise governance",
        status: "Planned",
        oneLiner: "Node network in place; orchestration lowers complexity; enterprise compliance ready.",
        milestones: [
          { id: "M5-c", name: "Node ecosystem", status: "Planned", deliverables: ["Node revenue share", "Connection wizard", "Compatibility promise", "Node reputation"] },
          { id: "M5-d", name: "IM bridge enhancement", status: "Planned", deliverables: ["More IM platforms", "Reconnect recovery", "Channel/session mapping"] },
          { id: "M6-a", name: "Orchestration engine", status: "Planned", deliverables: ["Orchestration DSL + runtime", "Template library", "Advanced intent routing"] },
          { id: "M6-b", name: "Visual orchestration", status: "Planned", deliverables: ["Low-code drag-and-drop editor"] },
          { id: "M6-c", name: "Enterprise compliance", status: "Planned", deliverables: ["Compliance reports", "Tamper-evident storage", "TEE (optional)", "Enterprise SLA"] },
          { id: "M6-d", name: "Enterprise white-label", status: "Planned", deliverables: ["Custom domain", "Branding", "Dedicated support"] },
          { id: "M6-e", name: "Advanced observability", status: "Planned", deliverables: ["Alerts & SLO", "APM integration", "A2A visualization L3"] },
        ],
      },
      {
        id: "phase-4",
        name: "Physical world integration",
        status: "Research",
        oneLiner: "Agents move from cloud into real space; hardware becomes trusted edge nodes.",
        milestones: [
          { id: "M7-a", name: "Agent Dock onboarding", status: "Research", deliverables: ["First-time binding", "Plug-and-play online", "Device identity", "Basic session access"] },
          { id: "M7-b", name: "Local action hub", status: "Research", deliverables: ["Local permission hub", "Action execution loop", "High-risk physical confirm"] },
          { id: "M7-c", name: "Execution Agent ecosystem", status: "Research", deliverables: ["Execution Agent adapter", "Legacy device spec", "Device directory"] },
          { id: "M7-d", name: "Space-level collaboration", status: "Research", deliverables: ["Multi-device squad", "Event-driven sessions", "Cloud-edge orchestration"] },
          { id: "M7-e", name: "Real-time channels", status: "Research", deliverables: ["Audio/video", "Screen sharing"] },
        ],
      },
    ],
    milestonesHeading: "Product milestones",
    phasesSectionHeading: "Engineering phases (reference)",
    phasesSectionLead:
      "The cards above are ordered for clarity on the page. Phases 0–4+ describe roughly how we build toward those capabilities. Expand each phase for sub-milestones.",
    journeySections: [
      {
        title: "Verified access, automation, and open supply",
        tagline:
          "From listed, verified agents in the Agent Hub to repeatable automation and open supply: attributable execution, ready to scale.",
        milestoneIds: ["1", "2", "3"],
      },
      {
        title: "Collaboration, policy, and enterprise governance",
        tagline:
          "Many agents and people in one conversation under runtime rules; human confirmation where it matters; enterprise-grade orchestration and compliance as you grow.",
        milestoneIds: ["4", "5"],
      },
      {
        title: "Network scale and physical integration (outlook)",
        tagline:
          "Federated networking and edge devices extend collaboration into broader settings. Timing and scope are published on the product roadmap and updated with releases.",
        milestoneIds: ["6", "7"],
      },
    ],
    capabilityLabel: "What you get",
    milestoneCards: [
      {
        id: "1",
        name: "Trusted execution: foundational layer",
        consumerStatus: "Now",
        description:
          "GaiaLynk establishes a baseline for attributable, verifiable execution: conversational workflows are fulfilled by listed, verified agents in the Agent Hub; untrusted agents are excluded, and each invocation yields an auditable record with a verifiable receipt. Later milestones build on this foundation.",
        capabilities: [
          "Conversational messaging",
          "Agent Hub listing and selection",
          "A2A Gateway",
          "Audit trail with verifiable receipts",
          "Protocol documentation and SDK",
        ],
      },
      {
        id: "2",
        name: "Recurring operations and connectors",
        consumerStatus: "Now",
        description:
          "After single invocations stabilize, the platform adds repeatable operation: subscription-based tasks and connectors integrate agents with existing systems; pause, resume, and execution history stay under the account holder’s control.",
        capabilities: [
          "Subscription-based tasks",
          "Task scheduling",
          "Connectors (integration with existing systems)",
          "Evidence of local execution",
        ],
      },
      {
        id: "3",
        name: "Publisher listings and catalog discovery",
        consumerStatus: "Now",
        description:
          "With core invocation and automation in production use, publisher-facing capabilities support listing agents for others to select and enable from the Agent Hub. Hosted runtime, discovery, and publisher tooling expand the catalog without assuming everyone must self-host.",
        capabilities: [
          "Hosted runtime",
          "Catalog discovery and listings in the Hub",
          "Billing and publisher console",
          "Template library",
        ],
      },
      {
        id: "4",
        name: "Teams, policy, many agents",
        consumerStatus: "Now",
        description:
          "As work becomes shared, multiple agents and teammates meet on one timeline. Runtime rules and human review catch high-impact steps, with reputation signals and fallbacks when outcomes drift.",
        capabilities: [
          "Threads, @mentions, presence",
          "Runtime policy + human review",
          "Retry / switch / degrade",
          "Reputation signals",
        ],
      },
      {
        id: "5",
        name: "Enterprise programs",
        consumerStatus: "Developing",
        description:
          "Orchestration for complex flows; compliance artifacts, white-label, and deeper observability so sign-off and audit views scale with the organization.",
        capabilities: ["Orchestration DSL & runtime", "Visual editor", "Compliance reports", "TEE, SLA, white-label"],
      },
      {
        id: "6",
        name: "Network effect",
        consumerStatus: "Planned",
        description:
          "Further out on the roadmap, we are shaping subnet federation and cross-node collaboration: self-hosted nodes, broader discovery, and policy-guided connectivity between deployments, delivered in steps as capabilities mature.",
        capabilities: [
          "Wider network participation on policy-backed terms",
          "Governed links between deployments so discovery and hand-offs stay accountable",
          "Bridges to the chat tools teams already use",
          "Sustainable participation for people who help run the network",
        ],
      },
      {
        id: "7",
        name: "Physical world",
        consumerStatus: "Planned",
        description:
          "On the horizon: bringing devices and real-world identities, including shop floors and edge locations, into the same governance model you expect from GaiaLynk, when the roadmap indicates readiness.",
        capabilities: ["Agent Dock", "Local action hub", "Execution-agent adapter", "Space-level collaboration"],
      },
    ],
  },
  "zh-Hant": {
    title: "我們正在建造什麼，以及先後順序",
    subtitle:
      "GaiaLynk 將受治理的協作收斂在同一對話形態的工作區。您可從智能體中心選用已列示智能體起步，無須先行完成自建託管。",
    milestonesHeading: "產品里程碑",
    phasesSectionHeading: "工程階段（對照用）",
    phasesSectionLead:
      "上方卡片依易讀順序排列；Phase 0–4+ 呈現我們大致如何一步步往這些能力落地。展開各階可見子里程碑。",
    journeySections: [
      {
        title: "可信准入、自動化與開放供給",
        tagline:
          "從智能體中心內已列示且經驗證的智能體，到可重複的自動化與開放供給：可歸因執行，並可擴展。",
        milestoneIds: ["1", "2", "3"],
      },
      {
        title: "協作、策略與企業治理",
        tagline:
          "多智能體與多人在同一對話中，依執行當下規則協作；必要處由人確認；成長後銜接企業級編排與合規。",
        milestoneIds: ["4", "5"],
      },
      {
        title: "網絡規模與物理整合（展望）",
        tagline:
          "聯邦式組網與邊緣設備把協作延伸到更廣的實際場景。上線節奏與範圍於產品路線圖隨釋出更新。",
        milestoneIds: ["6", "7"],
      },
    ],
    capabilityLabel: "這一項帶來什麼",
    phases: [
      {
        id: "phase-0",
        name: "Agent 准入與調用閉環",
        status: "Now",
        oneLiner: "第一條「用戶 → 經過驗證的 Agent → 結果 + 收據」鏈路跑通，惡意 Agent 擋在門外。",
        milestones: [
          { id: "M1-a", name: "協議與身份", status: "Now", deliverables: ["A2A 擴展基礎", "Agent 類型模型", "收據模型", "結構化通道"] },
          { id: "M1-b", name: "主網最小閉環", status: "Now", deliverables: ["會話 CRUD + 消息流", "智能體中心 + 查詢", "A2A Gateway", "最小審計 + 收據"] },
          { id: "M1-c", name: "開發者入口", status: "Now", deliverables: ["協議文檔", "SDK", "開發者快速開始"] },
          { id: "M1-d", name: "極簡控制台", status: "Now", deliverables: ["最薄 UI / 控制台", "端到端 demo"] },
          { id: "M1-e", name: "安全基線", status: "Now", deliverables: ["結構化通道", "SDK 防注入", "高風險預設拒絕"] },
        ],
      },
      {
        id: "phase-1",
        name: "協作風控 + 自動化起步",
        status: "In Progress",
        oneLiner: "多 Agent 協作有風險可見性，人審與回退；自動化萌芽。",
        milestones: [
          { id: "M2-a", name: "會話體驗增強", status: "In Progress", deliverables: ["線程", "@ 提及", "在線狀態", "邀請流程"] },
          { id: "M2-b", name: "Trust Policy + HITL", status: "In Progress", deliverables: ["可信調用決策", "人審工作流", "審批歷史", "可驗證收據"] },
          { id: "M2-c", name: "失敗回退", status: "In Progress", deliverables: ["重試/切換/降級", "A2A 可視化 L1+L2"] },
          { id: "M2-d", name: "鏈下信譽 v1", status: "In Progress", deliverables: ["多維信譽畫像", "注入檢測 v1", "數據邊界策略"] },
          { id: "M3-a", name: "一鍵部署首個 Agent", status: "In Progress", deliverables: ["引導 → 選模板 → 配置 → 部署"] },
          { id: "M3-b", name: "訂閱任務 MVP", status: "Coming Soon", deliverables: ["創建/暫停/刪除", "基礎調度", "歷史查看"] },
          { id: "M3-c", name: "連接器 MVP", status: "Coming Soon", deliverables: ["1–2 個本地動作", "三層授權", "執行證據"] },
        ],
      },
      {
        id: "phase-2",
        name: "自動化完善 + 開放生態 + 節點起步",
        status: "Coming Soon",
        oneLiner: "自動化可靠運行，Agent 市場開放第三方供給，自建節點可連入主網。",
        milestones: [
          { id: "M3-d", name: "訂閱任務完善", status: "Coming Soon", deliverables: ["參數修改", "異常通知", "任務模板化", "通知策略"] },
          { id: "M3-e", name: "連接器增強", status: "Coming Soon", deliverables: ["更多動作類型", "授權時效", "離線降級", "隱私模式"] },
          { id: "M4-a", name: "Agent 託管運行時", status: "Coming Soon", deliverables: ["代碼上傳 + 模板實例化", "生命週期管理"] },
          { id: "M4-b", name: "Agent 市場 v1", status: "Coming Soon", deliverables: ["上架流程", "健康檢查", "能力驗證", "瀏覽與搜索"] },
          { id: "M4-c", name: "計費與賬單", status: "Coming Soon", deliverables: ["用量計費", "賬單生成", "支付對接"] },
          { id: "M4-d", name: "發布者面板", status: "Coming Soon", deliverables: ["調用量", "成功率", "收益", "版本管理"] },
          { id: "M5-a", name: "Node–Hub 協議 v1", status: "Coming Soon", deliverables: ["節點註冊", "心跳", "智能體中心同步", "跨節點中繼 MVP"] },
          { id: "M5-b", name: "IM 橋 v1", status: "Coming Soon", deliverables: ["官方 1–2 個 Connector", "Bridge API v1"] },
        ],
      },
      {
        id: "phase-3",
        name: "網絡效應 + 企業治理",
        status: "Planned",
        oneLiner: "節點網絡成型，編排降低複雜任務門檻，企業合規開箱即用。",
        milestones: [
          { id: "M5-c", name: "節點生態", status: "Planned", deliverables: ["節點分成", "連接嚮導", "兼容性承諾", "節點信譽"] },
          { id: "M5-d", name: "IM 橋增強", status: "Planned", deliverables: ["更多 IM 平台", "斷連恢復", "頻道/會話映射"] },
          { id: "M6-a", name: "編排引擎", status: "Planned", deliverables: ["編排 DSL + 運行時", "模板庫", "高級意圖路由"] },
          { id: "M6-b", name: "可視化編排", status: "Planned", deliverables: ["低代碼拖拽編輯器"] },
          { id: "M6-c", name: "企業合規", status: "Planned", deliverables: ["合規報表", "不可篡改存儲", "TEE（可選）", "企業 SLA"] },
          { id: "M6-d", name: "企業白標", status: "Planned", deliverables: ["獨立域名", "品牌定制", "專屬支持"] },
          { id: "M6-e", name: "高級可觀測", status: "Planned", deliverables: ["告警與 SLO", "APM 集成", "A2A 可視化 L3"] },
        ],
      },
      {
        id: "phase-4",
        name: "物理世界融合",
        status: "Research",
        oneLiner: "Agent 從雲端走進現實空間，硬件設備成為網絡中可信邊緣節點。",
        milestones: [
          { id: "M7-a", name: "Agent Dock 接入", status: "Research", deliverables: ["首次綁定", "插上即在線", "設備身份", "基礎會話接入"] },
          { id: "M7-b", name: "本地行動中樞", status: "Research", deliverables: ["本地權限中樞", "行動執行閉環", "高風險物理確認"] },
          { id: "M7-c", name: "執行 Agent 生態", status: "Research", deliverables: ["執行 Agent 適配層", "傳統設備接入規範", "設備目錄"] },
          { id: "M7-d", name: "空間級協同", status: "Research", deliverables: ["多設備小隊", "事件驅動會話", "雲邊協同調度"] },
          { id: "M7-e", name: "實時通道", status: "Research", deliverables: ["音視頻", "屏幕共享"] },
        ],
      },
    ],
    milestoneCards: [
      {
        id: "1",
        name: "可信執行之基礎層",
        consumerStatus: "Now",
        description:
          "GaiaLynk 建立可歸因、可驗證之執行基線：於對話工作流中，需求由智能體中心內已列示且經驗證的智能體處理；不可信來源不予接入，每次調用產出可稽核紀錄與可驗證收據。後續里程碑均於此基礎上延伸。",
        capabilities: [
          "對話與訊息流",
          "智能體中心列示與選用",
          "A2A Gateway",
          "稽核軌跡與可驗證收據",
          "協議文檔與 SDK",
        ],
      },
      {
        id: "2",
        name: "週期性任務與系統連接器",
        consumerStatus: "Now",
        description:
          "於單次調用模式趨於穩定後，平台補強可重複運行能力：以訂閱式任務與連接器將智能體與既有系統銜接；暫停、恢復與執行歷程由帳戶持有人自主管理。",
        capabilities: ["訂閱式任務", "任務排程", "連接器（與既有系統整合）", "本地執行之佐證材料"],
      },
      {
        id: "3",
        name: "發布者上架與目錄可發現性",
        consumerStatus: "Now",
        description:
          "當核心調用與自動化已具可依賴之閉環，面向發布者之能力隨之開放：支援上架智能體，供他人在智能體中心選用與啟用；託管運行時、可發現性及發布者工具協同支撐目錄擴充，無須假設所有參與者均需先行自建託管。",
        capabilities: ["託管運行時", "智能體中心內之目錄發現與列示", "計費與發布者控制台", "模板庫"],
      },
      {
        id: "4",
        name: "多人協作——策略與多智能體",
        consumerStatus: "Now",
        description:
          "當工作變成多人共事，多個智能體與成員匯入同一時間線；以執行當下規則與人工覆核收束高影響步驟，並以信譽訊號與回退承接結果波動。",
        capabilities: ["對話串、@ 提及、在線狀態", "執行規則＋人工覆核", "重試／切換／降級", "信譽訊號"],
      },
      {
        id: "5",
        name: "企業級方案",
        consumerStatus: "Developing",
        description:
          "編排複雜流程；合規產出、白標與更深可觀測，使簽核與審計視圖隨組織擴展。",
        capabilities: ["編排 DSL 與運行時", "可視化編輯器", "合規報表", "TEE、SLA、白標"],
      },
      {
        id: "6",
        name: "網絡效應",
        consumerStatus: "Planned",
        description:
          "在更長的產品路線上，我們持續探索子網聯邦與跨節點協作，包含自建節點、更廣的可發現性，以及在策略下走向 Agent 互聯網，隨能力成熟分階段推進。",
        capabilities: [
          "在策略保障下參與更廣協作網絡",
          "受治理的環境銜接，使可發現性與交接仍可歸因",
          "與日常慣用之對話工具銜接",
          "協助維運網絡之參與方獲得可持續參與空間",
        ],
      },
      {
        id: "7",
        name: "物理世界",
        consumerStatus: "Planned",
        description:
          "同樣屬前瞻方向：把設備與產線身份納入同一套治理模型，使實體現場以可管理的參與方加入協作；上線節奏見產品路線圖。",
        capabilities: ["Agent Dock", "本地行動中樞", "執行智能體適配", "空間級協同"],
      },
    ],
  },
  "zh-Hans": {
    title: "我们正在建造什么，以及先后顺序",
    subtitle:
      "GaiaLynk 将受治理的协作收敛在同一会话形态的工作区。您可从智能体中心选用已列示智能体起步，无须先行完成自建托管。",
    milestonesHeading: "产品里程碑",
    phasesSectionHeading: "工程阶段（对照用）",
    phasesSectionLead:
      "上方卡片依易读顺序排列；Phase 0–4+ 呈现我们大致如何一步步往这些能力落地。展开各阶段可见子里程碑。",
    journeySections: [
      {
        title: "可信准入、自动化与开放供给",
        tagline:
          "从智能体中心内已列示且经验证的智能体，到可重复的自动化与开放供给：可归因执行，并可扩展。",
        milestoneIds: ["1", "2", "3"],
      },
      {
        title: "协作、策略与企业治理",
        tagline:
          "多智能体与多人在同一会话中，依执行当下规则协作；必要处由人确认；成长后衔接企业级编排与合规。",
        milestoneIds: ["4", "5"],
      },
      {
        title: "网络规模与物理整合（展望）",
        tagline:
          "联邦式组网与边缘设备把协作延伸到更广的实际场景。上线节奏与范围于产品路线图随发布更新。",
        milestoneIds: ["6", "7"],
      },
    ],
    capabilityLabel: "这一项带来什么",
    phases: [
      {
        id: "phase-0",
        name: "Agent 准入与调用闭环",
        status: "Now",
        oneLiner: "第一条「用户 → 经过验证的 Agent → 结果 + 收据」链路跑通，恶意 Agent 挡在门外。",
        milestones: [
          { id: "M1-a", name: "协议与身份", status: "Now", deliverables: ["A2A 扩展基础", "Agent 类型模型", "收据模型", "结构化通道"] },
          { id: "M1-b", name: "主网最小闭环", status: "Now", deliverables: ["会话 CRUD + 消息流", "智能体中心 + 查询", "A2A Gateway", "最小审计 + 收据"] },
          { id: "M1-c", name: "开发者入口", status: "Now", deliverables: ["协议文档", "SDK", "开发者快速开始"] },
          { id: "M1-d", name: "极简控制台", status: "Now", deliverables: ["最薄 UI / 控制台", "端到端 demo"] },
          { id: "M1-e", name: "安全基线", status: "Now", deliverables: ["结构化通道", "SDK 防注入", "高风险默认拒绝"] },
        ],
      },
      {
        id: "phase-1",
        name: "协作风控 + 自动化起步",
        status: "In Progress",
        oneLiner: "多 Agent 协作有风险可见性，人审与回退；自动化萌芽。",
        milestones: [
          { id: "M2-a", name: "会话体验增强", status: "In Progress", deliverables: ["线程", "@ 提及", "在线状态", "邀请流程"] },
          { id: "M2-b", name: "Trust Policy + HITL", status: "In Progress", deliverables: ["可信调用决策", "人审工作流", "审批历史", "可验证收据"] },
          { id: "M2-c", name: "失败回退", status: "In Progress", deliverables: ["重试/切换/降级", "A2A 可视化 L1+L2"] },
          { id: "M2-d", name: "链下信誉 v1", status: "In Progress", deliverables: ["多维信誉画像", "注入检测 v1", "数据边界策略"] },
          { id: "M3-a", name: "一键部署首个 Agent", status: "In Progress", deliverables: ["引导 → 选模板 → 配置 → 部署"] },
          { id: "M3-b", name: "订阅任务 MVP", status: "Coming Soon", deliverables: ["创建/暂停/删除", "基础调度", "历史查看"] },
          { id: "M3-c", name: "连接器 MVP", status: "Coming Soon", deliverables: ["1–2 个本地动作", "三层授权", "执行证据"] },
        ],
      },
      {
        id: "phase-2",
        name: "自动化完善 + 开放生态 + 节点起步",
        status: "Coming Soon",
        oneLiner: "自动化可靠运行，Agent 市场开放第三方供给，自建节点可连入主网。",
        milestones: [
          { id: "M3-d", name: "订阅任务完善", status: "Coming Soon", deliverables: ["参数修改", "异常通知", "任务模板化", "通知策略"] },
          { id: "M3-e", name: "连接器增强", status: "Coming Soon", deliverables: ["更多动作类型", "授权时效", "离线降级", "隐私模式"] },
          { id: "M4-a", name: "Agent 托管运行时", status: "Coming Soon", deliverables: ["代码上传 + 模板实例化", "生命周期管理"] },
          { id: "M4-b", name: "Agent 市场 v1", status: "Coming Soon", deliverables: ["上架流程", "健康检查", "能力验证", "浏览与搜索"] },
          { id: "M4-c", name: "计费与账单", status: "Coming Soon", deliverables: ["用量计费", "账单生成", "支付对接"] },
          { id: "M4-d", name: "发布者面板", status: "Coming Soon", deliverables: ["调用量", "成功率", "收益", "版本管理"] },
          { id: "M5-a", name: "Node–Hub 协议 v1", status: "Coming Soon", deliverables: ["节点注册", "心跳", "智能体中心同步", "跨节点中继 MVP"] },
          { id: "M5-b", name: "IM 桥 v1", status: "Coming Soon", deliverables: ["官方 1–2 个 Connector", "Bridge API v1"] },
        ],
      },
      {
        id: "phase-3",
        name: "网络效应 + 企业治理",
        status: "Planned",
        oneLiner: "节点网络成型，编排降低复杂任务门槛，企业合规开箱即用。",
        milestones: [
          { id: "M5-c", name: "节点生态", status: "Planned", deliverables: ["节点分成", "连接向导", "兼容性承诺", "节点信誉"] },
          { id: "M5-d", name: "IM 桥增强", status: "Planned", deliverables: ["更多 IM 平台", "断连恢复", "频道/会话映射"] },
          { id: "M6-a", name: "编排引擎", status: "Planned", deliverables: ["编排 DSL + 运行时", "模板库", "高级意图路由"] },
          { id: "M6-b", name: "可视化编排", status: "Planned", deliverables: ["低代码拖拽编辑器"] },
          { id: "M6-c", name: "企业合规", status: "Planned", deliverables: ["合规报表", "不可篡改存储", "TEE（可选）", "企业 SLA"] },
          { id: "M6-d", name: "企业白标", status: "Planned", deliverables: ["独立域名", "品牌定制", "专属支持"] },
          { id: "M6-e", name: "高级可观测", status: "Planned", deliverables: ["告警与 SLO", "APM 集成", "A2A 可视化 L3"] },
        ],
      },
      {
        id: "phase-4",
        name: "物理世界融合",
        status: "Research",
        oneLiner: "Agent 从云端走进现实空间，硬件设备成为网络中可信边缘节点。",
        milestones: [
          { id: "M7-a", name: "Agent Dock 接入", status: "Research", deliverables: ["首次绑定", "插上即在线", "设备身份", "基础会话接入"] },
          { id: "M7-b", name: "本地行动中枢", status: "Research", deliverables: ["本地权限中枢", "行动执行闭环", "高风险物理确认"] },
          { id: "M7-c", name: "执行 Agent 生态", status: "Research", deliverables: ["执行 Agent 适配层", "传统设备接入规范", "设备目录"] },
          { id: "M7-d", name: "空间级协同", status: "Research", deliverables: ["多设备小队", "事件驱动会话", "云边协同调度"] },
          { id: "M7-e", name: "实时通道", status: "Research", deliverables: ["音视频", "屏幕共享"] },
        ],
      },
    ],
    milestoneCards: [
      {
        id: "1",
        name: "可信执行之基础层",
        consumerStatus: "Now",
        description:
          "GaiaLynk 建立可归因、可验证的执行基线：在对话工作流中，需求由智能体中心内已列示且经验证的智能体处理；不可信来源不予接入，每次调用产出可稽核记录与可验证收据。后续里程碑均在此基础上延伸。",
        capabilities: [
          "对话与消息流",
          "智能体中心列示与选用",
          "A2A Gateway",
          "稽核轨迹与可验证收据",
          "协议文档与 SDK",
        ],
      },
      {
        id: "2",
        name: "周期性任务与系统连接器",
        consumerStatus: "Now",
        description:
          "在单次调用模式趋于稳定后，平台补强可重复运行能力：以订阅式任务与连接器将智能体与既有系统衔接；暂停、恢复与执行历程由账户持有人自主管理。",
        capabilities: ["订阅式任务", "任务排程", "连接器（与既有系统整合）", "本地执行之佐证材料"],
      },
      {
        id: "3",
        name: "发布者上架与目录可发现性",
        consumerStatus: "Now",
        description:
          "当核心调用与自动化已具备可依赖的闭环，面向发布者的能力随之开放：支持上架智能体，供他人在智能体中心选用与启用；托管运行时、可发现性及发布者工具协同支撑目录扩充，无须假设所有参与者均需先行自建托管。",
        capabilities: ["托管运行时", "智能体中心内之目录发现与列示", "计费与发布者控制台", "模板库"],
      },
      {
        id: "4",
        name: "多人协作——策略与多智能体",
        consumerStatus: "Now",
        description:
          "当工作变成多人共事，多个智能体与成员汇入同一时间线；以执行当下规则与人工复核收束高影响步骤，并以信誉信号与回退承接结果波动。",
        capabilities: ["对话串、@ 提及、在线状态", "执行规则＋人工复核", "重试／切换／降级", "信誉信号"],
      },
      {
        id: "5",
        name: "企业级方案",
        consumerStatus: "Developing",
        description:
          "编排复杂流程；合规产出、白标与更深可观测，使签核与审计视图随组织扩展。",
        capabilities: ["编排 DSL 与运行时", "可视化编辑器", "合规报表", "TEE、SLA、白标"],
      },
      {
        id: "6",
        name: "网络效应",
        consumerStatus: "Planned",
        description:
          "在更长的产品路线上，我们持续探索子网联邦与跨节点协作，包含自建节点、更广的可发现性，以及在策略下走向 Agent 互联网，随能力成熟分阶段推进。",
        capabilities: [
          "在策略保障下参与更广协作网络",
          "受治理的环境衔接，使可发现性与交接仍可归因",
          "与日常惯用之对话工具衔接",
          "协助维运网络的参与方获得可持续参与空间",
        ],
      },
      {
        id: "7",
        name: "物理世界",
        consumerStatus: "Planned",
        description:
          "同样属前瞻方向：把设备与产线身份纳入同一套治理模型，使实体现场以可管理的参与方加入协作；上线节奏见产品路线图。",
        capabilities: ["Agent Dock", "本地行动中枢", "执行智能体适配", "空间级协同"],
      },
    ],
  },
};

export function getRoadmapFull(locale: Locale): RoadmapFull {
  return ROADMAP_FULL[locale];
}
