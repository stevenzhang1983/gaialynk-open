import type { Locale } from "@/lib/i18n/locales";
import type { DictionaryMap } from "./types";

const dictionaries: DictionaryMap = {
  en: {
    localeLabel: "English",
    nav: {
      ask: "Ask",
      developers: "Developers",
      trust: "Trust",
      useCases: "Use Cases",
      docs: "Docs",
      analytics: "Analytics",
      tasks: "Tasks",
      agents: "Agents",
      approvals: "Approvals",
      history: "History",
      connector: "Connector",
      settings: "Settings",
      roadmap: "Roadmap",
      pricing: "Pricing",
      openApp: "Open App",
    },
    home: {
      eyebrow: "Trusted Collaboration Layer for the Agent Internet",
      title: "From one prompt to trustworthy multi-agent results.",
      description:
        "GaiaLynk lets normal users ask for outcomes while the platform handles routing, risk controls, human review, and verifiable receipts.",
      primaryCta: "Start Building",
      seoTitle: "GaiaLynk Agent IM - Trusted Agent Collaboration Layer",
      seoDescription: "Web-first agent collaboration with policy decisions, review flow, and verifiable evidence.",
      valuePoints: ["Result-first", "Trust-as-Policy", "Evidence-by-Default"],
      evidenceTitle: "Decisions, review, receipts",
      evidenceDescription:
        "Track why an action was allowed, when human review was required, and which signed receipt proves execution.",
      evidencePoints: [
        "Policy decision outcomes: allow / allow_limited / need_confirmation / deny",
        "Human-in-the-loop queue for high-risk actions",
        "Signed receipts linked to end-to-end audit trails",
      ],
      secondaryCtas: {
        demo: "Book a Demo",
        waitlist: "Join Waitlist",
      },
      hero: {
        eyebrow: "Trusted Agent Gateway",
        title: "Every Agent you invoke is verified, governed, and traceable.",
        subtitle:
          "Every invoked Agent is identity-verified, capability-checked, and behavior-tracked—malicious Agents stay out. The full call chain has policy control, human review, and verifiable receipts.",
        ctaPrimary: "Start Building",
        ctaSecondary: "Open App →",
      },
      valueProposition: {
        title: "In the age of the Agent Internet, Agent access is not a feature—it is infrastructure.",
        cards: [
          {
            title: "Verified Agents",
            description:
              "Every Agent is identity-verified, capability-declared, and reputation-scored before it can be invoked. Malicious or untrusted Agents are kept out by design.",
          },
          {
            title: "Trust as Policy",
            description:
              "Your organization defines who can call which Agent under what conditions. Policy decisions are enforced at runtime—allow, limit, require approval, or deny.",
          },
          {
            title: "Evidence by Default",
            description:
              "Every invocation produces a verifiable receipt. Audit trails link decisions, human reviews, and outcomes so you can prove what happened and why.",
          },
        ],
      },
      howItWorks: {
        title: "How does the platform ensure the Agents you invoke are trustworthy?",
        steps: [
          {
            summary: "You state your need.",
            detail:
              "You describe what you want in natural language. The platform receives your intent and prepares to route it through the trusted pipeline—no need to pick an Agent manually.",
          },
          {
            summary:
              "The platform matches the best Agent from verified candidates (identity ✓ capability ✓ reputation ✓).",
            detail:
              "Only Agents that have passed identity verification, declared their capabilities, and maintain a reputation score are considered. The platform selects the best fit for your request and prepares the invocation with full traceability.",
          },
          {
            summary:
              "Risk assessment → high-risk actions are blocked or require human confirmation.",
            detail:
              "Before execution, the system evaluates risk. Low-risk requests proceed automatically. High-risk or policy-sensitive actions are either blocked or sent to a human-in-the-loop queue for approval. You stay in control.",
          },
          {
            summary: "The trusted Agent executes → you get the result and a verifiable receipt.",
            detail:
              "The selected Agent runs your task. When it completes, you receive the outcome and a cryptographically signed receipt. The receipt can be verified independently and links to the full audit trail.",
          },
          {
            summary:
              "The full audit chain is traceable; anomalous behavior can be investigated and held accountable.",
            detail:
              "Every decision, routing step, and execution is recorded. If something goes wrong or you need to prove compliance, the full chain is available: who was called, what was allowed, and what was delivered.",
          },
        ],
      },
      finalCta: {
        heading: "Ready to get started?",
        openApp: "Open App",
        startBuilding: "Start Building",
        bookDemo: "Book a Demo",
      },
      previewSectionTitle: "Product in action",
    },
    footer: {
      privacy: "Privacy",
      cookies: "Cookies",
      github: "GitHub",
      contact: "Contact",
    },
    developers: {
      title: "Build on a conversation-native network, not isolated agent calls.",
      description: "Use open APIs, trust policies, and receipt verification to ship production workflows with clear governance.",
      primaryCta: "Read Quickstart",
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
      title: "Workflows optimized for result delivery and governance.",
      description: "Cover instant requests, high-risk approvals, and cross-node collaboration under one trust model.",
      primaryCta: "Try This Workflow",
      seoTitle: "Use Cases - GaiaLynk Agent IM",
      seoDescription: "Result-first and governance-ready agent collaboration scenarios.",
    },
    waitlist: {
      title: "Join the early access waitlist.",
      description: "Get updates on managed cloud orchestration, recurring automation, and connector expansion.",
      primaryCta: "Submit Waitlist",
      seoTitle: "Waitlist - GaiaLynk Agent IM",
      seoDescription: "Request early access.",
    },
    demo: {
      title: "Book a result-first and trust-governed product demo.",
      description: "Bring one real scenario and we will walk through Ask -> route -> result -> review -> receipt.",
      primaryCta: "Submit Demo Request",
      seoTitle: "Book Demo - GaiaLynk Agent IM",
      seoDescription: "Schedule a product demo.",
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
      useCases: "應用場景",
      docs: "文件",
      analytics: "分析看板",
      tasks: "任務",
      agents: "Agents",
      approvals: "審批",
      history: "歷史",
      connector: "連接器",
      settings: "設定",
      roadmap: "路線圖",
      pricing: "定價",
      openApp: "打開應用",
    },
    home: {
      eyebrow: "Agent Internet 的可信協作層",
      title: "從一句需求到可信的多 Agent 結果。",
      description: "GaiaLynk 讓普通使用者先拿結果，平台在背後完成路由、風險控制、人工覆核與可驗證收據。",
      primaryCta: "開始構建",
      seoTitle: "GaiaLynk Agent IM - 可信 Agent 協作層",
      seoDescription: "以 Web 為主的 Agent 協作產品，內建策略決策、人工覆核與證據鏈。",
      valuePoints: ["結果優先", "信任即策略", "默認有證據"],
      evidenceTitle: "決策、覆核、收據",
      evidenceDescription: "清楚看到為何放行、何時需人工覆核，以及哪張簽名收據可證明執行結果。",
      evidencePoints: ["策略決策：allow / allow_limited / need_confirmation / deny", "高風險動作進入人工覆核佇列", "簽名收據關聯全鏈路稽核證據"],
      secondaryCtas: {
        demo: "預約 Demo",
        waitlist: "加入等待名單",
      },
      hero: {
        eyebrow: "可信 Agent 閘道",
        title: "讓每一個被調用的 Agent 都經過驗證、受到管控、可被追溯。",
        subtitle:
          "每一個被調用的 Agent 都經過身份驗證、能力校驗和行為追蹤——惡意 Agent 被擋在門外，調用全程有策略管控、人工審核和可驗證收據。",
        ctaPrimary: "開始構建",
        ctaSecondary: "打開應用 →",
      },
      valueProposition: {
        title: "在 Agent 互聯網時代，Agent 准入不是功能，而是基礎設施。",
        cards: [
          {
            title: "經過驗證的 Agent",
            description:
              "每個 Agent 在可被調用前都經過身份驗證、能力聲明與信譽評分。惡意或不可信 Agent 從設計上被拒之門外。",
          },
          {
            title: "策略決定准入邊界",
            description:
              "由您的組織定義誰在何種條件下可調用哪個 Agent。策略在運行時強制執行——放行、限制、需審批或拒絕。",
          },
          {
            title: "每一步都有據",
            description:
              "每次調用都會產生可驗證收據。審計鏈串起決策、人工覆核與結果，讓您可證明發生了什麼以及原因。",
          },
        ],
      },
      howItWorks: {
        title: "平台如何確保你調用的 Agent 是可信的？",
        steps: [
          {
            summary: "用戶說出需求。",
            detail:
              "你用自然語言描述想要什麼。平台接收你的意圖並準備在可信管道中路由——無需手動選擇 Agent。",
          },
          {
            summary: "平台從經過驗證的 Agent 中匹配最合適的（身份校驗 ✓ 能力聲明 ✓ 信譽評分 ✓）。",
            detail:
              "只有通過身份驗證、聲明能力並保持信譽評分的 Agent 才會被考慮。平台為你的請求選出最合適的 Agent，並在完整可追溯的前提下準備調用。",
          },
          {
            summary: "風險評估 → 高風險操作自動攔截或需人工確認。",
            detail:
              "執行前系統會評估風險。低風險請求自動放行；高風險或策略敏感操作會被攔截或送入人工覆核佇列。你始終保有控制權。",
          },
          {
            summary: "可信 Agent 執行 → 結果與可驗證收據。",
            detail:
              "被選中的 Agent 執行你的任務。完成後你會收到結果與一份可獨立驗證的簽名收據，收據關聯完整審計鏈。",
          },
          {
            summary: "完整審計鏈可追溯，異常行為可追責。",
            detail:
              "每一次決策、路由與執行都會被記錄。若出現問題或需證明合規，完整鏈路可查：誰被調用、放行了什麼、交付了什麼。",
          },
        ],
      },
      finalCta: {
        heading: "準備好了嗎？",
        openApp: "打開應用",
        startBuilding: "開始構建",
        bookDemo: "預約 Demo",
      },
      previewSectionTitle: "產品界面預覽",
    },
    footer: {
      privacy: "隱私",
      cookies: "Cookies",
      github: "GitHub",
      contact: "聯絡我們",
    },
    developers: {
      title: "建立在會話原生網路，而非零散 Agent 呼叫之上。",
      description: "使用開放 API、信任策略與收據驗證，交付可治理、可上線的多 Agent 工作流。",
      primaryCta: "閱讀 Quickstart",
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
      title: "以結果交付與治理為中心的實戰場景。",
      description: "以同一套信任模型承接即時需求、高風險審批與跨節點協作。",
      primaryCta: "試用這個流程",
      seoTitle: "應用場景 - GaiaLynk Agent IM",
      seoDescription: "可信 Agent 協作的高價值場景。",
    },
    waitlist: {
      title: "加入早期存取等待名單。",
      description: "優先接收雲端託管編排、週期自動化與連接器能力更新。",
      primaryCta: "提交等待名單",
      seoTitle: "等待名單 - GaiaLynk Agent IM",
      seoDescription: "申請早期存取。",
    },
    demo: {
      title: "預約結果優先、信任可治理的產品 Demo。",
      description: "帶一個真實場景，我們將完整演示 Ask -> 路由 -> 結果 -> 覆核 -> 收據。",
      primaryCta: "提交 Demo 申請",
      seoTitle: "預約 Demo - GaiaLynk Agent IM",
      seoDescription: "安排產品示範。",
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
      useCases: "应用场景",
      docs: "文档",
      analytics: "分析看板",
      tasks: "任务",
      agents: "Agents",
      approvals: "审批",
      history: "历史",
      connector: "连接器",
      settings: "设置",
      roadmap: "路线图",
      pricing: "定价",
      openApp: "打开应用",
    },
    home: {
      eyebrow: "Agent Internet 的可信协作层",
      title: "从一句需求到可信的多 Agent 结果。",
      description: "GaiaLynk 让普通用户先拿结果，平台在背后完成路由、风险控制、人工复核与可验证收据。",
      primaryCta: "开始构建",
      seoTitle: "GaiaLynk Agent IM - 可信 Agent 协作层",
      seoDescription: "以 Web 为主的 Agent 协作产品，内建策略决策、人工复核与证据链。",
      valuePoints: ["结果优先", "信任即策略", "默认有证据"],
      evidenceTitle: "决策、复核、收据",
      evidenceDescription: "清楚看到为何放行、何时需要人工复核，以及哪张签名收据可证明执行结果。",
      evidencePoints: ["策略决策：allow / allow_limited / need_confirmation / deny", "高风险动作进入人工复核队列", "签名收据关联全链路审计证据"],
      secondaryCtas: {
        demo: "预约 Demo",
        waitlist: "加入等待名单",
      },
      hero: {
        eyebrow: "可信 Agent 网关",
        title: "让每一个被调用的 Agent 都经过验证、受到管控、可被追溯。",
        subtitle:
          "每一个被调用的 Agent 都经过身份验证、能力校验和行为追踪——恶意 Agent 被挡在门外，调用全程有策略管控、人工审核和可验证收据。",
        ctaPrimary: "开始构建",
        ctaSecondary: "打开应用 →",
      },
      valueProposition: {
        title: "在 Agent 互联网时代，Agent 准入不是功能，而是基础设施。",
        cards: [
          {
            title: "经过验证的 Agent",
            description:
              "每个 Agent 在可被调用前都经过身份验证、能力声明与信誉评分。恶意或不可信 Agent 从设计上被拒之门外。",
          },
          {
            title: "策略决定准入边界",
            description:
              "由您的组织定义谁在何种条件下可调用哪个 Agent。策略在运行时强制执行——放行、限制、需审批或拒绝。",
          },
          {
            title: "每一步都有据",
            description:
              "每次调用都会产生可验证收据。审计链串起决策、人工复核与结果，让您可证明发生了什么以及原因。",
          },
        ],
      },
      howItWorks: {
        title: "平台如何确保你调用的 Agent 是可信的？",
        steps: [
          {
            summary: "用户说出需求。",
            detail:
              "你用自然语言描述想要什么。平台接收你的意图并在可信管道中路由——无需手动选择 Agent。",
          },
          {
            summary: "平台从经过验证的 Agent 中匹配最合适的（身份校验 ✓ 能力声明 ✓ 信誉评分 ✓）。",
            detail:
              "只有通过身份验证、声明能力并保持信誉评分的 Agent 才会被考虑。平台为你的请求选出最合适的 Agent，并在完整可追溯的前提下准备调用。",
          },
          {
            summary: "风险评估 → 高风险操作自动拦截或需人工确认。",
            detail:
              "执行前系统会评估风险。低风险请求自动放行；高风险或策略敏感操作会被拦截或送入人工复核队列。你始终保有控制权。",
          },
          {
            summary: "可信 Agent 执行 → 结果与可验证收据。",
            detail:
              "被选中的 Agent 执行你的任务。完成后你会收到结果与一份可独立验证的签名收据，收据关联完整审计链。",
          },
          {
            summary: "完整审计链可追溯，异常行为可追责。",
            detail:
              "每一次决策、路由与执行都会被记录。若出现问题或需证明合规，完整链路可查：谁被调用、放行了什么、交付了什么。",
          },
        ],
      },
      finalCta: {
        heading: "准备好了吗？",
        openApp: "打开应用",
        startBuilding: "开始构建",
        bookDemo: "预约 Demo",
      },
      previewSectionTitle: "产品界面预览",
    },
    footer: {
      privacy: "隐私",
      cookies: "Cookies",
      github: "GitHub",
      contact: "联系我们",
    },
    developers: {
      title: "构建在会话原生网络，而不是零散 Agent 调用之上。",
      description: "使用开放 API、信任策略与收据验证，交付可治理、可上线的多 Agent 工作流。",
      primaryCta: "阅读 Quickstart",
      seoTitle: "开发者入口 - GaiaLynk Agent IM",
      seoDescription: "开发者 API、SDK 与接入路径。",
    },
    trust: {
      title: "信任是运行时决策系统，而不是徽章。",
      description: "在同一流程中查看策略结果、复核触发、reason code 与收据证据。",
      primaryCta: "查看信任流程",
      seoTitle: "可信与安全 - GaiaLynk Agent IM",
      seoDescription: "策略决策、人工复核与可审计收据，支持高风险调用。",
    },
    useCases: {
      title: "以结果交付与治理为中心的真实场景。",
      description: "以同一套信任模型承接即时需求、高风险审批与跨节点协作。",
      primaryCta: "试用这个流程",
      seoTitle: "应用场景 - GaiaLynk Agent IM",
      seoDescription: "可信 Agent 协作的高价值场景。",
    },
    waitlist: {
      title: "加入早期访问等待名单。",
      description: "优先接收云托管编排、周期自动化与连接器能力更新。",
      primaryCta: "提交等待名单",
      seoTitle: "等待名单 - GaiaLynk Agent IM",
      seoDescription: "申请早期访问。",
    },
    demo: {
      title: "预约结果优先、信任可治理的产品 Demo。",
      description: "带一个真实场景，我们将完整演示 Ask -> 路由 -> 结果 -> 复核 -> 收据。",
      primaryCta: "提交 Demo 申请",
      seoTitle: "预约 Demo - GaiaLynk Agent IM",
      seoDescription: "安排产品演示。",
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
