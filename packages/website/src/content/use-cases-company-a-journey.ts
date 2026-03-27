import type { Locale } from "@/lib/i18n/locales";

/** 主角線故事塊（官網不使用表格） */
export type JourneyStoryMoment = {
  headline: string;
  body: string;
};

export type JourneyChapterCopy = {
  id: string;
  label: string;
  title: string;
  outlookBadge: string;
  isOutlookChapter: boolean;
  narrative: string;
  /** 小標：底下故事塊的引子 */
  journeyHeading: string;
  storyMoments: JourneyStoryMoment[];
  capabilitiesHeading: string;
  capabilities: string[];
  closure?: string;
  outlookNotice?: string;
};

const EN: JourneyChapterCopy[] = [
  {
    id: "journey-chapter-1",
    label: "Chapter 1",
    title: "Natural-language requests and routed execution",
    outlookBadge: "Outlook",
    isOutlookChapter: false,
    narrative:
      "You state needs in everyday language; the platform routes work, applies policy, and keeps verifiable receipts.\n\nCompanyA is a fictional five-role sketch (marketing, leadership, engineering, procurement, operations) showing how the path widens as more people take part. Solo use follows the same shape.\n\nBefore shared threads, work proceeds in private threads; you choose listed agents in the Agent Hub, without an org-wide kickoff.",
    journeyHeading: "Five opening exchanges",
    storyMoments: [
      {
        headline: "Maya · Marketing",
        body: "Request: three short videos this week for a new device. The applicable listed agent returns scripts and rough cuts; deliverables stay on the governed thread with a reviewable record, instead of living only in informal side chats.",
      },
      {
        headline: "Alex · Executive leadership",
        body: "Request: a 90-day product narrative and a tight requirements outline. The applicable listed agent returns narrative text, a short brief, and open questions ready for review.",
      },
      {
        headline: "Jordan · Engineering",
        body: "Request: a weekly summary of hardware–software interface changes. The applicable listed agent answers in short form with risk notes; no forced cross-team meeting at this stage.",
      },
      {
        headline: "Dana · Procurement",
        body: "Request: a structured comparison of public quotes. The applicable listed agent uses public sources only, keeping a clear boundary before contracts.",
      },
      {
        headline: "Raj · Operations",
        body: "Request: next week’s shift plan under line constraints. The applicable listed agent returns an editable draft; the manager keeps authority.",
      },
    ],
    capabilitiesHeading: "What you get",
    capabilities: [
      "① Listed agents in the Agent Hub expose trust signals clearly.",
      "② Plain-language requests become routed execution through those agents.",
      "③ History stays available for audit and replay.",
    ],
    closure: "Everyone reaches a useful outcome; work still lives in individual threads.",
  },
  {
    id: "journey-chapter-2",
    label: "Chapter 2",
    title: "Repeatable, policy-aware workflows",
    outlookBadge: "Outlook",
    isOutlookChapter: false,
    narrative:
      "The same people turn proven requests into workflows you can run again: steps in natural language or from templates builders publish, with listed agents executing the chained work.",
    journeyHeading: "Longer run sequences",
    storyMoments: [
      {
        headline: "Maya · Marketing",
        body: "Listed agents run the pipeline from concept through draft, pre-publish checks, and review, within what the Agent Hub lists today.",
      },
      {
        headline: "Alex · Executive leadership",
        body: "Listed agents support layered refinement across assumptions, priorities, milestones, and risks across multiple turns in one thread.",
      },
      {
        headline: "Jordan · Engineering",
        body: "Listed agents carry the cross-domain chain: design constraints, interface specifications, and a joint integration checklist.",
      },
      {
        headline: "Dana · Procurement",
        body: "Listed agents run structured passes on specifications, lead times, and MOQs, producing tabular validated output instead of messy paste.",
      },
      {
        headline: "Raj · Operations",
        body: "Listed agents consolidate skills, maintenance windows, and shift patterns in one view.",
      },
    ],
    capabilitiesHeading: "What you get",
    capabilities: [
      "① Multi-step flows feel like one experience because agents carry the sequence.",
      "② Routing and hand-offs repeat without rewiring each run by hand.",
      "③ Fits personal initiatives and team programs alike.",
    ],
    closure: "The same team can run the workflow on a cadence.",
  },
  {
    id: "journey-chapter-3",
    label: "Chapter 3",
    title: "Collaboration in a shared thread",
    outlookBadge: "Outlook",
    isOutlookChapter: false,
    narrative:
      "As more people join, at home, with clients, or internally, shared threads replace scattered direct messages. People align on decisions; listed agents help draft and summarize, with verifiable records in one place.",
    journeyHeading: "One place to align",
    storyMoments: [
      {
        headline: "Raj · Operations + line supervision",
        body: "Stakeholders enter special scheduling constraints; a shared scheduling listed agent recomputes; named approvers sign off.",
      },
      {
        headline: "Jordan · Engineering + integration",
        body: "Mechanical, firmware, and validation stay in one thread. Listed agents capture minutes, sketches, and test notes on one timeline.",
      },
      {
        headline: "Alex · Executive leadership",
        body: "A strategy alignment thread with the right stakeholders; each can pair people and listed agents as needed.",
      },
      {
        headline: "Dana · Procurement + finance / legal",
        body: "Before anything goes external, procurement, finance, and legal review one consolidated pack. Listed agents assemble drafts and surface gaps under policy.",
      },
    ],
    capabilitiesHeading: "What you get",
    capabilities: [
      "① Membership and permissions mirror real structure.",
      "② One timeline for people and listed agents.",
      "③ Speed with clear governance boundaries.",
    ],
    closure: "People and listed agents advance one shared narrative.",
  },
  {
    id: "journey-chapter-4",
    label: "Chapter 4",
    title: "Partner agents in the thread",
    outlookBadge: "Outlook",
    isOutlookChapter: false,
    narrative:
      "Where policy allows, agents operated by partner organizations may join the session. What they may use or show follows each partner’s authorization for disclosure. If you do not need cross-organization work yet, read this as context; the same invitation pattern applies when you do.",
    journeyHeading: "External participants",
    storyMoments: [
      {
        headline: "Dana · Procurement — supplier agent",
        body: "Invite a discoverable supplier agent listed for your workspace; replies stay within policy-authorized public facts.",
      },
      {
        headline: "Maya · Marketing — partner specialist",
        body: "Invite a partner-listed specialist agent from the Agent Hub under the same path used for other external participants, so campaigns can draw on outside expertise without a separate integration model.",
      },
    ],
    capabilitiesHeading: "What you get",
    capabilities: [
      "① Partner-run agents are listed in the Agent Hub and join through the same invitation mechanics as your other agents, so cross-org collaboration stays on one product path.",
      "② Who may connect is defined by policy.",
      "③ One invitation pattern covers many scenarios.",
    ],
    closure: "Cross-org work stays visible and policy-governed.",
  },
  {
    id: "journey-chapter-5",
    label: "Chapter 5",
    title: "Human confirmation for consequential actions",
    outlookBadge: "Outlook",
    isOutlookChapter: false,
    narrative:
      "Listed agents prepare drafts and evidence. Purchases, public posts, workforce moves, and customer commitments still need explicit human approval: for individuals, usually the account owner; in larger organizations, named accountable roles.",
    journeyHeading: "People keep the decision",
    storyMoments: [
      {
        headline: "Dana · Procurement — PO",
        body: "Authorized representatives on both sides align terms before commitment; listed agents remain in document preparation.",
      },
      {
        headline: "Maya · Marketing — publish",
        body: "Marketing or legal reviews outward content; high-impact posts wait for a person before they go live, after listed agents prepare drafts.",
      },
      {
        headline: "Raj · Operations — scheduling",
        body: "A named owner approves the final plan; schedules are not set by software alone, even when listed agents propose options.",
      },
      {
        headline: "Alex · Executive leadership — customer commitments",
        body: "Management owns customer-facing commitments; listed agents supply drafts and supporting evidence.",
      },
    ],
    capabilitiesHeading: "What you get",
    capabilities: [
      "① Sensitive steps can require approval with reasons on record.",
      "② Decisions map cleanly to what ran, including agent-prepared material.",
      "③ Pause or escalate without losing context.",
    ],
    closure: "Listed agents prepare; people decide.",
  },
  {
    id: "journey-chapter-6",
    label: "Chapter 6",
    title: "Where the product heads next",
    outlookBadge: "Outlook",
    isOutlookChapter: true,
    outlookNotice:
      "This section describes direction, not a feature switchboard. Timing and scope stay on the public roadmap.",
    narrative:
      "Planned themes include richer discovery in the Agent Hub, deeper operational playbooks, and governance visibility that scales with adoption for individuals and organizations. Cross-organization trust and field operations follow the public roadmap as capabilities mature.",
    journeyHeading: "Strategic outlook",
    storyMoments: [
      {
        headline: "Network",
        body: "Stronger discovery first; tighter cross-organization trust follows later on the roadmap.",
      },
      {
        headline: "Governance visibility",
        body: "Policy scope and observability grow with deployment, from personal history to organization-wide views.",
      },
      {
        headline: "Physical operations",
        body: "Lines, warehouses, and field work join as governed identities in the same trust model; timing follows the roadmap.",
      },
    ],
    capabilitiesHeading: "What we’re building toward",
    capabilities: [
      "① Richer discovery in the Agent Hub and steadier trust between organizations, delivered in stages; pace and scope stay on the public roadmap.",
      "② Governance you can follow: policies, approvals, and history stay legible as you move from solo use to larger teams.",
      "③ Physical sites and devices join the same collaboration model over time; timing and detail appear on the public roadmap as plans mature.",
    ],
  },
];

const ZH_HANT: JourneyChapterCopy[] = [
  {
    id: "journey-chapter-1",
    label: "第一章",
    title: "自然語言需求與路由執行",
    outlookBadge: "展望",
    isOutlookChapter: false,
    narrative:
      "您以日常語言陳述需求；平台路由工作、套用政策，並保留可驗證收據。\n\nCompanyA 是虛構的五角草稿（行銷、高階主管、工程、採購、營運），示範參與面擴大時路徑如何拉寬。個人獨用亦為同一形狀。\n\n在共享對話串之前，於私人對話中作業，在智能體中心擇用已列示智能體，無須全組織啟動會議。",
    journeyHeading: "五則開場交流",
    storyMoments: [
      {
        headline: "Maya · 行銷",
        body: "需求：本週三支介紹新裝置之短片。特定智能體回傳腳本與粗剪；產出留存於受治理對話時間線，附可覆核紀錄，而非僅散落於非正式私訊。",
      },
      {
        headline: "Alex · 高階主管",
        body: "需求：九十天產品敘事與緊湊需求大綱。特定智能體回傳敘事文稿、簡短摘要，以及可供審閱之開放式問題。",
      },
      {
        headline: "Jordan · 工程",
        body: "需求：軟硬體介面變更之每週摘要。特定智能體以簡短答覆並附風險註記；此階段尚不強迫跨團隊會議。",
      },
      {
        headline: "Dana · 採購",
        body: "需求：公開報價之結構化比對。特定智能體僅使用公開來源，合約前維持清楚邊界。",
      },
      {
        headline: "Raj · 營運",
        body: "需求：在產線限制下之次週排班計畫。特定智能體回傳可編修草稿；主管保有權限。",
      },
    ],
    capabilitiesHeading: "您會得到什麼",
    capabilities: [
      "① 智能體中心內已列示之智能體清楚呈現信任訊號。",
      "② 白話需求經由上述智能體轉為受路由之執行。",
      "③ 歷程可供稽核與回放。",
    ],
    closure: "皆達成有用成果；工作仍分佈於個人對話。",
  },
  {
    id: "journey-chapter-2",
    label: "第二章",
    title: "可重複、具政策意識的工作流",
    outlookBadge: "展望",
    isOutlookChapter: false,
    narrative:
      "同一群人將已驗證的需求轉成可一再執行的工作流：步驟以自然語言表達，或取自建構者發布之範本，並由已列示之特定智能體承接鏈式執行。",
    journeyHeading: "較長的連續序列",
    storyMoments: [
      {
        headline: "Maya · 行銷",
        body: "特定智能體執行概念→草稿→發布前檢查→審視之管線，範圍以智能體中心目前列示能力為準。",
      },
      {
        headline: "Alex · 高階主管",
        body: "特定智能體支援分層精煉：假設、優先順序、里程碑、風險，於同一對話內多輪往來。",
      },
      {
        headline: "Jordan · 工程",
        body: "特定智能體承載跨域鏈：設計限制、介面規格、聯合整合檢查清單。",
      },
      {
        headline: "Dana · 採購",
        body: "特定智能體針對規格、交期、MOQ 執行結構化多輪補全，產出表格式且已驗證之結果，而非雜亂貼上。",
      },
      {
        headline: "Raj · 營運",
        body: "特定智能體將技能、維護視窗與排班模式彙整於同一視圖。",
      },
    ],
    capabilitiesHeading: "您會得到什麼",
    capabilities: [
      "① 多步驟流程由智能體承接序列，體驗如一。",
      "② 路由與交接可重複，無須每次手動接線。",
      "③ 適用於個人專案與團隊計畫。",
    ],
    closure: "同一團隊可以按節奏重複執行該工作流。",
  },
  {
    id: "journey-chapter-3",
    label: "第三章",
    title: "共享對話串中的協作",
    outlookBadge: "展望",
    isOutlookChapter: false,
    narrative:
      "隨著更多人加入，無論居家、客戶或內部情境，共享對話串取代零散私訊。人們就決策對齊；已列示之特定智能體協助起草與摘要，並在同一處留下可驗證紀錄。",
    journeyHeading: "對齊的單一所在",
    storyMoments: [
      {
        headline: "Raj · 營運與產線督導",
        body: "利害關係人提出特殊時間需求；共用排程用之特定智能體重新計算；具名核可人簽核定案。",
      },
      {
        headline: "Jordan · 工程與整合",
        body: "機構、韌體與驗證留在同一對話串。特定智能體將紀要、草圖與測試筆記記錄在同一時間軸。",
      },
      {
        headline: "Alex · 高階主管",
        body: "策略對齊對話串納入適當利害關係人；每人可依需要搭配人員與特定智能體。",
      },
      {
        headline: "Dana · 採購與財務／法務",
        body: "在對外揭露前，採購、財務與法務審閱同一份彙整包；特定智能體可彙整初稿並於政策下標示缺口。",
      },
    ],
    capabilitiesHeading: "您會得到什麼",
    capabilities: [
      "① 成員與權限反映實際結構。",
      "② 人員與已列示智能體共用同一時間軸。",
      "③ 在清楚治理邊界下維持節奏。",
    ],
    closure: "人員與特定智能體推進同一則共享敘事。",
  },
  {
    id: "journey-chapter-4",
    label: "第四章",
    title: "夥伴智能體接入對話",
    outlookBadge: "展望",
    isOutlookChapter: false,
    narrative:
      "於策略允許時，**由合作方營運之智能體**可加入對話；**可見與可處理之內容，以各該合作方已授權、得對外揭露之範圍為準**。**若尚無跨組織需求**，可視為補充；實際需要時**邀請機制不變**。",
    journeyHeading: "外部協作參與方",
    storyMoments: [
      {
        headline: "Dana · 採購—供應商智能體",
        body: "邀請可檢索之供應商特定智能體；回覆限於策略授權之公開範圍。",
      },
      {
        headline: "Maya · 行銷—夥伴專家",
        body: "依與其他外部參與者相同之邀請路徑，從智能體中心引入夥伴列示之特定智能體，使行銷活動可運用外部專長而無須另建接入模式。",
      },
    ],
    capabilitiesHeading: "您會得到什麼",
    capabilities: [
      "① 由合作方營運之智能體於智能體中心列示，並以與內部其他智能體相同之邀請與接入方式加入對話，跨組織協作沿用同一產品路徑。",
      "② 誰可連線由策略定義。",
      "③ 單一邀請模式涵蓋多種情境。",
    ],
    closure: "跨組織協作過程可見、規則可管。",
  },
  {
    id: "journey-chapter-5",
    label: "第五章",
    title: "重大操作之人工確認",
    outlookBadge: "展望",
    isOutlookChapter: false,
    narrative:
      "已列示之特定智能體負責初稿與佐證材料。採購承諾、對外發布、人力排班與對客義務仍須具名人員明示授權：個人情境下通常為帳戶持有人；較大組織則由明確職責角色承擔。",
    journeyHeading: "責任仍屬人員",
    storyMoments: [
      {
        headline: "Dana · 採購—採購訂單",
        body: "雙方授權代表對齊條款後方具效力；特定智能體僅承擔文件準備。",
      },
      {
        headline: "Maya · 行銷—上線",
        body: "行銷或法務審核對外內容；於特定智能體備妥初稿後，高影響貼文仍待人工確認始得對外發出。",
      },
      {
        headline: "Raj · 營運—排班",
        body: "具名負責人確認定案；即使特定智能體提出方案，班表亦不會僅由軟體自動拍板。",
      },
      {
        headline: "Alex · 高階管理—對客承諾",
        body: "管理層簽發對客規格；特定智能體提供底稿與證據支援。",
      },
    ],
    capabilitiesHeading: "您會得到什麼",
    capabilities: [
      "① 敏感步驟可要求確認並留存理由。",
      "② 決策與實際執行相互對應，含智能體產出之對照。",
      "③ 可暫停或升級，脈絡不中斷。",
    ],
    closure: "特定智能體提供準備性產出；決策權歸屬人員。",
  },
  {
    id: "journey-chapter-6",
    label: "第六章",
    title: "產品後續方向（展望）",
    outlookBadge: "展望",
    isOutlookChapter: true,
    outlookNotice: "本章說明方向，並非可逐項開關之功能表；節奏與範圍見公開產品路線圖。",
    narrative:
      "規劃方向包含智能體中心更易檢索、更完整作業劇本，以及隨採用擴大之治理可見度，涵蓋個人與組織。跨組織信任與實體現場覆蓋將隨能力成熟，依公開路線圖逐步推出。",
    journeyHeading: "策略展望",
    storyMoments: [
      { headline: "協作網路", body: "近期先把可檢索性做紮實；中長期再往更穩的跨組織可信協作延伸，節奏見路線圖。" },
      { headline: "治理可見度", body: "策略範圍與可觀測性隨部署規模擴展，由個人紀錄至組織視角。" },
      { headline: "實體現場", body: "產線、倉儲與外勤以可治理身份納入同一信任模型；何時推進見路線圖。" },
    ],
    capabilitiesHeading: "我們正在往哪裡前進",
    capabilities: [
      "① 智能體中心更易找到適用之智能體，並在跨組織協作上走向更穩的可信銜接，分階段釋出；節奏與範圍見公開產品路線圖。",
      "② 治理可讀：從個人使用到更大團隊，策略、確認與紀錄仍清楚可追、可對應查閱。",
      "③ 實體現場與裝置逐步納入同一套協作與信任框架；時點與做法隨路線圖更新公開。",
    ],
  },
];

const ZH_HANS: JourneyChapterCopy[] = [
  {
    id: "journey-chapter-1",
    label: "第一章",
    title: "自然语言需求与路由执行",
    outlookBadge: "展望",
    isOutlookChapter: false,
    narrative:
      "您以日常语言陈述需求；平台路由工作、套用政策，并保留可验证收据。\n\nCompanyA 是虚构的五角草稿（行销、高阶主管、工程、采购、营运），示范参与面扩大时路径如何拉宽。个人独用亦为同一形状。\n\n在共享对话串之前，于私人对话中作业，在智能体中心择用已列示智能体，无须全组织启动会议。",
    journeyHeading: "五则开场交流",
    storyMoments: [
      {
        headline: "Maya · 行销",
        body: "需求：本周三支介绍新设备之短片。特定智能体回传脚本与粗剪；产出留存于受治理对话时间线，附可复核纪录，而非仅散落非正式私讯。",
      },
      {
        headline: "Alex · 高阶主管",
        body: "需求：九十天产品叙事与紧凑需求大纲。特定智能体回传叙事文稿、简短摘要，以及可供审阅之开放式问题。",
      },
      {
        headline: "Jordan · 工程",
        body: "需求：软硬件接口变更之每周摘要。特定智能体以简短答复并附风险注记；此阶段尚不强迫跨团队会议。",
      },
      {
        headline: "Dana · 采购",
        body: "需求：公开报价之结构化比对。特定智能体仅使用公开来源，合约前维持清楚边界。",
      },
      {
        headline: "Raj · 营运",
        body: "需求：在产线限制下之次周排班计划。特定智能体回传可编修草稿；主管保有权限。",
      },
    ],
    capabilitiesHeading: "您会得到什么",
    capabilities: [
      "① 智能体中心内已列示之智能体清楚呈现信任信号。",
      "② 白话需求经由上述智能体转为经路由之执行。",
      "③ 历程可供稽核与回放。",
    ],
    closure: "皆达成有用成果；工作仍分布于个人对话。",
  },
  {
    id: "journey-chapter-2",
    label: "第二章",
    title: "可重复、具政策意识的工作流",
    outlookBadge: "展望",
    isOutlookChapter: false,
    narrative:
      "同一群人将已验证的需求转成可一再执行的工作流：步骤以自然语言表达，或取自建构者发布之范本，并由已列示之特定智能体承接链式执行。",
    journeyHeading: "较长的连续序列",
    storyMoments: [
      {
        headline: "Maya · 行销",
        body: "特定智能体执行概念→草稿→发布前检查→审视之管线，范围以智能体中心目前列示能力为准。",
      },
      {
        headline: "Alex · 高阶主管",
        body: "特定智能体支持分层精炼：假设、优先顺序、里程碑、风险，于同一对话内多轮往来。",
      },
      {
        headline: "Jordan · 工程",
        body: "特定智能体承载跨域链：设计限制、接口规格、联合整合检查清单。",
      },
      {
        headline: "Dana · 采购",
        body: "特定智能体针对规格、交期、MOQ 执行结构化多轮补全，产出表格式且已验证之结果，而非杂乱贴上。",
      },
      {
        headline: "Raj · 营运",
        body: "特定智能体将技能、维护窗口与排班模式汇整于同一视图。",
      },
    ],
    capabilitiesHeading: "您会得到什么",
    capabilities: [
      "① 多步骤流程由智能体承接序列，体验如一。",
      "② 路由与交接可重复，无须每次手动接线。",
      "③ 适用于个人专案与团队计划。",
    ],
    closure: "同一团队可以按节奏重复执行该工作流。",
  },
  {
    id: "journey-chapter-3",
    label: "第三章",
    title: "共享对话串中的协作",
    outlookBadge: "展望",
    isOutlookChapter: false,
    narrative:
      "随着更多人加入，无论居家、客户或内部情境，共享对话串取代零散私讯。人们就决策对齐；已列示之特定智能体协助起草与摘要，并在同一处留下可验证纪录。",
    journeyHeading: "对齐的单一所在",
    storyMoments: [
      {
        headline: "Raj · 营运与产线督导",
        body: "利害关系人提出特殊时间需求；共用排程用之特定智能体重新计算；具名核准人签核定案。",
      },
      {
        headline: "Jordan · 工程与整合",
        body: "机构、韧体与验证留在同一对话串。特定智能体将纪要、草图与测试笔记记录在同一时间轴。",
      },
      {
        headline: "Alex · 高阶主管",
        body: "策略对齐对话串纳入适当利害关系人；每人可按需搭配人员与特定智能体。",
      },
      {
        headline: "Dana · 采购与财务／法务",
        body: "在对外揭露前，采购、财务与法务审阅同一份汇整包；特定智能体可汇整初稿并于政策下标示缺口。",
      },
    ],
    capabilitiesHeading: "您会得到什么",
    capabilities: [
      "① 成员与权限反映实际结构。",
      "② 人员与已列示智能体共用同一时间轴。",
      "③ 在清楚治理边界下维持节奏。",
    ],
    closure: "人员与特定智能体推进同一则共享叙事。",
  },
  {
    id: "journey-chapter-4",
    label: "第四章",
    title: "伙伴智能体接入对话",
    outlookBadge: "展望",
    isOutlookChapter: false,
    narrative:
      "于策略允许时，**由合作方营运之智能体**可加入对话；**可见与可处理之内容，以各该合作方已授权、得对外揭露之范围为准**。**若尚无跨组织需求**，可视为补充；实际需要时**邀请机制不变**。",
    journeyHeading: "外部协作参与方",
    storyMoments: [
      {
        headline: "Dana · 采购—供应商智能体",
        body: "邀请可检索之供应商特定智能体；回复限于策略授权之公开范围。",
      },
      {
        headline: "Maya · 行销—伙伴专家",
        body: "依与其他外部参与者相同之邀请路径，从智能体中心引入伙伴列示之特定智能体，使行销活动可运用外部专长而无须另建接入模式。",
      },
    ],
    capabilitiesHeading: "您会得到什么",
    capabilities: [
      "① 由合作方营运之智能体于智能体中心列示，并以与内部其他智能体相同之邀请与接入方式加入对话，跨组织协作沿用同一产品路径。",
      "② 谁可连线由策略定义。",
      "③ 单一邀请模式涵盖多种情境。",
    ],
    closure: "跨组织协作过程可见、规则可管。",
  },
  {
    id: "journey-chapter-5",
    label: "第五章",
    title: "重大操作之人工确认",
    outlookBadge: "展望",
    isOutlookChapter: false,
    narrative:
      "已列示之特定智能体负责初稿与佐证材料。采购承诺、对外发布、人力排班与对客义务仍须具名人员明示授权：个人情境下通常为账户持有人；较大组织则由明确职责角色承担。",
    journeyHeading: "责任仍属人员",
    storyMoments: [
      {
        headline: "Dana · 采购—采购订单",
        body: "双方授权代表对齐条款后方具效力；特定智能体仅承担文件准备。",
      },
      {
        headline: "Maya · 行销—上线",
        body: "行销或法务审核对外内容；于特定智能体备妥初稿后，高影响贴文仍待人工确认始得对外发出。",
      },
      {
        headline: "Raj · 营运—排班",
        body: "具名负责人确认定案；即使特定智能体提出方案，班表亦不会仅由软件自动拍板。",
      },
      {
        headline: "Alex · 高阶管理—对客承诺",
        body: "管理层签发对客规格；特定智能体提供底稿与证据支援。",
      },
    ],
    capabilitiesHeading: "您会得到什么",
    capabilities: [
      "① 敏感步骤可要求确认并留存理由。",
      "② 决策与实际执行相互对应，含智能体产出之对照。",
      "③ 可暂停或升级，脉络不中断。",
    ],
    closure: "特定智能体提供准备性产出；决策权归属人员。",
  },
  {
    id: "journey-chapter-6",
    label: "第六章",
    title: "产品后续方向（展望）",
    outlookBadge: "展望",
    isOutlookChapter: true,
    outlookNotice: "本章说明方向，并非可逐项开关之功能表；节奏与范围见公开产品路线图。",
    narrative:
      "规划方向包含智能体中心更易检索、更完整作业剧本，以及随采用扩大之治理可见度，涵盖个人与组织。跨组织信任与实体现场覆盖将随能力成熟，依公开路线图逐步推出。",
    journeyHeading: "策略展望",
    storyMoments: [
      { headline: "协作网络", body: "近期先把可检索性做扎实；中长期再往更稳的跨组织可信协作延伸，节奏见路线图。" },
      { headline: "治理可见度", body: "策略范围与可观测性随部署规模扩展，由个人纪录至组织视图。" },
      { headline: "实体现场", body: "产线、仓储与外勤以可治理身份纳入同一信任模型；何时推进见路线图。" },
    ],
    capabilitiesHeading: "我们正在往哪里前进",
    capabilities: [
      "① 智能体中心更易找到适用之智能体，并在跨组织协作上走向更稳的可信衔接，分阶段释出；节奏与范围见公开产品路线图。",
      "② 治理可读：从个人使用到更大团队，策略、确认与纪录仍清楚可追、可对应查阅。",
      "③ 实体现场与装置逐步纳入同一套协作与信任框架；时点与做法随路线图更新公开。",
    ],
  },
];

export function getCompanyAJourneyChapters(locale: Locale): JourneyChapterCopy[] {
  switch (locale) {
    case "zh-Hant":
      return ZH_HANT;
    case "zh-Hans":
      return ZH_HANS;
    default:
      return EN;
  }
}
