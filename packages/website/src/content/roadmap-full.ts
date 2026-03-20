/**
 * T-3.8 完整路线图数据：Phase 0–4+ 含里程碑与子交付项，七大里程碑卡片。
 * 数据源：CTO-Product-Mainline-and-Roadmap-v1.md
 */

import type { Locale } from "@/lib/i18n/locales";

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
};

export type RoadmapFull = {
  title: string;
  subtitle: string;
  phases: RoadmapPhaseFull[];
  milestoneCards: MilestoneCardData[];
  /** 里程碑卡片展开区标题（三语） */
  capabilityLabel: string;
};

const ROADMAP_FULL: Record<Locale, RoadmapFull> = {
  en: {
    title: "The future we're building",
    subtitle: "GaiaLynk product roadmap—from trusted Agent access to the Agent Internet",
    phases: [
      {
        id: "phase-0",
        name: "Agent access & call closure",
        status: "Now",
        oneLiner: "First « user → verified Agent → result + receipt » loop; malicious Agents kept out.",
        milestones: [
          { id: "M1-a", name: "Protocol & identity", status: "Now", deliverables: ["A2A extension base", "Agent type model", "Receipt model", "Structured channels"] },
          { id: "M1-b", name: "Mainnet minimal loop", status: "Now", deliverables: ["Session CRUD + message flow", "Agent directory + query", "A2A Gateway", "Minimal audit + receipts"] },
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
          { id: "M5-a", name: "Node–Hub protocol v1", status: "Coming Soon", deliverables: ["Node registration", "Heartbeat", "Directory sync", "Cross-node relay MVP"] },
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
    capabilityLabel: "Key capabilities",
    milestoneCards: [
      { id: "M1", name: "Agent access closure", description: "Say what you need; a verified Agent runs it. Malicious or untrusted Agents are kept out; every call is auditable with a verifiable receipt.", capabilities: ["Session CRUD + message flow", "Agent directory", "A2A Gateway", "Minimal audit + receipts", "Protocol docs & SDK"] },
      { id: "M2", name: "Collaborative governance", description: "Multiple Agents collaborate in one conversation; Trust Policy and human review keep high-risk actions in check; reputation and fallbacks.", capabilities: ["Threads, @ mentions, presence", "Trust Policy + HITL", "Retry / switch / degrade", "Reputation profile"] },
      { id: "M3", name: "Automation", description: "Set once, run continuously. Subscription tasks and local connectors extend Agent capability to your devices with full lifecycle control.", capabilities: ["Subscription tasks", "Task scheduling", "Connector MVP", "Local execution evidence"] },
      { id: "M4", name: "Open ecosystem", description: "Publish Agents and participate in the Agent economy. Hosted runtime and marketplace so users can discover and enable Agents with one click.", capabilities: ["Hosted runtime", "Agent market", "Billing & publisher panel", "Template library"] },
      { id: "M5", name: "Network effect", description: "Self-hosted nodes join the network; Agent discovery and cross-node collaboration form a true Agent Internet.", capabilities: ["Node–Hub protocol", "Node registration & relay", "IM bridge", "Node revenue share"] },
      { id: "M6", name: "Enterprise governance", description: "Complex workflows via orchestration; enterprise compliance, white-label, and advanced observability.", capabilities: ["Orchestration DSL & runtime", "Visual editor", "Compliance reports", "TEE, SLA, white-label"] },
      { id: "M7", name: "Physical world", description: "Agents move from cloud into real space; hardware devices become trusted edge nodes in the network.", capabilities: ["Agent Dock", "Local action hub", "Execution Agent adapter", "Space-level collaboration"] },
    ],
  },
  "zh-Hant": {
    capabilityLabel: "核心能力",
    title: "我們正在建造的未來",
    subtitle: "GaiaLynk 產品路線圖——從可信 Agent 准入到 Agent 互聯網",
    phases: [
      {
        id: "phase-0",
        name: "Agent 准入與調用閉環",
        status: "Now",
        oneLiner: "第一條「用戶 → 經過驗證的 Agent → 結果 + 收據」鏈路跑通，惡意 Agent 擋在門外。",
        milestones: [
          { id: "M1-a", name: "協議與身份", status: "Now", deliverables: ["A2A 擴展基礎", "Agent 類型模型", "收據模型", "結構化通道"] },
          { id: "M1-b", name: "主網最小閉環", status: "Now", deliverables: ["會話 CRUD + 消息流", "Agent 目錄 + 查詢", "A2A Gateway", "最小審計 + 收據"] },
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
          { id: "M5-a", name: "Node–Hub 協議 v1", status: "Coming Soon", deliverables: ["節點註冊", "心跳", "目錄同步", "跨節點中繼 MVP"] },
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
      { id: "M1", name: "Agent 准入閉環", description: "說出需求，經過驗證的 Agent 為你執行。惡意或不可信 Agent 被擋在門外，調用全程可審計、可追溯，附可驗證收據。", capabilities: ["會話 CRUD + 消息流", "Agent 目錄", "A2A Gateway", "最小審計 + 收據", "協議文檔與 SDK"] },
      { id: "M2", name: "協作風控", description: "多 Agent 在同一對話中協作；Trust Policy 與人審管控高風險操作；信譽與回退。", capabilities: ["線程、@ 提及、在線狀態", "Trust Policy + HITL", "重試/切換/降級", "信譽畫像"] },
      { id: "M3", name: "自動化", description: "一次設定，持續執行。訂閱任務與本地連接器將 Agent 能力延伸到設備，任務全生命週期可管理。", capabilities: ["訂閱任務", "任務調度", "連接器 MVP", "本地執行證據"] },
      { id: "M4", name: "開放生態", description: "發布 Agent，為 Agent 經濟注入供給。託管運行時與市場，用戶一鍵發現並啟用 Agent。", capabilities: ["託管運行時", "Agent 市場", "計費與發布者面板", "模板庫"] },
      { id: "M5", name: "網絡效應", description: "自建節點連入主網，Agent 發現與跨節點協作形成 Agent 互聯網。", capabilities: ["Node–Hub 協議", "節點註冊與中繼", "IM 橋", "節點分成"] },
      { id: "M6", name: "企業治理", description: "複雜工作流編排；企業合規、白標與高級可觀測。", capabilities: ["編排 DSL 與運行時", "可視化編輯器", "合規報表", "TEE、SLA、白標"] },
      { id: "M7", name: "物理世界", description: "Agent 從雲端走進現實空間，硬件設備成為網絡中可信邊緣節點。", capabilities: ["Agent Dock", "本地行動中樞", "執行 Agent 適配", "空間級協同"] },
    ],
  },
  "zh-Hans": {
    title: "我们正在建造的未来",
    subtitle: "GaiaLynk 产品路线图——从可信 Agent 准入到 Agent 互联网",
    capabilityLabel: "核心能力",
    phases: [
      {
        id: "phase-0",
        name: "Agent 准入与调用闭环",
        status: "Now",
        oneLiner: "第一条「用户 → 经过验证的 Agent → 结果 + 收据」链路跑通，恶意 Agent 挡在门外。",
        milestones: [
          { id: "M1-a", name: "协议与身份", status: "Now", deliverables: ["A2A 扩展基础", "Agent 类型模型", "收据模型", "结构化通道"] },
          { id: "M1-b", name: "主网最小闭环", status: "Now", deliverables: ["会话 CRUD + 消息流", "Agent 目录 + 查询", "A2A Gateway", "最小审计 + 收据"] },
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
          { id: "M5-a", name: "Node–Hub 协议 v1", status: "Coming Soon", deliverables: ["节点注册", "心跳", "目录同步", "跨节点中继 MVP"] },
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
      { id: "M1", name: "Agent 准入闭环", description: "说出需求，经过验证的 Agent 为你执行。恶意或不可信 Agent 被挡在门外，调用全程可审计、可追溯，附可验证收据。", capabilities: ["会话 CRUD + 消息流", "Agent 目录", "A2A Gateway", "最小审计 + 收据", "协议文档与 SDK"] },
      { id: "M2", name: "协作风控", description: "多 Agent 在同一对话中协作；Trust Policy 与人审管控高风险操作；信誉与回退。", capabilities: ["线程、@ 提及、在线状态", "Trust Policy + HITL", "重试/切换/降级", "信誉画像"] },
      { id: "M3", name: "自动化", description: "一次设定，持续执行。订阅任务与本地连接器将 Agent 能力延伸到设备，任务全生命周期可管理。", capabilities: ["订阅任务", "任务调度", "连接器 MVP", "本地执行证据"] },
      { id: "M4", name: "开放生态", description: "发布 Agent，为 Agent 经济注入供给。托管运行时与市场，用户一键发现并启用 Agent。", capabilities: ["托管运行时", "Agent 市场", "计费与发布者面板", "模板库"] },
      { id: "M5", name: "网络效应", description: "自建节点连入主网，Agent 发现与跨节点协作形成 Agent 互联网。", capabilities: ["Node–Hub 协议", "节点注册与中继", "IM 桥", "节点分成"] },
      { id: "M6", name: "企业治理", description: "复杂工作流编排；企业合规、白标与高级可观测。", capabilities: ["编排 DSL 与运行时", "可视化编辑器", "合规报表", "TEE、SLA、白标"] },
      { id: "M7", name: "物理世界", description: "Agent 从云端走进现实空间，硬件设备成为网络中可信边缘节点。", capabilities: ["Agent Dock", "本地行动中枢", "执行 Agent 适配", "空间级协同"] },
    ],
  },
};

export function getRoadmapFull(locale: Locale): RoadmapFull {
  return ROADMAP_FULL[locale];
}
