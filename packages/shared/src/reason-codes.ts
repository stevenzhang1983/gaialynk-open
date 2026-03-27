/**
 * Trust / policy reason_codes → trilingual user-facing copy (zh / en / ja).
 * Shared by mainline server and website (E-15).
 */

export type UserFacingLocaleBundle = {
  zh: string;
  en: string;
  ja: string;
};

const UNKNOWN: UserFacingLocaleBundle = {
  zh: "系统已记录该事件；如需详情请联系管理员或查看审计记录。",
  en: "This event was recorded. Contact support or check audit logs for details.",
  ja: "このイベントは記録されました。詳細はサポートまたは監査ログをご確認ください。",
};

const TRUST_REVIEW_PENDING: UserFacingLocaleBundle = {
  zh: "该调用正在等待人工或策略审批，请稍后在审批队列中处理。",
  en: "This invocation is awaiting policy or human review. Please check the review queue.",
  ja: "この呼び出しはポリシーまたは人的レビュー待ちです。承認キューをご確認ください。",
};

export const REASON_CODE_USER_FACING: Record<string, UserFacingLocaleBundle> = {
  identity_unverified: {
    zh: "无法验证该 Agent 的身份，已按策略拒绝执行。",
    en: "This agent’s identity could not be verified; execution was denied by policy.",
    ja: "エージェントの身元を確認できないため、ポリシーにより実行を拒否しました。",
  },
  capability_not_declared: {
    zh: "请求的能力未在 Agent 卡片中声明，已拒绝调用。",
    en: "The requested capability is not declared on the agent card; the call was denied.",
    ja: "要求された能力がエージェントカードに宣言されていないため、呼び出しを拒否しました。",
  },
  risk_critical_denied: {
    zh: "该能力被标记为极高风险，当前策略不允许自动执行。",
    en: "This capability is classified as critical risk and cannot run automatically under policy.",
    ja: "この能力は重大リスクと分類され、ポリシーにより自動実行できません。",
  },
  risk_high_requires_confirmation: {
    zh: "该操作风险较高，需要您确认后才能继续。",
    en: "This action is high risk and requires your confirmation before it can proceed.",
    ja: "この操作は高リスクのため、続行前に確認が必要です。",
  },
  identity_verified: {
    zh: "身份校验已通过。",
    en: "Identity checks passed.",
    ja: "身元確認に合格しました。",
  },
  capability_declared: {
    zh: "能力声明与请求一致。",
    en: "The capability is declared and matches the request.",
    ja: "能力が宣言され、要求と一致しています。",
  },
  risk_acceptable: {
    zh: "当前风险等级在可接受范围内。",
    en: "Risk level is acceptable under current policy.",
    ja: "現在のポリシー下でリスクレベルは許容範囲内です。",
  },
  delegation_scope_violation: {
    zh: "该调用超出委托授权范围，已被拦截。",
    en: "This call falls outside the delegated scope and was blocked.",
    ja: "この呼び出しは委任スコープ外のためブロックされました。",
  },
  prompt_injection_ignore_previous: {
    zh: "检测到可能忽略先前指令的内容，已按数据边界策略拦截。",
    en: "Content that may ignore prior instructions was detected and blocked by data-boundary policy.",
    ja: "以前の指示を無視しようとする内容が検出され、データ境界ポリシーでブロックされました。",
  },
  prompt_injection_system_prompt_exfiltration: {
    zh: "检测到试图套取系统提示的内容，已拦截。",
    en: "Attempt to extract system prompt content was detected and blocked.",
    ja: "システムプロンプトの抽出が疑われる内容のためブロックしました。",
  },
  prompt_injection_system_tag: {
    zh: "检测到可疑的系统标签片段，已拦截。",
    en: "Suspicious system-like tags were detected and blocked.",
    ja: "疑わしいシステムタグが検出され、ブロックしました。",
  },
  sensitive_data_exfiltration_attempt: {
    zh: "检测到疑似密钥或令牌等敏感信息，已拦截转发。",
    en: "Possible secrets or tokens were detected; forwarding was blocked.",
    ja: "秘密情報やトークンの疑いがあるため転送をブロックしました。",
  },
  boundary_pass: {
    zh: "数据边界检查通过。",
    en: "Data boundary checks passed.",
    ja: "データ境界チェックに合格しました。",
  },
  sensitive_domain_disclaimer: {
    zh: "输出涉及敏感领域，已附加免责声明；请谨慎采纳。",
    en: "Sensitive-domain disclaimer applies; use judgment when acting on this output.",
    ja: "センシティブ領域の免責事項が適用されます。内容の利用はご注意ください。",
  },
  not_for_retraining_boundary: {
    zh: "内容受数据使用边界约束，请勿用于再训练或二次分发。",
    en: "Content is subject to a no-retraining / redistribution boundary.",
    ja: "再学習や再配布を禁止するデータ境界が適用されています。",
  },
  trust_review_pending: TRUST_REVIEW_PENDING,
  /** E-15: Agent listing / gateway lifecycle */
  agent_maintenance: {
    zh: "该 Agent 处于维护中，暂不接受新的调用；已在执行的请求会继续完成。",
    en: "This agent is in maintenance and is not accepting new invocations; in-flight runs continue.",
    ja: "このエージェントはメンテナンス中のため新規呼び出しを受け付けていません。実行中のリクエストは完了まで続行されます。",
  },
  agent_delisted: {
    zh: "该 Agent 已下架，无法继续调用。",
    en: "This agent has been delisted and cannot be invoked.",
    ja: "このエージェントは掲載終了しており、呼び出しできません。",
  },
  /** E-20: desktop Connector 文件操作 */
  desktop_file_read_allow: {
    zh: "桌面连接器读取/列出文件已通过策略评估（中等风险）。",
    en: "Desktop connector read/list was evaluated as medium risk and allowed.",
    ja: "デスクトップコネクタの読取/一覧は中リスクとして許可されました。",
  },
  desktop_write_new_prefix_requires_confirmation: {
    zh: "首次向新目录前缀写入需要您在 Web 端确认后再执行。",
    en: "First write under a new path prefix requires confirmation in the web app before execution.",
    ja: "新しいパス接頭辞への初回書き込みは、実行前に Web で確認が必要です。",
  },
  desktop_write_known_prefix_allow: {
    zh: "在已使用过的路径前缀内写入已通过策略评估（中等风险）。",
    en: "Write within a previously used path prefix is medium risk and allowed.",
    ja: "既に使用したパス接頭辞内の書き込みは中リスクとして許可されました。",
  },
};

export const buildUserFacingMessageFromReasonCodes = (reasonCodes: string[]): UserFacingLocaleBundle => {
  const codes = reasonCodes.filter(Boolean);
  if (codes.length === 0) {
    return UNKNOWN;
  }
  const bundles = codes
    .map((c) => REASON_CODE_USER_FACING[c] ?? UNKNOWN)
    .filter(Boolean);
  if (bundles.length === 1) {
    return bundles[0]!;
  }
  const zh = bundles.map((b) => b.zh).join(" ");
  const en = bundles.map((b) => b.en).join(" ");
  const ja = bundles.map((b) => b.ja).join(" ");
  return { zh, en, ja };
};
