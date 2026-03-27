import type { Locale } from "@/lib/i18n/locales";
import type { Agent } from "@/lib/product/agent-types";

/** W-9：Consumer 首启 ≤4 屏；hub 合并 S1 可选目标 + S2 二选一 */
export type ConsumerOnboardingCopy = {
  eyebrow: string;
  title: string;
  skipToApp: string;
  stepProgress: (current: number, total: number) => string;
  hub: {
    heading: string;
    body: string;
    goalLabel: string;
    goalOptional: string;
    goalPlaceholder: string;
    startChat: string;
    browseAgents: string;
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
    doneHeading: string;
    doneBody: string;
    continueApp: string;
    browseAll: string;
  };
};

const COPY: Record<Locale, ConsumerOnboardingCopy> = {
  en: {
    eyebrow: "Consumer onboarding",
    title: "Welcome",
    skipToApp: "Skip to app",
    stepProgress: (c, t) => `Step ${c} of ${t}`,
    hub: {
      heading: "What would you like to do today?",
      body: "Optional: jot a one-line goal—we’ll pre-fill your first message. Then start chatting or open the Agent Hub. No OAuth or connectors required.",
      goalLabel: "Your goal (optional)",
      goalOptional: "Skip if you prefer",
      goalPlaceholder: "e.g. Summarize yesterday’s customer feedback",
      startChat: "Start conversation",
      browseAgents: "Browse Agent Hub",
    },
    browse: {
      heading: "Pick a starter Agent",
      body: "Choose one of these verified picks—you’ll send your first message on the next screen.",
      recommended: "Recommended",
      reputation: "Reputation",
      back: "Back",
      next: "Next",
    },
    firstMessage: {
      heading: "Your first message",
      intro: "You're talking to ",
      outro:
        ". Tap a suggestion or write your own—then run a quick demo (mock response, no connector needed).",
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
      doneHeading: "You're ready for the real app",
      doneBody: "Continue to Chat to send live messages—still no mandatory connectors.",
      continueApp: "Continue to app",
      browseAll: "Browse full Agent Hub",
    },
  },
  "zh-Hant": {
    eyebrow: "使用者引導",
    title: "歡迎",
    skipToApp: "略過並進入應用",
    stepProgress: (c, t) => `第 ${c} 步，共 ${t} 步`,
    hub: {
      heading: "你今天想完成什麼？",
      body: "可選：寫一句目標，我們會預填你的第一則訊息。接著直接開始對話或瀏覽智能體中心。無需 OAuth 或連接器。",
      goalLabel: "你的目標（可選）",
      goalOptional: "可不填",
      goalPlaceholder: "例：整理昨日客戶回饋重點",
      startChat: "開始對話",
      browseAgents: "瀏覽智能體中心",
    },
    browse: {
      heading: "選擇入門 Agent",
      body: "從下列已驗證推薦擇一——下一步你將對它送出第一則訊息。",
      recommended: "推薦",
      reputation: "信譽",
      back: "返回",
      next: "下一步",
    },
    firstMessage: {
      heading: "你的第一則訊息",
      intro: "你正在與 ",
      outro: " 對話。可點選建議或自行輸入，再執行快速示範（Mock，無需連接器）。",
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
      doneHeading: "可以進入正式體驗了",
      doneBody: "前往對話即可發送真實訊息——仍無強制連接器要求。",
      continueApp: "進入應用",
      browseAll: "瀏覽完整智能體中心",
    },
  },
  "zh-Hans": {
    eyebrow: "用户引导",
    title: "欢迎",
    skipToApp: "跳过并进入应用",
    stepProgress: (c, t) => `第 ${c} 步，共 ${t} 步`,
    hub: {
      heading: "你今天想完成什么？",
      body: "可选：写一句目标，我们会预填你的第一条消息。然后直接开始对话或浏览智能体中心。无需 OAuth 或连接器。",
      goalLabel: "你的目标（可选）",
      goalOptional: "可不填",
      goalPlaceholder: "例：整理昨日客户反馈要点",
      startChat: "开始对话",
      browseAgents: "浏览智能体中心",
    },
    browse: {
      heading: "选择入门 Agent",
      body: "从下列已验证推荐中选一个——下一步你将向它发送第一条消息。",
      recommended: "推荐",
      reputation: "信誉",
      back: "返回",
      next: "下一步",
    },
    firstMessage: {
      heading: "你的第一条消息",
      intro: "你正在与 ",
      outro: " 对话。可点击建议或自行输入，再执行快速演示（Mock，无需连接器）。",
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
      doneHeading: "可以进入正式体验了",
      doneBody: "前往对话即可发送真实消息——仍无强制连接器要求。",
      continueApp: "进入应用",
      browseAll: "浏览完整智能体中心",
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
