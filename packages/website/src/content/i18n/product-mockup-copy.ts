import type { Locale } from "@/lib/i18n/locales";

export type ProductMockupCopy = {
  topBarBadge: string;
  conversationsLabel: string;
  convTitles: [string, string, string];
  userMessage: string;
  agentReply: string;
  riskTitle: string;
  riskDesc: string;
  approve: string;
  reject: string;
  agentReply2: string;
  agentReceiptLabel: string;
  agentName: string;
  verified: string;
  reputation: string;
  receiptTitle: string;
  receiptDesc: string;
  viewDetails: string;
};

const copies: Record<Locale, ProductMockupCopy> = {
  en: {
    topBarBadge: "Preview",
    conversationsLabel: "Conversations",
    convTitles: ["Summary request", "API docs lookup", "Code review"],
    userMessage: "Summarize the latest API changes and risks.",
    agentReply:
      "I found 3 breaking changes. One action requires your approval before I proceed.",
    riskTitle: "Risk confirmation required",
    riskDesc: "Execute external API call? Approve or reject below.",
    approve: "Approve",
    reject: "Reject",
    agentReply2: "Summary ready. Receipt attached.",
    agentReceiptLabel: "Agent & Receipt",
    agentName: "Agent Alpha",
    verified: "Verified",
    reputation: "Reputation: 4.8",
    receiptTitle: "Call receipt",
    receiptDesc: "Signed · Verifiable",
    viewDetails: "View details →",
  },
  "zh-Hant": {
    topBarBadge: "預覽",
    conversationsLabel: "對話",
    convTitles: ["摘要請求", "API 文件查詢", "程式碼審查"],
    userMessage: "請總結最新的 API 變更與風險。",
    agentReply:
      "我發現了 3 個破壞性變更。其中一項操作需要您的批准才能繼續。",
    riskTitle: "需要風險確認",
    riskDesc: "執行外部 API 呼叫？請在下方批准或拒絕。",
    approve: "批准",
    reject: "拒絕",
    agentReply2: "摘要已完成。收據已附上。",
    agentReceiptLabel: "Agent 與收據",
    agentName: "Agent Alpha",
    verified: "已驗證",
    reputation: "信譽：4.8",
    receiptTitle: "調用收據",
    receiptDesc: "已簽名 · 可驗證",
    viewDetails: "查看詳情 →",
  },
  "zh-Hans": {
    topBarBadge: "预览",
    conversationsLabel: "对话",
    convTitles: ["摘要请求", "API 文档查询", "代码审查"],
    userMessage: "请总结最新的 API 变更与风险。",
    agentReply:
      "我发现了 3 个破坏性变更。其中一项操作需要您的批准才能继续。",
    riskTitle: "需要风险确认",
    riskDesc: "执行外部 API 调用？请在下方批准或拒绝。",
    approve: "批准",
    reject: "拒绝",
    agentReply2: "摘要已完成。收据已附上。",
    agentReceiptLabel: "Agent 与收据",
    agentName: "Agent Alpha",
    verified: "已验证",
    reputation: "信誉：4.8",
    receiptTitle: "调用收据",
    receiptDesc: "已签名 · 可验证",
    viewDetails: "查看详情 →",
  },
};

export function getProductMockupCopy(locale: Locale): ProductMockupCopy {
  return copies[locale];
}
