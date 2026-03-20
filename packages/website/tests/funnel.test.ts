import { describe, expect, test } from "vitest";
import { buildFunnelSnapshot } from "../src/lib/analytics/funnel";

describe("funnel snapshot", () => {
  test("calculates counts and rates for locale", () => {
    const now = new Date("2026-01-01T01:00:00Z").getTime();
    const snapshot = buildFunnelSnapshot(
      [
        {
          name: "page_view",
          payload: { locale: "en", page: "/en", referrer: "direct", timestamp: "2026-01-01T00:00:00Z" },
          receivedAt: "2026-01-01T00:00:00Z",
        },
        {
          name: "cta_click",
          payload: {
            locale: "en",
            page: "home",
            referrer: "internal",
            timestamp: "2026-01-01T00:00:01Z",
            cta_id: "start_building",
          },
          receivedAt: "2026-01-01T00:00:01Z",
        },
        {
          name: "docs_click",
          payload: {
            locale: "en",
            page: "developers",
            referrer: "internal",
            timestamp: "2026-01-01T00:00:02Z",
            is_suspected_bot: true,
          },
          receivedAt: "2026-01-01T00:00:02Z",
        },
        {
          name: "activation_event",
          payload: {
            locale: "en",
            page: "docs_redirect",
            referrer: "internal",
            timestamp: "2026-01-01T00:00:03Z",
          },
          receivedAt: "2026-01-01T00:00:03Z",
        },
      ],
      "en",
      now,
      undefined,
      undefined,
      {
        minAskToRecoveryPct: 50,
        minRecoveryToSubscriptionsPct: 40,
        minSubscriptionsToWaitlistPct: 30,
      },
    );

    expect(snapshot.counts.homeViews).toBe(1);
    expect(snapshot.counts.startBuildingClicks).toBe(1);
    expect(snapshot.counts.docsClicks).toBe(1);
    expect(snapshot.counts.activationEvents).toBe(1);
    expect(snapshot.rates.startBuildingCtr).toBe(100);
    expect(snapshot.rates.docsActivationRate).toBe(100);
    expect(snapshot.rates.activationCompletionRate).toBe(100);
    expect(snapshot.topCtas[0]?.key).toBe("start_building");
    expect(snapshot.topPages[0]?.key).toBe("/en");
    expect(snapshot.suspectedEvents).toBe(1);
    expect(snapshot.suspectedTrafficSharePct).toBeGreaterThan(0);
    expect(snapshot.suspectedByHour24h).toHaveLength(24);
    expect(snapshot.pathFunnel.homeViews).toBe(1);
    expect(snapshot.pathFunnel.askViews).toBe(0);
    const recentBucket = snapshot.suspectedByHour24h[snapshot.suspectedByHour24h.length - 1];
    expect(recentBucket?.total).toBe(3);
    expect(recentBucket?.suspected).toBe(1);
  });

  test("emits funnel threshold alerts when metrics cross guardrails", () => {
    const now = new Date("2026-01-01T01:00:00Z").getTime();
    const snapshot = buildFunnelSnapshot(
      [
        {
          name: "page_view",
          payload: { locale: "en", page: "/en", referrer: "direct", timestamp: "2026-01-01T00:00:00Z" },
          receivedAt: "2026-01-01T00:00:00Z",
        },
        {
          name: "page_view",
          payload: { locale: "en", page: "/en", referrer: "direct", timestamp: "2026-01-01T00:10:00Z" },
          receivedAt: "2026-01-01T00:10:00Z",
        },
        {
          name: "page_view",
          payload: { locale: "en", page: "/en", referrer: "direct", timestamp: "2026-01-01T00:20:00Z" },
          receivedAt: "2026-01-01T00:20:00Z",
        },
        {
          name: "cta_click",
          payload: {
            locale: "en",
            page: "home",
            referrer: "internal",
            timestamp: "2026-01-01T00:21:00Z",
            cta_id: "start_building",
            is_suspected_bot: true,
          },
          receivedAt: "2026-01-01T00:21:00Z",
        },
      ],
      "en",
      now,
      {
        minStartBuildingCtrPct: 50,
        minSubmitRatePct: 20,
        maxSuspectedTrafficSharePct: 10,
      },
    );

    expect(snapshot.alerts.map((item) => item.code)).toContain("LOW_START_BUILDING_CTR");
    expect(snapshot.alerts.map((item) => item.code)).toContain("LOW_SUBMIT_RATE");
    expect(snapshot.alerts.map((item) => item.code)).toContain("HIGH_SUSPECTED_TRAFFIC_SHARE");
  });

  test("builds locale diagnostics and gap alerts", () => {
    const now = new Date("2026-01-01T01:00:00Z").getTime();
    const snapshot = buildFunnelSnapshot(
      [
        {
          name: "page_view",
          payload: { locale: "en", page: "/en", referrer: "direct", timestamp: "2026-01-01T00:00:00Z" },
          receivedAt: "2026-01-01T00:00:00Z",
        },
        {
          name: "cta_click",
          payload: {
            locale: "en",
            page: "home",
            referrer: "internal",
            timestamp: "2026-01-01T00:00:01Z",
            cta_id: "start_building",
          },
          receivedAt: "2026-01-01T00:00:01Z",
        },
        {
          name: "page_view",
          payload: { locale: "zh-Hans", page: "/zh-Hans", referrer: "direct", timestamp: "2026-01-01T00:10:00Z" },
          receivedAt: "2026-01-01T00:10:00Z",
        },
      ],
      "all",
      now,
      {
        minStartBuildingCtrPct: 0,
        minSubmitRatePct: 0,
        maxSuspectedTrafficSharePct: 100,
      },
      {
        minCtrGapPct: 20,
        minSubmitRateGapPct: 10,
        minSuspectedShareGapPct: 10,
      },
    );

    expect(snapshot.localeDiagnostics.length).toBe(3);
    expect(snapshot.localeGapAlerts.map((item) => item.code)).toContain("LOCALE_CTR_GAP_HIGH");
  });

  test("does not emit locale gap alert when locales are balanced", () => {
    const now = new Date("2026-01-01T01:00:00Z").getTime();
    const input = [
      {
        name: "page_view" as const,
        payload: { locale: "en" as const, page: "/en", referrer: "direct", timestamp: "2026-01-01T00:00:00Z" },
        receivedAt: "2026-01-01T00:00:00Z",
      },
      {
        name: "cta_click" as const,
        payload: { locale: "en" as const, page: "home", referrer: "internal", timestamp: "2026-01-01T00:01:00Z", cta_id: "start_building" },
        receivedAt: "2026-01-01T00:01:00Z",
      },
      {
        name: "page_view" as const,
        payload: { locale: "zh-Hant" as const, page: "/zh-Hant", referrer: "direct", timestamp: "2026-01-01T00:02:00Z" },
        receivedAt: "2026-01-01T00:02:00Z",
      },
      {
        name: "cta_click" as const,
        payload: { locale: "zh-Hant" as const, page: "home", referrer: "internal", timestamp: "2026-01-01T00:03:00Z", cta_id: "start_building" },
        receivedAt: "2026-01-01T00:03:00Z",
      },
      {
        name: "page_view" as const,
        payload: { locale: "zh-Hans" as const, page: "/zh-Hans", referrer: "direct", timestamp: "2026-01-01T00:04:00Z" },
        receivedAt: "2026-01-01T00:04:00Z",
      },
      {
        name: "cta_click" as const,
        payload: { locale: "zh-Hans" as const, page: "home", referrer: "internal", timestamp: "2026-01-01T00:05:00Z", cta_id: "start_building" },
        receivedAt: "2026-01-01T00:05:00Z",
      },
    ];
    const snapshot = buildFunnelSnapshot(
      input,
      "all",
      now,
      {
        minStartBuildingCtrPct: 0,
        minSubmitRatePct: 0,
        maxSuspectedTrafficSharePct: 100,
      },
      {
        minCtrGapPct: 20,
        minSubmitRateGapPct: 10,
        minSuspectedShareGapPct: 10,
      },
    );
    expect(snapshot.localeGapAlerts.length).toBe(0);
  });

  test("builds entry path funnel metrics", () => {
    const now = new Date("2026-01-01T01:00:00Z").getTime();
    const snapshot = buildFunnelSnapshot(
      [
        {
          name: "page_view",
          payload: { locale: "en", page: "/en", referrer: "direct", timestamp: "2026-01-01T00:00:00Z" },
          receivedAt: "2026-01-01T00:00:00Z",
        },
        {
          name: "page_view",
          payload: { locale: "en", page: "/en/ask", referrer: "internal", timestamp: "2026-01-01T00:01:00Z" },
          receivedAt: "2026-01-01T00:01:00Z",
        },
        {
          name: "page_view",
          payload: { locale: "en", page: "/en/recovery-hitl", referrer: "internal", timestamp: "2026-01-01T00:02:00Z" },
          receivedAt: "2026-01-01T00:02:00Z",
        },
        {
          name: "page_view",
          payload: { locale: "en", page: "/en/subscriptions", referrer: "internal", timestamp: "2026-01-01T00:03:00Z" },
          receivedAt: "2026-01-01T00:03:00Z",
        },
        {
          name: "waitlist_submit",
          payload: { locale: "en", page: "waitlist", referrer: "internal", timestamp: "2026-01-01T00:04:00Z" },
          receivedAt: "2026-01-01T00:04:00Z",
        },
      ],
      "en",
      now,
      undefined,
      undefined,
      {
        minAskToRecoveryPct: 50,
        minRecoveryToSubscriptionsPct: 40,
        minSubscriptionsToWaitlistPct: 30,
      },
    );

    expect(snapshot.pathFunnel.homeViews).toBe(1);
    expect(snapshot.pathFunnel.askViews).toBe(1);
    expect(snapshot.pathFunnel.recoveryViews).toBe(1);
    expect(snapshot.pathFunnel.subscriptionsViews).toBe(1);
    expect(snapshot.pathFunnel.waitlistSubmits).toBe(1);
    expect(snapshot.pathFunnel.rates.homeToAsk).toBe(100);
    expect(snapshot.pathFunnel.rates.askToRecovery).toBe(100);
    expect(snapshot.pathFunnel.rates.recoveryToSubscriptions).toBe(100);
    expect(snapshot.pathFunnel.rates.subscriptionsToWaitlist).toBe(100);
  });

  test("builds consumer and provider funnels", () => {
    const now = new Date("2026-01-01T01:00:00Z").getTime();
    const snapshot = buildFunnelSnapshot(
      [
        // Consumer funnel
        {
          name: "cta_click",
          payload: { locale: "en", page: "marketing", referrer: "internal", timestamp: "2026-01-01T00:00:00Z", cta_id: "open_app" },
          receivedAt: "2026-01-01T00:00:00Z",
        },
        {
          name: "consumer_browse_agents",
          payload: { locale: "en", page: "agent_directory", referrer: "internal", timestamp: "2026-01-01T00:01:00Z" },
          receivedAt: "2026-01-01T00:01:00Z",
        },
        {
          name: "consumer_login_trigger",
          payload: { locale: "en", page: "chat", referrer: "input_bar", timestamp: "2026-01-01T00:02:00Z" },
          receivedAt: "2026-01-01T00:02:00Z",
        },
        {
          name: "consumer_first_conversation",
          payload: { locale: "en", page: "onboarding/consumer", referrer: "mock", timestamp: "2026-01-01T00:03:00Z" },
          receivedAt: "2026-01-01T00:03:00Z",
        },
        {
          name: "consumer_first_result",
          payload: { locale: "en", page: "onboarding/consumer", referrer: "mock", timestamp: "2026-01-01T00:04:00Z" },
          receivedAt: "2026-01-01T00:04:00Z",
        },

        // Provider funnel
        {
          name: "cta_click",
          payload: { locale: "en", page: "marketing", referrer: "internal", timestamp: "2026-01-01T00:10:00Z", cta_id: "start_building" },
          receivedAt: "2026-01-01T00:10:00Z",
        },
        {
          name: "docs_click",
          payload: { locale: "en", page: "developers/quickstart", referrer: "internal", timestamp: "2026-01-01T00:11:00Z", cta_id: "read_quickstart" },
          receivedAt: "2026-01-01T00:11:00Z",
        },
        {
          name: "provider_login_trigger",
          payload: { locale: "en", page: "onboarding/provider", referrer: "internal", timestamp: "2026-01-01T00:12:00Z" },
          receivedAt: "2026-01-01T00:12:00Z",
        },
        {
          name: "provider_agent_info_filled",
          payload: { locale: "en", page: "onboarding/provider", referrer: "internal", timestamp: "2026-01-01T00:13:00Z" },
          receivedAt: "2026-01-01T00:13:00Z",
        },
        {
          name: "provider_first_test_call_success",
          payload: { locale: "en", page: "onboarding/provider", referrer: "internal", timestamp: "2026-01-01T00:14:00Z" },
          receivedAt: "2026-01-01T00:14:00Z",
        },
      ],
      "en",
      now,
      undefined,
      undefined,
      {
        minAskToRecoveryPct: 50,
        minRecoveryToSubscriptionsPct: 40,
        minSubscriptionsToWaitlistPct: 30,
      },
    );

    expect(snapshot.consumerFunnel.openAppClicks).toBe(1);
    expect(snapshot.consumerFunnel.browseAgentsViews).toBe(1);
    expect(snapshot.consumerFunnel.loginTriggers).toBe(1);
    expect(snapshot.consumerFunnel.firstConversations).toBe(1);
    expect(snapshot.consumerFunnel.firstResults).toBe(1);
    expect(snapshot.consumerFunnel.rates.openAppToBrowseAgents).toBe(100);

    expect(snapshot.providerFunnel.startBuildingClicks).toBe(1);
    expect(snapshot.providerFunnel.readDocsClicks).toBe(1);
    expect(snapshot.providerFunnel.loginTriggers).toBe(1);
    expect(snapshot.providerFunnel.agentInfoFilled).toBe(1);
    expect(snapshot.providerFunnel.firstTestCalls).toBe(1);
    expect(snapshot.providerFunnel.rates.startBuildingToReadDocs).toBe(100);
  });

  test("emits entry path alerts when stage conversion falls below thresholds", () => {
    const now = new Date("2026-01-01T01:00:00Z").getTime();
    const snapshot = buildFunnelSnapshot(
      [
        {
          name: "page_view",
          payload: { locale: "en", page: "/en", referrer: "direct", timestamp: "2026-01-01T00:00:00Z" },
          receivedAt: "2026-01-01T00:00:00Z",
        },
        {
          name: "page_view",
          payload: { locale: "en", page: "/en/ask", referrer: "internal", timestamp: "2026-01-01T00:01:00Z" },
          receivedAt: "2026-01-01T00:01:00Z",
        },
      ],
      "en",
      now,
      undefined,
      undefined,
      {
        minAskToRecoveryPct: 50,
        minRecoveryToSubscriptionsPct: 40,
        minSubscriptionsToWaitlistPct: 30,
      },
    );
    expect(snapshot.pathFunnel.alerts.map((item) => item.code)).toContain("LOW_ASK_TO_RECOVERY");
    expect(snapshot.pathFunnel.alerts.map((item) => item.code)).toContain("LOW_RECOVERY_TO_SUBSCRIPTIONS");
    expect(snapshot.pathFunnel.alerts.map((item) => item.code)).toContain("LOW_SUBSCRIPTIONS_TO_WAITLIST");
  });
});
