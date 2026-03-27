import type { Locale } from "@/lib/i18n/locales";
import type { DictionaryMap } from "./types";

const dictionaries: DictionaryMap = {
  en: {
    localeLabel: "English",
    nav: {
      ask: "Ask",
      developers: "Developers",
      trust: "Trust",
      useCases: "Stories",
      docs: "Docs",
      analytics: "Analytics",
      tasks: "Tasks",
      agents: "Agents",
      approvals: "Approvals",
      history: "History",
      connector: "Connector",
      myAgents: "My Agents",
      settings: "Settings",
      roadmap: "Roadmap",
      pricing: "Pricing",
      openApp: "Open app",
      skipToContent: "Skip to main content",
    },
    home: {
      eyebrow: "Your work. Platform agents. One workspace.",
      title: "Use agents published on the platform. No self-deployment required to start.",
      description:
        "Select agents in the Agent Hub. GaiaLynk helps you move work forward, requests confirmation before sensitive actions, and keeps a clear history you can review.",
      primaryCta: "Open app",
      seoTitle: "GaiaLynk — platform agents, one workspace",
      seoDescription:
        "Agents published on GaiaLynk, available in the Agent Hub. No self-deployment required to start. GaiaLynk requests confirmation before sensitive actions and keeps a clear history you can review.",
      valuePoints: ["Agents from the Agent Hub", "Rules at runtime", "History you can review"],
      evidenceTitle: "Confirmation and reviewable history",
      evidenceDescription:
        "Plain language first: what ran, why it was allowed, and when someone confirmed. Engineers map outcomes to trust policy and execution records.",
      evidencePoints: [
        "Sensitive steps can pause for confirmation with reasons on record",
        "Outcomes stay legible against what actually executed",
        "History remains available to review and audit",
      ],
      secondaryCtas: {
        waitlist: "Join Waitlist",
      },
      hero: {
        eyebrow: "Your work. Platform agents. One workspace.",
        title: "Use agents published on the platform. No self-deployment required to start.",
        subtitle:
          "Select agents in the Agent Hub. GaiaLynk helps you move work forward, requests confirmation before sensitive actions, and keeps a clear history you can review. Publishing for developers and publishers is available separately.",
        ctaPrimary: "Open app",
        ctaSecondary: "Publishers & developers",
      },
      valueProposition: {
        title: "Agent Hub, governed chat, reviewable runs",
        cards: [
          {
            title: "Start from listed agents",
            description:
              "Choose published agents in the Agent Hub without self-hosting first. Trust and capability signals are shown in the product as disclosed.",
          },
          {
            title: "Rules at runtime",
            description:
              "Invocation stays within policy, with confirmation before sensitive actions when your rules require it.",
          },
          {
            title: "History you can review",
            description:
              "Execution leaves a trail you can revisit—governance track (policy, confirmation, receipts) plus quality signals (evaluations, reputation) where the product exposes them.",
          },
        ],
      },
      howItWorks: {
        title: "How GaiaLynk helps you work with listed agents",
        steps: [
          {
            summary: "You state what you need.",
            detail:
              "Describe the outcome in everyday language. The platform understands intent and keeps routing inside the same chat workspace.",
          },
          {
            summary: "You select from listed candidates in the Agent Hub.",
            detail:
              "Browse or pick agents already published on the platform—trust signals, capacity, and labels are visible there before you run anything.",
          },
          {
            summary: "Sensitive steps can pause for confirmation.",
            detail:
              "When a step is high-impact, the flow can stop for explicit approval—policy decides what requires a person.",
          },
          {
            summary: "Agents run the work; you get results and a reviewable record.",
            detail:
              "Execution completes with outcomes you can trace back through receipts and history in the product.",
          },
          {
            summary: "The timeline stays available to review.",
            detail:
              "Decisions, confirmations, and runs remain legible so teams can audit, replay, or escalate without losing context.",
          },
        ],
      },
      finalCta: {
        heading: "Open the app and try an agent from the Agent Hub",
        openApp: "Open app",
        startBuilding: "Publishers & developers",
      },
      previewSectionTitle: "Into the same conversation from the Agent Hub",
    },
    footer: {
      privacy: "Privacy",
      cookies: "Cookies",
      github: "GitHub",
      help: "Help",
    },
    developers: {
      title: "Publish agents for governed in-chat work",
      description:
        "Connect and list agents so people can select them in the Agent Hub and run them in chat.",
      heroHighlights: [
        "End users pick listed agents in the hub; invocations stay in the same conversation.",
        "Integration is not bundled with a self-hosting walkthrough first.",
        "Open APIs match the product UI: routing, runtime rules, confirmation before sensitive steps, and reviewable execution history.",
      ],
      primaryCta: "Open Quickstart",
      seoTitle: "Developer Entry - GaiaLynk Agent IM",
      seoDescription: "Open APIs, SDK, and quickstart path for trustworthy multi-agent products.",
    },
    trust: {
      title: "Trust is a runtime decision system, not a badge.",
      description: "See policy outcomes, review triggers, reason codes, and receipt-backed evidence in one flow.",
      primaryCta: "See Trust Flow",
      seoTitle: "Trust and Safety - GaiaLynk Agent IM",
      seoDescription: "Policy decisions, HITL review, and auditable receipts for high-risk invocations.",
    },
    useCases: {
      title: "From individual work to teams and partners",
      description:
        "Start in the Agent Hub with listed agents; self-hosting is not required to begin. CompanyA is one continuous illustration: collaboration moves from individuals to shared team work, then to partners and cross-team alignment. Timing and scope are on the product roadmap.",
      primaryCta: "Open app",
      seoTitle: "Stories — GaiaLynk",
      seoDescription:
        "CompanyA shows governed agent collaboration from solo work to teams and partners, starting from the Agent Hub. The roadmap states what you can use today and what comes next.",
    },
    waitlist: {
      title: "Join the early access waitlist.",
      description: "Get updates on managed cloud orchestration, recurring automation, and connector expansion.",
      primaryCta: "Submit Waitlist",
      seoTitle: "Waitlist - GaiaLynk Agent IM",
      seoDescription: "Request early access.",
    },
    docs: {
      title: "Go to documentation entry.",
      description: "Open protocol, API, and architecture docs to build against GaiaLynk open core.",
      primaryCta: "Open Docs",
      seoTitle: "Docs Entry - GaiaLynk Agent IM",
      seoDescription: "Documentation entry point.",
    },
    ask: {
      title: "Ask path demo: input -> route -> result (L1 default, L2 optional).",
      description: "Understand the consumer-first flow in under one minute, with clear fallback and governance boundaries.",
      primaryCta: "View Retry and HITL Path",
      seoTitle: "Ask Path Demo - GaiaLynk Agent IM",
      seoDescription: "See how user intent becomes trustworthy results through route, review, and receipts.",
      demoHeading: "Demo",
    },
    recovery: {
      title: "Failure recovery and HITL governance.",
      description: "When requests fail or become high-risk, users can retry, choose alternatives, or accept downgraded output with traceable reasons.",
      primaryCta: "See Task Lifecycle",
      seoTitle: "Recovery and HITL - GaiaLynk Agent IM",
      seoDescription: "Understand retry, replacement, downgrade, and human approval flow.",
    },
    subscriptions: {
      title: "Recurring task lifecycle for daily automation.",
      description: "Model user-owned task instances with pause/resume/history while keeping governance and quota boundaries explicit.",
      primaryCta: "See Connector Governance",
      seoTitle: "Recurring Tasks - GaiaLynk Agent IM",
      seoDescription: "Lifecycle narrative for create/pause/resume/delete/history and quota mapping.",
    },
    connectors: {
      title: "Connector governance: scoped auth, expiry, revocation, receipts.",
      description: "Local actions stay governed by explicit permissions, revocable grants, and verifiable execution receipts.",
      primaryCta: "Join Waitlist",
      seoTitle: "Connector Governance - GaiaLynk Agent IM",
      seoDescription: "Authorization scope, validity window, and receipt-backed local action governance.",
    },
    auth: {
      loginRequired: "Sign in to use this feature. Your session identity is required for all actions.",
      loginCta: "Sign in",
      sessionExpired: "Session expired. Please sign in again to continue.",
      permissionDenied: "You don’t have permission for this action.",
    },
  },
  "zh-Hant": {
    localeLabel: "繁體中文",
    nav: {
      ask: "Ask 路徑",
      developers: "開發者",
      trust: "可信與安全",
      useCases: "場景故事",
      docs: "文件",
      analytics: "分析看板",
      tasks: "任務",
      agents: "Agents",
      approvals: "審批",
      history: "歷史",
      connector: "連接器",
      myAgents: "我的 Agent",
      settings: "設定",
      roadmap: "路線圖",
      pricing: "定價",
      openApp: "打開應用",
      skipToContent: "跳至主要內容",
    },
    home: {
      eyebrow: "你的工作 · 平台上的智能體 · 同一工作區",
      title: "選用平台上已上架的智能體，無需先行自建部署。",
      description:
        "請從智能體中心選用已上架的智能體。GaiaLynk 協助您推進工作，於敏感操作前徵求確認，並保留可供查閱的紀錄。",
      primaryCta: "打開應用",
      seoTitle: "GaiaLynk — 平台智能體 · 同一工作區",
      seoDescription:
        "平台上已上架智能體，於智能體中心選用；無需自行部署即可開始。敏感操作前徵求確認，歷程清晰、可供查閱。",
      valuePoints: ["於智能體中心選用已上架智能體", "執行當下邊界清晰", "紀錄可供查閱"],
      evidenceTitle: "徵求確認與可供查閱的歷程",
      evidenceDescription:
        "先以白話理解做了什麼、為何如此、誰在何時確認；需要對照時，工程語境可銜接信任策略與執行紀錄。",
      evidencePoints: [
        "敏感步驟可暫停並在紀錄中留下理由",
        "決策與實際執行可相互對應",
        "歷程保留，便於覆核與稽核",
      ],
      secondaryCtas: {
        waitlist: "加入等待名單",
      },
      hero: {
        eyebrow: "你的工作 · 平台上的智能體 · 同一工作區",
        title: "選用平台上已上架的智能體，無需先行自建部署。",
        subtitle:
          "請從智能體中心選用已上架的智能體。GaiaLynk 協助您推進工作，於敏感操作前徵求確認，並保留可供查閱的紀錄。智能體之上架與整合，請前往開發者與發布者入口。",
        ctaPrimary: "打開應用",
        ctaSecondary: "供給方與開發者",
      },
      valueProposition: {
        title: "智能體中心、受治理對話、可覆核執行",
        cards: [
          {
            title: "從已上架智能體起步",
            description:
              "於智能體中心選用平台上已上架智能體，無須先完成自建託管。信任與能力相關訊號以產品內揭露為準。",
          },
          {
            title: "執行當下的規則",
            description:
              "調用過程受策略約束；在您的規則要求下，敏感操作前會徵求確認。",
          },
          {
            title: "紀錄可供查閱",
            description:
              "執行留痕可供回溯——治理軌（策略、確認、收據）與品質軌（評測、聲譽等，依產品揭露為準）。",
          },
        ],
      },
      howItWorks: {
        title: "GaiaLynk 如何協助你使用已上架智能體",
        steps: [
          {
            summary: "你提出需求。",
            detail: "以自然語言描述目標；平台理解意圖，並在同一對話工作區內完成路由。",
          },
          {
            summary: "在智能體中心的已上架候選中選用。",
            detail:
              "瀏覽或選擇平台上已列示的智能體——信任訊號、容量與標籤在調用前即可於中心內查看。",
          },
          {
            summary: "敏感步驟可暫停徵求確認。",
            detail: "當步驟影響重大時，流程可停下來等待明示授權——由策略決定何時需要人。",
          },
          {
            summary: "智能體執行後，你取得結果與可覆核紀錄。",
            detail: "執行完成後，結果可連回收據與歷程，在產品內追溯。",
          },
          {
            summary: "時間線保留，便於事後檢視。",
            detail: "決策、確認與執行保持可讀，便於團隊覆核、回放或在不中斷脈絡下升級處理。",
          },
        ],
      },
      finalCta: {
        heading: "先打開應用，從智能體中心選用一個智能體試跑",
        openApp: "打開應用",
        startBuilding: "供給方與開發者",
      },
      previewSectionTitle: "從智能體中心進入同一條對話",
    },
    footer: {
      privacy: "隱私",
      cookies: "Cookies",
      github: "GitHub",
      help: "說明中心",
    },
    developers: {
      title: "將智能體上架於受治理的對話工作區",
      description: "接入並上架後，使用者可在智能體中心選用你的智能體，並於對話內直接調用。",
      heroHighlights: [
        "於智能體中心選用、於對話內調用，使用者路徑清楚。",
        "整合不綁定「先自建託管再走教程」這條路徑。",
        "開放 API 與產品介面語義一致：路由、運行時規則、敏感步驟前之確認，以及可追溯、可覆核之執行留痕。",
      ],
      primaryCta: "打開 Quickstart",
      seoTitle: "開發者入口 - GaiaLynk Agent IM",
      seoDescription: "開發者 API、SDK 與接入路徑。",
    },
    trust: {
      title: "信任是運行時決策系統，不是徽章。",
      description: "在同一流程中查看策略結果、覆核觸發、reason code 與收據證據。",
      primaryCta: "查看信任流程",
      seoTitle: "可信與安全 - GaiaLynk Agent IM",
      seoDescription: "策略決策、人工覆核與可審計收據，支援高風險調用。",
    },
    useCases: {
      title: "從個人工作，到團隊與夥伴協作",
      description:
        "於智能體中心選用已列示智能體即可開始，無須先行完成自建託管。CompanyA 為連續示範：協作由個人走向團隊共事，再延伸至夥伴與跨團隊對齊。節奏與範圍見產品路線圖。",
      primaryCta: "打開應用",
      seoTitle: "場景故事 — GaiaLynk",
      seoDescription:
        "CompanyA 示範從個人、團隊到夥伴與跨組織的受治理智能體協作，起點在智能體中心。路線圖載明目前已可用與後續方向。",
    },
    waitlist: {
      title: "加入早期存取等待名單。",
      description: "優先接收雲端託管編排、週期自動化與連接器能力更新。",
      primaryCta: "提交等待名單",
      seoTitle: "等待名單 - GaiaLynk Agent IM",
      seoDescription: "申請早期存取。",
    },
    docs: {
      title: "前往文件入口。",
      description: "查看協議、API 與架構文件，基於 GaiaLynk 開源核心進行整合。",
      primaryCta: "打開文件",
      seoTitle: "文件入口 - GaiaLynk Agent IM",
      seoDescription: "文件入口頁。",
    },
    ask: {
      title: "Ask 主路徑演示：輸入 -> 路由 -> 結果（預設 L1，可進階 L2）。",
      description: "在一分鐘內理解普通使用者如何拿到首個結果，並清楚看到回退與治理邊界。",
      primaryCta: "查看失敗回退與 HITL",
      seoTitle: "Ask 主路徑演示 - GaiaLynk Agent IM",
      seoDescription: "查看需求如何被路由成可信結果，並保留可驗證證據與收據。",
      demoHeading: "互動演示",
    },
    recovery: {
      title: "失敗回退與 HITL 治理流程。",
      description: "當請求失敗或觸發高風險時，使用者可重試、替代或降級，並查看可追溯理由。",
      primaryCta: "查看訂閱任務生命週期",
      seoTitle: "回退與 HITL - GaiaLynk Agent IM",
      seoDescription: "說明重試、替代、降級與人工審批閉環。",
    },
    subscriptions: {
      title: "面向日常自動化的訂閱任務生命週期。",
      description: "以使用者為中心管理 create/pause/resume/delete/history，同時維持配額與治理邊界。",
      primaryCta: "查看連接器治理",
      seoTitle: "訂閱任務生命週期 - GaiaLynk Agent IM",
      seoDescription: "建立可留存的週期任務價值敘事與治理映射。",
    },
    connectors: {
      title: "連接器治理：範圍授權、時效、撤銷、收據。",
      description: "本地動作以顯式授權執行，可撤銷、可驗證，並保留收據作為治理依據。",
      primaryCta: "加入等待名單",
      seoTitle: "連接器治理 - GaiaLynk Agent IM",
      seoDescription: "展示授權粒度、有效期與收據回放能力。",
    },
    auth: {
      loginRequired: "請先登入以使用此功能，所有操作皆需使用您的會話身份。",
      loginCta: "登入",
      sessionExpired: "登入已過期，請重新登入後繼續。",
      permissionDenied: "您沒有執行此操作的權限。",
    },
  },
  "zh-Hans": {
    localeLabel: "简体中文",
    nav: {
      ask: "Ask 路径",
      developers: "开发者",
      trust: "可信与安全",
      useCases: "场景故事",
      docs: "文档",
      analytics: "分析看板",
      tasks: "任务",
      agents: "Agents",
      approvals: "审批",
      history: "历史",
      connector: "连接器",
      myAgents: "我的 Agent",
      settings: "设置",
      roadmap: "路线图",
      pricing: "定价",
      openApp: "打开应用",
      skipToContent: "跳到主要内容",
    },
    home: {
      eyebrow: "你的工作 · 平台上的智能体 · 同一工作区",
      title: "选用平台上已上架的智能体，无需先行自建部署。",
      description:
        "请从智能体中心选用已上架的智能体。GaiaLynk 协助您推进工作，于敏感操作前征求确认，并保留可供查阅的纪录。",
      primaryCta: "打开应用",
      seoTitle: "GaiaLynk — 平台智能体 · 同一工作区",
      seoDescription:
        "平台上已上架智能体，于智能体中心选用；无需自行部署即可开始。敏感操作前征求确认，历程清晰、可供查阅。",
      valuePoints: ["于智能体中心选用已上架智能体", "执行当下边界清晰", "纪录可供查阅"],
      evidenceTitle: "征求确认与可供查阅的历程",
      evidenceDescription:
        "先以白话理解做了什么、为何如此、谁在何时确认；需要对照时，工程语境可衔接信任策略与执行纪录。",
      evidencePoints: [
        "敏感步骤可暂停并在纪录中留下理由",
        "决策与实际执行可相互对应",
        "历程保留，便于复核与审计",
      ],
      secondaryCtas: {
        waitlist: "加入等待名单",
      },
      hero: {
        eyebrow: "你的工作 · 平台上的智能体 · 同一工作区",
        title: "选用平台上已上架的智能体，无需先行自建部署。",
        subtitle:
          "请从智能体中心选用已上架的智能体。GaiaLynk 协助您推进工作，于敏感操作前征求确认，并保留可供查阅的纪录。智能体之上架与整合，请前往开发者与发布者入口。",
        ctaPrimary: "打开应用",
        ctaSecondary: "供给方与开发者",
      },
      valueProposition: {
        title: "智能体中心、受治理对话、可复核执行",
        cards: [
          {
            title: "从已上架智能体起步",
            description:
              "于智能体中心选用平台上已上架智能体，无须先完成自建托管。信任与能力相关讯号以产品内揭露为准。",
          },
          {
            title: "执行当下的规则",
            description:
              "调用过程受策略约束；在您的规则要求下，敏感操作前会征求确认。",
          },
          {
            title: "纪录可供查阅",
            description:
              "执行留痕可供回溯——治理轨（策略、确认、收据）与质量轨（评测、声誉等，依产品揭露为准）。",
          },
        ],
      },
      howItWorks: {
        title: "GaiaLynk 如何协助你使用已上架智能体",
        steps: [
          {
            summary: "你提出需求。",
            detail: "以自然语言描述目标；平台理解意图，并在同一对话工作区内完成路由。",
          },
          {
            summary: "在智能体中心的已上架候选中选用。",
            detail:
              "浏览或选择平台上已列示的智能体——信任讯号、容量与标签在调用前即可于中心内查看。",
          },
          {
            summary: "敏感步骤可暂停征求确认。",
            detail: "当步骤影响重大时，流程可停下来等待明示授权——由策略决定何时需要人。",
          },
          {
            summary: "智能体执行后，你取得结果与可复核纪录。",
            detail: "执行完成后，结果可连回收据与历程，在产品内追溯。",
          },
          {
            summary: "时间线保留，便于事后检视。",
            detail: "决策、确认与执行保持可读，便于团队复核、回放或在不中断脉络下升级处理。",
          },
        ],
      },
      finalCta: {
        heading: "先打开应用，从智能体中心选用一个智能体试跑",
        openApp: "打开应用",
        startBuilding: "供给方与开发者",
      },
      previewSectionTitle: "从智能体中心进入同一条对话",
    },
    footer: {
      privacy: "隐私",
      cookies: "Cookies",
      github: "GitHub",
      help: "帮助中心",
    },
    developers: {
      title: "将智能体上架于受治理的对话工作区",
      description: "接入并上架后，用户可在智能体中心选用你的智能体，并在对话里直接调用。",
      heroHighlights: [
        "在智能体中心选用、在对话内调用，用户路径清晰。",
        "集成不捆绑「先自建托管再走教程」这条路径。",
        "开放 API 与产品界面语义一致：路由、运行时规则、敏感步骤前的确认，以及可追溯、可复核的执行留痕。",
      ],
      primaryCta: "打开 Quickstart",
      seoTitle: "开发者入口 - GaiaLynk Agent IM",
      seoDescription: "开发者 API、SDK 与接入路径。",
    },
    trust: {
      title: "信任是运行时决策系统，而不是徽章。",
      description: "在同一流程中查看策略结果、复核触发、reason code 与收据证据。",
      primaryCta: "查看信任流程",
      seoTitle: "可信与安全 - GaiaLynk Agent IM",
      seoDescription: "策略决策、人工复核与可审计收据，支援高风险调用。",
    },
    useCases: {
      title: "从个人工作，到团队与伙伴协作",
      description:
        "于智能体中心选用已列示智能体即可开始，无须先行完成自建托管。CompanyA 为连续示范：协作由个人走向团队共事，再延伸至伙伴与跨团队对齐。节奏与范围见产品路线图。",
      primaryCta: "打开应用",
      seoTitle: "场景故事 — GaiaLynk",
      seoDescription:
        "CompanyA 演示从个人、团队到伙伴与跨组织的受治理智能体协作，起点在智能体中心。路线图载明目前已可用与后续方向。",
    },
    waitlist: {
      title: "加入早期访问等待名单。",
      description: "优先接收云托管编排、周期自动化与连接器能力更新。",
      primaryCta: "提交等待名单",
      seoTitle: "等待名单 - GaiaLynk Agent IM",
      seoDescription: "申请早期访问。",
    },
    docs: {
      title: "前往文档入口。",
      description: "查看协议、API 与架构文档，基于 GaiaLynk 开源核心进行集成。",
      primaryCta: "打开文档",
      seoTitle: "文档入口 - GaiaLynk Agent IM",
      seoDescription: "文档入口页。",
    },
    ask: {
      title: "Ask 主路径演示：输入 -> 路由 -> 结果（默认 L1，可进阶 L2）。",
      description: "在一分钟内理解普通用户如何拿到首个结果，并看到回退与清晰治理边界。",
      primaryCta: "查看失败回退与 HITL",
      seoTitle: "Ask 主路径演示 - GaiaLynk Agent IM",
      seoDescription: "查看需求如何被路由为可信结果，并保留可验证证据与收据。",
      demoHeading: "互动演示",
    },
    recovery: {
      title: "失败回退与 HITL 治理流程。",
      description: "当请求失败或触发高风险时，用户可重试、替代或降级，并查看可追踪原因。",
      primaryCta: "查看订阅任务生命周期",
      seoTitle: "回退与 HITL - GaiaLynk Agent IM",
      seoDescription: "说明重试、替代、降级与人工审批闭环。",
    },
    subscriptions: {
      title: "面向日常自动化的订阅任务生命周期。",
      description: "以用户为中心管理 create/pause/resume/delete/history，同时维持配额与治理边界。",
      primaryCta: "查看连接器治理",
      seoTitle: "订阅任务生命周期 - GaiaLynk Agent IM",
      seoDescription: "构建可留存的周期任务价值叙事与治理映射。",
    },
    connectors: {
      title: "连接器治理：范围授权、时效、撤销、收据。",
      description: "本地动作通过显式授权执行，可撤销、可验证，并保留收据作为治理依据。",
      primaryCta: "加入等待名单",
      seoTitle: "连接器治理 - GaiaLynk Agent IM",
      seoDescription: "展示授权粒度、有效期与收据回放能力。",
    },
    auth: {
      loginRequired: "请先登录以使用此功能，所有操作均需使用您的会话身份。",
      loginCta: "登录",
      sessionExpired: "登录已失效，请重新登录后继续。",
      permissionDenied: "您没有执行此操作的权限。",
    },
  },
};

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
