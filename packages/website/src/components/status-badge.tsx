import type { Locale } from "@/lib/i18n/locales";
import { visionStatusLabel, type VisionStatus } from "@/content/i18n/vision-status";

type StatusBadgeProps = {
  status: VisionStatus;
  locale: Locale;
};

const STYLE_BY_STATUS: Record<VisionStatus, string> = {
  Now: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  "In Progress": "border-indigo-500/40 bg-indigo-500/10 text-indigo-200",
  "Coming Soon": "border-amber-500/40 bg-amber-500/10 text-amber-200",
  Planned: "border-zinc-500/40 bg-zinc-500/10 text-zinc-300",
  Research: "border-violet-500/40 bg-violet-500/10 text-violet-200",
};

/** T-6.5：状态文案随 locale 切换；西文站保留小号大写，中文不强制 uppercase 以免排版怪异 */
export function StatusBadge({ status, locale }: StatusBadgeProps) {
  const text = visionStatusLabel(locale, status);
  const typographic =
    locale === "en"
      ? "text-[10px] font-semibold uppercase tracking-wide"
      : "text-[11px] font-semibold tracking-wide";
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 ${typographic} ${STYLE_BY_STATUS[status]}`}
    >
      {text}
    </span>
  );
}
