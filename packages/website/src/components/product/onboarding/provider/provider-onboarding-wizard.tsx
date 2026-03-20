"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { getProviderOnboardingCopy } from "@/content/onboarding/provider-onboarding-copy";
import type { Locale } from "@/lib/i18n/locales";
import type { RegisterAgentBody } from "@/lib/product/provider-agent-types";
import type { ProviderAgent } from "@/lib/product/provider-agent-types";
import { ProviderAgentFormStep } from "./steps/provider-agent-form-step";
import { ProviderCompleteStep } from "./steps/provider-complete-step";
import { ProviderHealthCheckStep } from "./steps/provider-health-check-step";
import { ProviderSubmitStep } from "./steps/provider-submit-step";
import { ProviderTestCallStep } from "./steps/provider-test-call-step";
import { ProviderWelcomeStep } from "./steps/provider-welcome-step";
import { useIdentity } from "@/lib/identity/context";
import { buildAnalyticsPayload } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track";

const STEP_COUNT = 6;

function sanitizeReturnUrl(locale: Locale, raw: string): string {
  const fallback = `/${locale}/app`;
  if (!raw.startsWith("/")) return fallback;
  if (!raw.startsWith(`/${locale}/`)) return fallback;
  if (raw.includes("//") || raw.includes("://")) return fallback;
  return raw;
}

type Props = {
  locale: Locale;
  returnUrl: string;
};

/**
 * T-4.8 Provider 引导：欢迎 → 填写 Agent 信息 → 连通性检查 → 测试调用 → 提交审核 → 完成。
 */
export function ProviderOnboardingWizard({ locale, returnUrl: returnUrlProp }: Props) {
  const returnUrl = sanitizeReturnUrl(locale, returnUrlProp);
  const copy = useMemo(() => getProviderOnboardingCopy(locale), [locale]);
  const { isAuthenticated } = useIdentity();
  const [step, setStep] = useState(0);
  const [agent, setAgent] = useState<ProviderAgent | null>(null);
  const [healthStatus, setHealthStatus] = useState<"ok" | "failed" | null>(null);
  const [healthCheckedAt, setHealthCheckedAt] = useState<string | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const didTrackProviderLoginRef = useRef(false);
  const didTrackProviderAgentInfoFilledRef = useRef(false);
  const didTrackProviderFirstTestCallSuccessRef = useRef(false);

  const goWelcome = useCallback(() => setStep(0), []);
  const goForm = useCallback(() => setStep(1), []);
  const goHealth = useCallback(() => setStep(2), []);
  const goTestCall = useCallback(() => setStep(3), []);
  const goSubmit = useCallback(() => setStep(4), []);
  const goComplete = useCallback(() => setStep(5), []);

  const handleRegister = useCallback(
    async (body: RegisterAgentBody) => {
      if (!isAuthenticated && !didTrackProviderLoginRef.current) {
        didTrackProviderLoginRef.current = true;
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(`gl_provider_login_trigger_tracked_${locale}`, "1");
        }
        trackEvent(
          "provider_login_trigger",
          buildAnalyticsPayload({
            locale,
            page: "onboarding/provider",
            referrer: "provider_onboarding",
            action: "submit_agent_form",
            outcome: "login_required",
          }),
        );
      }

      setRegisterError(null);
      setRegisterLoading(true);
      try {
        const res = await fetch("/api/mainline/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRegisterError(data?.error?.message ?? copy.errors.registrationFailed);
        return;
      }
      const created = data?.data as ProviderAgent | undefined;
      if (created?.id) {
        if (!didTrackProviderAgentInfoFilledRef.current) {
          didTrackProviderAgentInfoFilledRef.current = true;
          trackEvent(
            "provider_agent_info_filled",
            buildAnalyticsPayload({
              locale,
              page: "onboarding/provider",
              referrer: "provider_onboarding",
              action: "register_success",
              outcome: "agent_created",
            }),
          );
        }
        setAgent(created);
        setHealthStatus(null);
        setHealthCheckedAt(null);
        setHealthError(null);
        setTestOutput(null);
        setTestError(null);
        goHealth();
      } else {
        setRegisterError(copy.errors.invalidResponse);
      }
    } finally {
      setRegisterLoading(false);
    }
    },
    [goHealth, copy.errors, isAuthenticated, locale],
  );

  const triggerHealthCheck = useCallback(async () => {
    if (!agent) return;
    setHealthLoading(true);
    setHealthError(null);
    try {
      const runRes = await fetch(`/api/mainline/agents/${agent.id}/health-check`, { method: "POST" });
      const runData = await runRes.json().catch(() => ({}));
      if (!runRes.ok) {
        setHealthStatus("failed");
        setHealthError(runData?.error?.message ?? copy.errors.healthFailed);
        setHealthCheckedAt(new Date().toISOString());
        return;
      }
      const resultRes = await fetch(`/api/mainline/agents/${agent.id}/health-check/result`, { cache: "no-store" });
      const resultData = await resultRes.json().catch(() => ({}));
      const d = resultData?.data;
      setHealthStatus(d?.status ?? "failed");
      setHealthCheckedAt(d?.checked_at ?? new Date().toISOString());
      setHealthError(d?.error ?? runData?.data?.error ?? null);
    } finally {
      setHealthLoading(false);
    }
  }, [agent, copy.errors.healthFailed]);

  const triggerTestCall = useCallback(
    async (message: string) => {
      if (!agent) return;
      setTestLoading(true);
      setTestError(null);
      setTestOutput(null);
      try {
        const res = await fetch(`/api/mainline/agents/${agent.id}/test-call`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setTestError(data?.error?.message ?? copy.errors.testFailed);
          return;
        }
        setTestOutput(data?.data?.output_text ?? "");
        if (!didTrackProviderFirstTestCallSuccessRef.current) {
          didTrackProviderFirstTestCallSuccessRef.current = true;
          trackEvent(
            "provider_first_test_call_success",
            buildAnalyticsPayload({
              locale,
              page: "onboarding/provider",
              referrer: "provider_onboarding",
              action: "test_call_success",
              outcome: "invocation_accepted",
            }),
          );
        }
      } finally {
        setTestLoading(false);
      }
    },
    [agent, copy.errors.testFailed, locale],
  );

  const handleSubmitReview = useCallback(async () => {
    if (!agent) return;
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      const res = await fetch(`/api/mainline/agents/${agent.id}/submit-review`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data?.error?.message ?? copy.errors.submitFailed);
        return;
      }
      setAgent(data?.data ?? agent);
      goComplete();
    } finally {
      setSubmitLoading(false);
    }
  }, [agent, goComplete, copy.errors.submitFailed]);

  const progressLabel = copy.stepProgress(step + 1, STEP_COUNT);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copy.eyebrow}</p>
          <h1 className="text-2xl font-semibold text-foreground">{copy.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{progressLabel}</span>
          <Link href={returnUrl} className="text-xs text-primary underline hover:no-underline">
            {copy.skipToApp}
          </Link>
        </div>
      </header>

      <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${((step + 1) / STEP_COUNT) * 100}%` }}
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={STEP_COUNT}
          aria-label={progressLabel}
        />
      </div>

      {step === 0 && <ProviderWelcomeStep copy={copy.welcome} onNext={goForm} />}
      {step === 1 && (
        <ProviderAgentFormStep
          copy={copy.form}
          onSubmit={handleRegister}
          onBack={goWelcome}
          loading={registerLoading}
          error={registerError ?? undefined}
        />
      )}
      {step === 2 && agent && (
        <ProviderHealthCheckStep
          copy={copy.health}
          agent={agent}
          status={healthStatus}
          checkedAt={healthCheckedAt}
          error={healthError}
          loading={healthLoading}
          onTrigger={triggerHealthCheck}
          onNext={goTestCall}
          onBack={goForm}
        />
      )}
      {step === 3 && agent && (
        <ProviderTestCallStep
          copy={copy.test}
          onTrigger={triggerTestCall}
          loading={testLoading}
          outputText={testOutput}
          error={testError}
          onNext={goSubmit}
          onBack={goHealth}
        />
      )}
      {step === 4 && agent && (
        <ProviderSubmitStep
          copy={copy.submit}
          agent={agent}
          onSubmit={handleSubmitReview}
          loading={submitLoading}
          error={submitError}
          onBack={goTestCall}
        />
      )}
      {step === 5 && <ProviderCompleteStep copy={copy.complete} locale={locale} returnUrl={returnUrl} />}
    </div>
  );
}
