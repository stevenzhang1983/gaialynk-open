"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { isSupportedLocale, type Locale } from "@/lib/i18n/locales";
import { getW18AgentLifecycleCopy } from "@/content/i18n/product-experience";
import { lineFromUserFacingBundle } from "@/lib/product/locale-bundle";
import { buildUserFacingMessageFromReasonCodes } from "@/lib/product/reason-codes-user-facing";

export type InvocationReceiptApi = {
  id: string;
  conversation_id: string;
  space_id: string | null;
  agent_id: string;
  agent_name: string;
  requester_id: string;
  status: string;
  user_text: string;
  user_text_redacted: boolean;
  created_at: string;
  updated_at: string;
  orchestration_run_id?: string | null;
  orchestration_step_index?: number | null;
  visibility_role: "user" | "space_admin" | "developer" | "platform_admin";
  trust_decision?: {
    reason_codes?: string[];
    policy_rule_id?: string;
    user_facing_message?: { zh: string; en: string; ja: string };
    risk_level?: string;
    decision?: string;
  };
  agent_output_text?: string | null;
  agent_output_truncated?: boolean;
  error_detail?: string | null;
  developer_invocation_stats?: { count_last_30d: number };
};

type Props = {
  locale: string;
  invocationId: string;
};

export function InvocationReceiptDetailClient({ locale: localeRaw, invocationId }: Props) {
  const locale: Locale = isSupportedLocale(localeRaw) ? localeRaw : "en";
  const copy = getW18AgentLifecycleCopy(locale);
  const [data, setData] = useState<InvocationReceiptApi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/mainline/invocations/${encodeURIComponent(invocationId)}`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof json?.error?.message === "string"
            ? json.error.message
            : res.status === 404
              ? copy.notFound
              : copy.loadError;
        setData(null);
        setError(msg);
        return;
      }
      setData(json.data as InvocationReceiptApi);
    } catch {
      setData(null);
      setError(copy.loadError);
    } finally {
      setLoading(false);
    }
  }, [invocationId, copy.loadError, copy.notFound]);

  useEffect(() => {
    void load();
  }, [load]);

  const trustBundle = (td: NonNullable<InvocationReceiptApi["trust_decision"]>) => {
    if (
      td.user_facing_message &&
      typeof td.user_facing_message.zh === "string" &&
      typeof td.user_facing_message.en === "string" &&
      typeof td.user_facing_message.ja === "string"
    ) {
      return td.user_facing_message;
    }
    const codes = Array.isArray(td.reason_codes) ? td.reason_codes : [];
    return buildUserFacingMessageFromReasonCodes(codes);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{copy.receiptPageTitle}</h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{invocationId}</p>
        </div>
        <Link
          href={`/${locale}/app/chat`}
          className="text-sm font-medium text-primary hover:underline"
        >
          {copy.backToChat}
        </Link>
      </div>

      {loading && <p className="text-sm text-muted-foreground">{copy.loading}</p>}
      {error && !loading && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm text-foreground">
          {error}
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {copy.visibilityRoleLabel}
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {copy.visibilityRoles[data.visibility_role] ?? data.visibility_role}
            </p>
          </div>

          <dl className="grid gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2 sm:p-5">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">{copy.fieldAgent}</dt>
              <dd className="mt-0.5 text-sm text-foreground">{data.agent_name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">{copy.fieldStatus}</dt>
              <dd className="mt-0.5 text-sm text-foreground">{data.status}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-muted-foreground">{copy.fieldCreated}</dt>
              <dd className="mt-0.5 text-sm tabular-nums text-foreground">
                {new Date(data.created_at).toLocaleString()}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-muted-foreground">{copy.fieldUserText}</dt>
              <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground/90">
                {data.user_text}
                {data.user_text_redacted ? (
                  <span className="ml-2 text-xs text-amber-700 dark:text-amber-200">
                    ({copy.redactedNote})
                  </span>
                ) : null}
              </dd>
            </div>
            {data.agent_output_text != null && data.agent_output_text !== "" && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">{copy.fieldAgentOutput}</dt>
                <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground/90">
                  {data.agent_output_text}
                  {data.agent_output_truncated ? (
                    <span className="ml-2 text-xs text-muted-foreground">({copy.truncatedNote})</span>
                  ) : null}
                </dd>
              </div>
            )}
            {data.error_detail && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">{copy.fieldError}</dt>
                <dd className="mt-1 font-mono text-xs text-rose-800 dark:text-rose-200">{data.error_detail}</dd>
              </div>
            )}
            {data.developer_invocation_stats && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">{copy.fieldDevStats}</dt>
                <dd className="mt-0.5 text-sm tabular-nums text-foreground">
                  {copy.devStatsLast30d.replace(
                    "{{n}}",
                    String(data.developer_invocation_stats.count_last_30d),
                  )}
                </dd>
              </div>
            )}
            {(data.orchestration_run_id || data.orchestration_step_index != null) && (
              <div className="sm:col-span-2 font-mono text-xs text-muted-foreground">
                {data.orchestration_run_id ? `${copy.fieldOrchestration}: ${data.orchestration_run_id}` : null}
                {data.orchestration_step_index != null
                  ? ` · ${copy.fieldStep}: ${data.orchestration_step_index}`
                  : null}
              </div>
            )}
          </dl>

          {data.trust_decision && (
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-foreground">{copy.trustSectionTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                {lineFromUserFacingBundle(trustBundle(data.trust_decision), locale)}
              </p>
              {Array.isArray(data.trust_decision.reason_codes) && data.trust_decision.reason_codes.length > 0 && (
                <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                  reason_codes: {data.trust_decision.reason_codes.join(", ")}
                </p>
              )}
              {typeof data.trust_decision.policy_rule_id === "string" && (
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  policy_rule_id: {data.trust_decision.policy_rule_id}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
