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
};

export type CookieCopy = {
  message: string;
  accept: string;
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
  },
};

const COOKIES: Record<Locale, CookieCopy> = {
  en: {
    message:
      "We use minimal cookies for locale preference and analytics baseline. By continuing, you agree to this usage.",
    accept: "Accept",
  },
  "zh-Hant": {
    message: "我們僅使用最少量的 Cookie 以記住語系偏好與分析基線。繼續使用即表示您同意此用途。",
    accept: "接受",
  },
  "zh-Hans": {
    message: "我们仅使用最少量的 Cookie 以记住语言偏好与分析基线。继续使用即表示您同意此用途。",
    accept: "接受",
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

export function getProductUiCopy(locale: Locale): ProductUiCopy {
  return PRODUCT_UI[locale];
}

export function getCookieCopy(locale: Locale): CookieCopy {
  return COOKIES[locale];
}

export function getAuthFormsCopy(locale: Locale): AuthFormsCopy {
  return AUTH_FORMS[locale];
}
