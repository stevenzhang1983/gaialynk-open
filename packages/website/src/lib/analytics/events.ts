import type { Locale } from "@/lib/i18n/locales";

export const ANALYTICS_EVENTS = [
  "page_view",
  "cta_click",
  "docs_click",
  "activation_event",
  "demo_click",
  "waitlist_submit",
  "demo_submit",
  "lang_switch",
  // Website entry CTA funnel (T-7.1)
  "scroll_depth",
  "consumer_browse_agents",
  "consumer_login_trigger",
  "consumer_first_conversation",
  "consumer_first_result",
  "provider_login_trigger",
  "provider_agent_info_filled",
  "provider_first_test_call_success",
  "submit_ask",
  "approval_action",
  "fallback_action",
  "export_action",
  "revoke_auth",
  "task_create",
  "task_pause",
  "task_resume",
  "task_archive",
  "task_delete",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export type AnalyticsPayload = {
  locale: Locale;
  page: string;
  referrer: string;
  timestamp: string;
  cta_id?: string;
  source?: string;
  device_type?: "mobile" | "desktop";
  is_suspected_bot?: boolean;
  action?: string;
  outcome?: string;
  task_id?: string;
  auth_id?: string;
};

export function inferDeviceType(width: number): "mobile" | "desktop" {
  return width < 768 ? "mobile" : "desktop";
}

export function buildAnalyticsPayload(
  payload: Omit<AnalyticsPayload, "timestamp"> & { timestamp?: string },
): AnalyticsPayload {
  return {
    ...payload,
    device_type: payload.device_type ?? "desktop",
    is_suspected_bot: payload.is_suspected_bot ?? false,
    timestamp: payload.timestamp ?? new Date().toISOString(),
  };
}
