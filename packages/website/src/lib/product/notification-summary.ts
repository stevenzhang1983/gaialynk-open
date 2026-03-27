import type { Locale } from "@/lib/i18n/locales";
import type { NotificationListItem } from "./notification-api-types";

function pickPayloadString(payload: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = payload[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/** 列表行摘要：优先 payload 多语字段，否则回退类型标签（由调用方传入）。 */
export function notificationRowSummary(item: NotificationListItem, locale: Locale): string {
  const p = item.payload ?? {};
  if (locale === "zh-Hans" || locale === "zh-Hant") {
    const zh = pickPayloadString(p, ["summary_zh", "summary", "message_zh"]);
    if (zh) return zh;
  }
  const en = pickPayloadString(p, ["summary_en", "summary", "message_en", "message", "summary_ja", "message_ja"]);
  if (en) return en;

  if (item.type === "task_completed") {
    const step = typeof p.step_index === "number" ? p.step_index + 1 : null;
    const outcome = typeof p.outcome === "string" ? p.outcome : "";
    if (step != null && outcome) return `Step ${step} — ${outcome}`;
    if (outcome) return outcome;
  }
  if (item.type === "connector_expiring") {
    const prov = pickPayloadString(p, ["provider"]);
    if (prov) return prov;
  }
  if (item.type === "quota_warning") {
    const pct = typeof p.percent === "number" ? `${p.percent}%` : pickPayloadString(p, ["level"]);
    if (pct) return pct;
  }
  return item.event_type || item.type;
}
