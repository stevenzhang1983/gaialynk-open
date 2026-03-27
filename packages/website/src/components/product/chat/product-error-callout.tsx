"use client";

import Link from "next/link";
import type { ProductErrorSurface } from "@/lib/product/chat-types";
import { formatWaitEstimate } from "@/lib/product/product-error-pattern";
import type { W7ProductResilienceCopy } from "@/content/i18n/product-experience";
import type { Locale } from "@/lib/i18n/locales";

type ProductErrorCalloutProps = {
  surface: ProductErrorSurface;
  copy: W7ProductResilienceCopy;
  locale: Locale;
  onRetrySamePayload?: () => void;
  onRefreshThread?: () => void;
  /** W-22：与 surface.helpArticleId 同时存在时链至帮助中心锚点 */
  helpArticleHref?: string | null;
};

function pickTitleBody(
  surface: ProductErrorSurface,
  w7: W7ProductResilienceCopy,
  locale: Locale,
): { title: string; body: string; estimateLine: string | null } {
  const est = formatWaitEstimate(surface.estimatedWaitMs, locale);
  const estimateLine =
    surface.pattern === "queue_saturated" && est
      ? w7.queueEstimate.replace("{{estimate}}", est)
      : null;

  switch (surface.pattern) {
    case "platform_fault":
      return { title: w7.platformTitle, body: w7.platformBody, estimateLine: null };
    case "agent_unavailable":
      return { title: w7.agentTitle, body: w7.agentBody, estimateLine: null };
    case "queue_saturated":
      return { title: w7.queueTitle, body: w7.queueBody, estimateLine };
    case "connector":
      return { title: w7.connectorTitle, body: w7.connectorBody, estimateLine: null };
    default:
      return { title: w7.policyTitle, body: w7.policyBody, estimateLine: null };
  }
}

const SUPPORT_MAIL = "mailto:support@gaialynk.com?subject=GaiaLynk%20consumer%20support";

/**
 * W-7：与 Trust 卡片区分的错误面（平台 / Agent / 队列 / 连接器 / 其他策略）。
 */
export function ProductErrorCallout({
  surface,
  copy,
  locale,
  onRetrySamePayload,
  onRefreshThread,
  helpArticleHref,
}: ProductErrorCalloutProps) {
  const { title, body, estimateLine } = pickTitleBody(surface, copy, locale);
  const agentsHref = `/${locale}/app/agents`;
  const settingsHref = `/${locale}/app/settings/connectors`;

  return (
    <div
      className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2.5 text-sm shadow-sm dark:border-amber-400/25 dark:bg-amber-500/5"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-950 dark:text-amber-100">
        {title}
      </p>
      <p className="mt-1 text-base leading-relaxed text-foreground">{body}</p>
      {estimateLine ? (
        <p className="mt-1.5 text-xs font-medium text-amber-900/90 dark:text-amber-100/90">{estimateLine}</p>
      ) : null}
      {surface.code ? (
        <p className="mt-1 font-mono text-[0.65rem] text-muted-foreground">code: {surface.code}</p>
      ) : null}
      <div className="mt-2.5 flex flex-wrap gap-2">
        {surface.canRetrySamePayload && onRetrySamePayload ? (
          <button
            type="button"
            onClick={onRetrySamePayload}
            className="rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {copy.retrySameMessage}
          </button>
        ) : null}
        {onRefreshThread ? (
          <button
            type="button"
            onClick={onRefreshThread}
            className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted"
          >
            {copy.refreshMessages}
          </button>
        ) : null}
        <Link
          href={agentsHref}
          className="inline-flex items-center rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted"
        >
          {copy.openAgents}
        </Link>
        {surface.pattern === "connector" ? (
          <Link
            href={settingsHref}
            className="inline-flex items-center rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted"
          >
            {copy.openSettings}
          </Link>
        ) : null}
        {surface.helpArticleId && helpArticleHref ? (
          <Link
            href={helpArticleHref}
            className="inline-flex items-center rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted"
          >
            {copy.connectorDesktopHelpCta}
          </Link>
        ) : null}
        <a
          href={SUPPORT_MAIL}
          className="inline-flex items-center rounded-md border border-transparent px-2.5 py-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
        >
          {copy.contactSupport}
        </a>
      </div>
    </div>
  );
}
