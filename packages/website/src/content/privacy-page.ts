import type { Locale } from "@/lib/i18n/locales";

export type PrivacyPageCopy = {
  seoTitle: string;
  seoDescription: string;
  title: string;
  intro: string[];
  cookiesSectionTitle: string;
  cookiesSection: string[];
  /** W-21：数据保留摘要（对齐内部矩阵占位，非法务最终承诺） */
  retentionSectionTitle: string;
  retentionSection: string[];
  /** W-21：UGC 举报与管理员隐藏 */
  ugcSectionTitle: string;
  ugcSection: string[];
};

const EN: PrivacyPageCopy = {
  seoTitle: "Privacy Policy - GaiaLynk",
  seoDescription:
    "Minimum lead fields and basic funnel events; no sensitive content in analytics payloads. Cookies, retention summary, and UGC reporting.",
  title: "Privacy Policy",
  intro: [
    "We collect only the minimum lead fields and basic funnel events. We do not put sensitive content in analytics payloads.",
    "On lead and waitlist forms we limit collection to what you submit (such as name, email, company, and stated use case).",
    "Product analytics and scroll or page metrics are sent only if you opt in to **analytics cookies** in the cookie banner. Essential cookies are always used for session and security.",
  ],
  cookiesSectionTitle: "Cookies",
  cookiesSection: [
    "**Essential** cookies keep you signed in, protect the service, and remember locale where needed. They cannot be turned off from the banner.",
    "**Analytics** cookies (for example PostHog and our first-party `/api/analytics/events` pipeline) load only when you enable **Analytics** in the cookie banner. They help us understand which pages, locales, and CTAs perform best.",
    "**Marketing** cookies are reserved for future campaigns; you can leave them off. We do not use them for targeted ads in this build.",
    "You can change your mind by clearing site data for this origin or using the banner when we surface it again after a policy update.",
  ],
  retentionSectionTitle: "Data retention (summary)",
  retentionSection: [
    "GaiaLynk retains product data by **class** (for example conversation messages, audit-oriented logs, invocation receipts, and scheduled orchestration history). **Default periods** in production are **placeholders** aligned with our internal matrix until **legal** approves final commitments—typically on the order of **one year** for ordinary conversation text in many environments, with **longer** windows where **compliance** requires.",
    "When data ages out it may be **archived** and **removed from normal in-product views**. **Exports** and self-serve history reflect **in-retention** material unless a separate policy applies.",
    "Account deletion requests are handled through **support**; some records may be **anonymized** or **retained** where **law** mandates. The **Help Center** article *How long is data kept?* mirrors this summary in plainer language.",
  ],
  ugcSectionTitle: "User-generated content, reporting, and moderation",
  ugcSection: [
    "In **multi-participant** conversations you may **report** another participant’s **user messages** that violate acceptable-use or safety rules. Reports include a **reason** and optional **detail** for review.",
    "**Space owners and administrators** may **hide** a message after review; other members then see a **standard placeholder** instead of the original text. Hidden messages remain governed by **retention** and **audit** policies.",
    "Misuse of reporting (for example coordinated harassment through false filings) may itself violate policy and lead to enforcement.",
  ],
};

const ZH_HANT: PrivacyPageCopy = {
  seoTitle: "隱私權政策 - GaiaLynk",
  seoDescription:
    "僅蒐集必要留資欄位與基礎轉化事件；敏感內容不寫入分析 payload。Cookie、保留摘要與 UGC 檢舉。",
  title: "隱私權政策",
  intro: [
    "僅蒐集必要留資欄位與基礎轉化事件；敏感內容不寫入分析 payload。",
    "名單或等候清單表單上，我們僅收集您提交的內容（例如姓名、電子郵件、公司與用途說明）。",
    "產品分析與捲動／頁面指標僅在您於 Cookie 橫幅中同意**分析**後才會傳送；**必要** Cookie 則用於工作階段與安全。",
  ],
  cookiesSectionTitle: "Cookie",
  cookiesSection: [
    "**必要** Cookie 用於維持登入、保護服務與記住語系等，無法在橫幅中關閉。",
    "僅當您啟用橫幅中的**分析**時，才會載入 **Analytics** Cookie（例如 PostHog 與我們的 `/api/analytics/events` 管線），協助了解頁面、語系與 CTA 表現。",
    "**行銷** Cookie 預留未來活動；可維持關閉。本版本未用於定向廣告。",
    "若需調整，可清除本站資料；若政策更新後我們再次顯示橫幅，亦可重新選擇。",
  ],
  retentionSectionTitle: "資料保留（摘要）",
  retentionSection: [
    "GaiaLynk 依**資料類別**保留產品資料（例如對話訊息、稽核取向紀錄、調用收據、排程編排歷程）。正式環境的**預設週期**在**法務**定稿前為與內部矩陣一致的**占位數值**——多數情境下一般對話正文常為**約一年**量級，**合規**所需者可能更長。",
    "資料逾時後可能**歸檔**並自一般產品視圖**隱藏**。**匯出**與自助歷程通常反映**保留期內**資料，另有政策者從其規定。",
    "刪除帳號請透過**支援**流程辦理；部分紀錄可能**匿名化**或依法**留存**。**說明中心**〈資料會保存多久？〉以較白話方式與本摘要對齊。",
  ],
  ugcSectionTitle: "使用者內容、檢舉與審核",
  ugcSection: [
    "在**多人參與**的對話中，您可**檢舉**其他參與者之**使用者訊息**若其違反可接受使用或安全規範。檢舉需含**原因**並可附**補充說明**供審核。",
    "**Space 擁有者與管理員**審視後可**隱藏**訊息；其他成員將看到**標準占位**而非原文。隱藏訊息仍受**保留**與**稽核**政策約束。",
    "濫用檢舉（例如以不實檢舉進行騷擾）本身可能違反政策並招致處置。",
  ],
};

const ZH_HANS: PrivacyPageCopy = {
  seoTitle: "隐私政策 - GaiaLynk",
  seoDescription: "仅收集必要留资字段与基础转化事件；敏感内容不写入分析 payload。Cookie、保留摘要与 UGC 举报。",
  title: "隐私政策",
  intro: [
    "仅收集必要留资字段与基础转化事件；敏感内容不写入分析 payload。",
    "在留资或等候名单表单上，我们仅收集您提交的内容（例如姓名、邮箱、公司与用途说明）。",
    "产品分析与滚动／页面指标仅当您于 Cookie 横幅中同意**分析**后才会发送；**必要** Cookie 用于会话与安全。",
  ],
  cookiesSectionTitle: "Cookie",
  cookiesSection: [
    "**必要** Cookie 用于保持登录、保护服务与记住语言等，无法在横幅中关闭。",
    "仅当您启用横幅中的**分析**时，才会加载 **Analytics** Cookie（例如 PostHog 与我们的 `/api/analytics/events` 管道），用于了解页面、语言与 CTA 表现。",
    "**营销** Cookie 预留给未来活动；可保持关闭。本版本不用于定向广告。",
    "如需调整，可清除本站数据；若政策更新后我们再次展示横幅，亦可重新选择。",
  ],
  retentionSectionTitle: "数据保留（摘要）",
  retentionSection: [
    "GaiaLynk 按**数据类别**保留产品数据（例如对话消息、审计类记录、调用收据、定时编排历史）。生产环境的**默认周期**在**法务**定稿前为与内部矩阵一致的**占位数值**——多数场景下一般对话正文常为**约一年**量级，**合规**所需可能更长。",
    "数据过期后可能**归档**并从常规产品视图**隐藏**。**导出**与自助历史通常反映**保留期内**数据，另有政策者从其规定。",
    "删除账号请走**支持**流程；部分记录可能**匿名化**或依法**留存**。**帮助中心**《数据保存多久？》以白话与本摘要对齐。",
  ],
  ugcSectionTitle: "用户内容、举报与治理",
  ugcSection: [
    "在**多人参与**的对话中，您可**举报**其他参与者的**用户消息**若其违反可接受使用或安全规则。举报需包含**原因**并可附**补充说明**供审核。",
    "**Space 所有者与管理员**审视后可**隐藏**消息；其他成员将看到**标准占位**而非原文。隐藏消息仍受**保留**与**审计**政策约束。",
    "滥用举报（例如虚假举报骚扰）本身可能违反政策并导致处置。",
  ],
};

const MAP: Record<Locale, PrivacyPageCopy> = {
  en: EN,
  "zh-Hant": ZH_HANT,
  "zh-Hans": ZH_HANS,
};

export function getPrivacyPageCopy(locale: Locale): PrivacyPageCopy {
  return MAP[locale];
}
