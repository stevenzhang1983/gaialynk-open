import type { Locale } from "@/lib/i18n/locales";

export type VisionStatus = "Now" | "In Progress" | "Coming Soon" | "Planned" | "Research";

const LABELS: Record<Locale, Record<VisionStatus, string>> = {
  en: {
    Now: "Now",
    "In Progress": "In Progress",
    "Coming Soon": "Coming Soon",
    Planned: "Planned",
    Research: "Research",
  },
  "zh-Hant": {
    Now: "已上線",
    "In Progress": "進行中",
    "Coming Soon": "即將推出",
    Planned: "規劃中",
    Research: "研究中",
  },
  "zh-Hans": {
    Now: "已上线",
    "In Progress": "进行中",
    "Coming Soon": "即将推出",
    Planned: "规划中",
    Research: "研究中",
  },
};

/** T-6.5：路线图 / Use Cases / 入口页状态徽记三语 */
export function visionStatusLabel(locale: Locale, status: VisionStatus): string {
  return LABELS[locale][status];
}
