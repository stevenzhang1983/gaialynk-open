/**
 * W-7：与 CTO 补充 §6.1 对齐的 API 错误分类（主线 + BFF）。
 */

export type ProductErrorPattern =
  | "platform_fault"
  | "agent_unavailable"
  | "queue_saturated"
  | "policy_other"
  | "connector";

export type ClassifiedProductError = {
  pattern: ProductErrorPattern;
  /** 主线 / BFF error.code */
  code?: string;
  estimatedWaitMs?: number;
  /** 是否在收到 HTTP 响应前失败（用于决定是否提供「用原文重试」） */
  networkLevelFailure: boolean;
  /** W-22 */
  helpArticleId?: string;
};

type ErrorJson = {
  error?: {
    code?: string;
    message?: string;
    details?: {
      estimated_wait_ms?: number;
      reason_codes?: string[];
      trust_decision?: unknown;
    };
  };
};

function num(ms: unknown): number | undefined {
  return typeof ms === "number" && Number.isFinite(ms) ? ms : undefined;
}

/**
 * 对「发送消息」类请求的响应做分类（Trust 403/422 在 chat-window 中已单独处理）。
 */
export function classifySendMessageError(
  status: number,
  json: unknown,
  networkLevelFailure: boolean,
): ClassifiedProductError | null {
  if (networkLevelFailure) {
    return { pattern: "platform_fault", networkLevelFailure: true };
  }

  const body = json as ErrorJson;
  const code = typeof body?.error?.code === "string" ? body.error.code : undefined;

  if (code === "mainline_unreachable") {
    return { pattern: "platform_fault", code, networkLevelFailure: false };
  }

  if (code === "invocation_capacity_exceeded") {
    return {
      pattern: "queue_saturated",
      code,
      estimatedWaitMs: num(body.error?.details?.estimated_wait_ms),
      networkLevelFailure: false,
    };
  }

  if (code === "invocation_queue_timeout") {
    return { pattern: "queue_saturated", code, networkLevelFailure: false };
  }

  if (code === "a2a_invocation_failed") {
    return { pattern: "agent_unavailable", code, networkLevelFailure: false };
  }

  if (code === "device_not_found") {
    return {
      pattern: "connector",
      code,
      networkLevelFailure: false,
      helpArticleId: "how-to-install-pair-desktop-connector",
    };
  }

  if (
    code === "authorization_expired" ||
    code === "authorization_revoked" ||
    code === "authorization_not_found" ||
    code === "connector_unavailable"
  ) {
    return { pattern: "connector", code, networkLevelFailure: false };
  }

  if (code === "file_ref_invalid") {
    return { pattern: "connector", code, networkLevelFailure: false };
  }

  if (status === 401) {
    return { pattern: "policy_other", code: code ?? "unauthorized", networkLevelFailure: false };
  }

  if (status === 403 && code && code !== "invocation_denied") {
    return { pattern: "policy_other", code, networkLevelFailure: false };
  }

  if (status >= 500) {
    return { pattern: "platform_fault", code, networkLevelFailure: false };
  }

  return null;
}

export function formatWaitEstimate(ms: number | undefined, locale: string): string | null {
  if (ms == null || ms <= 0) return null;
  const sec = Math.ceil(ms / 1000);
  const min = Math.ceil(sec / 60);
  if (locale.startsWith("zh")) {
    if (min >= 2) return `约 ${min} 分钟`;
    return `约 ${sec} 秒`;
  }
  if (min >= 2) return `~${min} min`;
  return `~${sec}s`;
}
