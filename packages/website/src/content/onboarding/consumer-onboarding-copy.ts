import type { Locale } from "@/lib/i18n/locales";
import type { Agent } from "@/lib/product/agent-types";

export type ConsumerOnboardingCopy = {
  eyebrow: string;
  title: string;
  skipToApp: string;
  stepProgress: (current: number, total: number) => string;
  welcome: {
    heading: string;
    body: string;
    next: string;
  };
  browse: {
    heading: string;
    body: string;
    recommended: string;
    reputation: string;
    back: string;
    next: string;
  };
  firstMessage: {
    heading: string;
    intro: string;
    outro: string;
    placeholder: string;
    messageAria: string;
    back: string;
    runDemo: string;
  };
  result: {
    heading: string;
    bodyBefore: string;
    bodyAfter: string;
    you: string;
    receiptTitle: string;
    receiptId: string;
    invocationId: string;
    trustDecision: string;
    routedAgent: string;
    completedAt: string;
    back: string;
    finish: string;
  };
  complete: {
    heading: string;
    body: string;
    continueApp: string;
    browseAll: string;
  };
};

const COPY: Record<Locale, ConsumerOnboardingCopy> = {
  en: {
    eyebrow: "Consumer onboarding",
    title: "Get started",
    skipToApp: "Skip to app",
    stepProgress: (c, t) => `Step ${c} of ${t}`,
    welcome: {
      heading: "Let Agents work for you",
      body: "Pick verified Agents, send a task in plain language, and get results with a trust receipt—so you always know what ran and why it was allowed.",
      next: "Next",
    },
    browse: {
      heading: "Browse recommended Agents",
      body: "These Agents are verified picks to start with. Select one—you'll send your first message to it next.",
      recommended: "Recommended",
      reputation: "Reputation",
      back: "Back",
      next: "Next",
    },
    firstMessage: {
      heading: "Your first message",
      intro: "You're talking to ",
      outro:
        ". Tap a suggestion or write your own—then run a demo invocation (no real backend required).",
      placeholder: "Describe what you want the Agent to do…",
      messageAria: "Message to agent",
      back: "Back",
      runDemo: "Run demo (mock)",
    },
    result: {
      heading: "Your first result",
      bodyBefore: "The platform routed your task to ",
      bodyAfter: " and returned an answer plus an audit receipt (demo data).",
      you: "You",
      receiptTitle: "Invocation receipt (mock)",
      receiptId: "Receipt ID",
      invocationId: "Invocation ID",
      trustDecision: "Trust decision",
      routedAgent: "Routed Agent",
      completedAt: "Completed at",
      back: "Back",
      finish: "Finish",
    },
    complete: {
      heading: "You're ready",
      body: "Open Chat to start real conversations, browse the full Agent directory from the sidebar, and explore tasks and approvals when you need them.",
      continueApp: "Continue to app",
      browseAll: "Browse all Agents",
    },
  },
  "zh-Hant": {
    eyebrow: "使用者引導",
    title: "開始使用",
    skipToApp: "略過並進入應用",
    stepProgress: (c, t) => `第 ${c} 步，共 ${t} 步`,
    welcome: {
      heading: "讓 Agent 為你工作",
      body: "在此挑選已驗證的 Agent、用自然語言送出任務，並取得附帶信任收據的結果——清楚知道執行了什麼、為何被允許。",
      next: "下一步",
    },
    browse: {
      heading: "瀏覽推薦 Agent",
      body: "這些是適合入門的已驗證 Agent。選擇其一——下一步你將對它送出第一則訊息。",
      recommended: "推薦",
      reputation: "信譽",
      back: "返回",
      next: "下一步",
    },
    firstMessage: {
      heading: "你的第一則訊息",
      intro: "你正在與 ",
      outro: " 對話。可點選建議或自行輸入，再執行示範調用（無需真實後端）。",
      placeholder: "描述你希望 Agent 做什麼…",
      messageAria: "傳給 Agent 的訊息",
      back: "返回",
      runDemo: "執行示範（Mock）",
    },
    result: {
      heading: "你的第一個結果",
      bodyBefore: "平台已將你的任務路由至 ",
      bodyAfter: "，並回傳答案與稽核收據（示範資料）。",
      you: "你",
      receiptTitle: "調用收據（示範）",
      receiptId: "收據 ID",
      invocationId: "調用 ID",
      trustDecision: "信任決策",
      routedAgent: "路由 Agent",
      completedAt: "完成時間",
      back: "返回",
      finish: "完成",
    },
    complete: {
      heading: "你已準備就緒",
      body: "打開對話開始真實協作，從側欄瀏覽完整 Agent 目錄，需要時再探索任務與審批。",
      continueApp: "進入應用",
      browseAll: "瀏覽全部 Agent",
    },
  },
  "zh-Hans": {
    eyebrow: "用户引导",
    title: "开始使用",
    skipToApp: "跳过并进入应用",
    stepProgress: (c, t) => `第 ${c} 步，共 ${t} 步`,
    welcome: {
      heading: "让 Agent 为你工作",
      body: "在此挑选已验证的 Agent、用自然语言发送任务，并取得附带信任收据的结果——清楚知道执行了什么、为何被允许。",
      next: "下一步",
    },
    browse: {
      heading: "浏览推荐 Agent",
      body: "这些是适合入门的已验证 Agent。选择其一——下一步你将向它发送第一条消息。",
      recommended: "推荐",
      reputation: "信誉",
      back: "返回",
      next: "下一步",
    },
    firstMessage: {
      heading: "你的第一条消息",
      intro: "你正在与 ",
      outro: " 对话。可点击建议或自行输入，再执行演示调用（无需真实后端）。",
      placeholder: "描述你希望 Agent 做什么…",
      messageAria: "发给 Agent 的消息",
      back: "返回",
      runDemo: "运行演示（Mock）",
    },
    result: {
      heading: "你的第一个结果",
      bodyBefore: "平台已将你的任务路由至 ",
      bodyAfter: "，并返回答案与审计收据（演示数据）。",
      you: "你",
      receiptTitle: "调用收据（演示）",
      receiptId: "收据 ID",
      invocationId: "调用 ID",
      trustDecision: "信任决策",
      routedAgent: "路由 Agent",
      completedAt: "完成时间",
      back: "返回",
      finish: "完成",
    },
    complete: {
      heading: "你已准备就绪",
      body: "打开对话开始真实协作，从侧栏浏览完整 Agent 目录，需要时再探索任务与审批。",
      continueApp: "进入应用",
      browseAll: "浏览全部 Agent",
    },
  },
};

const SUGGESTED_PROMPTS: Record<Locale, string[]> = {
  en: [
    "Summarize this week's product updates in 5 bullet points.",
    "What are the main risks if we ship this feature tomorrow?",
    "Draft a short reply acknowledging the customer's request.",
  ],
  "zh-Hant": [
    "用五個要點總結本週產品更新。",
    "若明天上線此功能，主要風險有哪些？",
    "草擬一段簡短回覆，確認已收到客戶需求。",
  ],
  "zh-Hans": [
    "用五个要点总结本周产品更新。",
    "若明天上线此功能，主要风险有哪些？",
    "草拟一段简短回复，确认已收到客户需求。",
  ],
};

export function getConsumerOnboardingCopy(locale: Locale): ConsumerOnboardingCopy {
  return COPY[locale];
}

export function getConsumerSuggestedPrompts(locale: Locale): string[] {
  return SUGGESTED_PROMPTS[locale];
}

export function formatConsumerMockAssistant(agent: Agent, userMessage: string, locale: Locale): string {
  const snippet = `${userMessage.slice(0, 80)}${userMessage.length > 80 ? "…" : ""}`;
  if (locale === "zh-Hant") {
    return `[示範] ${agent.name} 已處理你的請求。\n\n以下為基於「${snippet}」的簡要示範回覆\n\n• 已在生產力策略下接受任務\n• 無需外部寫入\n• 完整稽核鏈已附於下方收據`;
  }
  if (locale === "zh-Hans") {
    return `[演示] ${agent.name} 已处理你的请求。\n\n以下为基于「${snippet}」的简要演示回复\n\n• 已在生产力策略下接受任务\n• 无需外部写入\n• 完整审计链已附于下方收据`;
  }
  return `[Demo] ${agent.name} processed your request.\n\nHere's a concise mock response based on: "${snippet}"\n\n• Task accepted under productivity policy\n• No external writes were required\n• Full audit trail is attached to the receipt below`;
}
