import type { Locale } from "@/lib/i18n/locales";

const UUID =
  "([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})";
const REVIEW_RE = new RegExp(`^/conversations/${UUID}/invocations/${UUID}/review/?$`, "i");
const ORCH_RE = new RegExp(`^/conversations/${UUID}/orchestrations/([^/?#]+)/?$`, "i");

/**
 * 将主线 `notification_events.deep_link` 转为官网产品区路径（含 locale）。
 * 审批类链接附带 `focus_invocation`，供 ChatWindow 滚动到 Trust 卡片。
 */
export function mapMainlineDeepLinkToProductHref(
  locale: Locale,
  deepLink: string | null | undefined,
): string | null {
  if (!deepLink || typeof deepLink !== "string") return null;
  const path = deepLink.trim().split("#")[0] ?? "";
  if (!path) return null;

  const review = path.match(REVIEW_RE);
  if (review) {
    const [, conversationId, invocationId] = review;
    return `/${locale}/app/chat/${conversationId}?focus_invocation=${encodeURIComponent(invocationId)}`;
  }

  const orch = path.match(ORCH_RE);
  if (orch) {
    const [, conversationId, runId] = orch;
    return `/${locale}/app/chat/${conversationId}?focus_orchestration=${encodeURIComponent(runId)}`;
  }

  if (path.startsWith("/settings/connectors")) {
    const q = path.includes("?") ? path.slice(path.indexOf("?")) : "";
    return `/${locale}/app/connectors-governance${q}`;
  }

  if (path.startsWith("/account/usage")) {
    const q = path.includes("?") ? path.slice(path.indexOf("?")) : "";
    return `/${locale}/app/settings/usage${q}`;
  }

  return null;
}
