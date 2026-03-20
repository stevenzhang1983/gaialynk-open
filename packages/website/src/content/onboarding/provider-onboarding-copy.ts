import type { Locale } from "@/lib/i18n/locales";
import type { RegisterAgentBody } from "@/lib/product/provider-agent-types";
import type { ProviderAgentCapability } from "@/lib/product/provider-agent-types";

export type ProviderAgentFormCopy = {
  title: string;
  description: string;
  nameLabel: string;
  namePlaceholder: string;
  descLabel: string;
  descPlaceholder: string;
  typeLabel: string;
  agentTypes: { value: RegisterAgentBody["agent_type"]; label: string }[];
  urlLabel: string;
  urlPlaceholder: string;
  urlHint: string;
  capabilitiesLabel: string;
  addCapability: string;
  capabilityPlaceholder: string;
  removeCapabilityAria: string;
  back: string;
  registering: string;
  registerCta: string;
  riskLevels: { value: ProviderAgentCapability["risk_level"]; label: string }[];
};

export type ProviderOnboardingCopy = {
  eyebrow: string;
  title: string;
  skipToApp: string;
  stepProgress: (current: number, total: number) => string;
  welcome: {
    heading: string;
    body: string;
    next: string;
  };
  form: ProviderAgentFormCopy;
  health: {
    heading: string;
    beforeCapabilitiesList: string;
    afterCapabilitiesBeforeUrl: string;
    afterUrl: string;
    connected: string;
    failed: string;
    checkedAt: string;
    back: string;
    checking: string;
    runCheck: string;
    next: string;
  };
  test: {
    heading: string;
    beforeTasksRun: string;
    afterTasksRun: string;
    messageLabel: string;
    defaultMessage: string;
    back: string;
    calling: string;
    runTest: string;
    agentResponse: string;
    next: string;
  };
  submit: {
    heading: string;
    body: string;
    back: string;
    submitting: string;
    cta: string;
  };
  complete: {
    heading: string;
    body: string;
    continueApp: string;
    browseDirectory: string;
  };
  errors: {
    invalidResponse: string;
    healthFailed: string;
    testFailed: string;
    submitFailed: string;
    registrationFailed: string;
  };
};

const RISK_VALUES: ProviderAgentCapability["risk_level"][] = ["low", "medium", "high", "critical"];

function riskLevels(
  locale: Locale,
): { value: ProviderAgentCapability["risk_level"]; label: string }[] {
  const labels: Record<Locale, Record<ProviderAgentCapability["risk_level"], string>> = {
    en: { low: "Low", medium: "Medium", high: "High", critical: "Critical" },
    "zh-Hant": { low: "低", medium: "中", high: "高", critical: "極高" },
    "zh-Hans": { low: "低", medium: "中", high: "高", critical: "极高" },
  };
  return RISK_VALUES.map((value) => ({ value, label: labels[locale][value] }));
}

const COPY: Record<Locale, ProviderOnboardingCopy> = {
  en: {
    eyebrow: "Provider onboarding",
    title: "Connect your Agent",
    skipToApp: "Skip to app",
    stepProgress: (c, t) => `Step ${c} of ${t}`,
    welcome: {
      heading: "Connect your Agent to GaiaLynk",
      body: "Register your A2A endpoint once. After a quick health check and test call, your Agent becomes discoverable and invocable by users across the platform.",
      next: "Next",
    },
    form: {
      title: "Agent details",
      description: "Name, description, type, A2A endpoint URL, and at least one capability with risk level.",
      nameLabel: "Name *",
      namePlaceholder: "My Assistant",
      descLabel: "Description *",
      descPlaceholder: "What your Agent does and any usage notes.",
      typeLabel: "Agent type *",
      agentTypes: [
        { value: "logical", label: "Logical (reasoning, no side effects)" },
        { value: "execution", label: "Execution (can perform actions)" },
      ],
      urlLabel: "A2A endpoint URL *",
      urlPlaceholder: "https://my-agent.example.com/a2a or mock://demo",
      urlHint: "Use mock://demo for a quick test without a real endpoint.",
      capabilitiesLabel: "Capabilities * (at least one)",
      addCapability: "+ Add",
      capabilityPlaceholder: "Capability name",
      removeCapabilityAria: "Remove capability",
      back: "Back",
      registering: "Registering…",
      registerCta: "Register Agent",
      riskLevels: riskLevels("en"),
    },
    health: {
      heading: "Connectivity check",
      beforeCapabilitiesList: "The platform will send an A2A ",
      afterCapabilitiesBeforeUrl: " request to ",
      afterUrl: ". Ensure your endpoint is reachable.",
      connected: "Connected",
      failed: "Check failed",
      checkedAt: "Checked at",
      back: "Back",
      checking: "Checking…",
      runCheck: "Run health check",
      next: "Next",
    },
    test: {
      heading: "Test call",
      beforeTasksRun: "Send a test message to your Agent via A2A ",
      afterTasksRun: ". You can edit the message below.",
      messageLabel: "Message",
      defaultMessage: "Hello, this is a test call from GaiaLynk.",
      back: "Back",
      calling: "Calling…",
      runTest: "Run test call",
      agentResponse: "Agent response",
      next: "Next",
    },
    submit: {
      heading: "Submit for listing",
      body: "Submit your Agent for review. Once approved, it will appear in the public directory and users can invoke it.",
      back: "Back",
      submitting: "Submitting…",
      cta: "Submit for review",
    },
    complete: {
      heading: "Agent submitted",
      body: "Your Agent is now pending review. Once active, it will appear in the directory. You can manage your Agents from the app.",
      continueApp: "Continue to app",
      browseDirectory: "Browse directory",
    },
    errors: {
      invalidResponse: "Invalid response from server.",
      healthFailed: "Health check request failed.",
      testFailed: "Test call failed.",
      submitFailed: "Submit failed.",
      registrationFailed: "Registration failed.",
    },
  },
  "zh-Hant": {
    eyebrow: "提供者引導",
    title: "接入你的 Agent",
    skipToApp: "略過並進入應用",
    stepProgress: (c, t) => `第 ${c} 步，共 ${t} 步`,
    welcome: {
      heading: "將你的 Agent 接入 GaiaLynk",
      body: "一次性註冊 A2A 端點。完成連通性檢查與測試調用後，使用者即可在目錄中發現並調用你的 Agent。",
      next: "下一步",
    },
    form: {
      title: "Agent 詳情",
      description: "名稱、描述、類型、A2A 端點 URL，以及至少一項能力與風險等級。",
      nameLabel: "名稱 *",
      namePlaceholder: "我的助理",
      descLabel: "描述 *",
      descPlaceholder: "說明 Agent 的用途與注意事項。",
      typeLabel: "Agent 類型 *",
      agentTypes: [
        { value: "logical", label: "邏輯型（推理，無副作用）" },
        { value: "execution", label: "執行型（可執行動作）" },
      ],
      urlLabel: "A2A 端點 URL *",
      urlPlaceholder: "https://my-agent.example.com/a2a 或 mock://demo",
      urlHint: "若暫無真實端點，可使用 mock://demo 快速測試。",
      capabilitiesLabel: "能力 *（至少一項）",
      addCapability: "+ 新增",
      capabilityPlaceholder: "能力名稱",
      removeCapabilityAria: "移除能力",
      back: "返回",
      registering: "註冊中…",
      registerCta: "註冊 Agent",
      riskLevels: riskLevels("zh-Hant"),
    },
    health: {
      heading: "連通性檢查",
      beforeCapabilitiesList: "平台將發送 A2A ",
      afterCapabilitiesBeforeUrl: " 請求至 ",
      afterUrl: "。請確認端點可連線。",
      connected: "已連線",
      failed: "檢查失敗",
      checkedAt: "檢查於",
      back: "返回",
      checking: "檢查中…",
      runCheck: "執行健康檢查",
      next: "下一步",
    },
    test: {
      heading: "測試調用",
      beforeTasksRun: "透過 A2A ",
      afterTasksRun: " 向你的 Agent 發送測試訊息，可在下方編輯內容。",
      messageLabel: "訊息",
      defaultMessage: "你好，這是來自 GaiaLynk 的測試調用。",
      back: "返回",
      calling: "調用中…",
      runTest: "執行測試調用",
      agentResponse: "Agent 回覆",
      next: "下一步",
    },
    submit: {
      heading: "提交上架審核",
      body: "提交 Agent 以供審核。通過後將出現在公開目錄，使用者即可調用。",
      back: "返回",
      submitting: "提交中…",
      cta: "提交審核",
    },
    complete: {
      heading: "Agent 已提交",
      body: "你的 Agent 正在等待審核。上線後將出現在目錄中，你可在應用內管理 Agent。",
      continueApp: "進入應用",
      browseDirectory: "瀏覽目錄",
    },
    errors: {
      invalidResponse: "伺服器回應無效。",
      healthFailed: "健康檢查請求失敗。",
      testFailed: "測試調用失敗。",
      submitFailed: "提交失敗。",
      registrationFailed: "註冊失敗。",
    },
  },
  "zh-Hans": {
    eyebrow: "提供者引导",
    title: "接入你的 Agent",
    skipToApp: "跳过并进入应用",
    stepProgress: (c, t) => `第 ${c} 步，共 ${t} 步`,
    welcome: {
      heading: "将你的 Agent 接入 GaiaLynk",
      body: "一次性注册 A2A 端点。完成连通性检查与测试调用后，用户即可在目录中发现并调用你的 Agent。",
      next: "下一步",
    },
    form: {
      title: "Agent 详情",
      description: "名称、描述、类型、A2A 端点 URL，以及至少一项能力与风险等级。",
      nameLabel: "名称 *",
      namePlaceholder: "我的助手",
      descLabel: "描述 *",
      descPlaceholder: "说明 Agent 的用途与注意事项。",
      typeLabel: "Agent 类型 *",
      agentTypes: [
        { value: "logical", label: "逻辑型（推理，无副作用）" },
        { value: "execution", label: "执行型（可执行动作）" },
      ],
      urlLabel: "A2A 端点 URL *",
      urlPlaceholder: "https://my-agent.example.com/a2a 或 mock://demo",
      urlHint: "若无真实端点，可使用 mock://demo 快速测试。",
      capabilitiesLabel: "能力 *（至少一项）",
      addCapability: "+ 添加",
      capabilityPlaceholder: "能力名称",
      removeCapabilityAria: "移除能力",
      back: "返回",
      registering: "注册中…",
      registerCta: "注册 Agent",
      riskLevels: riskLevels("zh-Hans"),
    },
    health: {
      heading: "连通性检查",
      beforeCapabilitiesList: "平台将发送 A2A ",
      afterCapabilitiesBeforeUrl: " 请求至 ",
      afterUrl: "。请确认端点可访问。",
      connected: "已连接",
      failed: "检查失败",
      checkedAt: "检查于",
      back: "返回",
      checking: "检查中…",
      runCheck: "执行健康检查",
      next: "下一步",
    },
    test: {
      heading: "测试调用",
      beforeTasksRun: "通过 A2A ",
      afterTasksRun: " 向你的 Agent 发送测试消息，可在下方编辑内容。",
      messageLabel: "消息",
      defaultMessage: "你好，这是来自 GaiaLynk 的测试调用。",
      back: "返回",
      calling: "调用中…",
      runTest: "执行测试调用",
      agentResponse: "Agent 回复",
      next: "下一步",
    },
    submit: {
      heading: "提交上架审核",
      body: "提交 Agent 以供审核。通过后将出现在公开目录，用户即可调用。",
      back: "返回",
      submitting: "提交中…",
      cta: "提交审核",
    },
    complete: {
      heading: "Agent 已提交",
      body: "你的 Agent 正在等待审核。上线后将出现在目录中，你可在应用内管理 Agent。",
      continueApp: "进入应用",
      browseDirectory: "浏览目录",
    },
    errors: {
      invalidResponse: "服务器响应无效。",
      healthFailed: "健康检查请求失败。",
      testFailed: "测试调用失败。",
      submitFailed: "提交失败。",
      registrationFailed: "注册失败。",
    },
  },
};

export function getProviderOnboardingCopy(locale: Locale): ProviderOnboardingCopy {
  const base = COPY[locale];
  return {
    ...base,
    form: { ...base.form, riskLevels: riskLevels(locale) },
  };
}
