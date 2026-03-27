import type { Locale } from "@/lib/i18n/locales";

/** 产品壳层、Cookie、登录/注册/角色（T-6.5） */
export type ProductUiCopy = {
  backToMarketing: string;
  signOut: string;
  accountFallback: string;
  ariaOpenMenu: string;
  ariaOpenContextPanel: string;
  mobileQuickNavAria: string;
  mobileMore: string;
  chat: string;
  statusDisconnected: string;
  statusAgentsOnline: string;
  statusDefaultSpace: string;
  statusBarAria: string;
  statusDemo: string;
  /** 右侧面板无选中焦点时的提示 */
  contextPanelEmpty: string;
  /** 会话内无消息时的空状态 */
  chatEmptyHint: string;
  /** 非法会话 ID */
  chatInvalidConversation: string;
  /** 风险确认卡片标题 */
  riskActionNeedsConfirmation: string;
  riskConfirm: string;
  riskReject: string;
  /** 风险卡片中调用 ID 行前缀，例：Invocation / 調用編號 */
  riskInvocationCaption: string;
  viewReceipt: string;
  /** 202 待确认时插入的 Agent 消息摘要 */
  pendingAgentConfirmation: string;
  /** W-14：跳过顶栏直达主工作区 */
  skipToMain: string;
  /** W-14：读屏播报新消息（用户） */
  a11yLiveNewUserMessage: string;
  /** W-14：读屏播报新消息（Agent） */
  a11yLiveNewAgentMessage: string;
  /** W-14：读屏播报新消息（系统） */
  a11yLiveNewSystemMessage: string;
  /** 聊天：附件按钮 */
  chatAttachFileAria: string;
  chatAttachUploading: string;
  chatAttachUploadFailed: string;
  chatAttachedPrefix: string;
  chatRemoveAttachmentAria: string;
  chatFileTooLarge: string;
  /** 仅有附件、正文为空时填入的默认提示（须满足服务端 text min(1)） */
  chatDefaultMessageWithFile: string;
};

/** W-3 Space / 多人协作文案 */
export type SpaceUiCopy = {
  spaceSwitcherAria: string;
  createTeamSpace: string;
  teamSpaceNamePlaceholder: string;
  teamSpaceCreate: string;
  teamSpaceCreating: string;
  membersNavLink: string;
  membersTitle: string;
  memberRosterHeading: string;
  membersDescription: string;
  memberColumnUser: string;
  memberColumnRole: string;
  memberColumnJoined: string;
  inviteSectionTitle: string;
  inviteGenerate: string;
  invitePresetRole: string;
  inviteTtlHint: string;
  inviteLinkLabel: string;
  inviteCopy: string;
  inviteCopied: string;
  inviteShareNote: string;
  noMembers: string;
  joinPageTitle: string;
  joinPageWorking: string;
  joinPageSuccess: string;
  joinPageError: string;
  joinPageSignIn: string;
  guestNoInviteTooltip: string;
  guestNoAddAgentTooltip: string;
  participantsTitle: string;
  addAgent: string;
  addAgentIdPlaceholder: string;
  addAgentSubmit: string;
  addAgentBrowse: string;
  mentionEmpty: string;
  mentionUserPrefix: string;
  mentionAgentPrefix: string;
  roleOwner: string;
  roleAdmin: string;
  roleMember: string;
  roleGuest: string;
  systemJoinLabel: string;
  systemLeaveLabel: string;
};

/** W-15：Space RBAC 路由 UI、成员增强、权限 Toast */
export type W15RbacUiCopy = {
  roleNoPermissionToast: string;
  presenceOnline: string;
  presenceAway: string;
  presenceOffline: string;
  agentDelegateTitle: string;
  agentDelegateEligible: string;
  agentDelegateNotEligible: string;
  removeMember: string;
  removeConfirmTitle: string;
  removeConfirmBody: string;
  removeConfirm: string;
  cancel: string;
  exportAuditJson: string;
  exporting: string;
  exportFailed: string;
  auditExportDone: string;
  roleSaveFailed: string;
  roleUpdated: string;
  memberRemoved: string;
  youLabel: string;
  guestConnectorBanner: string;
  auditExportHint: string;
  memberDisplayFallback: string;
};

/** W-19：Cookie 同意横幅（三语） */
export type CookieConsentCopy = {
  title: string;
  lead: string;
  privacyLink: string;
  necessaryLabel: string;
  necessaryHint: string;
  analyticsLabel: string;
  analyticsHint: string;
  marketingLabel: string;
  marketingHint: string;
  rejectOptional: string;
  saveChoices: string;
  acceptAll: string;
};

export type AuthFormsCopy = {
  backToChat: string;
  login: {
    title: string;
    description: string;
    signInGitHub: string;
    signInGoogle: string;
    orEmail: string;
    email: string;
    password: string;
    signingIn: string;
    signIn: string;
    cancel: string;
    noAccount: string;
    register: string;
    redirecting: string;
    invalidCredentials: string;
    genericError: string;
  };
  register: {
    title: string;
    description: string;
    email: string;
    passwordHint: string;
    password: string;
    passwordTooShort: string;
    roleOptional: string;
    roleHelp: string;
    roleLater: string;
    roleProvider: string;
    roleConsumer: string;
    creating: string;
    submit: string;
    cancel: string;
    hasAccount: string;
    signIn: string;
    registrationFailed: string;
  };
  role: {
    title: string;
    description: string;
    providerTitle: string;
    providerDesc: string;
    consumerTitle: string;
    consumerDesc: string;
    skipLink: string;
    skipRest: string;
    pleaseSignIn: string;
    signIn: string;
    loading: string;
    failedSetRole: string;
    genericError: string;
  };
};

/** W-5：Trust 用户面、收据摘要（与 chat TrustCard / ReceiptSummary 对齐） */
export type W5TrustUiCopy = {
  /** 气泡内一行说明（卡片内为人话全文） */
  trustLeadBlockedPolicy: string;
  trustLeadBlockedBoundary: string;
  platformBlockedTitle: string;
  boundaryBlockedTitle: string;
  riskLow: string;
  riskMedium: string;
  riskHigh: string;
  riskCritical: string;
  viewDetails: string;
  trustActorLabel: string;
  receiptSectionTitle: string;
  receiptIssuedAtLabel: string;
  receiptSummaryLabel: string;
  receiptCopyFullId: string;
  receiptCopied: string;
  receiptAdminReasonCodes: string;
  receiptAdminPolicyRule: string;
};

/** W-4：智能体中心（Agent Hub）浏览、详情 Tab、编排推荐条（三语）；代码键名仍用 directory。 */
export type W4AgentUxCopy = {
  directory: {
    searchPlaceholder: string;
    filterAria: string;
    allCategories: string;
    noResults: string;
    tryDiscoveryHint: string;
    discoveryHot: string;
    discoveryBeginner: string;
    discoveryLowLatency: string;
    rankingFallbackNote: string;
    lowConcurrency: string;
    parallelSlots: string;
    queueLikely: string;
    fastFail: string;
  };
  trustBadge: {
    unverified: string;
    consumer_ready: string;
    high_sensitivity_enhanced: string;
  };
  agentDetail: {
    tabOverview: string;
    tabCapabilities: string;
    tabPrivacy: string;
    tabReviews: string;
    tabDeveloper: string;
    trustHeading: string;
    loadError: string;
    identitySection: string;
    reputationSection: string;
    successRateSection: string;
    riskSection: string;
    identityVerified: string;
    identityUnverified: string;
    privacyLead: string;
    memoryTier: string;
    supportsScheduledYes: string;
    supportsScheduledNo: string;
    timeoutSuggest: string;
    reviewsHeading: string;
    quality: string;
    speed: string;
    stability: string;
    developerType: string;
    developerOrigin: string;
    developerNode: string;
    developerUrl: string;
  };
  orchestration: {
    planTitle: string;
    collapse: string;
    expand: string;
    stepPrefix: string;
    confirmRun: string;
    singleAgentOnly: string;
    loadingRecommend: string;
    recommendUnavailable: string;
    notEnoughAgents: string;
    runProgress: string;
    statusPending: string;
    statusRunning: string;
    statusCompleted: string;
    statusFailed: string;
    statusAwaitingUser: string;
    statusAwaitingReview: string;
    expandStep: string;
    failedAt: string;
    retryStep: string;
    swapAgent: string;
    sendFeedback: string;
    runCompleted: string;
    runPartial: string;
    runFailed: string;
    dismissing: string;
    selectAgent: string;
    /** W-20 */
    statusLeaseExpired: string;
    statusScheduled: string;
    statusSchedulePaused: string;
    statusCompletedWarnings: string;
    scheduleRun: string;
    scheduleDialogTitle: string;
    scheduleDialogLead: string;
    scheduleConfirm: string;
    scheduleClose: string;
    scheduleCreated: string;
    scheduleFailed: string;
    cronDaily9: string;
    cronWeeklyMon9: string;
    cronCustom: string;
    cronCustomPlaceholder: string;
    cronUtcNote: string;
    abandonRun: string;
    swapAgentHint: string;
    flowAriaLabel: string;
    outputPreview: string;
  };
};

/** W-20：定时编排任务管理页 */
export type W20ScheduledTasksCopy = {
  pageTitle: string;
  pageLead: string;
  colStatus: string;
  colCron: string;
  colNextRun: string;
  colConversation: string;
  colActions: string;
  statusScheduled: string;
  statusSchedulePaused: string;
  statusRunning: string;
  statusOther: string;
  pause: string;
  resume: string;
  openChat: string;
  noTasks: string;
  loadError: string;
  expandHistory: string;
  collapseHistory: string;
  historyTitle: string;
  historyNote: string;
  agentDetailCta: string;
  agentDetailCtaLead: string;
  agentDetailLink: string;
  loading: string;
};

const W5_TRUST_UI: Record<Locale, W5TrustUiCopy> = {
  en: {
    trustLeadBlockedPolicy: "The platform blocked this request. Details below.",
    trustLeadBlockedBoundary: "Your message was not delivered. Details below.",
    platformBlockedTitle: "Blocked by trust policy",
    boundaryBlockedTitle: "Blocked by data boundary policy",
    riskLow: "Low risk",
    riskMedium: "Medium risk",
    riskHigh: "High risk",
    riskCritical: "Critical risk",
    viewDetails: "View queue & details",
    trustActorLabel: "Trust policy",
    receiptSectionTitle: "Invocation receipt",
    receiptIssuedAtLabel: "Issued at",
    receiptSummaryLabel: "Summary",
    receiptCopyFullId: "Copy full ID",
    receiptCopied: "Copied",
    receiptAdminReasonCodes: "Reason codes",
    receiptAdminPolicyRule: "Policy rule",
  },
  "zh-Hant": {
    trustLeadBlockedPolicy: "平台已攔截此請求，詳見下方說明。",
    trustLeadBlockedBoundary: "訊息未送出，詳見下方說明。",
    platformBlockedTitle: "已由信任策略攔截",
    boundaryBlockedTitle: "已由資料邊界策略攔截",
    riskLow: "低風險",
    riskMedium: "中風險",
    riskHigh: "高風險",
    riskCritical: "重大風險",
    viewDetails: "查看佇列與詳情",
    trustActorLabel: "信任策略",
    receiptSectionTitle: "調用收據",
    receiptIssuedAtLabel: "開立時間",
    receiptSummaryLabel: "摘要",
    receiptCopyFullId: "複製完整 ID",
    receiptCopied: "已複製",
    receiptAdminReasonCodes: "原因碼",
    receiptAdminPolicyRule: "策略規則",
  },
  "zh-Hans": {
    trustLeadBlockedPolicy: "平台已拦截此请求，详见下方说明。",
    trustLeadBlockedBoundary: "消息未送达，详见下方说明。",
    platformBlockedTitle: "已被信任策略拦截",
    boundaryBlockedTitle: "已被数据边界策略拦截",
    riskLow: "低风险",
    riskMedium: "中风险",
    riskHigh: "高风险",
    riskCritical: "重大风险",
    viewDetails: "查看队列与详情",
    trustActorLabel: "信任策略",
    receiptSectionTitle: "调用收据",
    receiptIssuedAtLabel: "开立时间",
    receiptSummaryLabel: "摘要",
    receiptCopyFullId: "复制完整 ID",
    receiptCopied: "已复制",
    receiptAdminReasonCodes: "原因码",
    receiptAdminPolicyRule: "策略规则",
  },
};

const W4_AGENT_UX: Record<Locale, W4AgentUxCopy> = {
  en: {
    directory: {
      searchPlaceholder: "Search agents…",
      filterAria: "Filter by category",
      allCategories: "All categories",
      noResults: "No agents match your search or filter.",
      tryDiscoveryHint: "Try a curated list below, or clear filters.",
      discoveryHot: "Popular",
      discoveryBeginner: "Beginner-friendly",
      discoveryLowLatency: "Low latency",
      rankingFallbackNote: "Showing alphabetical fallback while ranking recovers.",
      lowConcurrency: "Low concurrency (1 slot)",
      parallelSlots: "Up to {{n}} parallel slots",
      queueLikely: "Queue likely when busy",
      fastFail: "Fast-fail when at capacity",
    },
    trustBadge: {
      unverified: "Unverified",
      consumer_ready: "Consumer ready",
      high_sensitivity_enhanced: "High-sensitivity",
    },
    agentDetail: {
      tabOverview: "Overview",
      tabCapabilities: "Capabilities",
      tabPrivacy: "Privacy & data",
      tabReviews: "Reviews",
      tabDeveloper: "Developer",
      trustHeading: "Trust badge",
      loadError: "Could not load agent details.",
      identitySection: "Identity",
      reputationSection: "Reputation",
      successRateSection: "Success rate",
      riskSection: "Risk level",
      identityVerified: "Identity verified",
      identityUnverified: "Identity not verified",
      privacyLead: "How this agent handles memory and retention depends on its declared tier and your Space policies.",
      memoryTier: "Memory tier",
      supportsScheduledYes: "Scheduled runs supported",
      supportsScheduledNo: "Scheduled runs not declared",
      timeoutSuggest: "Suggested step timeout",
      reviewsHeading: "User feedback (aggregated)",
      quality: "Quality",
      speed: "Speed",
      stability: "Stability",
      developerType: "Agent type",
      developerOrigin: "Source",
      developerNode: "Node",
      developerUrl: "Endpoint URL",
    },
    orchestration: {
      planTitle: "Recommended multi-agent plan",
      collapse: "Hide",
      expand: "Show",
      stepPrefix: "Step",
      confirmRun: "Confirm run",
      singleAgentOnly: "Single agent only",
      loadingRecommend: "Fetching recommendation…",
      recommendUnavailable: "Could not load a plan. Continue with normal chat.",
      notEnoughAgents: "Add at least two agents to this chat to enable plans.",
      runProgress: "Run progress",
      statusPending: "Pending",
      statusRunning: "Running",
      statusCompleted: "Done",
      statusFailed: "Failed",
      statusAwaitingUser: "Waiting for you",
      statusAwaitingReview: "Human review",
      expandStep: "Details",
      failedAt: "Failed at step {{n}}",
      retryStep: "Retry step",
      swapAgent: "Change agent",
      sendFeedback: "Feedback",
      runCompleted: "Run completed",
      runPartial: "Run partially completed",
      runFailed: "Run failed",
      dismissing: "Dismiss",
      selectAgent: "Replace with…",
      statusLeaseExpired: "Timed out",
      statusScheduled: "Scheduled",
      statusSchedulePaused: "Paused",
      statusCompletedWarnings: "Done (warnings)",
      scheduleRun: "Schedule",
      scheduleDialogTitle: "Schedule this plan",
      scheduleDialogLead: "Runs use UTC cron. The server executes the same steps on each tick.",
      scheduleConfirm: "Create schedule",
      scheduleClose: "Cancel",
      scheduleCreated: "Scheduled. Manage tasks in Settings → Scheduled tasks.",
      scheduleFailed: "Could not create schedule.",
      cronDaily9: "Daily at 09:00 UTC",
      cronWeeklyMon9: "Weekly on Monday 09:00 UTC",
      cronCustom: "Custom cron (5 fields, UTC)",
      cronCustomPlaceholder: "0 9 * * *",
      cronUtcNote: "Cron is evaluated in UTC to match the orchestration scheduler.",
      abandonRun: "Abandon run",
      swapAgentHint: "Change agents in the chat participant bar, then request a new plan.",
      flowAriaLabel: "Data flow across steps",
      outputPreview: "Output preview",
    },
  },
  "zh-Hant": {
    directory: {
      searchPlaceholder: "搜尋 Agent…",
      filterAria: "依分類篩選",
      allCategories: "全部分類",
      noResults: "沒有符合搜尋或篩選的 Agent。",
      tryDiscoveryHint: "可試試下方精選列，或清除篩選。",
      discoveryHot: "熱門",
      discoveryBeginner: "新手友善",
      discoveryLowLatency: "低延遲",
      rankingFallbackNote: "排序服務暫時不可用，已改為字母序安全排序。",
      lowConcurrency: "低併發（1 槽）",
      parallelSlots: "最多 {{n}} 個並行槽",
      queueLikely: "繁忙時可能排隊",
      fastFail: "額滿時快速失敗",
    },
    trustBadge: {
      unverified: "未驗證",
      consumer_ready: "可給消費者使用",
      high_sensitivity_enhanced: "高敏感增強",
    },
    agentDetail: {
      tabOverview: "概覽",
      tabCapabilities: "能力與限制",
      tabPrivacy: "隱私與資料",
      tabReviews: "評價",
      tabDeveloper: "開發者資訊",
      trustHeading: "信任徽章",
      loadError: "無法載入 Agent 詳情。",
      identitySection: "身分",
      reputationSection: "聲譽",
      successRateSection: "成功率",
      riskSection: "風險等級",
      identityVerified: "身分已驗證",
      identityUnverified: "身分未驗證",
      privacyLead: "記憶與留存方式取決於其宣告層級與你的 Space 政策。",
      memoryTier: "記憶層級",
      supportsScheduledYes: "支援排程執行",
      supportsScheduledNo: "未宣告排程執行",
      timeoutSuggest: "建議逾時",
      reviewsHeading: "使用者回饋（彙總）",
      quality: "品質",
      speed: "速度",
      stability: "穩定",
      developerType: "Agent 類型",
      developerOrigin: "來源",
      developerNode: "節點",
      developerUrl: "端點 URL",
    },
    orchestration: {
      planTitle: "推薦多 Agent 方案",
      collapse: "收起",
      expand: "展開",
      stepPrefix: "步驟",
      confirmRun: "確認執行",
      singleAgentOnly: "只要單一 Agent",
      loadingRecommend: "取得推薦中…",
      recommendUnavailable: "無法載入方案，將以一般對話繼續。",
      notEnoughAgents: "請在對話中加入至少兩個 Agent 以啟用方案。",
      runProgress: "執行進度",
      statusPending: "等待中",
      statusRunning: "執行中",
      statusCompleted: "完成",
      statusFailed: "失敗",
      statusAwaitingUser: "等待你操作",
      statusAwaitingReview: "人工審核",
      expandStep: "詳情",
      failedAt: "第 {{n}} 步失敗",
      retryStep: "重試此步",
      swapAgent: "更換 Agent",
      sendFeedback: "意見回饋",
      runCompleted: "執行完成",
      runPartial: "部分完成",
      runFailed: "執行失敗",
      dismissing: "關閉",
      selectAgent: "改為…",
      statusLeaseExpired: "逾時",
      statusScheduled: "已排程",
      statusSchedulePaused: "已暫停",
      statusCompletedWarnings: "完成（有警告）",
      scheduleRun: "排程執行",
      scheduleDialogTitle: "為此方案建立排程",
      scheduleDialogLead: "使用 UTC cron。伺服器會在每個週期執行相同步驟。",
      scheduleConfirm: "建立排程",
      scheduleClose: "取消",
      scheduleCreated: "已建立排程。可在「設定 → 排程任務」管理。",
      scheduleFailed: "無法建立排程。",
      cronDaily9: "每天 09:00 UTC",
      cronWeeklyMon9: "每週一 09:00 UTC",
      cronCustom: "自訂 cron（五段，UTC）",
      cronCustomPlaceholder: "0 9 * * *",
      cronUtcNote: "Cron 以 UTC 計算，與編排排程器一致。",
      abandonRun: "放棄執行",
      swapAgentHint: "請在對話參與者列調整 Agent，再重新取得方案。",
      flowAriaLabel: "步驟間資料流",
      outputPreview: "輸出預覽",
    },
  },
  "zh-Hans": {
    directory: {
      searchPlaceholder: "搜索 Agent…",
      filterAria: "按分类筛选",
      allCategories: "全部分类",
      noResults: "没有符合搜索或筛选的 Agent。",
      tryDiscoveryHint: "可试试下方精选列表，或清除筛选。",
      discoveryHot: "热门",
      discoveryBeginner: "新手友好",
      discoveryLowLatency: "低延迟",
      rankingFallbackNote: "排序服务暂不可用，已改为字母序安全排序。",
      lowConcurrency: "低并发（1 槽）",
      parallelSlots: "最多 {{n}} 个并行槽",
      queueLikely: "繁忙时可能排队",
      fastFail: "满载时快速失败",
    },
    trustBadge: {
      unverified: "未验证",
      consumer_ready: "消费者就绪",
      high_sensitivity_enhanced: "高敏感增强",
    },
    agentDetail: {
      tabOverview: "概览",
      tabCapabilities: "能力与限制",
      tabPrivacy: "隐私与数据",
      tabReviews: "评价",
      tabDeveloper: "开发者信息",
      trustHeading: "信任徽章",
      loadError: "无法加载 Agent 详情。",
      identitySection: "身份",
      reputationSection: "信誉",
      successRateSection: "成功率",
      riskSection: "风险等级",
      identityVerified: "身份已验证",
      identityUnverified: "身份未验证",
      privacyLead: "记忆与留存方式取决于其声明层级与你的 Space 策略。",
      memoryTier: "记忆层级",
      supportsScheduledYes: "支持定时/排程执行",
      supportsScheduledNo: "未声明排程执行",
      timeoutSuggest: "建议超时",
      reviewsHeading: "用户反馈（汇总）",
      quality: "质量",
      speed: "速度",
      stability: "稳定",
      developerType: "Agent 类型",
      developerOrigin: "来源",
      developerNode: "节点",
      developerUrl: "端点 URL",
    },
    orchestration: {
      planTitle: "推荐多 Agent 方案",
      collapse: "收起",
      expand: "展开",
      stepPrefix: "步骤",
      confirmRun: "确认执行",
      singleAgentOnly: "只要单 Agent",
      loadingRecommend: "获取推荐中…",
      recommendUnavailable: "无法加载方案，将以普通对话继续。",
      notEnoughAgents: "请在对话中加入至少两个 Agent 以启用方案。",
      runProgress: "执行进度",
      statusPending: "等待中",
      statusRunning: "执行中",
      statusCompleted: "完成",
      statusFailed: "失败",
      statusAwaitingUser: "等待你操作",
      statusAwaitingReview: "人工审核",
      expandStep: "详情",
      failedAt: "第 {{n}} 步失败",
      retryStep: "重试此步",
      swapAgent: "更换 Agent",
      sendFeedback: "反馈",
      runCompleted: "执行完成",
      runPartial: "部分完成",
      runFailed: "执行失败",
      dismissing: "关闭",
      selectAgent: "替换为…",
      statusLeaseExpired: "超时",
      statusScheduled: "已排程",
      statusSchedulePaused: "已暂停",
      statusCompletedWarnings: "完成（有警告）",
      scheduleRun: "定时执行",
      scheduleDialogTitle: "为此方案创建定时任务",
      scheduleDialogLead: "使用 UTC cron。服务器会在每个周期执行相同步骤。",
      scheduleConfirm: "创建定时任务",
      scheduleClose: "取消",
      scheduleCreated: "已创建定时任务。可在「设置 → 定时任务」管理。",
      scheduleFailed: "无法创建定时任务。",
      cronDaily9: "每天 09:00 UTC",
      cronWeeklyMon9: "每周一 09:00 UTC",
      cronCustom: "自定义 cron（五段，UTC）",
      cronCustomPlaceholder: "0 9 * * *",
      cronUtcNote: "Cron 按 UTC 计算，与编排调度器一致。",
      abandonRun: "放弃执行",
      swapAgentHint: "请在对话参与者栏调整 Agent，再重新获取方案。",
      flowAriaLabel: "步骤间数据流",
      outputPreview: "输出预览",
    },
  },
};

const W20_SCHEDULED_TASKS: Record<Locale, W20ScheduledTasksCopy> = {
  en: {
    pageTitle: "Scheduled tasks",
    pageLead: "B-class orchestration runs with cron. Pause, resume, or open the conversation.",
    colStatus: "Status",
    colCron: "Cron (UTC)",
    colNextRun: "Next run",
    colConversation: "Conversation",
    colActions: "Actions",
    statusScheduled: "Active",
    statusSchedulePaused: "Paused",
    statusRunning: "Running",
    statusOther: "In progress",
    pause: "Pause",
    resume: "Resume",
    openChat: "Open chat",
    noTasks: "No scheduled orchestrations yet. Create one from a multi-agent plan in chat.",
    loadError: "Could not load scheduled tasks.",
    expandHistory: "Show latest run detail",
    collapseHistory: "Hide detail",
    historyTitle: "Latest step snapshot",
    historyNote: "Shows the current run record; full audit history may require exports.",
    agentDetailCta: "Scheduled tasks",
    agentDetailCtaLead: "Create recurring runs from a chat with two or more agents.",
    agentDetailLink: "Open scheduled tasks",
    loading: "Loading…",
  },
  "zh-Hant": {
    pageTitle: "排程任務",
    pageLead: "帶 cron 的 B 類編排。可暫停、恢復或開啟對話。",
    colStatus: "狀態",
    colCron: "Cron（UTC）",
    colNextRun: "下次執行",
    colConversation: "對話",
    colActions: "操作",
    statusScheduled: "進行中",
    statusSchedulePaused: "已暫停",
    statusRunning: "執行中",
    statusOther: "處理中",
    pause: "暫停",
    resume: "恢復",
    openChat: "開啟對話",
    noTasks: "尚無排程編排。請在含兩個以上 Agent 的對話中從方案建立。",
    loadError: "無法載入排程任務。",
    expandHistory: "顯示最近執行細節",
    collapseHistory: "隱藏細節",
    historyTitle: "最近步驟快照",
    historyNote: "為目前 Run 記錄；完整稽核可能需要匯出。",
    agentDetailCta: "排程任務",
    agentDetailCtaLead: "在含兩個以上 Agent 的對話中，可建立週期性執行。",
    agentDetailLink: "前往排程任務",
    loading: "載入中…",
  },
  "zh-Hans": {
    pageTitle: "定时任务",
    pageLead: "带 cron 的 B 类编排。可暂停、恢复或打开会话。",
    colStatus: "状态",
    colCron: "Cron（UTC）",
    colNextRun: "下次执行",
    colConversation: "会话",
    colActions: "操作",
    statusScheduled: "进行中",
    statusSchedulePaused: "已暂停",
    statusRunning: "执行中",
    statusOther: "处理中",
    pause: "暂停",
    resume: "恢复",
    openChat: "打开会话",
    noTasks: "暂无定时编排。请在包含两个以上 Agent 的会话中从方案创建。",
    loadError: "无法加载定时任务。",
    expandHistory: "显示最近执行详情",
    collapseHistory: "隐藏详情",
    historyTitle: "最近步骤快照",
    historyNote: "为当前 Run 记录；完整审计可能需要导出。",
    agentDetailCta: "定时任务",
    agentDetailCtaLead: "在包含两个以上 Agent 的会话中可创建周期性执行。",
    agentDetailLink: "前往定时任务",
    loading: "加载中…",
  },
};

export function getW20ScheduledTasksCopy(locale: Locale): W20ScheduledTasksCopy {
  return W20_SCHEDULED_TASKS[locale];
}

/** W-21：UGC 举报 / 管理员隐藏 */
export type W21ModerationCopy = {
  contextMenuAria: string;
  menuReport: string;
  menuHide: string;
  reportTitle: string;
  reportLead: string;
  reasonLabel: string;
  reportReasons: { value: string; label: string }[];
  detailLabel: string;
  detailOptional: string;
  detailPlaceholder: string;
  submitReport: string;
  cancel: string;
  closeDialog: string;
  reportSuccess: string;
  reportErrorGeneric: string;
  reportErrorAlready: string;
  reportErrorNotGroup: string;
  reportErrorNotApplicable: string;
  hideTitle: string;
  hideLead: string;
  hideConfirm: string;
  hideCancel: string;
  hideSuccess: string;
  hideError: string;
};

const W21_MODERATION: Record<Locale, W21ModerationCopy> = {
  en: {
    contextMenuAria: "Message actions",
    menuReport: "Report",
    menuHide: "Hide for members",
    reportTitle: "Report message",
    reportLead:
      "Available in conversations with multiple participants. Reports are reviewed under our safety policies.",
    reasonLabel: "Reason",
    reportReasons: [
      { value: "spam", label: "Spam or ads" },
      { value: "harassment", label: "Harassment or bullying" },
      { value: "hateful", label: "Hateful or abusive content" },
      { value: "privacy", label: "Privacy risk or sensitive data" },
      { value: "other", label: "Other" },
    ],
    detailLabel: "Details",
    detailOptional: "optional",
    detailPlaceholder: "Add context that helps moderators (max 2000 characters).",
    submitReport: "Submit report",
    cancel: "Cancel",
    closeDialog: "Close",
    reportSuccess: "Report submitted. Thank you.",
    reportErrorGeneric: "Could not submit report. Try again later.",
    reportErrorAlready: "You already reported this message.",
    reportErrorNotGroup: "Reporting is only available when multiple people are in the conversation.",
    reportErrorNotApplicable: "This message cannot be reported.",
    hideTitle: "Hide message?",
    hideLead:
      "Members will see a placeholder instead of the original text. This applies to this Space conversation.",
    hideConfirm: "Hide message",
    hideCancel: "Cancel",
    hideSuccess: "Message hidden.",
    hideError: "Could not hide message. Check permissions and try again.",
  },
  "zh-Hant": {
    contextMenuAria: "訊息操作",
    menuReport: "檢舉",
    menuHide: "對成員隱藏",
    reportTitle: "檢舉訊息",
    reportLead: "僅在多人參與的對話中可用。檢舉將依安全政策處理。",
    reasonLabel: "原因",
    reportReasons: [
      { value: "spam", label: "垃圾內容或廣告" },
      { value: "harassment", label: "騷擾或霸凌" },
      { value: "hateful", label: "仇恨或辱罵" },
      { value: "privacy", label: "隱私風險或敏感資料" },
      { value: "other", label: "其他" },
    ],
    detailLabel: "補充說明",
    detailOptional: "選填",
    detailPlaceholder: "提供有助審核的脈絡（最多 2000 字）。",
    submitReport: "送出檢舉",
    cancel: "取消",
    closeDialog: "關閉",
    reportSuccess: "已送出檢舉，感謝您。",
    reportErrorGeneric: "無法送出檢舉，請稍後再試。",
    reportErrorAlready: "您已檢舉過此訊息。",
    reportErrorNotGroup: "僅在多人對話中可使用檢舉。",
    reportErrorNotApplicable: "此訊息無法檢舉。",
    hideTitle: "隱藏訊息？",
    hideLead: "成員將看到占位說明，而非原文。僅影響此 Space 對話中的顯示。",
    hideConfirm: "隱藏訊息",
    hideCancel: "取消",
    hideSuccess: "已隱藏訊息。",
    hideError: "無法隱藏，請確認權限後再試。",
  },
  "zh-Hans": {
    contextMenuAria: "消息操作",
    menuReport: "举报",
    menuHide: "对成员隐藏",
    reportTitle: "举报消息",
    reportLead: "仅在多人参与的对话中可用。举报将按安全政策处理。",
    reasonLabel: "原因",
    reportReasons: [
      { value: "spam", label: "垃圾内容或广告" },
      { value: "harassment", label: "骚扰或霸凌" },
      { value: "hateful", label: "仇恨或辱骂" },
      { value: "privacy", label: "隐私风险或敏感数据" },
      { value: "other", label: "其他" },
    ],
    detailLabel: "补充说明",
    detailOptional: "选填",
    detailPlaceholder: "提供有助于审核的上下文（最多 2000 字）。",
    submitReport: "提交举报",
    cancel: "取消",
    closeDialog: "关闭",
    reportSuccess: "举报已提交，感谢。",
    reportErrorGeneric: "无法提交举报，请稍后重试。",
    reportErrorAlready: "您已举报过该消息。",
    reportErrorNotGroup: "仅在多人对话中可使用举报。",
    reportErrorNotApplicable: "该消息无法举报。",
    hideTitle: "隐藏消息？",
    hideLead: "成员将看到占位说明，而非原文。仅影响此 Space 会话中的展示。",
    hideConfirm: "隐藏消息",
    hideCancel: "取消",
    hideSuccess: "消息已隐藏。",
    hideError: "无法隐藏，请确认权限后重试。",
  },
};

export function getW21ModerationCopy(locale: Locale): W21ModerationCopy {
  return W21_MODERATION[locale];
}

const PRODUCT_UI: Record<Locale, ProductUiCopy> = {
  en: {
    backToMarketing: "← Back to site",
    signOut: "Sign out",
    accountFallback: "Account",
    ariaOpenMenu: "Open menu",
    ariaOpenContextPanel: "Open context panel",
    mobileQuickNavAria: "Product quick navigation",
    mobileMore: "More",
    chat: "Chat",
    statusDisconnected: "Disconnected",
    statusAgentsOnline: "Agents online",
    statusDefaultSpace: "Default space",
    statusBarAria: "Status bar",
    statusDemo: "Demo",
    contextPanelEmpty: "Select a conversation, agent, approval, or receipt to view details here.",
    chatEmptyHint: "No messages yet. Send one below.",
    chatInvalidConversation: "Invalid conversation",
    riskActionNeedsConfirmation: "Action requires your confirmation",
    riskConfirm: "Confirm",
    riskReject: "Reject",
    riskInvocationCaption: "Invocation",
    viewReceipt: "View receipt",
    pendingAgentConfirmation: "This action requires your confirmation.",
    skipToMain: "Skip to main content",
    a11yLiveNewUserMessage: "New message from you",
    a11yLiveNewAgentMessage: "New message from an agent",
    a11yLiveNewSystemMessage: "New system message",
    chatAttachFileAria: "Attach file",
    chatAttachUploading: "Uploading file…",
    chatAttachUploadFailed: "Could not upload file. Try again.",
    chatAttachedPrefix: "Attached:",
    chatRemoveAttachmentAria: "Remove attachment",
    chatFileTooLarge: "File is too large (max 2 MB).",
    chatDefaultMessageWithFile: "Please review the attached file.",
  },
  "zh-Hant": {
    backToMarketing: "← 回官網",
    signOut: "登出",
    accountFallback: "帳戶",
    ariaOpenMenu: "打開選單",
    ariaOpenContextPanel: "打開情境面板",
    mobileQuickNavAria: "產品快捷導覽",
    mobileMore: "更多",
    chat: "對話",
    statusDisconnected: "未連線",
    statusAgentsOnline: "線上 Agent",
    statusDefaultSpace: "預設空間",
    statusBarAria: "狀態列",
    statusDemo: "展示模式",
    contextPanelEmpty: "請在左側選擇對話、Agent、審批項目或收據，以在此檢視詳情。",
    chatEmptyHint: "尚無訊息，請在下方傳送。",
    chatInvalidConversation: "無效的對話",
    riskActionNeedsConfirmation: "此操作需要你的確認",
    riskConfirm: "確認",
    riskReject: "拒絕",
    riskInvocationCaption: "調用編號",
    viewReceipt: "檢視收據",
    pendingAgentConfirmation: "此動作需要你的確認。",
    skipToMain: "跳至主要內容",
    a11yLiveNewUserMessage: "你有一則新訊息",
    a11yLiveNewAgentMessage: "Agent 新訊息",
    a11yLiveNewSystemMessage: "系統新訊息",
    chatAttachFileAria: "附加檔案",
    chatAttachUploading: "正在上傳檔案…",
    chatAttachUploadFailed: "無法上傳檔案，請再試一次。",
    chatAttachedPrefix: "已附加：",
    chatRemoveAttachmentAria: "移除附件",
    chatFileTooLarge: "檔案過大（上限 2 MB）。",
    chatDefaultMessageWithFile: "請檢視附加的檔案。",
  },
  "zh-Hans": {
    backToMarketing: "← 回官网",
    signOut: "退出登录",
    accountFallback: "账户",
    ariaOpenMenu: "打开菜单",
    ariaOpenContextPanel: "打开上下文面板",
    mobileQuickNavAria: "产品快捷导航",
    mobileMore: "更多",
    chat: "对话",
    statusDisconnected: "未连接",
    statusAgentsOnline: "在线 Agent",
    statusDefaultSpace: "默认空间",
    statusBarAria: "状态栏",
    statusDemo: "演示模式",
    contextPanelEmpty: "请在左侧选择对话、Agent、审批项或收据，以在此查看详情。",
    chatEmptyHint: "暂无消息，请在下方发送。",
    chatInvalidConversation: "无效的会话",
    riskActionNeedsConfirmation: "此操作需要你确认",
    riskConfirm: "确认",
    riskReject: "拒绝",
    riskInvocationCaption: "调用编号",
    viewReceipt: "查看收据",
    pendingAgentConfirmation: "此操作需要你确认。",
    skipToMain: "跳到主要内容",
    a11yLiveNewUserMessage: "你有一条新消息",
    a11yLiveNewAgentMessage: "Agent 新消息",
    a11yLiveNewSystemMessage: "系统新消息",
    chatAttachFileAria: "附加文件",
    chatAttachUploading: "正在上传文件…",
    chatAttachUploadFailed: "无法上传文件，请重试。",
    chatAttachedPrefix: "已附加：",
    chatRemoveAttachmentAria: "移除附件",
    chatFileTooLarge: "文件过大（上限 2 MB）。",
    chatDefaultMessageWithFile: "请查看附加的文件。",
  },
};

const COOKIE_CONSENT: Record<Locale, CookieConsentCopy> = {
  en: {
    title: "Cookies and your choices",
    lead: "We use essential cookies for session and security. Optional analytics help us improve pages and conversion (for example PostHog). Marketing cookies are reserved for future campaigns—you can leave them off.",
    privacyLink: "Privacy policy",
    necessaryLabel: "Essential",
    necessaryHint: "Session, authentication, and security. Always on.",
    analyticsLabel: "Analytics",
    analyticsHint: "Anonymous usage to understand which pages and locales perform best.",
    marketingLabel: "Marketing",
    marketingHint: "Reserved for future promotional use. Not used yet.",
    rejectOptional: "Essential only",
    saveChoices: "Save my choices",
    acceptAll: "Accept all",
  },
  "zh-Hant": {
    title: "Cookie 與您的選擇",
    lead: "我們使用必要的 Cookie 以維持登入與安全。選用分析 Cookie 有助我們改善頁面與轉化（例如 PostHog）。行銷 Cookie 預留未來活動使用，您可維持關閉。",
    privacyLink: "隱私權政策",
    necessaryLabel: "必要",
    necessaryHint: "工作階段、驗證與安全相關，一律啟用。",
    analyticsLabel: "分析",
    analyticsHint: "匿名使用情況，協助了解頁面與語系表現。",
    marketingLabel: "行銷",
    marketingHint: "預留未來推廣；目前尚未使用。",
    rejectOptional: "僅必要",
    saveChoices: "儲存選擇",
    acceptAll: "全部接受",
  },
  "zh-Hans": {
    title: "Cookie 与您的选择",
    lead: "我们使用必要的 Cookie 维持登录与安全。可选的分析 Cookie 用于改进页面与转化（例如 PostHog）。营销 Cookie 预留给未来活动，您可保持关闭。",
    privacyLink: "隐私政策",
    necessaryLabel: "必要",
    necessaryHint: "会话、身份验证与安全相关，始终开启。",
    analyticsLabel: "分析",
    analyticsHint: "匿名使用情况，用于了解页面与语言表现。",
    marketingLabel: "营销",
    marketingHint: "预留给未来推广；当前未使用。",
    rejectOptional: "仅必要",
    saveChoices: "保存选择",
    acceptAll: "全部接受",
  },
};

const AUTH_FORMS: Record<Locale, AuthFormsCopy> = {
  en: {
    backToChat: "← Chat",
    login: {
      title: "Sign in",
      description:
        "Sign in with your email or OAuth to continue. You will be returned to the page you came from.",
      signInGitHub: "Sign in with GitHub",
      signInGoogle: "Sign in with Google",
      orEmail: "Or continue with email",
      email: "Email",
      password: "Password",
      signingIn: "Signing in…",
      signIn: "Sign in",
      cancel: "Cancel",
      noAccount: "Don't have an account?",
      register: "Register",
      redirecting: "Redirecting…",
      invalidCredentials: "Invalid email or password. Try again.",
      genericError: "Something went wrong. Try again.",
    },
    register: {
      title: "Create account",
      description: "Register with email. You can choose your role now or on the next screen.",
      email: "Email",
      passwordHint: "Password (min 8 characters)",
      password: "Password",
      passwordTooShort: "Password must be at least 8 characters.",
      roleOptional: "Role (optional)",
      roleHelp: "Choose now or on the next screen. Provider: offer agents; Consumer: use agents.",
      roleLater: "Choose later",
      roleProvider: "Provider",
      roleConsumer: "Consumer",
      creating: "Creating account…",
      submit: "Register",
      cancel: "Cancel",
      hasAccount: "Already have an account?",
      signIn: "Sign in",
      registrationFailed: "Registration failed.",
    },
    role: {
      title: "Choose your role",
      description: "Select how you want to use the platform. You can change this later in settings.",
      providerTitle: "Provider",
      providerDesc: "Offer agents and capabilities to others.",
      consumerTitle: "Consumer",
      consumerDesc: "Use agents and complete tasks.",
      skipLink: "Skip for now",
      skipRest: "(you can set your role later in settings).",
      pleaseSignIn: "Please sign in first.",
      signIn: "Sign in",
      loading: "Loading…",
      failedSetRole: "Failed to set role.",
      genericError: "Something went wrong. Try again.",
    },
  },
  "zh-Hant": {
    backToChat: "← 對話",
    login: {
      title: "登入",
      description: "使用電子郵件或 OAuth 登入以繼續，完成後將回到您來源的頁面。",
      signInGitHub: "以 GitHub 登入",
      signInGoogle: "以 Google 登入",
      orEmail: "或以電子郵件繼續",
      email: "電子郵件",
      password: "密碼",
      signingIn: "登入中…",
      signIn: "登入",
      cancel: "取消",
      noAccount: "還沒有帳戶？",
      register: "註冊",
      redirecting: "正在重新導向…",
      invalidCredentials: "電子郵件或密碼不正確，請再試一次。",
      genericError: "發生錯誤，請再試一次。",
    },
    register: {
      title: "建立帳戶",
      description: "以電子郵件註冊。可現在選擇角色，或在下一步再選。",
      email: "電子郵件",
      passwordHint: "密碼（至少 8 字元）",
      password: "密碼",
      passwordTooShort: "密碼至少需要 8 個字元。",
      roleOptional: "角色（選填）",
      roleHelp: "可現在選擇或在下一步再選。Provider：提供 Agent；Consumer：使用 Agent。",
      roleLater: "稍後再選",
      roleProvider: "Provider",
      roleConsumer: "Consumer",
      creating: "建立帳戶中…",
      submit: "註冊",
      cancel: "取消",
      hasAccount: "已有帳戶？",
      signIn: "登入",
      registrationFailed: "註冊失敗。",
    },
    role: {
      title: "選擇你的角色",
      description: "選擇你使用平台的方式，之後仍可在設定中變更。",
      providerTitle: "Provider",
      providerDesc: "向他人提供 Agent 與能力。",
      consumerTitle: "Consumer",
      consumerDesc: "使用 Agent 並完成任務。",
      skipLink: "暫時略過",
      skipRest: "（之後仍可在設定中設定角色）。",
      pleaseSignIn: "請先登入。",
      signIn: "登入",
      loading: "載入中…",
      failedSetRole: "無法設定角色。",
      genericError: "發生錯誤，請再試一次。",
    },
  },
  "zh-Hans": {
    backToChat: "← 对话",
    login: {
      title: "登录",
      description: "使用邮箱或 OAuth 登录以继续，完成后将回到您来源的页面。",
      signInGitHub: "使用 GitHub 登录",
      signInGoogle: "使用 Google 登录",
      orEmail: "或使用邮箱继续",
      email: "邮箱",
      password: "密码",
      signingIn: "登录中…",
      signIn: "登录",
      cancel: "取消",
      noAccount: "还没有账户？",
      register: "注册",
      redirecting: "正在跳转…",
      invalidCredentials: "邮箱或密码不正确，请重试。",
      genericError: "出错了，请重试。",
    },
    register: {
      title: "创建账户",
      description: "使用邮箱注册。可现在选择角色，或在下一步再选。",
      email: "邮箱",
      passwordHint: "密码（至少 8 位）",
      password: "密码",
      passwordTooShort: "密码至少需要 8 个字符。",
      roleOptional: "角色（可选）",
      roleHelp: "可现在选择或在下一步再选。Provider：提供 Agent；Consumer：使用 Agent。",
      roleLater: "稍后选择",
      roleProvider: "Provider",
      roleConsumer: "Consumer",
      creating: "创建账户中…",
      submit: "注册",
      cancel: "取消",
      hasAccount: "已有账户？",
      signIn: "登录",
      registrationFailed: "注册失败。",
    },
    role: {
      title: "选择你的角色",
      description: "选择你使用平台的方式，之后仍可在设置中更改。",
      providerTitle: "Provider",
      providerDesc: "向他人提供 Agent 与能力。",
      consumerTitle: "Consumer",
      consumerDesc: "使用 Agent 并完成任务。",
      skipLink: "暂时跳过",
      skipRest: "（之后仍可在设置中设置角色）。",
      pleaseSignIn: "请先登录。",
      signIn: "登录",
      loading: "加载中…",
      failedSetRole: "无法设置角色。",
      genericError: "出错了，请重试。",
    },
  },
};

const SPACE_UI: Record<Locale, SpaceUiCopy> = {
  en: {
    spaceSwitcherAria: "Current Space, switch workspace",
    createTeamSpace: "New team space",
    teamSpaceNamePlaceholder: "Team name",
    teamSpaceCreate: "Create",
    teamSpaceCreating: "Creating…",
    membersNavLink: "Space members",
    membersTitle: "Space members",
    memberRosterHeading: "Member roster",
    membersDescription: "View roles, invite teammates, and copy join links.",
    memberColumnUser: "Member",
    memberColumnRole: "Role",
    memberColumnJoined: "Joined",
    inviteSectionTitle: "Invite link",
    inviteGenerate: "Generate invite link",
    invitePresetRole: "Role for invitees",
    inviteTtlHint: "Expires in 24h (default)",
    inviteLinkLabel: "Join link",
    inviteCopy: "Copy",
    inviteCopied: "Copied",
    inviteShareNote: "Share this link with teammates. They must sign in to accept.",
    noMembers: "No members loaded.",
    joinPageTitle: "Join Space",
    joinPageWorking: "Joining…",
    joinPageSuccess: "Joined. Opening chat…",
    joinPageError: "Could not join with this link.",
    joinPageSignIn: "Please sign in to accept the invite.",
    guestNoInviteTooltip: "Guests cannot create invite links. Ask an owner or admin.",
    guestNoAddAgentTooltip: "Guests cannot add agents to this conversation. Ask an owner, admin, or member.",
    participantsTitle: "Participants",
    addAgent: "Add Agent",
    addAgentIdPlaceholder: "Agent ID",
    addAgentSubmit: "Add",
    addAgentBrowse: "Browse Agent Hub",
    mentionEmpty: "No matching participants",
    mentionUserPrefix: "User",
    mentionAgentPrefix: "Agent",
    roleOwner: "Owner",
    roleAdmin: "Admin",
    roleMember: "Member",
    roleGuest: "Guest",
    systemJoinLabel: "Joined",
    systemLeaveLabel: "Left",
  },
  "zh-Hant": {
    spaceSwitcherAria: "目前 Space，切換工作空間",
    createTeamSpace: "新建團隊 Space",
    teamSpaceNamePlaceholder: "團隊名稱",
    teamSpaceCreate: "建立",
    teamSpaceCreating: "建立中…",
    membersNavLink: "Space 成員",
    membersTitle: "Space 成員",
    memberRosterHeading: "成員名單",
    membersDescription: "檢視角色、邀請隊友並複製加入連結。",
    memberColumnUser: "成員",
    memberColumnRole: "角色",
    memberColumnJoined: "加入時間",
    inviteSectionTitle: "邀請連結",
    inviteGenerate: "產生邀請連結",
    invitePresetRole: "受邀者角色",
    inviteTtlHint: "預設 24 小時內有效",
    inviteLinkLabel: "加入連結",
    inviteCopy: "複製",
    inviteCopied: "已複製",
    inviteShareNote: "將連結分享給隊友；對方需登入後接受。",
    noMembers: "尚無成員資料。",
    joinPageTitle: "加入 Space",
    joinPageWorking: "加入中…",
    joinPageSuccess: "已加入，正在前往對話…",
    joinPageError: "無法以此連結加入。",
    joinPageSignIn: "請先登入以接受邀請。",
    guestNoInviteTooltip: "訪客無法建立邀請連結，請洽 owner 或 admin。",
    guestNoAddAgentTooltip: "訪客無法將 Agent 拉入此對話，請洽 owner、admin 或 member。",
    participantsTitle: "參與者",
    addAgent: "加入 Agent",
    addAgentIdPlaceholder: "Agent ID",
    addAgentSubmit: "加入",
    addAgentBrowse: "瀏覽智能體中心",
    mentionEmpty: "沒有符合的參與者",
    mentionUserPrefix: "使用者",
    mentionAgentPrefix: "Agent",
    roleOwner: "擁有者",
    roleAdmin: "管理員",
    roleMember: "成員",
    roleGuest: "訪客",
    systemJoinLabel: "加入",
    systemLeaveLabel: "離開",
  },
  "zh-Hans": {
    spaceSwitcherAria: "当前 Space，切换工作空间",
    createTeamSpace: "新建团队 Space",
    teamSpaceNamePlaceholder: "团队名称",
    teamSpaceCreate: "创建",
    teamSpaceCreating: "创建中…",
    membersNavLink: "Space 成员",
    membersTitle: "Space 成员",
    memberRosterHeading: "成员名单",
    membersDescription: "查看角色、邀请队友并复制加入链接。",
    memberColumnUser: "成员",
    memberColumnRole: "角色",
    memberColumnJoined: "加入时间",
    inviteSectionTitle: "邀请链接",
    inviteGenerate: "生成邀请链接",
    invitePresetRole: "受邀者角色",
    inviteTtlHint: "默认 24 小时内有效",
    inviteLinkLabel: "加入链接",
    inviteCopy: "复制",
    inviteCopied: "已复制",
    inviteShareNote: "将链接分享给队友；对方需登录后接受。",
    noMembers: "暂无成员数据。",
    joinPageTitle: "加入 Space",
    joinPageWorking: "加入中…",
    joinPageSuccess: "已加入，正在前往对话…",
    joinPageError: "无法以此链接加入。",
    joinPageSignIn: "请先登录以接受邀请。",
    guestNoInviteTooltip: "访客无法创建邀请链接，请联系 owner 或 admin。",
    guestNoAddAgentTooltip: "访客无法将 Agent 拉入此会话，请联系 owner、admin 或 member。",
    participantsTitle: "参与者",
    addAgent: "加入 Agent",
    addAgentIdPlaceholder: "Agent ID",
    addAgentSubmit: "加入",
    addAgentBrowse: "浏览智能体中心",
    mentionEmpty: "没有匹配的参与者",
    mentionUserPrefix: "用户",
    mentionAgentPrefix: "Agent",
    roleOwner: "拥有者",
    roleAdmin: "管理员",
    roleMember: "成员",
    roleGuest: "访客",
    systemJoinLabel: "加入",
    systemLeaveLabel: "离开",
  },
};

const W15_RBAC_UI: Record<Locale, W15RbacUiCopy> = {
  en: {
    roleNoPermissionToast: "Your role does not allow this. Please contact a Space owner or admin.",
    presenceOnline: "Online",
    presenceAway: "Away",
    presenceOffline: "Offline",
    agentDelegateTitle: "Agent invite delegation",
    agentDelegateEligible: "Owner or admin accounts can authorize Agent-to-Agent invites (delegating user).",
    agentDelegateNotEligible: "Members and guests cannot be delegating users for Agent invites unless promoted to admin.",
    removeMember: "Remove",
    removeConfirmTitle: "Remove member?",
    removeConfirmBody: "They will lose access to this Space and its conversations.",
    removeConfirm: "Remove member",
    cancel: "Cancel",
    exportAuditJson: "Export audit (JSON)",
    exporting: "Exporting…",
    exportFailed: "Could not export audit events.",
    auditExportDone: "Audit export downloaded.",
    roleSaveFailed: "Could not update role.",
    roleUpdated: "Role updated.",
    memberRemoved: "Member removed.",
    youLabel: "You",
    guestConnectorBanner:
      "Your role (guest) cannot trigger connectors in this Space. Ask an owner, admin, or member if you need access.",
    auditExportHint: "Downloads recent audit events for the current Space (owner or admin only).",
    memberDisplayFallback: "Unnamed member",
  },
  "zh-Hant": {
    roleNoPermissionToast: "你的角色無此權限，請聯絡 Space 管理員（owner 或 admin）。",
    presenceOnline: "在線",
    presenceAway: "離開",
    presenceOffline: "離線",
    agentDelegateTitle: "Agent 代邀請授權",
    agentDelegateEligible: "owner / admin 帳號可作為 Agent 拉 Agent 時的授權使用者（delegating user）。",
    agentDelegateNotEligible: "member / guest 不能直接作為代邀請授權使用者；需先升為 admin（或由管理員調整角色）。",
    removeMember: "移除",
    removeConfirmTitle: "要移除此成員嗎？",
    removeConfirmBody: "對方將失去此 Space 與相關對話的存取權。",
    removeConfirm: "確認移除",
    cancel: "取消",
    exportAuditJson: "匯出審計（JSON）",
    exporting: "匯出中…",
    exportFailed: "無法匯出審計事件。",
    auditExportDone: "審計匯出已下載。",
    roleSaveFailed: "無法更新角色。",
    roleUpdated: "已更新角色。",
    memberRemoved: "已移除成員。",
    youLabel: "你",
    guestConnectorBanner:
      "你目前為訪客（guest），無法在此 Space 觸發連接器。若需要，請洽 owner、admin 或 member。",
    auditExportHint: "下載目前 Space 近期審計事件（僅 owner / admin）。",
    memberDisplayFallback: "未命名成員",
  },
  "zh-Hans": {
    roleNoPermissionToast: "你的角色无此权限，请联系 Space 管理员（owner 或 admin）。",
    presenceOnline: "在线",
    presenceAway: "离开",
    presenceOffline: "离线",
    agentDelegateTitle: "Agent 代邀请授权",
    agentDelegateEligible: "owner / admin 账号可作为 Agent 拉 Agent 时的授权用户（delegating user）。",
    agentDelegateNotEligible: "member / guest 不能直接作为代邀请授权用户；需先升为 admin（或由管理员调整角色）。",
    removeMember: "移除",
    removeConfirmTitle: "要移除此成员吗？",
    removeConfirmBody: "对方将失去此 Space 及相关对话的访问权。",
    removeConfirm: "确认移除",
    cancel: "取消",
    exportAuditJson: "导出审计（JSON）",
    exporting: "导出中…",
    exportFailed: "无法导出审计事件。",
    auditExportDone: "审计导出已下载。",
    roleSaveFailed: "无法更新角色。",
    roleUpdated: "已更新角色。",
    memberRemoved: "已移除成员。",
    youLabel: "你",
    guestConnectorBanner:
      "你目前为访客（guest），无法在此 Space 触发连接器。若需要，请联系 owner、admin 或 member。",
    auditExportHint: "下载当前 Space 近期审计事件（仅 owner / admin）。",
    memberDisplayFallback: "未命名成员",
  },
};

export function getW15RbacUiCopy(locale: Locale): W15RbacUiCopy {
  return W15_RBAC_UI[locale];
}

export function getProductUiCopy(locale: Locale): ProductUiCopy {
  return PRODUCT_UI[locale];
}

export function getCookieConsentCopy(locale: Locale): CookieConsentCopy {
  return COOKIE_CONSENT[locale];
}

export function getAuthFormsCopy(locale: Locale): AuthFormsCopy {
  return AUTH_FORMS[locale];
}

export function getSpaceUiCopy(locale: Locale): SpaceUiCopy {
  return SPACE_UI[locale];
}

export function getW4AgentUxCopy(locale: Locale): W4AgentUxCopy {
  return W4_AGENT_UX[locale];
}

export function getW5TrustUiCopy(locale: Locale): W5TrustUiCopy {
  return W5_TRUST_UI[locale];
}

/** W-6：对话生命周期（列表分组、搜索、归档、导出） */
export type W6ConversationLifecycleCopy = {
  searchPlaceholder: string;
  includeArchived: string;
  groupToday: string;
  groupWeek: string;
  groupOlder: string;
  pin: string;
  unpin: string;
  star: string;
  unstar: string;
  archive: string;
  restore: string;
  delete: string;
  deleteConfirm: string;
  actionsAria: string;
  readOnlyArchived: string;
  readOnlyClosed: string;
  restoreChat: string;
  exportMarkdown: string;
  exportPlain: string;
  exportRedact: string;
  exportDownload: string;
  stateArchivedBadge: string;
  stateClosedBadge: string;
  pinnedBadge: string;
  listLoading: string;
  listEmpty: string;
};

const W6_CONVERSATION_LIFECYCLE: Record<Locale, W6ConversationLifecycleCopy> = {
  en: {
    searchPlaceholder: "Search conversations…",
    includeArchived: "Include archived",
    groupToday: "Today",
    groupWeek: "Last 7 days",
    groupOlder: "Earlier",
    pin: "Pin",
    unpin: "Unpin",
    star: "Star",
    unstar: "Unstar",
    archive: "Archive",
    restore: "Restore to active",
    delete: "Delete",
    deleteConfirm: "Delete this conversation permanently? This cannot be undone.",
    actionsAria: "Conversation actions",
    readOnlyArchived: "This conversation is archived — messaging is disabled.",
    readOnlyClosed: "This conversation is closed — view only (audit).",
    restoreChat: "Restore",
    exportMarkdown: "Export Markdown",
    exportPlain: "Export plain text",
    exportRedact: "Redact @mentions in export",
    exportDownload: "Download",
    stateArchivedBadge: "Archived",
    stateClosedBadge: "Closed",
    pinnedBadge: "Pinned",
    listLoading: "Loading…",
    listEmpty: "No conversations match your filters.",
  },
  "zh-Hant": {
    searchPlaceholder: "搜尋對話…",
    includeArchived: "包含已封存",
    groupToday: "今天",
    groupWeek: "過去 7 天",
    groupOlder: "更早",
    pin: "置頂",
    unpin: "取消置頂",
    star: "標星",
    unstar: "取消標星",
    archive: "封存",
    restore: "恢復為進行中",
    delete: "刪除",
    deleteConfirm: "確定永久刪除此對話？此操作無法復原。",
    actionsAria: "對話操作",
    readOnlyArchived: "此對話已封存，無法發送新訊息。",
    readOnlyClosed: "此對話已關閉，僅可檢視（審計）。",
    restoreChat: "恢復",
    exportMarkdown: "匯出 Markdown",
    exportPlain: "匯出純文字",
    exportRedact: "匯出時脫敏 @提及",
    exportDownload: "下載",
    stateArchivedBadge: "已封存",
    stateClosedBadge: "已關閉",
    pinnedBadge: "已置頂",
    listLoading: "載入中…",
    listEmpty: "沒有符合篩選的對話。",
  },
  "zh-Hans": {
    searchPlaceholder: "搜索对话…",
    includeArchived: "包含已归档",
    groupToday: "今天",
    groupWeek: "过去 7 天",
    groupOlder: "更早",
    pin: "置顶",
    unpin: "取消置顶",
    star: "标星",
    unstar: "取消标星",
    archive: "归档",
    restore: "恢复为进行中",
    delete: "删除",
    deleteConfirm: "确定永久删除此对话？此操作无法撤销。",
    actionsAria: "对话操作",
    readOnlyArchived: "此对话已归档，无法发送新消息。",
    readOnlyClosed: "此对话已关闭，仅可查看（审计）。",
    restoreChat: "恢复",
    exportMarkdown: "导出 Markdown",
    exportPlain: "导出纯文本",
    exportRedact: "导出时脱敏 @提及",
    exportDownload: "下载",
    stateArchivedBadge: "已归档",
    stateClosedBadge: "已关闭",
    pinnedBadge: "已置顶",
    listLoading: "加载中…",
    listEmpty: "没有符合筛选的对话。",
  },
};

export function getW6ConversationLifecycleCopy(locale: Locale): W6ConversationLifecycleCopy {
  return W6_CONVERSATION_LIFECYCLE[locale];
}

/** W-7：错误模式、连接状态、发送队列、编排部分成功摘要 */
export type W7ProductResilienceCopy = {
  errorActorLabel: string;
  platformTitle: string;
  platformBody: string;
  agentTitle: string;
  agentBody: string;
  queueTitle: string;
  queueBody: string;
  queueEstimate: string;
  connectorTitle: string;
  connectorBody: string;
  policyTitle: string;
  policyBody: string;
  retry: string;
  retrySameMessage: string;
  openAgents: string;
  openSettings: string;
  contactSupport: string;
  refreshMessages: string;
  connectionOnline: string;
  connectionOffline: string;
  connectionReconnecting: string;
  connectionSseDisconnected: string;
  queueStripTitle: string;
  queueWillSend: string;
  queueRemove: string;
  queueFlushNow: string;
  orchestrationPartialTitle: string;
  orchestrationPartialLead: string;
  /** W-22：帮助中心链出（桌面 Connector 不可用指引） */
  connectorDesktopHelpCta: string;
};

const W7_PRODUCT_RESILIENCE: Record<Locale, W7ProductResilienceCopy> = {
  en: {
    errorActorLabel: "GaiaLynk",
    platformTitle: "GaiaLynk is temporarily unavailable",
    platformBody:
      "We could not reach the service. Check your network or try again shortly. If the issue persists, contact support.",
    agentTitle: "This Agent could not respond",
    agentBody:
      "The Agent endpoint timed out or returned an error. Try another Agent from the Agent Hub, send a shorter follow-up, or contact support with the error time.",
    queueTitle: "Queue is busy right now",
    queueBody:
      "This Agent is at capacity or your request waited too long in line. Try a lower-load Agent or wait briefly and refresh the thread.",
    queueEstimate: "Estimated wait: {{estimate}}",
    connectorTitle: "Connection or authorization needed",
    connectorBody:
      "A connector or attachment could not be used. Re-authorize the integration in settings or remove the attachment and try again.",
    policyTitle: "Request was blocked",
    policyBody:
      "The platform declined this action (not a Trust review card). Check your role, Space rules, or contact an admin.",
    retry: "Try again",
    retrySameMessage: "Resend last message",
    openAgents: "Browse Agents",
    openSettings: "Settings",
    contactSupport: "Contact support",
    refreshMessages: "Refresh thread",
    connectionOnline: "Connected",
    connectionOffline: "Offline — messages will send when you are back online",
    connectionReconnecting: "Reconnecting live updates…",
    connectionSseDisconnected: "Live updates paused — messages still save; we are reconnecting",
    queueStripTitle: "Queued while offline",
    queueWillSend: "Will send when online",
    queueRemove: "Remove",
    queueFlushNow: "Send queued now",
    orchestrationPartialTitle: "Partial run",
    orchestrationPartialLead: "{{ok}} of {{total}} steps succeeded. Retry failed steps below.",
    connectorDesktopHelpCta: "How to connect the desktop Connector",
  },
  "zh-Hant": {
    errorActorLabel: "GaiaLynk",
    platformTitle: "GaiaLynk 暫時無法使用",
    platformBody: "無法連上服務。請檢查網路或稍後重試；若持續發生請聯絡支援。",
    agentTitle: "此 Agent 暫時無法回應",
    agentBody: "Agent 端點逾時或回傳錯誤。請改從智能體中心選擇其他 Agent、傳送較短的後續訊息，或聯絡支援並提供錯誤時間。",
    queueTitle: "目前排隊較長",
    queueBody: "此 Agent 並發已滿或等待逾時。請改選較低負載的 Agent，或稍候並重新整理訊息。",
    queueEstimate: "預估等待：{{estimate}}",
    connectorTitle: "需要連線或重新授權",
    connectorBody: "連接器或附件無法使用。請至設定重新授權，或移除附件後再試。",
    policyTitle: "請求已被拒絕",
    policyBody: "平台拒絕此操作（非信任審核卡片）。請確認角色、Space 規則或聯絡管理員。",
    retry: "重試",
    retrySameMessage: "用上一則內容重送",
    openAgents: "瀏覽智能體中心",
    openSettings: "設定",
    contactSupport: "聯絡支援",
    refreshMessages: "重新整理訊息",
    connectionOnline: "已連線",
    connectionOffline: "離線中 — 恢復連線後會送出訊息",
    connectionReconnecting: "正在重新連接即時更新…",
    connectionSseDisconnected: "即時更新暫停 — 訊息仍會儲存，系統將自動重連",
    queueStripTitle: "離線期間排程",
    queueWillSend: "上線後送出",
    queueRemove: "移除",
    queueFlushNow: "立即送出佇列",
    orchestrationPartialTitle: "部分完成",
    orchestrationPartialLead: "{{ok}} / {{total}} 步已成功，可於下方單獨重試失敗步驟。",
    connectorDesktopHelpCta: "如何連接桌面 Connector",
  },
  "zh-Hans": {
    errorActorLabel: "GaiaLynk",
    platformTitle: "GaiaLynk 暂时不可用",
    platformBody: "无法连接服务。请检查网络或稍后重试；若持续发生请联系支持。",
    agentTitle: "该 Agent 暂时无法响应",
    agentBody: "Agent 端点超时或返回错误。请从智能体中心更换 Agent、发送更短的跟进消息，或联系支持并提供出错时间。",
    queueTitle: "当前排队较长",
    queueBody: "该 Agent 并发已满或排队超时。请选择更低负载的 Agent，或稍候并刷新会话消息。",
    queueEstimate: "预估等待：{{estimate}}",
    connectorTitle: "需要连接或重新授权",
    connectorBody: "连接器或附件不可用。请在设置中重新授权，或移除附件后重试。",
    policyTitle: "请求已被拒绝",
    policyBody: "平台拒绝了此操作（非信任审核卡片）。请检查角色、Space 规则或联系管理员。",
    retry: "重试",
    retrySameMessage: "用上一则内容重发",
    openAgents: "浏览智能体中心",
    openSettings: "设置",
    contactSupport: "联系支持",
    refreshMessages: "刷新消息",
    connectionOnline: "已连接",
    connectionOffline: "离线 — 恢复连接后将发送消息",
    connectionReconnecting: "正在重新连接实时更新…",
    connectionSseDisconnected: "实时更新已暂停 — 消息仍会保存，系统将自动重连",
    queueStripTitle: "离线期间排队",
    queueWillSend: "上线后发送",
    queueRemove: "移除",
    queueFlushNow: "立即发送队列",
    orchestrationPartialTitle: "部分完成",
    orchestrationPartialLead: "{{ok}} / {{total}} 步已成功，可在下方单独重试失败步骤。",
    connectorDesktopHelpCta: "如何连接桌面 Connector",
  },
};

export function getW7ProductResilienceCopy(locale: Locale): W7ProductResilienceCopy {
  return W7_PRODUCT_RESILIENCE[locale];
}

/** W-22：桌面 Connector 下载、配对、设备列表与对话内文案 */
export type W22DesktopConnectorCopy = {
  sectionTitle: string;
  sectionLead: string;
  statusNotPaired: string;
  statusAwaitingConnector: string;
  statusConnected: string;
  statusDisconnected: string;
  mobileOnlyHint: string;
  downloadMac: string;
  downloadWin: string;
  releasesNote: string;
  pairNewDevice: string;
  listRefresh: string;
  listTitle: string;
  emptyDevices: string;
  loadError: string;
  colDevice: string;
  colPairedAt: string;
  colLastSeen: string;
  colStatus: string;
  online: string;
  offline: string;
  pendingPair: string;
  unpair: string;
  unpairing: string;
  pairingDialogTitle: string;
  pairingDialogLead: string;
  pairingCodeLabel: string;
  pairingSubmit: string;
  pairingSubmitting: string;
  pairingSuccess: string;
  pairingInvalid: string;
  pairingFailed: string;
  pairingCancel: string;
  desktopTrustLead: string;
  desktopTrustPathLine: string;
  desktopActionFileList: string;
  desktopActionFileRead: string;
  desktopActionFileWrite: string;
  desktopWriteConfirmLoading: string;
  desktopWriteConfirmFailed: string;
};

const W22_DESKTOP_CONNECTOR: Record<Locale, W22DesktopConnectorCopy> = {
  en: {
    sectionTitle: "Desktop Connector",
    sectionLead:
      "Pair a lightweight tray app to run governed file actions on this machine. Downloads point to GitHub Releases; revoke access here anytime.",
    statusNotPaired: "Not paired — install the app and enter the 6-digit code from the tray.",
    statusAwaitingConnector: "Pairing started — open Desktop Connector and finish pairing.",
    statusConnected: "Connected",
    statusDisconnected: "Paired but offline — keep the Connector running on your desktop.",
    mobileOnlyHint: "Desktop Connector pairing and downloads are available on a desktop browser.",
    downloadMac: "Download for macOS",
    downloadWin: "Download for Windows",
    releasesNote: "Pick the latest release asset for your platform.",
    pairNewDevice: "Pair new device",
    listRefresh: "Refresh",
    listTitle: "Paired devices",
    emptyDevices: "No devices yet.",
    loadError: "Could not load desktop devices.",
    colDevice: "Device",
    colPairedAt: "Paired",
    colLastSeen: "Last seen",
    colStatus: "Status",
    online: "Online",
    offline: "Offline",
    pendingPair: "Awaiting app",
    unpair: "Unpair",
    unpairing: "Unpairing…",
    pairingDialogTitle: "Pair Desktop Connector",
    pairingDialogLead:
      "Open Desktop Connector on your computer, find the 6-digit pairing code in the tray UI, then enter it below.",
    pairingCodeLabel: "6-digit code",
    pairingSubmit: "Submit pairing",
    pairingSubmitting: "Pairing…",
    pairingSuccess: "Pairing registered. Finish in the desktop app.",
    pairingInvalid: "Enter exactly 6 digits.",
    pairingFailed: "Pairing failed.",
    pairingCancel: "Cancel",
    desktopTrustLead: "Trust policy: desktop file action",
    desktopTrustPathLine: "{{action}} · {{path}}",
    desktopActionFileList: "List files",
    desktopActionFileRead: "Read file",
    desktopActionFileWrite: "Write file",
    desktopWriteConfirmLoading: "Confirming…",
    desktopWriteConfirmFailed: "Could not confirm write. Try again.",
  },
  "zh-Hant": {
    sectionTitle: "桌面 Connector",
    sectionLead:
      "配對輕量托盤應用，在本機執行受治理的檔案動作。下載指向 GitHub Releases；可隨時於此解綁。",
    statusNotPaired: "尚未配對 — 請安裝應用並在托盤介面輸入 6 位數配對碼。",
    statusAwaitingConnector: "已登記配對 — 請在桌面端開啟 Connector 完成連線。",
    statusConnected: "已連線",
    statusDisconnected: "已配對但離線 — 請在電腦上保持 Connector 執行。",
    mobileOnlyHint: "桌面 Connector 的下載與配對請在桌面瀏覽器操作。",
    downloadMac: "下載 macOS 版",
    downloadWin: "下載 Windows 版",
    releasesNote: "請在 Releases 中選擇適合平台的最新安裝檔。",
    pairNewDevice: "配對新裝置",
    listRefresh: "重新整理",
    listTitle: "已配對裝置",
    emptyDevices: "尚無裝置。",
    loadError: "無法載入桌面裝置列表。",
    colDevice: "裝置",
    colPairedAt: "配對時間",
    colLastSeen: "最近上線",
    colStatus: "狀態",
    online: "線上",
    offline: "離線",
    pendingPair: "等待應用",
    unpair: "解綁",
    unpairing: "解綁中…",
    pairingDialogTitle: "配對桌面 Connector",
    pairingDialogLead: "在電腦上開啟 Desktop Connector，於托盤介面找到 6 位數配對碼，並在下方輸入。",
    pairingCodeLabel: "6 位數配對碼",
    pairingSubmit: "送出配對",
    pairingSubmitting: "配對中…",
    pairingSuccess: "已登記配對，請在桌面應用完成連線。",
    pairingInvalid: "請輸入 6 位數字。",
    pairingFailed: "配對失敗。",
    pairingCancel: "取消",
    desktopTrustLead: "信任策略：桌面檔案動作",
    desktopTrustPathLine: "{{action}} · {{path}}",
    desktopActionFileList: "列出檔案",
    desktopActionFileRead: "讀取檔案",
    desktopActionFileWrite: "寫入檔案",
    desktopWriteConfirmLoading: "確認中…",
    desktopWriteConfirmFailed: "無法確認寫入，請重試。",
  },
  "zh-Hans": {
    sectionTitle: "桌面 Connector",
    sectionLead:
      "配对轻量托盘应用，在本机执行受治理的文件动作。下载指向 GitHub Releases；可随时在此解绑。",
    statusNotPaired: "尚未配对 — 请安装应用并在托盘界面输入 6 位配对码。",
    statusAwaitingConnector: "已登记配对 — 请在桌面端打开 Connector 完成连接。",
    statusConnected: "已连接",
    statusDisconnected: "已配对但离线 — 请在电脑上保持 Connector 运行。",
    mobileOnlyHint: "桌面 Connector 的下载与配对请在桌面浏览器操作。",
    downloadMac: "下载 macOS 版",
    downloadWin: "下载 Windows 版",
    releasesNote: "请在 Releases 中选择适合平台的最新安装包。",
    pairNewDevice: "配对新设备",
    listRefresh: "刷新",
    listTitle: "已配对设备",
    emptyDevices: "尚无设备。",
    loadError: "无法加载桌面设备列表。",
    colDevice: "设备",
    colPairedAt: "配对时间",
    colLastSeen: "最近在线",
    colStatus: "状态",
    online: "在线",
    offline: "离线",
    pendingPair: "等待应用",
    unpair: "解绑",
    unpairing: "解绑中…",
    pairingDialogTitle: "配对桌面 Connector",
    pairingDialogLead: "在电脑上打开 Desktop Connector，在托盘界面找到 6 位配对码，并在下方输入。",
    pairingCodeLabel: "6 位配对码",
    pairingSubmit: "提交配对",
    pairingSubmitting: "配对中…",
    pairingSuccess: "已登记配对，请在桌面应用完成连接。",
    pairingInvalid: "请输入 6 位数字。",
    pairingFailed: "配对失败。",
    pairingCancel: "取消",
    desktopTrustLead: "信任策略：桌面文件操作",
    desktopTrustPathLine: "{{action}} · {{path}}",
    desktopActionFileList: "列出文件",
    desktopActionFileRead: "读取文件",
    desktopActionFileWrite: "写入文件",
    desktopWriteConfirmLoading: "确认中…",
    desktopWriteConfirmFailed: "无法确认写入，请重试。",
  },
};

export function getW22DesktopConnectorCopy(locale: Locale): W22DesktopConnectorCopy {
  return W22_DESKTOP_CONNECTOR[locale];
}

/** W-16：WebSocket 实时、已读回执、Typing、Presence */
export type W16RealtimeCopy = {
  msgDelivered: string;
  msgRead: string;
  typingSingle: string;
  typingMulti: string;
  presenceOnline: string;
  presenceAway: string;
  presenceOffline: string;
};

const W16_REALTIME: Record<Locale, W16RealtimeCopy> = {
  en: {
    msgDelivered: "Delivered",
    msgRead: "Read",
    typingSingle: "{{name}} is typing…",
    typingMulti: "Several people are typing…",
    presenceOnline: "Online",
    presenceAway: "Away",
    presenceOffline: "Offline",
  },
  "zh-Hant": {
    msgDelivered: "已送達",
    msgRead: "已讀",
    typingSingle: "{{name}} 正在輸入…",
    typingMulti: "多人正在輸入…",
    presenceOnline: "在線",
    presenceAway: "離開",
    presenceOffline: "離線",
  },
  "zh-Hans": {
    msgDelivered: "已送达",
    msgRead: "已读",
    typingSingle: "{{name}} 正在输入…",
    typingMulti: "多人正在输入…",
    presenceOnline: "在线",
    presenceAway: "离开",
    presenceOffline: "离线",
  },
};

export function getW16RealtimeCopy(locale: Locale): W16RealtimeCopy {
  return W16_REALTIME[locale];
}

/** W-8：通知中心（顶栏铃铛、列表、全部已读） */
export type W8NotificationCenterCopy = {
  bellAria: string;
  panelTitle: string;
  markAllRead: string;
  markingAll: string;
  empty: string;
  loadError: string;
  retry: string;
  unreadBadgeSuffix: string;
  justNow: string;
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
  typeReviewRequired: string;
  typeTaskCompleted: string;
  typeConnectorExpiring: string;
  typeQuotaWarning: string;
  typeAgentStatus: string;
  typeLegacy: string;
};

const W8_NOTIFICATION_CENTER: Record<Locale, W8NotificationCenterCopy> = {
  en: {
    bellAria: "Notifications",
    panelTitle: "Notifications",
    markAllRead: "Mark all as read",
    markingAll: "Updating…",
    empty: "You are all caught up.",
    loadError: "Could not load notifications.",
    retry: "Retry",
    unreadBadgeSuffix: "unread",
    justNow: "Just now",
    minutesAgo: "{{n}} min ago",
    hoursAgo: "{{n}} h ago",
    daysAgo: "{{n}} d ago",
    typeReviewRequired: "Approval required",
    typeTaskCompleted: "Task update",
    typeConnectorExpiring: "Connector",
    typeQuotaWarning: "Quota",
    typeAgentStatus: "Agent status",
    typeLegacy: "Notice",
  },
  "zh-Hant": {
    bellAria: "通知",
    panelTitle: "通知",
    markAllRead: "全部標為已讀",
    markingAll: "更新中…",
    empty: "目前沒有新通知。",
    loadError: "無法載入通知。",
    retry: "重試",
    unreadBadgeSuffix: "則未讀",
    justNow: "剛剛",
    minutesAgo: "{{n}} 分鐘前",
    hoursAgo: "{{n}} 小時前",
    daysAgo: "{{n}} 天前",
    typeReviewRequired: "待審批",
    typeTaskCompleted: "任務更新",
    typeConnectorExpiring: "連接器",
    typeQuotaWarning: "配額",
    typeAgentStatus: "Agent 狀態",
    typeLegacy: "通知",
  },
  "zh-Hans": {
    bellAria: "通知",
    panelTitle: "通知",
    markAllRead: "全部标为已读",
    markingAll: "更新中…",
    empty: "目前没有新通知。",
    loadError: "无法加载通知。",
    retry: "重试",
    unreadBadgeSuffix: "条未读",
    justNow: "刚刚",
    minutesAgo: "{{n}} 分钟前",
    hoursAgo: "{{n}} 小时前",
    daysAgo: "{{n}} 天前",
    typeReviewRequired: "待审批",
    typeTaskCompleted: "任务更新",
    typeConnectorExpiring: "连接器",
    typeQuotaWarning: "配额",
    typeAgentStatus: "Agent 状态",
    typeLegacy: "通知",
  },
};

export function getW8NotificationCenterCopy(locale: Locale): W8NotificationCenterCopy {
  return W8_NOTIFICATION_CENTER[locale];
}

/** W-9：聊天首屏空状态（推荐 Agent、连接器/订阅弱提示） */
export type W9FirstRunCopy = {
  title: string;
  lead: string;
  inputHint: string;
  recommendedHeading: string;
  addAgentLoading: string;
  guestNoAdd: string;
  readOnlyHint: string;
  noConnectorHint: string;
  connectorUnknownHint: string;
  subscriptionHint: string;
  connectorCta: string;
  browseDirectory: string;
};

const W9_FIRST_RUN: Record<Locale, W9FirstRunCopy> = {
  en: {
    title: "Start your first conversation",
    lead:
      "Type below in plain language—no connectors or SaaS setup required. Pick a suggested Agent to join this chat, or send a message and we will route it when Agents are available.",
    inputHint: "Your message goes in the box below.",
    recommendedHeading: "Suggested Agents",
    addAgentLoading: "Adding…",
    guestNoAdd: "Guests cannot add Agents to a chat.",
    readOnlyHint: "This conversation is read-only; open an active chat to add Agents.",
    noConnectorHint: "No connectors linked yet—optional. Connect calendars or tools when you need them.",
    connectorUnknownHint: "Connectors are optional; manage them anytime in settings.",
    subscriptionHint: "Tasks and subscriptions are optional—you can explore them later from the sidebar.",
    connectorCta: "Manage connectors",
    browseDirectory: "Browse full Agent Hub",
  },
  "zh-Hant": {
    title: "開始你的第一則對話",
    lead:
      "直接用自然語言在下方輸入——無需連接器或 SaaS 綁定。可點選建議 Agent 加入此對話，或先送出訊息，待有可用的 Agent 時再由平台路由。",
    inputHint: "訊息請輸入在最下方的輸入框。",
    recommendedHeading: "建議 Agent",
    addAgentLoading: "加入中…",
    guestNoAdd: "訪客無法在此對話加入 Agent。",
    readOnlyHint: "此對話為唯讀；請在可寫入的對話中加入 Agent。",
    noConnectorHint: "尚未連結任何連接器——可選。需要日曆或工具時再到設定中連接即可。",
    connectorUnknownHint: "連接器為可選項目；可隨時在設定中管理。",
    subscriptionHint: "任務與訂閱為可選功能——之後可從側欄再探索。",
    connectorCta: "管理連接器",
    browseDirectory: "瀏覽完整智能體中心",
  },
  "zh-Hans": {
    title: "开始你的第一条对话",
    lead:
      "在下方用自然语言直接输入——无需连接器或 SaaS 绑定。可点选建议 Agent 加入本会话，或先发送消息，待有可用 Agent 时再由平台路由。",
    inputHint: "请在底部输入框撰写消息。",
    recommendedHeading: "推荐 Agent",
    addAgentLoading: "添加中…",
    guestNoAdd: "访客无法在本会话添加 Agent。",
    readOnlyHint: "本会话为只读；请在可写入的会话中添加 Agent。",
    noConnectorHint: "尚未关联连接器——可选。需要日历或工具时再到设置中连接即可。",
    connectorUnknownHint: "连接器为可选项；可随时在设置中管理。",
    subscriptionHint: "任务与订阅为可选能力——之后可从侧栏再探索。",
    connectorCta: "管理连接器",
    browseDirectory: "浏览完整智能体中心",
  },
};

export function getW9FirstRunCopy(locale: Locale): W9FirstRunCopy {
  return W9_FIRST_RUN[locale];
}

/** W-10：设置套件导航与各子页 */
export type W10SettingsSuiteCopy = {
  suiteTitle: string;
  suiteLead: string;
  navAccount: string;
  navNotifications: string;
  navConnectors: string;
  navUsage: string;
  navDataPrivacy: string;
  navSpaceMembers: string;
  /** W-20 */
  navScheduledTasks: string;
  accountTitle: string;
  accountLead: string;
  profileSection: string;
  userIdLabel: string;
  emailLabel: string;
  roleLabel: string;
  roleUnset: string;
  securitySection: string;
  securityLead: string;
  sessionSection: string;
  signOut: string;
  devSignInPlaceholder: string;
  devSignIn: string;
  signedInAs: string;
  loadingIdentity: string;
  notificationsTitle: string;
  notificationsLead: string;
  channelInApp: string;
  channelEmail: string;
  strategyLabel: string;
  strategyExceptions: string;
  strategyAllRuns: string;
  savePreferences: string;
  saving: string;
  saved: string;
  saveFailed: string;
  connectorsTitle: string;
  connectorsLead: string;
  connectorsGovernanceLink: string;
  connectorProvider: string;
  connectorScope: string;
  connectorStatus: string;
  connectorExpires: string;
  connectorRevoke: string;
  connectorRevoking: string;
  connectorEmpty: string;
  connectorLoadError: string;
  statusActive: string;
  statusRevoked: string;
  usageTitle: string;
  usageLead: string;
  usageWindowNote: string;
  usageLoadError: string;
  quotaSection: string;
  quotaDeployments: string;
  quotaTaskRuns: string;
  quotaUsedOf: string;
  quotaAlert80: string;
  quotaAlert100: string;
  quotaUpgradeHint: string;
  activitySection: string;
  activityInvocations: string;
  activityConnectorCloud: string;
  activityAuditTotal: string;
  activityNoLimitBar: string;
  dataTitle: string;
  dataLead: string;
  dataPrivacySection: string;
  dataPrivacyBody: string;
  dataExportNote: string;
  deleteSection: string;
  deleteLead: string;
  deleteCoolingNote: string;
  deleteOpenMail: string;
  deleteMailSubject: string;
  deleteConfirmLabel: string;
  deleteConfirmPlaceholder: string;
  deleteConfirmMismatch: string;
  pleaseSignIn: string;
  listLoading: string;
  /** W-19：邮件偏好（E-16） */
  emailSectionTitle: string;
  emailSectionLead: string;
  emailMasterLabel: string;
  emailTypesLabel: string;
  emailTypeTaskCompleted: string;
  emailTypeHumanReview: string;
  emailTypeQuotaWarning: string;
  emailTypeAgentStatus: string;
  emailTypeConnectorExpired: string;
  emailTypeSpaceInvitation: string;
  emailLocaleLabel: string;
  emailLocaleZh: string;
  emailLocaleEn: string;
  emailLocaleJa: string;
  emailTypesInvalid: string;
};

const W10_SETTINGS_SUITE: Record<Locale, W10SettingsSuiteCopy> = {
  en: {
    suiteTitle: "Settings",
    suiteLead: "Account, notifications, connectors, usage, and data in one place.",
    navAccount: "Account",
    navNotifications: "Notifications",
    navConnectors: "Connectors",
    navUsage: "Usage & quotas",
    navDataPrivacy: "Data & privacy",
    navSpaceMembers: "Space & members",
    navScheduledTasks: "Scheduled tasks",
    accountTitle: "Account",
    accountLead: "Profile and session for this workspace.",
    profileSection: "Profile",
    userIdLabel: "User ID",
    emailLabel: "Email",
    roleLabel: "Role",
    roleUnset: "—",
    securitySection: "Security",
    securityLead: "Passwords and SSO are managed by your identity provider. Use Sign out on this device if you share it.",
    sessionSection: "Session",
    signOut: "Sign out",
    devSignInPlaceholder: "Enter user id",
    devSignIn: "Sign in",
    signedInAs: "Signed in as",
    loadingIdentity: "Loading identity…",
    notificationsTitle: "Notifications",
    notificationsLead: "Choose how we reach you about tasks, approvals, and quota warnings.",
    channelInApp: "In-app",
    channelEmail: "Email",
    strategyLabel: "Detail level",
    strategyExceptions: "Only exceptions",
    strategyAllRuns: "All runs",
    savePreferences: "Save preferences",
    saving: "Saving…",
    saved: "Saved.",
    saveFailed: "Could not save.",
    connectorsTitle: "Connectors",
    connectorsLead: "Cloud and device authorizations linked to your account. Revoke access here when you no longer need it.",
    connectorsGovernanceLink: "Open connector governance demo",
    connectorProvider: "Provider",
    connectorScope: "Scope",
    connectorStatus: "Status",
    connectorExpires: "Expires",
    connectorRevoke: "Revoke",
    connectorRevoking: "Revoking…",
    connectorEmpty: "No active connector authorizations.",
    connectorLoadError: "Could not load connectors.",
    statusActive: "Active",
    statusRevoked: "Revoked",
    usageTitle: "Usage & quotas",
    usageLead: "Rolling usage from audit events and plan quotas for key features.",
    usageWindowNote: "Figures below use the window returned by the API (default 30 days).",
    usageLoadError: "Could not load usage.",
    quotaSection: "Plan quotas",
    quotaDeployments: "Agent deployments",
    quotaTaskRuns: "Subscription task runs",
    quotaUsedOf: "{{used}} / {{limit}} used",
    quotaAlert80: "Approaching limit (80%)",
    quotaAlert100: "At or over limit",
    quotaUpgradeHint: "When limits are reached, upgrade paths will appear here.",
    activitySection: "Activity (approximate)",
    activityInvocations: "Invocation-related audit events",
    activityConnectorCloud: "Connector cloud actions (completed + failed)",
    activityAuditTotal: "Total audit events in window",
    activityNoLimitBar: "No fixed quota — shown as activity only.",
    dataTitle: "Data & privacy",
    dataLead: "How we treat your workspace data and how to request account deletion.",
    dataPrivacySection: "Privacy",
    dataPrivacyBody:
      "Conversation content is scoped to your Space and the Agents you invoke. Receipts and audit trails help you verify what happened. For regional or contractual questions, contact support.",
    dataExportNote: "Full data export may require a support-assisted process in early access.",
    deleteSection: "Delete account",
    deleteLead:
      "Account deletion is subject to legal retention and fraud checks. You can start a request by email; our team will confirm identity and any cooling-off period.",
    deleteCoolingNote: "Immediate self-service deletion is not enabled in this build.",
    deleteOpenMail: "Email support to start deletion",
    deleteMailSubject: "GaiaLynk account deletion request",
    deleteConfirmLabel: "Type DELETE to enable the email button",
    deleteConfirmPlaceholder: "DELETE",
    deleteConfirmMismatch: "Type DELETE exactly to continue.",
    pleaseSignIn: "Sign in to manage these settings.",
    listLoading: "Loading…",
    emailSectionTitle: "Email delivery",
    emailSectionLead:
      "Control whether we send email for important events. In-app notifications are managed separately above.",
    emailMasterLabel: "Send email for the selected types",
    emailTypesLabel: "Email types",
    emailTypeTaskCompleted: "Task completed",
    emailTypeHumanReview: "Human review required",
    emailTypeQuotaWarning: "Quota warning",
    emailTypeAgentStatus: "Agent status change",
    emailTypeConnectorExpired: "Connector expired or revoked",
    emailTypeSpaceInvitation: "Space invitation",
    emailLocaleLabel: "Email language (zh / en / ja)",
    emailLocaleZh: "Chinese",
    emailLocaleEn: "English",
    emailLocaleJa: "Japanese",
    emailTypesInvalid: "When email is on, keep at least one type selected.",
  },
  "zh-Hant": {
    suiteTitle: "設定",
    suiteLead: "在同一處管理帳戶、通知、連接器、用量與資料。",
    navAccount: "帳戶",
    navNotifications: "通知",
    navConnectors: "連接器",
    navUsage: "用量與配額",
    navDataPrivacy: "資料與隱私",
    navSpaceMembers: "Space 與成員",
    navScheduledTasks: "排程任務",
    accountTitle: "帳戶",
    accountLead: "此工作區的個人資料與工作階段。",
    profileSection: "個人資料",
    userIdLabel: "使用者 ID",
    emailLabel: "電子郵件",
    roleLabel: "角色",
    roleUnset: "—",
    securitySection: "安全",
    securityLead: "密碼與 SSO 由您的身分提供者管理。若與他人共用裝置，請使用登出。",
    sessionSection: "工作階段",
    signOut: "登出",
    devSignInPlaceholder: "輸入 user id",
    devSignIn: "登入",
    signedInAs: "目前登入",
    loadingIdentity: "載入身分中…",
    notificationsTitle: "通知",
    notificationsLead: "選擇我們如何通知您：任務、審批與配額警示。",
    channelInApp: "應用內",
    channelEmail: "電子郵件",
    strategyLabel: "細節程度",
    strategyExceptions: "僅例外",
    strategyAllRuns: "所有執行",
    savePreferences: "儲存偏好",
    saving: "儲存中…",
    saved: "已儲存。",
    saveFailed: "無法儲存。",
    connectorsTitle: "連接器",
    connectorsLead: "與您帳戶連結的雲端或裝置授權。若不再需要，可在此撤銷。",
    connectorsGovernanceLink: "開啟連接器治理示範",
    connectorProvider: "提供者",
    connectorScope: "範圍",
    connectorStatus: "狀態",
    connectorExpires: "到期",
    connectorRevoke: "撤銷",
    connectorRevoking: "撤銷中…",
    connectorEmpty: "目前沒有連接器授權。",
    connectorLoadError: "無法載入連接器。",
    statusActive: "有效",
    statusRevoked: "已撤銷",
    usageTitle: "用量與配額",
    usageLead: "以稽核事件的滾動視窗與方案配額呈現。",
    usageWindowNote: "下方數字依 API 回傳的視窗（預設 30 天）。",
    usageLoadError: "無法載入用量。",
    quotaSection: "方案配額",
    quotaDeployments: "Agent 部署",
    quotaTaskRuns: "訂閱任務執行",
    quotaUsedOf: "已用 {{used}} / {{limit}}",
    quotaAlert80: "接近上限（80%）",
    quotaAlert100: "已達或超過上限",
    quotaUpgradeHint: "達上限時，升級方案入口將顯示於此。",
    activitySection: "活動（約略）",
    activityInvocations: "與呼叫相關的稽核事件",
    activityConnectorCloud: "連接器雲端動作（完成 + 失敗）",
    activityAuditTotal: "視窗內稽核事件總數",
    activityNoLimitBar: "無固定配額，僅顯示活動量。",
    dataTitle: "資料與隱私",
    dataLead: "資料處理方式與如何申請刪除帳戶。",
    dataPrivacySection: "隱私",
    dataPrivacyBody:
      "對話內容僅限於您的 Space 與您呼叫的 Agent。收據與稽核軌跡協助您驗證發生了什麼。若涉及法遵或區域要求，請聯絡支援。",
    dataExportNote: "完整資料匯出在早期存取階段可能需要支援團隊協助。",
    deleteSection: "刪除帳戶",
    deleteLead:
      "刪除帳戶須符合法遵保留與防詐審核。您可透過電子郵件發起申請；團隊將確認身分與是否設有冷静期。",
    deleteCoolingNote: "此版本未開啟立即自助刪除。",
    deleteOpenMail: "寄信給支援以開始刪除流程",
    deleteMailSubject: "GaiaLynk 帳戶刪除申請",
    deleteConfirmLabel: "輸入 DELETE 以啟用寄信按鈕",
    deleteConfirmPlaceholder: "DELETE",
    deleteConfirmMismatch: "請完整輸入 DELETE。",
    pleaseSignIn: "請先登入以管理此設定。",
    listLoading: "載入中…",
    emailSectionTitle: "電子郵件寄送",
    emailSectionLead: "控制是否以電子郵件通知重要事件；應用內通知請使用上方管道設定。",
    emailMasterLabel: "依下列類型寄送電子郵件",
    emailTypesLabel: "郵件類型",
    emailTypeTaskCompleted: "任務完成",
    emailTypeHumanReview: "需要人工審核",
    emailTypeQuotaWarning: "配額警示",
    emailTypeAgentStatus: "Agent 狀態變更",
    emailTypeConnectorExpired: "連接器過期或撤銷",
    emailTypeSpaceInvitation: "Space 邀請",
    emailLocaleLabel: "郵件語言（zh / en / ja）",
    emailLocaleZh: "中文",
    emailLocaleEn: "英文",
    emailLocaleJa: "日文",
    emailTypesInvalid: "開啟郵件時，請至少保留一種類型。",
  },
  "zh-Hans": {
    suiteTitle: "设置",
    suiteLead: "在同一处管理账户、通知、连接器、用量与数据。",
    navAccount: "账户",
    navNotifications: "通知",
    navConnectors: "连接器",
    navUsage: "用量与配额",
    navDataPrivacy: "数据与隐私",
    navSpaceMembers: "Space 与成员",
    navScheduledTasks: "定时任务",
    accountTitle: "账户",
    accountLead: "此工作区的个人资料与会话。",
    profileSection: "个人资料",
    userIdLabel: "用户 ID",
    emailLabel: "邮箱",
    roleLabel: "角色",
    roleUnset: "—",
    securitySection: "安全",
    securityLead: "密码与 SSO 由您的身份提供商管理。若与他人共用设备，请使用退出登录。",
    sessionSection: "会话",
    signOut: "退出登录",
    devSignInPlaceholder: "输入 user id",
    devSignIn: "登录",
    signedInAs: "当前登录",
    loadingIdentity: "加载身份中…",
    notificationsTitle: "通知",
    notificationsLead: "选择我们如何通知您：任务、审批与配额告警。",
    channelInApp: "应用内",
    channelEmail: "邮件",
    strategyLabel: "详细程度",
    strategyExceptions: "仅例外",
    strategyAllRuns: "所有运行",
    savePreferences: "保存偏好",
    saving: "保存中…",
    saved: "已保存。",
    saveFailed: "无法保存。",
    connectorsTitle: "连接器",
    connectorsLead: "与账户关联的云或设备授权。若不再需要，可在此撤销。",
    connectorsGovernanceLink: "打开连接器治理演示",
    connectorProvider: "提供方",
    connectorScope: "范围",
    connectorStatus: "状态",
    connectorExpires: "过期",
    connectorRevoke: "撤销",
    connectorRevoking: "撤销中…",
    connectorEmpty: "暂无连接器授权。",
    connectorLoadError: "无法加载连接器。",
    statusActive: "有效",
    statusRevoked: "已撤销",
    usageTitle: "用量与配额",
    usageLead: "以审计事件的滚动窗口与方案配额展示。",
    usageWindowNote: "下方数字以 API 返回的窗口为准（默认 30 天）。",
    usageLoadError: "无法加载用量。",
    quotaSection: "方案配额",
    quotaDeployments: "Agent 部署",
    quotaTaskRuns: "订阅任务运行",
    quotaUsedOf: "已用 {{used}} / {{limit}}",
    quotaAlert80: "接近上限（80%）",
    quotaAlert100: "已达或超过上限",
    quotaUpgradeHint: "达到上限时，升级入口将显示于此。",
    activitySection: "活动（近似）",
    activityInvocations: "与调用相关的审计事件",
    activityConnectorCloud: "连接器云动作（完成 + 失败）",
    activityAuditTotal: "窗口内审计事件总数",
    activityNoLimitBar: "无固定配额，仅显示活动量。",
    dataTitle: "数据与隐私",
    dataLead: "数据处理说明与如何申请删除账户。",
    dataPrivacySection: "隐私",
    dataPrivacyBody:
      "会话内容限于您的 Space 与您调用的 Agent。收据与审计轨迹帮助您核对发生了什么。若涉及合规或区域要求，请联系支持。",
    dataExportNote: "完整数据导出在早期访问阶段可能需要支持团队协助。",
    deleteSection: "删除账户",
    deleteLead:
      "删除账户需符合法定保留与反欺诈审核。您可通过邮件发起申请；团队将确认身份与是否设有冷静期。",
    deleteCoolingNote: "本版本未启用立即自助删除。",
    deleteOpenMail: "发邮件给支持以开始删除流程",
    deleteMailSubject: "GaiaLynk 账户删除申请",
    deleteConfirmLabel: "输入 DELETE 以启用发信按钮",
    deleteConfirmPlaceholder: "DELETE",
    deleteConfirmMismatch: "请完整输入 DELETE。",
    pleaseSignIn: "请先登录以管理此设置。",
    listLoading: "加载中…",
    emailSectionTitle: "邮件投递",
    emailSectionLead: "控制是否通过邮件通知重要事件；应用内通知请使用上方渠道设置。",
    emailMasterLabel: "按下列类型发送邮件",
    emailTypesLabel: "邮件类型",
    emailTypeTaskCompleted: "任务完成",
    emailTypeHumanReview: "需要人工审核",
    emailTypeQuotaWarning: "配额告警",
    emailTypeAgentStatus: "Agent 状态变更",
    emailTypeConnectorExpired: "连接器过期或撤销",
    emailTypeSpaceInvitation: "Space 邀请",
    emailLocaleLabel: "邮件语言（zh / en / ja）",
    emailLocaleZh: "中文",
    emailLocaleEn: "英文",
    emailLocaleJa: "日文",
    emailTypesInvalid: "开启邮件时，请至少保留一种类型。",
  },
};

export function getW10SettingsSuiteCopy(locale: Locale): W10SettingsSuiteCopy {
  return W10_SETTINGS_SUITE[locale];
}

/** W-17：Notion 连接器设置 + 会话内收据卡片 */
export type W17NotionConnectorCopy = {
  cardTitle: string;
  cardDescription: string;
  connect: string;
  disconnect: string;
  connected: string;
  notConnected: string;
  workspaceLabel: string;
  workspaceFallback: string;
  connectedAtLabel: string;
  oauthOpening: string;
  oauthPopupBlocked: string;
  oauthFailed: string;
  revokeFailed: string;
};

export type W17NotionReceiptCardCopy = {
  badge: string;
  actionLabel: string;
  targetLabel: string;
  statusLabel: string;
  statusOk: string;
  statusError: string;
  statusExpired: string;
  receiptRefLabel: string;
  actionSearch: string;
  actionListDatabases: string;
  actionQuery: string;
  actionCreatePage: string;
  actionUnknown: string;
};

const W17_NOTION: Record<Locale, { connector: W17NotionConnectorCopy; receipt: W17NotionReceiptCardCopy }> = {
  en: {
    connector: {
      cardTitle: "Notion",
      cardDescription: "Search, query, and create pages in your Notion workspace with governed receipts.",
      connect: "Connect Notion",
      disconnect: "Disconnect",
      connected: "Connected",
      notConnected: "Not connected",
      workspaceLabel: "Workspace",
      workspaceFallback: "Notion workspace",
      connectedAtLabel: "Connected",
      oauthOpening: "Opening Notion…",
      oauthPopupBlocked: "Allow pop-ups for this site to finish Notion sign-in.",
      oauthFailed: "Notion authorization did not complete.",
      revokeFailed: "Could not disconnect Notion.",
    },
    receipt: {
      badge: "Notion",
      actionLabel: "Action",
      targetLabel: "Target",
      statusLabel: "Status",
      statusOk: "Success",
      statusError: "Failed",
      statusExpired: "Reconnect required",
      receiptRefLabel: "Receipt",
      actionSearch: "Search",
      actionListDatabases: "List databases",
      actionQuery: "Query database",
      actionCreatePage: "Create page",
      actionUnknown: "Connector action",
    },
  },
  "zh-Hant": {
    connector: {
      cardTitle: "Notion",
      cardDescription: "在您的 Notion 工作區搜尋、查詢與建立頁面，並產生可追溯收據。",
      connect: "連接 Notion",
      disconnect: "斷開",
      connected: "已連接",
      notConnected: "未連接",
      workspaceLabel: "工作區",
      workspaceFallback: "Notion 工作區",
      connectedAtLabel: "連接時間",
      oauthOpening: "正在開啟 Notion…",
      oauthPopupBlocked: "請允許此網站的彈出視窗以完成 Notion 登入。",
      oauthFailed: "Notion 授權未完成。",
      revokeFailed: "無法斷開 Notion。",
    },
    receipt: {
      badge: "Notion",
      actionLabel: "操作",
      targetLabel: "目標資料庫／資源",
      statusLabel: "狀態",
      statusOk: "成功",
      statusError: "失敗",
      statusExpired: "需重新授權",
      receiptRefLabel: "收據",
      actionSearch: "搜尋",
      actionListDatabases: "列出資料庫",
      actionQuery: "查詢資料庫",
      actionCreatePage: "建立頁面",
      actionUnknown: "連接器動作",
    },
  },
  "zh-Hans": {
    connector: {
      cardTitle: "Notion",
      cardDescription: "在您的 Notion 工作区搜索、查询与创建页面，并生成可追溯收据。",
      connect: "连接 Notion",
      disconnect: "断开",
      connected: "已连接",
      notConnected: "未连接",
      workspaceLabel: "工作区",
      workspaceFallback: "Notion 工作区",
      connectedAtLabel: "连接时间",
      oauthOpening: "正在打开 Notion…",
      oauthPopupBlocked: "请允许此网站的弹出窗口以完成 Notion 登录。",
      oauthFailed: "Notion 授权未完成。",
      revokeFailed: "无法断开 Notion。",
    },
    receipt: {
      badge: "Notion",
      actionLabel: "操作",
      targetLabel: "目标数据库／资源",
      statusLabel: "状态",
      statusOk: "成功",
      statusError: "失败",
      statusExpired: "需重新授权",
      receiptRefLabel: "收据",
      actionSearch: "搜索",
      actionListDatabases: "列出数据库",
      actionQuery: "查询数据库",
      actionCreatePage: "创建页面",
      actionUnknown: "连接器动作",
    },
  },
};

export function getW17NotionConnectorCopy(locale: Locale): W17NotionConnectorCopy {
  return W17_NOTION[locale].connector;
}

export function getW17NotionReceiptCardCopy(locale: Locale): W17NotionReceiptCardCopy {
  return W17_NOTION[locale].receipt;
}

/** W-13：Provider 控制台 / 我的 Agent（对齐 E-7 上架字段） */
export type W13ProviderPortalCopy = {
  title: string;
  providerRoleRequired: string;
  becomeProviderHint: string;
  openOnboarding: string;
  docsMinimalLinkLabel: string;
  newAgent: string;
  selectAgent: string;
  empty: string;
  loading: string;
  loadError: string;
  forbidden: string;
  statusLabel: string;
  statusPending: string;
  statusActive: string;
  statusDeprecated: string;
  reviewWorkflowNote: string;
  healthErrorHint: string;
  sectionListing: string;
  sectionListingLead: string;
  sectionEndpoints: string;
  sectionEndpointsLead: string;
  sectionOps: string;
  sectionStats: string;
  sectionStatsLead: string;
  maxConcurrent: string;
  queueBehavior: string;
  queue: string;
  fastFail: string;
  timeoutMs: string;
  timeoutHint: string;
  supportsScheduled: string;
  memoryTier: string;
  memoryNone: string;
  memorySession: string;
  memoryUserIsolated: string;
  saveListing: string;
  savingListing: string;
  listingSaved: string;
  listingSaveFailed: string;
  primaryUrl: string;
  addEndpoint: string;
  endpointUrlLabel: string;
  endpointUrlPlaceholder: string;
  removeEndpoint: string;
  endpointEmpty: string;
  runHealthCheck: string;
  healthChecking: string;
  testCall: string;
  testMessagePlaceholder: string;
  testCalling: string;
  submitReview: string;
  submitting: string;
  submitSuccess: string;
  statsCompleted: string;
  statsFailed: string;
  statsDenied: string;
  statsNeedConfirmation: string;
  statsSuccessRate: string;
  statsReputation: string;
  statsTotalInvocations: string;
  signInRequired: string;
  signInButton: string;
};

const W13_PROVIDER_PORTAL: Record<Locale, W13ProviderPortalCopy> = {
  en: {
    title: "My Agents",
    providerRoleRequired: "Provider role is required to register and manage Agents.",
    becomeProviderHint: "Sign in with an account that has the Provider role, or complete Provider onboarding after choosing Provider at registration.",
    openOnboarding: "Open Provider onboarding",
    docsMinimalLinkLabel: "15-minute minimal listing guide (docs)",
    newAgent: "Register new Agent",
    selectAgent: "Select an Agent",
    empty: "You have not registered any Agents yet.",
    loading: "Loading…",
    loadError: "Could not load your Agents.",
    forbidden: "You do not have permission to list Agents (Provider only).",
    statusLabel: "Listing review",
    statusPending: "Pending review",
    statusActive: "Approved / live",
    statusDeprecated: "Deprecated or delisted",
    reviewWorkflowNote:
      "Fine-grained states such as “needs more materials” may arrive via notifications; this console shows the server status field (pending_review / active / deprecated).",
    healthErrorHint: "Last health check error",
    sectionListing: "Gateway & listing fields",
    sectionListingLead: "Aligned with platform §5.1.9 / E-7: concurrency, queue policy, timeout, scheduling, memory tier.",
    sectionEndpoints: "Instance URLs",
    sectionEndpointsLead: "Primary A2A URL is set at registration. Add more homogenous endpoints for pooling and failover.",
    sectionOps: "Connectivity & review",
    sectionStats: "Usage snapshot",
    sectionStatsLead: "Approximate counts from recent audit events (not billing-grade).",
    maxConcurrent: "Max concurrent invocations",
    queueBehavior: "When at capacity",
    queue: "Queue (FIFO)",
    fastFail: "Fast fail (429)",
    timeoutMs: "Timeout (ms)",
    timeoutHint: "Leave empty to use platform default.",
    supportsScheduled: "Supports scheduled runs",
    memoryTier: "Memory tier",
    memoryNone: "None (stateless)",
    memorySession: "Session-scoped",
    memoryUserIsolated: "User-isolated",
    saveListing: "Save listing fields",
    savingListing: "Saving…",
    listingSaved: "Listing fields saved.",
    listingSaveFailed: "Could not save listing fields.",
    primaryUrl: "Primary endpoint (registration)",
    addEndpoint: "Add endpoint URL",
    endpointUrlLabel: "HTTPS URL",
    endpointUrlPlaceholder: "https://your-agent.example/a2a",
    removeEndpoint: "Remove",
    endpointEmpty: "No extra endpoints; platform uses the primary URL.",
    runHealthCheck: "Run health check",
    healthChecking: "Checking…",
    testCall: "Send test call",
    testMessagePlaceholder: "Optional message (default platform text if empty)",
    testCalling: "Calling…",
    submitReview: "Submit for listing / go live",
    submitting: "Submitting…",
    submitSuccess: "Submitted. Status updated when the server processes review (staging may auto-approve).",
    statsCompleted: "Completed",
    statsFailed: "Failed",
    statsDenied: "Denied",
    statsNeedConfirmation: "Need confirmation",
    statsSuccessRate: "Success rate (approx.)",
    statsReputation: "Reputation grade",
    statsTotalInvocations: "Invocation-related events (window)",
    signInRequired: "Sign in to manage your Agents.",
    signInButton: "Sign in",
  },
  "zh-Hant": {
    title: "我的 Agent",
    providerRoleRequired: "註冊與管理 Agent 需要 Provider 角色。",
    becomeProviderHint: "請以具 Provider 角色的帳戶登入，或在註冊時選擇 Provider 後完成入門流程。",
    openOnboarding: "開啟 Provider 入門",
    docsMinimalLinkLabel: "15 分鐘最小上架指南（文件）",
    newAgent: "註冊新 Agent",
    selectAgent: "選擇 Agent",
    empty: "尚未註冊任何 Agent。",
    loading: "載入中…",
    loadError: "無法載入你的 Agent 列表。",
    forbidden: "無權列出 Agent（僅 Provider）。",
    statusLabel: "上架審核",
    statusPending: "待審核",
    statusActive: "已通過 / 已上架",
    statusDeprecated: "已下架或棄用",
    reviewWorkflowNote:
      "「需補材」等細粒度狀態可能透過通知傳達；此處顯示伺服器狀態欄位（pending_review / active / deprecated）。",
    healthErrorHint: "上次健康檢查錯誤",
    sectionListing: "網關與上架欄位",
    sectionListingLead: "對齊平台 §5.1.9 / E-7：併發、排隊策略、逾時、排程、記憶層。",
    sectionEndpoints: "實例 URL",
    sectionEndpointsLead: "註冊時設定的主要 A2A URL。可新增同構端點以供池化與故障轉移。",
    sectionOps: "連通性與審核",
    sectionStats: "用量快照",
    sectionStatsLead: "來自近期稽核事件的約略統計（非計費級）。",
    maxConcurrent: "最大併發調用數",
    queueBehavior: "容量滿時",
    queue: "排隊（FIFO）",
    fastFail: "快速失敗（429）",
    timeoutMs: "逾時（毫秒）",
    timeoutHint: "留空則使用平台預設。",
    supportsScheduled: "支援排程執行",
    memoryTier: "記憶層級",
    memoryNone: "無（無狀態）",
    memorySession: "工作階段範圍",
    memoryUserIsolated: "使用者隔離",
    saveListing: "儲存上架欄位",
    savingListing: "儲存中…",
    listingSaved: "已儲存上架欄位。",
    listingSaveFailed: "無法儲存上架欄位。",
    primaryUrl: "主要端點（註冊時）",
    addEndpoint: "新增端點 URL",
    endpointUrlLabel: "HTTPS URL",
    endpointUrlPlaceholder: "https://your-agent.example/a2a",
    removeEndpoint: "移除",
    endpointEmpty: "尚無額外端點；平台使用主要 URL。",
    runHealthCheck: "執行健康檢查",
    healthChecking: "檢查中…",
    testCall: "發送測試調用",
    testMessagePlaceholder: "選填訊息（留空則用平台預設文案）",
    testCalling: "調用中…",
    submitReview: "提交上架 / 上線",
    submitting: "提交中…",
    submitSuccess: "已提交。審核結果以伺服器狀態為準（staging 可能自動通過）。",
    statsCompleted: "完成",
    statsFailed: "失敗",
    statsDenied: "拒絕",
    statsNeedConfirmation: "待確認",
    statsSuccessRate: "成功率（約略）",
    statsReputation: "聲譽等級",
    statsTotalInvocations: "與調用相關事件（視窗內）",
    signInRequired: "請登入以管理你的 Agent。",
    signInButton: "登入",
  },
  "zh-Hans": {
    title: "我的 Agent",
    providerRoleRequired: "注册与管理 Agent 需要 Provider 角色。",
    becomeProviderHint: "请以具备 Provider 角色的账户登录，或在注册时选择 Provider 后完成入门流程。",
    openOnboarding: "打开 Provider 入门",
    docsMinimalLinkLabel: "15 分钟最小上架指南（文档）",
    newAgent: "注册新 Agent",
    selectAgent: "选择 Agent",
    empty: "尚未注册任何 Agent。",
    loading: "加载中…",
    loadError: "无法加载你的 Agent 列表。",
    forbidden: "无权列出 Agent（仅 Provider）。",
    statusLabel: "上架审核",
    statusPending: "待审核",
    statusActive: "已通过 / 已上架",
    statusDeprecated: "已下架或弃用",
    reviewWorkflowNote:
      "「需补材」等细粒度状态可能通过通知传达；此处显示服务器状态字段（pending_review / active / deprecated）。",
    healthErrorHint: "上次健康检查错误",
    sectionListing: "网关与上架字段",
    sectionListingLead: "对齐平台 §5.1.9 / E-7：并发、排队策略、超时、排程、记忆层。",
    sectionEndpoints: "实例 URL",
    sectionEndpointsLead: "注册时设定的主 A2A URL。可添加同构端点用于池化与故障转移。",
    sectionOps: "连通性与审核",
    sectionStats: "用量快照",
    sectionStatsLead: "来自近期审计事件的近似统计（非计费级）。",
    maxConcurrent: "最大并发调用数",
    queueBehavior: "容量满时",
    queue: "排队（FIFO）",
    fastFail: "快速失败（429）",
    timeoutMs: "超时（毫秒）",
    timeoutHint: "留空则使用平台默认。",
    supportsScheduled: "支持排程执行",
    memoryTier: "记忆层级",
    memoryNone: "无（无状态）",
    memorySession: "会话范围",
    memoryUserIsolated: "用户隔离",
    saveListing: "保存上架字段",
    savingListing: "保存中…",
    listingSaved: "已保存上架字段。",
    listingSaveFailed: "无法保存上架字段。",
    primaryUrl: "主端点（注册时）",
    addEndpoint: "添加端点 URL",
    endpointUrlLabel: "HTTPS URL",
    endpointUrlPlaceholder: "https://your-agent.example/a2a",
    removeEndpoint: "移除",
    endpointEmpty: "暂无额外端点；平台使用主 URL。",
    runHealthCheck: "运行健康检查",
    healthChecking: "检查中…",
    testCall: "发送测试调用",
    testMessagePlaceholder: "可选消息（留空则用平台默认文案）",
    testCalling: "调用中…",
    submitReview: "提交上架 / 上线",
    submitting: "提交中…",
    submitSuccess: "已提交。审核结果以服务器状态为准（staging 可能自动通过）。",
    statsCompleted: "完成",
    statsFailed: "失败",
    statsDenied: "拒绝",
    statsNeedConfirmation: "待确认",
    statsSuccessRate: "成功率（近似）",
    statsReputation: "声誉等级",
    statsTotalInvocations: "与调用相关事件（窗口内）",
    signInRequired: "请登录以管理你的 Agent。",
    signInButton: "登录",
  },
};

export function getW13ProviderPortalCopy(locale: Locale): W13ProviderPortalCopy {
  return W13_PROVIDER_PORTAL[locale];
}

/** W-18：Agent 生命周期 + 调用收据详情（E-15 / E-17） */
export type W18AgentLifecycleCopy = {
  receiptPageTitle: string;
  backToChat: string;
  loading: string;
  loadError: string;
  notFound: string;
  visibilityRoleLabel: string;
  visibilityRoles: Record<string, string>;
  fieldAgent: string;
  fieldStatus: string;
  fieldCreated: string;
  fieldUserText: string;
  fieldAgentOutput: string;
  fieldError: string;
  fieldDevStats: string;
  devStatsLast30d: string;
  fieldOrchestration: string;
  fieldStep: string;
  trustSectionTitle: string;
  redactedNote: string;
  truncatedNote: string;
  maintenanceBanner: string;
  listingMaintenance: string;
  listingDelisted: string;
  listingListed: string;
  versionLabel: string;
  changelogTitle: string;
  changelogEmpty: string;
  breakingTag: string;
  viewInvocationReceipt: string;
  delistedCardHint: string;
};

const W18_AGENT_LIFECYCLE: Record<Locale, W18AgentLifecycleCopy> = {
  en: {
    receiptPageTitle: "Invocation receipt",
    backToChat: "Back to chat",
    loading: "Loading…",
    loadError: "Could not load this receipt.",
    notFound: "Receipt not found or access denied.",
    visibilityRoleLabel: "Your view",
    visibilityRoles: {
      user: "End user (summarized input/output where applicable)",
      space_admin: "Space admin (full fields)",
      developer: "Agent provider (input redacted, errors visible)",
      platform_admin: "Platform admin (full fields)",
    },
    fieldAgent: "Agent",
    fieldStatus: "Status",
    fieldCreated: "Created",
    fieldUserText: "User request",
    fieldAgentOutput: "Agent output",
    fieldError: "Error detail",
    fieldDevStats: "Usage",
    devStatsLast30d: "Invocations for this agent (last 30 days): {{n}}",
    fieldOrchestration: "Orchestration run",
    fieldStep: "Step",
    trustSectionTitle: "Trust decision",
    redactedNote: "redacted for your role",
    truncatedNote: "truncated summary",
    maintenanceBanner:
      "One or more Agents in this conversation are in maintenance — new calls may be paused until they are listed again.",
    listingMaintenance: "Maintenance",
    listingDelisted: "Delisted",
    listingListed: "Listed",
    versionLabel: "Published version",
    changelogTitle: "Version history",
    changelogEmpty: "No changelog entries yet.",
    breakingTag: "Breaking",
    viewInvocationReceipt: "Invocation receipt",
    delistedCardHint: "This agent is delisted and cannot be invoked.",
  },
  "zh-Hant": {
    receiptPageTitle: "呼叫收據",
    backToChat: "返回對話",
    loading: "載入中…",
    loadError: "無法載入此收據。",
    notFound: "找不到收據或無權限。",
    visibilityRoleLabel: "你的檢視範圍",
    visibilityRoles: {
      user: "一般使用者（輸入/輸出可能為摘要）",
      space_admin: "Space 管理員（完整欄位）",
      developer: "Agent 提供者（輸入已脫敏，可見錯誤）",
      platform_admin: "平台管理員（完整欄位）",
    },
    fieldAgent: "Agent",
    fieldStatus: "狀態",
    fieldCreated: "建立時間",
    fieldUserText: "使用者請求",
    fieldAgentOutput: "Agent 輸出",
    fieldError: "錯誤詳情",
    fieldDevStats: "用量",
    devStatsLast30d: "此 Agent 近 30 日呼叫次數：{{n}}",
    fieldOrchestration: "編排執行",
    fieldStep: "步驟",
    trustSectionTitle: "信任決策",
    redactedNote: "依角色已脫敏",
    truncatedNote: "摘要截斷",
    maintenanceBanner:
      "此對話中有 Agent 處於維護中，新的呼叫可能暫停，直到恢復上架。",
    listingMaintenance: "維護中",
    listingDelisted: "已下架",
    listingListed: "上架中",
    versionLabel: "已發布版本",
    changelogTitle: "版本紀錄",
    changelogEmpty: "尚無變更紀錄。",
    breakingTag: "破壞性",
    viewInvocationReceipt: "呼叫收據",
    delistedCardHint: "此 Agent 已下架，無法再被呼叫。",
  },
  "zh-Hans": {
    receiptPageTitle: "调用收据",
    backToChat: "返回对话",
    loading: "加载中…",
    loadError: "无法加载此收据。",
    notFound: "找不到收据或无权访问。",
    visibilityRoleLabel: "你的视图",
    visibilityRoles: {
      user: "普通用户（输入/输出可能为摘要）",
      space_admin: "Space 管理员（完整字段）",
      developer: "Agent 提供者（输入已脱敏，可见错误）",
      platform_admin: "平台管理员（完整字段）",
    },
    fieldAgent: "Agent",
    fieldStatus: "状态",
    fieldCreated: "创建时间",
    fieldUserText: "用户请求",
    fieldAgentOutput: "Agent 输出",
    fieldError: "错误详情",
    fieldDevStats: "用量",
    devStatsLast30d: "此 Agent 近 30 日调用次数：{{n}}",
    fieldOrchestration: "编排运行",
    fieldStep: "步骤",
    trustSectionTitle: "信任决策",
    redactedNote: "已按角色脱敏",
    truncatedNote: "摘要截断",
    maintenanceBanner:
      "此对话中有 Agent 处于维护中，新的调用可能暂停，直至恢复上架。",
    listingMaintenance: "维护中",
    listingDelisted: "已下架",
    listingListed: "上架中",
    versionLabel: "已发布版本",
    changelogTitle: "版本记录",
    changelogEmpty: "暂无变更记录。",
    breakingTag: "破坏性",
    viewInvocationReceipt: "调用收据",
    delistedCardHint: "该 Agent 已下架，无法继续调用。",
  },
};

export function getW18AgentLifecycleCopy(locale: Locale): W18AgentLifecycleCopy {
  return W18_AGENT_LIFECYCLE[locale];
}
