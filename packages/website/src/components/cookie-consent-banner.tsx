"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  buildConsentSnapshot,
  persistCookieConsentClient,
  readCookieConsentClient,
} from "@/lib/cookie-consent";
import { getCookieConsentCopy } from "@/content/i18n/product-experience";
import { isSupportedLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";

function localeFromPathname(pathname: string | null): Locale {
  if (!pathname) return "en";
  const seg = pathname.split("/").filter(Boolean)[0];
  return isSupportedLocale(seg) ? seg : "en";
}

/**
 * W-19：必要（不可关）+ 分析 + 营销；结果写入 `gaialynk_cookie_consent`。
 */
export function CookieConsentBanner() {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);
  const copy = getCookieConsentCopy(locale);
  const [visible, setVisible] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(false);
  const [marketingOn, setMarketingOn] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      const parsed = readCookieConsentClient();
      setVisible(!parsed);
    } catch {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(() => firstBtnRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const list = [...focusables].filter((el) => !el.hasAttribute("disabled"));
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  function applyChoice(analytics: boolean, marketing: boolean) {
    const snap = buildConsentSnapshot(analytics, marketing);
    persistCookieConsentClient(snap, { locale, path: pathname ?? undefined });
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  const privacyHref = `/${locale}/privacy`;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="gl-cookie-consent-title"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-card/98 p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md md:p-5"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <div>
          <h2 id="gl-cookie-consent-title" className="text-base font-semibold text-foreground">
            {copy.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.lead}</p>
          <Link
            href={privacyHref}
            className="mt-2 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {copy.privacyLink}
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex cursor-not-allowed items-start gap-3 rounded-lg border border-border bg-muted/40 p-3 opacity-90">
            <input type="checkbox" checked disabled className="mt-1" aria-readonly />
            <span>
              <span className="block text-sm font-medium text-foreground">{copy.necessaryLabel}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{copy.necessaryHint}</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-3">
            <input
              type="checkbox"
              checked={analyticsOn}
              onChange={(e) => setAnalyticsOn(e.target.checked)}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-foreground">{copy.analyticsLabel}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{copy.analyticsHint}</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-3">
            <input
              type="checkbox"
              checked={marketingOn}
              onChange={(e) => setMarketingOn(e.target.checked)}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-foreground">{copy.marketingLabel}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{copy.marketingHint}</span>
            </span>
          </label>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <button
            ref={firstBtnRef}
            type="button"
            className="order-2 rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted sm:order-1"
            onClick={() => applyChoice(false, false)}
          >
            {copy.rejectOptional}
          </button>
          <button
            type="button"
            className="order-3 rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted sm:order-2"
            onClick={() => applyChoice(analyticsOn, marketingOn)}
          >
            {copy.saveChoices}
          </button>
          <button
            type="button"
            className="order-1 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 sm:order-3"
            onClick={() => applyChoice(true, true)}
          >
            {copy.acceptAll}
          </button>
        </div>
      </div>
    </div>
  );
}
