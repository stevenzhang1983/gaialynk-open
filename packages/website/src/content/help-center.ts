import type { Locale } from "@/lib/i18n/locales";

export type HelpArticleStatus = "now" | "in_progress";
export type HelpPresetTag = "connector" | "approval" | "quota";

export type HelpArticleView = {
  id: string;
  status: HelpArticleStatus;
  presetTags: HelpPresetTag[];
  title: string;
  body: string[];
  /** Optional in-app or marketing link shown below body */
  cta?: { label: string; href: string };
};

export type HelpSectionView = {
  id: string;
  title: string;
  articles: HelpArticleView[];
};

export type HelpCenterView = {
  metaTitle: string;
  metaDescription: string;
  title: string;
  subtitle: string;
  searchLabel: string;
  searchPlaceholder: string;
  /** `{count}` replaced with the number of matching articles */
  resultsCountTemplate: string;
  resultsEmpty: string;
  presetChips: { tag: HelpPresetTag; label: string }[];
  statusLabels: Record<HelpArticleStatus, string>;
  roadmapFoot: { lead: string; cta: string; href: string };
};

const EN: HelpCenterView & { sections: HelpSectionView[] } = {
  metaTitle: "Help Center",
  metaDescription:
    "Concise help for chat, connectors, privacy, confirmations, usage, and troubleshooting.",
  title: "Help Center",
  subtitle: "Browse topics below or search.",
  searchLabel: "Search help",
  searchPlaceholder: "Connectors, approval, quota, queue, OAuth…",
  resultsCountTemplate: "{count} article(s) match.",
  resultsEmpty: "No articles match.",
  presetChips: [
    { tag: "connector", label: "Connectors" },
    { tag: "approval", label: "Approvals" },
    { tag: "quota", label: "Usage & limits" },
  ],
  statusLabels: {
    now: "Now",
    in_progress: "In progress",
  },
  roadmapFoot: {
    lead: "Looking for what ships next or what is still research?",
    cta: "See the roadmap",
    href: "/roadmap",
  },
  sections: [
    {
      id: "getting-started",
      title: "Getting started",
      articles: [
        {
          id: "quickstart-5m",
          status: "now",
          presetTags: [],
          title: "Get productive in about five minutes",
          body: [
            "Sign in and open the app to your conversation.",
            "Select agents listed in the Agent Hub to start—no need to deploy your own agent first.",
            "The platform routes work, applies **trust policy**, and returns a result with a **receipt** when execution completes.",
            "Add another agent to the thread for multi-step collaboration; the Agent Hub shows capacity and trust signals.",
            "Space owners can invite teammates from **Settings → Space & members**; guests have limited actions (for example, generating invites may be disabled).",
          ],
          cta: { label: "Open the app", href: "/app" },
        },
        {
          id: "what-is-receipt",
          status: "now",
          presetTags: [],
          title: "What is an execution record?",
          body: [
            "People often call it a **receipt**: the platform’s record that an invocation happened under a specific policy decision. It ties together **what was requested**, **what was allowed or blocked**, and **identifiers** you can copy for support or audit.",
            "Execution records are **not** a guarantee of business outcome—they prove the governed execution path the platform took.",
          ],
        },
        {
          id: "trust-policy-plain",
          status: "now",
          presetTags: ["approval"],
          title: "Rules in plain language",
          body: [
            "In everyday terms, rules decide whether an action can run automatically, needs **your confirmation**, or is **blocked**. You may see a card in the thread explaining the decision, sometimes with **reason codes**.",
            "Engineers call this **trust policy**. Space **owners** and **admins** may see extra technical detail (for example policy rule identifiers) to align with governance workflows.",
          ],
        },
        {
          id: "approvals-hitl",
          status: "now",
          presetTags: ["approval"],
          title: "Approvals, review, and notifications",
          body: [
            "When risk is high, the platform may require **human confirmation** before an Agent continues. Confirm or decline from the **trust card** in the conversation.",
            "Review-related items can also surface in **Notifications**; clicking a row can take you back to the right thread when a deep link is available.",
            "For demo-style review queues, the product may expose a dedicated **Approvals** area—use it when your workspace routes high-risk work there.",
          ],
          cta: { label: "Approvals demo (signed-in)", href: "/app/recovery-hitl" },
        },
        {
          id: "agent-delegated-invites",
          status: "now",
          presetTags: [],
          title: "Can an assistant pull in other Agents for me?",
          body: [
            "Participants in your thread—including automated flows—may **add Agents** when **Space rules**, **RBAC**, and **trust policy** allow it.",
            "If you should not see a new Agent, ask a **Space owner or admin** to review membership and connector permissions; you can often **remove** an Agent from the participant bar when you are allowed to.",
          ],
        },
        {
          id: "scheduled-tasks-explained",
          status: "now",
          presetTags: ["quota"],
          title: "What are scheduled tasks?",
          body: [
            "**Scheduled tasks** are **B-class orchestrations** that run on a **UTC cron** schedule. You can create them from a **multi-agent plan** in chat when the workspace supports scheduling.",
            "Manage them under **Settings → Scheduled tasks**: **pause**, **resume**, and open the originating conversation. Status matches the roadmap: this capability ships as **Now** in the current release wave.",
          ],
          cta: { label: "Scheduled tasks", href: "/app/settings/scheduled-tasks" },
        },
      ],
    },
    {
      id: "connectors",
      title: "Connectors",
      articles: [
        {
          id: "what-is-desktop-connector",
          status: "now",
          presetTags: ["connector"],
          title: "What is the Desktop Connector?",
          body: [
            "The **Desktop Connector** is a small **tray app** (macOS / Windows) that pairs with your GaiaLynk account using a **6-digit code** shown in the app.",
            "It runs **governed file list, read, and write** actions **on your computer** when you approve them in the web app—without granting the browser direct access to your filesystem.",
            "You can **unpair** devices under **Settings → Connectors**; receipts and audit events still flow through the platform for traceability.",
          ],
          cta: { label: "Connector settings", href: "/app/settings/connectors" },
        },
        {
          id: "how-to-install-pair-desktop-connector",
          status: "now",
          presetTags: ["connector"],
          title: "Install and pair the Desktop Connector",
          body: [
            "Download the latest build for your OS from **GitHub Releases** (see **Settings → Connectors → Desktop Connector**).",
            "Launch the app, open the **tray / menu bar** UI, and read the **6-digit pairing code**.",
            "In the web app: **Settings → Connectors → Pair new device**, enter the code, then keep the desktop app running until status shows **connected**.",
            "Choose **mounted workspace folders** only inside the Connector; the runtime allows file operations **under those roots** only.",
          ],
          cta: { label: "Open connector settings", href: "/app/settings/connectors" },
        },
        {
          id: "browser-vs-desktop",
          status: "now",
          presetTags: ["connector"],
          title: "Browser scope vs a desktop connector",
          body: [
            "**Browser / cloud integrations** run through the platform’s governed proxy with OAuth-style grants you can **revoke** from **Settings → Connectors**. Data leaves the browser only along declared scopes and product rules.",
            "A **desktop connector** runs as a **separate tray app** with **explicit pairing** and **device-level unpair**; it is for **local files and paths**, while browser connectors target **cloud APIs** (e.g. Calendar, Notion).",
            "High-risk **writes** to new path prefixes may require a **Trust card confirmation** in the web app before the Connector executes.",
            "**Enterprise SSO** for organizations is **not** part of the V1.3 baseline—today, team access is centered on **invited accounts** and Space membership. Treat SSO as **in progress** on the roadmap until announced otherwise.",
          ],
          cta: { label: "Connector settings", href: "/app/settings/connectors" },
        },
        {
          id: "calendar-permissions",
          status: "now",
          presetTags: ["connector"],
          title: "Google Calendar permissions",
          body: [
            "Calendar access is **scoped** to what you approve during connect. If an Agent needs more than you granted, the product should ask you to **re-authorize** rather than failing silently.",
            "You can **revoke** Calendar from **Settings → Connectors**; the next task that needs calendar data should prompt you to reconnect.",
          ],
        },
        {
          id: "notion-permissions",
          status: "now",
          presetTags: ["connector"],
          title: "Notion permissions",
          body: [
            "Notion connections follow the same pattern: **least privilege**, **visible scopes**, and **revocation** from **Settings → Connectors**.",
            "If pages fail to load, check that the integration still has access and that you did not remove the underlying workspace share.",
          ],
        },
        {
          id: "enterprise-sso",
          status: "in_progress",
          presetTags: [],
          title: "Enterprise SSO",
          body: [
            "**Enterprise SSO** (SAML/OIDC with your IdP) is **not** in the V1.3 consumer baseline. Team access today is **email invitations** and **Space** membership.",
            "When SSO ships, this article will be updated with setup steps and security boundaries—until then, treat any preview as **non-production** unless explicitly announced.",
          ],
        },
      ],
    },
    {
      id: "privacy-security",
      title: "Privacy & security",
      articles: [
        {
          id: "data-location-visibility",
          status: "now",
          presetTags: [],
          title: "Where data lives and who can see it",
          body: [
            "Conversation content and platform records are stored according to the **privacy policy** and retention rules in force for your environment. **Do not** assume infinite history—retention may differ by plan and data class.",
            "Within a **Space**, visibility follows **membership and roles**; guests are more restricted than members. Agent invocations are still governed by **trust policy** and receipts.",
          ],
          cta: { label: "Privacy policy", href: "/privacy" },
        },
        {
          id: "data-retention-how-long",
          status: "now",
          presetTags: [],
          title: "How long is data kept?",
          body: [
            "Retention depends on the **class of data** (conversation text, audit logs, invocation receipts, scheduled run history, and more). **Placeholder periods** in our matrix (for example **~365 days** for typical message bodies and **longer** windows for compliance-grade audit) follow engineering defaults until **legal** approves final numbers—see the privacy policy for the user-facing summary.",
            "After **archival**, content may **disappear from normal product views**. **Exports** generally cover in-retention material only unless a separate policy says otherwise.",
            "**Account deletion** is handled through support and the privacy policy; some records may be **anonymized** or kept where **law** requires.",
          ],
          cta: { label: "Privacy policy", href: "/privacy" },
        },
        {
          id: "report-inappropriate-content",
          status: "now",
          presetTags: [],
          title: "How do I report inappropriate messages?",
          body: [
            "In conversations with **multiple human participants**, **right-click** someone else’s **user message** (or **long-press** on touch devices), choose **Report**, pick a **reason**, and add optional details.",
            "**Space owners and admins** can **hide** a message after review; other members then see the standard moderation placeholder instead of the original text.",
            "Misuse of reporting can violate policy—use it in good faith for **safety** concerns.",
          ],
        },
        {
          id: "quotas-usage",
          status: "now",
          presetTags: ["quota"],
          title: "Usage limits and quotas",
          body: [
            "The platform tracks usage such as **Agent deployments** and **subscription-style task runs**. When you approach limits, you should see **warnings**; at hard limits, new actions may be blocked until usage resets or your plan changes.",
            "Check **Settings → Usage & quotas** for current counters and links from **notification** deep links when quota alerts fire.",
          ],
          cta: { label: "Usage & quotas", href: "/app/settings/usage" },
        },
      ],
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      articles: [
        {
          id: "queue-wait",
          status: "now",
          presetTags: ["quota"],
          title: "Waiting in queue",
          body: [
            "Agents declare **concurrency** and **queue behavior**. When capacity is full, your request may wait with an **estimated wait** or be rejected with a clear message—this is not the same as a silent hang.",
            "If wait times are unacceptable, try another Agent with spare capacity or retry later; Space admins may adjust governance, but **supplier-side capacity** still applies.",
          ],
        },
        {
          id: "orchestration-partial-success",
          status: "now",
          presetTags: ["approval"],
          title: "Why did my plan stop at step 2?",
          body: [
            "Multi-step orchestrations can end in **partial success**: an earlier step may succeed while a later one **fails**, hits **trust policy**, **capacity**, or a **timeout**. The plan bar shows **which step failed** and offers **retry** or guidance to **change agents** when available.",
            "**Lease timeout** is called out on its own—retry when the connector or Agent is reachable, or adjust participants and generate a **fresh plan**.",
          ],
        },
        {
          id: "platform-503",
          status: "now",
          presetTags: [],
          title: "Platform errors (503 / unavailable)",
          body: [
            "If the platform or an upstream dependency is down, the client should show a **product error** state with actions such as **refresh** or **try again later**—not a blank screen.",
            "Persistent outages are operational incidents; use **contact** or support channels if self-serve recovery does not work.",
          ],
          cta: { label: "Help center", href: "/help" },
        },
        {
          id: "oauth-expired",
          status: "now",
          presetTags: ["connector"],
          title: "OAuth expired or revoked",
          body: [
            "Tokens can **expire** or be **revoked** at the provider. The next action that needs the integration should surface **reconnect** guidance instead of failing without explanation.",
            "From **Settings → Connectors**, revoke stale grants and complete a fresh OAuth flow if the UI still shows an old connection.",
          ],
          cta: { label: "Connectors", href: "/app/settings/connectors" },
        },
      ],
    },
  ],
};

const ZH_HANT: HelpCenterView & { sections: HelpSectionView[] } = {
  metaTitle: "說明中心",
  metaDescription: "對話、連接器、隱私、確認、用量與疑難排解之精簡說明。",
  title: "說明中心",
  subtitle: "請使用下方主題或搜尋。",
  searchLabel: "搜尋說明",
  searchPlaceholder: "連接器、審批、額度、排隊、OAuth…",
  resultsCountTemplate: "共 {count} 篇符合。",
  resultsEmpty: "沒有符合的文章。",
  presetChips: [
    { tag: "connector", label: "連接器" },
    { tag: "approval", label: "審批" },
    { tag: "quota", label: "用量與額度" },
  ],
  statusLabels: {
    now: "已上線",
    in_progress: "進行中",
  },
  roadmapFoot: {
    lead: "想確認下一步會上線什麼、哪些仍在研究？",
    cta: "查看路線圖",
    href: "/roadmap",
  },
  sections: [
    {
      id: "getting-started",
      title: "入門",
      articles: [
        {
          id: "quickstart-5m",
          status: "now",
          presetTags: [],
          title: "約五分鐘上手",
          body: [
            "登入後打開應用並進入對話。",
            "從智能體中心選用已上架智能體即可開始，無須先行部署自有智能體。",
            "平台會路由工作、套用 **信任策略**，並在執行完成時附上 **收據**。",
            "若要多智能體協作，可在對話中加入其他智能體；智能體中心會顯示容量與信任相關訊號。",
            "Space 擁有者可從 **設定 → Space 與成員** 邀請隊友；訪客權限較受限（例如可能無法產生邀請連結）。",
          ],
          cta: { label: "打開應用", href: "/app" },
        },
        {
          id: "what-is-receipt",
          status: "now",
          presetTags: [],
          title: "什麼是執行紀錄（常稱收據）？",
          body: [
            "口語常稱 **收據**：平台對某次調用的留痕，記錄在特定策略決策下**發生了什麼**、**放行或攔截**，以及可複製的 **識別碼**（便於支援或稽核）。",
            "執行紀錄**不代表**商業結果必然成功——它證明的是**受治理的執行路徑**。",
          ],
        },
        {
          id: "trust-policy-plain",
          status: "now",
          presetTags: ["approval"],
          title: "規則白話說明",
          body: [
            "以一般語句來說，規則決定動作能否自動執行、是否需要 **你確認**，或是否 **被擋下**。對話中可能出現卡片說明決策，並附 **原因碼**。",
            "工程語境下即 **信任策略**。Space **擁有者／管理員**可能看到額外技術資訊（例如規則 ID），以利對齊治理流程。",
          ],
        },
        {
          id: "approvals-hitl",
          status: "now",
          presetTags: ["approval"],
          title: "審批、覆核與通知",
          body: [
            "風險較高時，平台可能要求在 Agent 繼續前完成 **人工確認**。請在對話中的 **信任卡片** 上確認或拒絕。",
            "與覆核相關的事件也會出現在 **通知**；若有 deep link，點擊可回到對應對話。",
            "示範環境可能有獨立的 **審批** 入口；若你的工作流將高風險工作導向該處，請從該入口處理。",
          ],
          cta: { label: "審批示範（需登入）", href: "/app/recovery-hitl" },
        },
        {
          id: "agent-delegated-invites",
          status: "now",
          presetTags: [],
          title: "助理會幫我拉別的 Agent 進對話嗎？",
          body: [
            "在 **Space 規則**、**RBAC** 與 **信任策略** 允許時，對話中的參與者（含自動化流程）可能**加入 Agent**。",
            "若你不應看到新的 Agent，請 **Space 擁有者／管理員** 檢視成員與連接器權限；在權限允許時，通常可從參與者列 **移除** Agent。",
          ],
        },
        {
          id: "scheduled-tasks-explained",
          status: "now",
          presetTags: ["quota"],
          title: "什麼是定時任務？",
          body: [
            "**定時任務**是帶 **UTC cron** 的 **B 類編排**。在工作區支援時，可從聊天中的**多 Agent 方案**建立。",
            "於 **設定 → 排程任務** 管理：**暫停**、**恢復**並開啟來源對話。與路線圖一致，此能力在目前版本波次為 **已上線**。",
          ],
          cta: { label: "排程任務", href: "/app/settings/scheduled-tasks" },
        },
      ],
    },
    {
      id: "connectors",
      title: "連接器",
      articles: [
        {
          id: "what-is-desktop-connector",
          status: "now",
          presetTags: ["connector"],
          title: "什麼是桌面 Connector？",
          body: [
            "**桌面 Connector** 是輕量 **托盤／選單列應用**（macOS／Windows），透過應用內顯示的 **6 位數配對碼** 與 GaiaLynk 帳號連線。",
            "當你在 Web 端同意後，由它在 **本機** 執行受治理的 **檔案列表、讀取、寫入**——**無需**讓瀏覽器直接存取你的檔案系統。",
            "可在 **設定 → 連接器** **解綁** 裝置；收據與稽核事件仍會經平台留存以利追溯。",
          ],
          cta: { label: "連接器設定", href: "/app/settings/connectors" },
        },
        {
          id: "how-to-install-pair-desktop-connector",
          status: "now",
          presetTags: ["connector"],
          title: "如何安裝與配對桌面 Connector？",
          body: [
            "自 **GitHub Releases** 下載適用作業系統的版本（**設定 → 連接器 → 桌面 Connector** 有入口連結）。",
            "啟動應用，在 **托盤／選單列** 介面查看 **6 位數配對碼**。",
            "於 Web：**設定 → 連接器 → 配對新裝置**，輸入配對碼並保持桌面應用執行，直至狀態顯示 **已連線**。",
            "僅在 Connector 內選擇要掛載的 **工作區資料夾**；執行階段僅允許在 **這些根目錄樹內** 的檔案操作。",
          ],
          cta: { label: "開啟連接器設定", href: "/app/settings/connectors" },
        },
        {
          id: "browser-vs-desktop",
          status: "now",
          presetTags: ["connector"],
          title: "瀏覽器範圍與桌面連接器",
          body: [
            "**瀏覽器／雲端整合**透過平台受治理的代理與類 OAuth 授權完成；你可在 **設定 → 連接器** **撤銷**。資料僅在宣告的範圍與產品規則下離開瀏覽器環境。",
            "**桌面連接器**為獨立 **托盤應用**，需 **明示配對** 與 **裝置級解綁**；負責 **本機路徑與檔案**，瀏覽器連接器則面向 **雲端 API**（如日曆、Notion）。",
            "對 **新路徑前綴** 的高風險 **寫入**，Web 端可能先以 **信任卡片** 要求確認，再由 Connector 執行。",
            "**企業 SSO** 並非 V1.3 預設交付範圍——目前團隊協作以 **邀請帳號** 與 Space 成員為主。在官方公告前，請將 SSO 視為路線圖上的 **進行中** 能力。",
          ],
          cta: { label: "連接器設定", href: "/app/settings/connectors" },
        },
        {
          id: "calendar-permissions",
          status: "now",
          presetTags: ["connector"],
          title: "Google Calendar 權限",
          body: [
            "日曆權限以連線時你同意的 **範圍** 為準。若 Agent 需要更大權限，產品應引導 **重新授權**，而非靜默失敗。",
            "可在 **設定 → 連接器** **撤銷** 日曆；下次需要日曆資料時應提示重新連線。",
          ],
        },
        {
          id: "notion-permissions",
          status: "now",
          presetTags: ["connector"],
          title: "Notion 權限",
          body: [
            "Notion 連線同樣遵循 **最小權限**、**可見範圍** 與在 **設定 → 連接器** **撤銷**。",
            "若頁面讀取失敗，請確認整合仍有效，且底層工作區分享未被移除。",
          ],
        },
        {
          id: "enterprise-sso",
          status: "in_progress",
          presetTags: [],
          title: "企業 SSO",
          body: [
            "**企業 SSO**（與貴司 IdP 的 SAML/OIDC）**未**納入 V1.3 一般使用者基線。目前團隊協作以 **信箱邀請** 與 **Space** 成員為主。",
            "正式上線後本文會更新設定步驟與安全邊界；在官方公告前，任何預覽預設為 **非正式生產** 能力。",
          ],
        },
      ],
    },
    {
      id: "privacy-security",
      title: "隱私與安全",
      articles: [
        {
          id: "data-location-visibility",
          status: "now",
          presetTags: [],
          title: "資料存放與誰可見",
          body: [
            "對話內容與平台紀錄之存放與保留，依 **隱私權政策** 與當前環境的保留策略。**不要**假設紀錄永久可查——方案與資料類別可能影響保留期。",
            "在 **Space** 內，可見性依 **成員身分與角色**；訪客比成員更受限制。Agent 調用仍受 **信任策略** 與收據約束。",
          ],
          cta: { label: "隱私權政策", href: "/privacy" },
        },
        {
          id: "data-retention-how-long",
          status: "now",
          presetTags: [],
          title: "資料會保存多久？",
          body: [
            "保留期依**資料類別**而異（對話正文、稽核、調用收據、排程執行紀錄等）。矩陣中的**占位週期**（例如一般訊息約 **365 天**、合規向稽核可能更長）在**法務**定稿前與工程預設對齊——使用者摘要亦見 **隱私權政策**。",
            "**歸檔**後，內容可能自一般產品視圖**隱藏**。**匯出**通常僅涵蓋保留期內資料，另有政策者從其規定。",
            "**刪除帳號**依隱私權政策與支援流程辦理；部分紀錄可能**匿名化**或依法**留存**。",
          ],
          cta: { label: "隱私權政策", href: "/privacy" },
        },
        {
          id: "report-inappropriate-content",
          status: "now",
          presetTags: [],
          title: "如何檢舉不當訊息？",
          body: [
            "在**多名人類參與者**的對話中，對他人的**使用者訊息** **右鍵**（觸控裝置可**長按**）→ **檢舉** → 選擇**原因**並可填寫補充。",
            "**Space 擁有者／管理員**審視後可**隱藏**訊息；其他成員將看到標準審核占位，而非原文。",
            "濫用檢舉本身可能違反政策——請本於**安全**與善意使用。",
          ],
        },
        {
          id: "quotas-usage",
          status: "now",
          presetTags: ["quota"],
          title: "用量與額度",
          body: [
            "平台會追蹤如 **Agent 部署數**、**訂閱型任務執行** 等用量。接近上限時應出現 **警示**；觸及硬上限時，新動作可能被擋下，直到週期重置或方案調整。",
            "請在 **設定 → 用量與額度** 查看計數器；額度相關通知的 deep link 也會導向此處。",
          ],
          cta: { label: "用量與額度", href: "/app/settings/usage" },
        },
      ],
    },
    {
      id: "troubleshooting",
      title: "故障排除",
      articles: [
        {
          id: "queue-wait",
          status: "now",
          presetTags: ["quota"],
          title: "排隊與等待",
          body: [
            "Agent 會宣告 **併發** 與 **排隊行為**。容量滿載時，請求可能 **附估時等待** 或被 **明確拒絕**——這與無回應不同。",
            "若等待不可接受，可改選有餘量的 Agent 或稍後重試；治理調整無法繞過供應端容量上限。",
          ],
        },
        {
          id: "orchestration-partial-success",
          status: "now",
          presetTags: ["approval"],
          title: "為什麼停在第二步？",
          body: [
            "多步編排可能**部分成功**：前段步驟成功，後段可能因**失敗**、**信任策略**、**容量**或**逾時**而停住。方案列會標示**失敗步驟**，並在可用時提供**重試**或**調整 Agent** 指引。",
            "**租約逾時**會單獨標示——請在連接器或 Agent 可連線時重試，或調整參與者後取得**新方案**。",
          ],
        },
        {
          id: "platform-503",
          status: "now",
          presetTags: [],
          title: "平台錯誤（503／不可用）",
          body: [
            "若平台或上游不可用，客戶端應顯示 **產品錯誤** 狀態與如 **重新整理**、**稍後再試** 等動作，而非空白畫面。",
            "長時間不可用屬營運事件；若自助恢復無效，請透過 **聯絡** 或支援管道回報。",
          ],
          cta: { label: "說明中心", href: "/help" },
        },
        {
          id: "oauth-expired",
          status: "now",
          presetTags: ["connector"],
          title: "OAuth 過期或已撤銷",
          body: [
            "權杖可能 **過期** 或在廠商端被 **撤銷**。下次需要該整合時，應出現 **重新連線** 說明，而非無解釋失敗。",
            "在 **設定 → 連接器** 撤銷舊授權並完成新的 OAuth 流程，若介面仍顯示舊連線。",
          ],
          cta: { label: "連接器", href: "/app/settings/connectors" },
        },
      ],
    },
  ],
};

const ZH_HANS: HelpCenterView & { sections: HelpSectionView[] } = {
  metaTitle: "帮助中心",
  metaDescription: "对话、连接器、隐私、确认、用量与疑难排解之精简说明。",
  title: "帮助中心",
  subtitle: "请使用下方主题或搜寻。",
  searchLabel: "搜寻说明",
  searchPlaceholder: "连接器、审批、额度、排队、OAuth…",
  resultsCountTemplate: "共 {count} 篇符合。",
  resultsEmpty: "没有符合的文章。",
  presetChips: [
    { tag: "connector", label: "连接器" },
    { tag: "approval", label: "审批" },
    { tag: "quota", label: "用量与额度" },
  ],
  statusLabels: {
    now: "已上线",
    in_progress: "进行中",
  },
  roadmapFoot: {
    lead: "想确认接下来上线什么、哪些仍在研究？",
    cta: "查看路线图",
    href: "/roadmap",
  },
  sections: [
    {
      id: "getting-started",
      title: "入门",
      articles: [
        {
          id: "quickstart-5m",
          status: "now",
          presetTags: [],
          title: "大约五分钟上手",
          body: [
            "登录后打开应用并进入对话。",
            "从智能体中心选用已上架智能体即可开始，无须先行部署自有智能体。",
            "平台会路由工作、应用 **信任策略**，并在执行完成时附上 **收据**。",
            "若要多智能体协作，可在对话中加入其他智能体；智能体中心会显示容量与信任相关信号。",
            "Space 所有者可以从 **设置 → Space 与成员** 邀请队友；访客权限更受限（例如可能无法生成邀请链接）。",
          ],
          cta: { label: "打开应用", href: "/app" },
        },
        {
          id: "what-is-receipt",
          status: "now",
          presetTags: [],
          title: "什么是执行记录（常称收据）？",
          body: [
            "口语常称 **收据**：平台对某次调用的留痕，记录在特定策略决策下**发生了什么**、**放行或拦截**，以及可复制的 **标识符**（便于支持或审计）。",
            "执行记录**不保证**业务结果一定成功——它证明的是**受治理的执行路径**。",
          ],
        },
        {
          id: "trust-policy-plain",
          status: "now",
          presetTags: ["approval"],
          title: "规则白话说明",
          body: [
            "以通俗语言来说，规则决定动作能否自动执行、是否需要 **你确认**，或是否 **被拦截**。对话中可能出现卡片说明决策，并附 **原因码**。",
            "工程语境下即 **信任策略**。Space **所有者/管理员**可能看到额外技术信息（例如规则 ID），以便对齐治理流程。",
          ],
        },
        {
          id: "approvals-hitl",
          status: "now",
          presetTags: ["approval"],
          title: "审批、复核与通知",
          body: [
            "风险较高时，平台可能要求在 Agent 继续前完成 **人工确认**。请在对话中的 **信任卡片** 上确认或拒绝。",
            "与复核相关的事件也会出现在 **通知**；若有 deep link，点击可回到对应会话。",
            "演示环境可能有独立的 **审批** 入口；若你的工作流将高风险工作导向该处，请从该入口处理。",
          ],
          cta: { label: "审批演示（需登录）", href: "/app/recovery-hitl" },
        },
        {
          id: "agent-delegated-invites",
          status: "now",
          presetTags: [],
          title: "助理会替我拉别的 Agent 吗？",
          body: [
            "在 **Space 规则**、**RBAC** 与 **信任策略** 允许时，对话中的参与者（含自动化流程）可以**加入 Agent**。",
            "若你不应看到新的 Agent，请 **Space 所有者/管理员** 检查成员与连接器权限；在权限允许时，通常可从参与者栏 **移除** Agent。",
          ],
        },
        {
          id: "scheduled-tasks-explained",
          status: "now",
          presetTags: ["quota"],
          title: "什么是定时任务？",
          body: [
            "**定时任务**是带 **UTC cron** 的 **B 类编排**。在工作区支持时，可从聊天中的**多 Agent 方案**创建。",
            "在 **设置 → 定时任务** 管理：**暂停**、**恢复**并打开来源会话。与路线图一致，该能力在当前版本波次为 **已上线**。",
          ],
          cta: { label: "定时任务", href: "/app/settings/scheduled-tasks" },
        },
      ],
    },
    {
      id: "connectors",
      title: "连接器",
      articles: [
        {
          id: "what-is-desktop-connector",
          status: "now",
          presetTags: ["connector"],
          title: "什么是桌面 Connector？",
          body: [
            "**桌面 Connector** 是轻量 **托盘/菜单栏应用**（macOS/Windows），通过应用内 **6 位配对码** 与你的 GaiaLynk 账号连接。",
            "在你于 Web 端同意后，由它在 **本机** 执行受治理的 **文件列表、读取、写入**——**无需**让浏览器直接访问你的文件系统。",
            "可在 **设置 → 连接器** **解绑** 设备；收据与审计事件仍会经平台留存以便追溯。",
          ],
          cta: { label: "连接器设置", href: "/app/settings/connectors" },
        },
        {
          id: "how-to-install-pair-desktop-connector",
          status: "now",
          presetTags: ["connector"],
          title: "如何安装与配对桌面 Connector？",
          body: [
            "从 **GitHub Releases** 下载适合你系统的版本（**设置 → 连接器 → 桌面 Connector** 提供链接）。",
            "启动应用，在 **托盘/菜单栏** 界面查看 **6 位配对码**。",
            "在 Web：**设置 → 连接器 → 配对新设备**，输入配对码并保持桌面应用运行，直到状态显示 **已连接**。",
            "仅在 Connector 内选择要挂载的 **工作区文件夹**；运行期只允许 **这些根目录树内** 的文件操作。",
          ],
          cta: { label: "打开连接器设置", href: "/app/settings/connectors" },
        },
        {
          id: "browser-vs-desktop",
          status: "now",
          presetTags: ["connector"],
          title: "浏览器范围与桌面连接器",
          body: [
            "**浏览器/云端集成**通过平台受治理的代理与类 OAuth 授权完成；你可以在 **设置 → 连接器** **撤销**。数据仅在声明的范围与产品规则下离开浏览器环境。",
            "**桌面连接器**是独立 **托盘应用**，需要 **显式配对** 与 **设备级解绑**；负责 **本机路径与文件**，浏览器连接器面向 **云端 API**（如日历、Notion）。",
            "对 **新路径前缀** 的高风险 **写入**，Web 端可能先用 **信任卡片** 要求确认，再由 Connector 执行。",
            "**企业 SSO** 不是 V1.3 默认可用范围——目前团队协作为 **邀请账号** 与 Space 成员为主。在官方宣布前，请将 SSO 视为路线图上的 **进行中** 能力。",
          ],
          cta: { label: "连接器设置", href: "/app/settings/connectors" },
        },
        {
          id: "calendar-permissions",
          status: "now",
          presetTags: ["connector"],
          title: "Google Calendar 权限",
          body: [
            "日历权限以连接时你同意的 **范围** 为准。若 Agent 需要更大权限，产品应引导 **重新授权**，而非静默失败。",
            "可在 **设置 → 连接器** **撤销** 日历；下次需要日历数据时应提示重新连接。",
          ],
        },
        {
          id: "notion-permissions",
          status: "now",
          presetTags: ["connector"],
          title: "Notion 权限",
          body: [
            "Notion 连接同样遵循 **最小权限**、**可见范围** 与在 **设置 → 连接器** **撤销**。",
            "若页面读取失败，请确认集成仍有效，且底层工作区分享未被移除。",
          ],
        },
        {
          id: "enterprise-sso",
          status: "in_progress",
          presetTags: [],
          title: "企业 SSO",
          body: [
            "**企业 SSO**（与贵司 IdP 的 SAML/OIDC）**未**纳入 V1.3 普通用户基线。目前团队协作为 **邮箱邀请** 与 **Space** 成员为主。",
            "正式上线后本文会更新设置步骤与安全边界；在官方宣布前，任何预览默认为 **非生产** 能力。",
          ],
        },
      ],
    },
    {
      id: "privacy-security",
      title: "隐私与安全",
      articles: [
        {
          id: "data-location-visibility",
          status: "now",
          presetTags: [],
          title: "数据存放在哪、谁可见",
          body: [
            "对话内容与平台记录的存放与保留，依 **隐私政策** 与当前环境的保留策略。**不要**假设记录永久可查——方案与数据类别可能影响保留期。",
            "在 **Space** 内，可见性依 **成员身份与角色**；访客比成员更受限制。Agent 调用仍受 **信任策略** 与收据约束。",
          ],
          cta: { label: "隐私政策", href: "/privacy" },
        },
        {
          id: "data-retention-how-long",
          status: "now",
          presetTags: [],
          title: "数据保存多久？",
          body: [
            "保留期因**数据类别**而异（对话正文、审计、调用收据、定时执行记录等）。矩阵中的**占位周期**（例如一般消息约 **365 天**、合规向审计可能更长）在**法务**定稿前与工程默认一致——面向用户的说明亦见 **隐私政策**。",
            "**归档**后，内容可能从常规产品视图**不可见**。**导出**通常仅包含保留期内数据，另有政策者从其规定。",
            "**删除账号**依隐私政策与支持流程办理；部分记录可能**匿名化**或依法**留存**。",
          ],
          cta: { label: "隐私政策", href: "/privacy" },
        },
        {
          id: "report-inappropriate-content",
          status: "now",
          presetTags: [],
          title: "如何举报不当消息？",
          body: [
            "在**多名人类参与者**的对话中，对他人的**用户消息** **右键**（触控设备可**长按**）→ **举报** → 选择**原因**并可填写补充。",
            "**Space 所有者/管理员**审视后可**隐藏**消息；其他成员将看到标准审核占位，而非原文。",
            "滥用举报本身可能违反政策——请出于**安全**与善意使用。",
          ],
        },
        {
          id: "quotas-usage",
          status: "now",
          presetTags: ["quota"],
          title: "用量与额度",
          body: [
            "平台会跟踪如 **Agent 部署数**、**订阅型任务执行** 等用量。接近上限时应出现 **警告**；触及硬上限时，新动作可能被拦截，直到周期重置或方案调整。",
            "请在 **设置 → 用量与额度** 查看计数器；额度相关通知的 deep link 也会指向此处。",
          ],
          cta: { label: "用量与额度", href: "/app/settings/usage" },
        },
      ],
    },
    {
      id: "troubleshooting",
      title: "故障排查",
      articles: [
        {
          id: "queue-wait",
          status: "now",
          presetTags: ["quota"],
          title: "排队与等待",
          body: [
            "Agent 会声明 **并发** 与 **排队行为**。容量满载时，请求可能 **带预估等待** 或被 **明确拒绝**——这与无响应不同。",
            "若等待不可接受，可改选有余量的 Agent 或稍后重试；治理调整无法绕过供应端容量上限。",
          ],
        },
        {
          id: "orchestration-partial-success",
          status: "now",
          presetTags: ["approval"],
          title: "为什么停在第二步？",
          body: [
            "多步编排可能**部分成功**：前序步骤成功，后续可能因**失败**、**信任策略**、**容量**或**超时**而停止。方案条会标明**失败步骤**，并在可用时提供**重试**或**更换 Agent** 指引。",
            "**租约超时**会单独标注——请在连接器或 Agent 可达时重试，或调整参与者后生成**新方案**。",
          ],
        },
        {
          id: "platform-503",
          status: "now",
          presetTags: [],
          title: "平台错误（503/不可用）",
          body: [
            "若平台或上游不可用，客户端应显示 **产品错误** 状态与如 **刷新**、**稍后再试** 等动作，而非空白画面。",
            "长时间不可用属运维事件；若自助恢复无效，请通过 **联系我们** 或支持渠道反馈。",
          ],
          cta: { label: "帮助中心", href: "/help" },
        },
        {
          id: "oauth-expired",
          status: "now",
          presetTags: ["connector"],
          title: "OAuth 过期或已撤销",
          body: [
            "令牌可能 **过期** 或在厂商端被 **撤销**。下次需要该集成时，应出现 **重新连接** 说明，而非无解释失败。",
            "在 **设置 → 连接器** 撤销旧授权并完成新的 OAuth 流程，若界面仍显示旧连接。",
          ],
          cta: { label: "连接器", href: "/app/settings/connectors" },
        },
      ],
    },
  ],
};

function localizeHref(locale: Locale, path: string): string {
  return `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}

function localizeBundle(locale: Locale, raw: HelpCenterView & { sections: HelpSectionView[] }): HelpCenterView & { sections: HelpSectionView[] } {
  const sections = raw.sections.map((sec) => ({
    ...sec,
    articles: sec.articles.map((a) => ({
      ...a,
      cta: a.cta ? { ...a.cta, href: localizeHref(locale, a.cta.href) } : undefined,
    })),
  }));
  const roadmapFoot = {
    ...raw.roadmapFoot,
    href: localizeHref(locale, raw.roadmapFoot.href),
  };
  return { ...raw, sections, roadmapFoot };
}

export function getHelpCenter(locale: Locale): HelpCenterView & { sections: HelpSectionView[] } {
  switch (locale) {
    case "zh-Hant":
      return localizeBundle(locale, ZH_HANT);
    case "zh-Hans":
      return localizeBundle(locale, ZH_HANS);
    default:
      return localizeBundle("en", EN);
  }
}

/** Lowercase search haystack per article (locale-specific + shared tokens). */
export function helpArticleSearchHaystack(article: HelpArticleView, locale: Locale): string {
  const extra =
    locale === "en"
      ? "connector calendar notion oauth queue quota approval hitl trust receipt policy sso enterprise usage limit 503 retention archive report schedule orchestration step delegate invitation data save desktop pairing install github releases tray"
      : locale === "zh-Hant"
        ? "連接器 日曆 notion 佇列 額度 審批 覆核 信任 收據 策略 sso 用量 503 資料 保存 保留 檢舉 編排 第二步 定時 代理 邀請 桌面 配對 安裝 托盤"
        : "连接器 日历 notion 队列 额度 审批 复核 信任 收据 策略 sso 用量 503 数据 保存 保留 举报 编排 第二步 定时 代理 邀请 桌面 配对 安装 托盘";
  return [article.title, ...article.body, extra, article.presetTags.join(" ")].join(" ").toLowerCase();
}
