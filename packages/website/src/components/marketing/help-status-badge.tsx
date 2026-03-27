import type { HelpArticleStatus } from "@/content/help-center";

type HelpStatusBadgeProps = {
  status: HelpArticleStatus;
  labels: Record<HelpArticleStatus, string>;
};

export function HelpStatusBadge({ status, labels }: HelpStatusBadgeProps) {
  const isSoon = status === "in_progress";
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-caption font-medium leading-none ${
        isSoon
          ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200"
          : "border-emerald-500/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
      }`}
    >
      {labels[status]}
    </span>
  );
}
