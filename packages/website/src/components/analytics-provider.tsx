"use client";

import { useEffect } from "react";
import { buildAnalyticsPayload, inferDeviceType, type AnalyticsEventName, type AnalyticsPayload } from "@/lib/analytics/events";
import { setTrackAdapter } from "@/lib/analytics/track";
import { COOKIE_CONSENT_CHANGED_EVENT, hasAnalyticsConsentClient } from "@/lib/cookie-consent";

type DataLayerWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
};

type PosthogClient = { capture: (event: string, payload: Record<string, unknown>) => void };

export function AnalyticsProvider() {
  useEffect(() => {
    const sessionStartMs = Date.now();
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";
    let posthog: PosthogClient | null = null;
    let posthogInitStarted = false;

    async function ensurePosthog(): Promise<void> {
      if (!posthogKey || !hasAnalyticsConsentClient()) return;
      if (posthog || posthogInitStarted) return;
      posthogInitStarted = true;
      try {
        const module = await import("posthog-js");
        module.default.init(posthogKey, {
          api_host: posthogHost,
          capture_pageview: false,
          capture_pageleave: false,
        });
        posthog = module.default;
      } catch {
        posthog = null;
        posthogInitStarted = false;
      }
    }

    function runTrack(name: AnalyticsEventName, payload: AnalyticsPayload) {
      if (!hasAnalyticsConsentClient()) return;
      const win = window as DataLayerWindow;
      if (!win.dataLayer) {
        win.dataLayer = [];
      }
      const normalized = buildAnalyticsPayload({
        ...payload,
        device_type: payload.device_type ?? inferDeviceType(window.innerWidth),
      });
      win.dataLayer.push({
        event: name,
        ...normalized,
      });
      void fetch("/api/analytics/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          payload: {
            ...normalized,
            client_elapsed_ms: Date.now() - sessionStartMs,
            honeytoken: "",
          },
        }),
        keepalive: true,
      }).catch(() => null);
      void ensurePosthog().then(() => {
        if (posthog) {
          posthog.capture(name, normalized as Record<string, unknown>);
        }
      });
    }

    setTrackAdapter(runTrack);
    void ensurePosthog();

    const onConsent = () => {
      void ensurePosthog();
    };
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onConsent);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onConsent);
  }, []);

  return null;
}
