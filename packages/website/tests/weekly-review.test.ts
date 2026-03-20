import { describe, expect, test } from "vitest";
import { buildWeeklyReviewMarkdown } from "../src/lib/analytics/weekly-review";

describe("weekly review markdown", () => {
  test("renders key metrics, alerts, and locale diagnostics", () => {
    const markdown = buildWeeklyReviewMarkdown({
      locale: "all",
      generatedAt: "2026-03-15T16:00:00.000Z",
      snapshot: {
        locale: "all",
        counts: {
          homeViews: 100,
          startBuildingClicks: 12,
          docsClicks: 8,
          activationEvents: 6,
          demoSubmits: 2,
          waitlistSubmits: 3,
        },
        rates: {
          startBuildingCtr: 12,
          docsActivationRate: 66.67,
          activationCompletionRate: 75,
          demoConversionRate: 2,
          waitlistConversionRate: 3,
        },
        totalEvents: 200,
        suspectedEvents: 20,
        suspectedTrafficSharePct: 10,
        last24hEvents: 80,
        topCtas: [{ key: "start_building", count: 12 }],
        topPages: [{ key: "/en", count: 40 }],
        suspectedByHour24h: [],
        thresholds: {
          minStartBuildingCtrPct: 8,
          minSubmitRatePct: 2,
          maxSuspectedTrafficSharePct: 35,
        },
        alerts: [
          {
            code: "LOW_START_BUILDING_CTR",
            level: "warn",
            currentPct: 5,
            thresholdPct: 8,
            message: "Start Building CTR is below the minimum threshold.",
          },
        ],
        localeDiagnostics: [
          { locale: "en", homeViews: 50, startBuildingCtr: 15, submitRate: 4, suspectedTrafficSharePct: 8 },
          { locale: "zh-Hant", homeViews: 30, startBuildingCtr: 8, submitRate: 2, suspectedTrafficSharePct: 11 },
          { locale: "zh-Hans", homeViews: 20, startBuildingCtr: 5, submitRate: 1, suspectedTrafficSharePct: 12 },
        ],
        localeGapThresholds: {
          minCtrGapPct: 15,
          minSubmitRateGapPct: 5,
          minSuspectedShareGapPct: 10,
        },
        localeGapAlerts: [
          {
            code: "LOCALE_CTR_GAP_HIGH",
            gapPct: 10,
            thresholdPct: 8,
            bestLocale: "en",
            worstLocale: "zh-Hans",
          },
        ],
        consumerFunnel: {
          openAppClicks: 0,
          browseAgentsViews: 0,
          loginTriggers: 0,
          firstConversations: 0,
          firstResults: 0,
          rates: {
            openAppToBrowseAgents: 0,
            browseAgentsToLoginTriggers: 0,
            loginTriggersToFirstConversations: 0,
            firstConversationsToFirstResults: 0,
          },
        },
        providerFunnel: {
          startBuildingClicks: 0,
          readDocsClicks: 0,
          loginTriggers: 0,
          agentInfoFilled: 0,
          firstTestCalls: 0,
          rates: {
            startBuildingToReadDocs: 0,
            readDocsToLoginTriggers: 0,
            loginTriggersToAgentInfoFilled: 0,
            agentInfoFilledToFirstTestCalls: 0,
          },
        },
        pathFunnel: {
          homeViews: 100,
          askViews: 20,
          recoveryViews: 10,
          subscriptionsViews: 5,
          waitlistSubmits: 3,
          rates: {
            homeToAsk: 20,
            askToRecovery: 50,
            recoveryToSubscriptions: 50,
            subscriptionsToWaitlist: 60,
          },
          thresholds: {
            minAskToRecoveryPct: 45,
            minRecoveryToSubscriptionsPct: 35,
            minSubscriptionsToWaitlistPct: 20,
          },
          alerts: [
            {
              code: "LOW_ASK_TO_RECOVERY",
              level: "warn",
              currentPct: 20,
              thresholdPct: 45,
              message: "Ask to Recovery conversion is below threshold.",
            },
          ],
        },
      },
    });

    expect(markdown).toContain("Website Entry Weekly Review Snapshot");
    expect(markdown).toContain("Start Building CTR");
    expect(markdown).toContain("Activation completion rate");
    expect(markdown).toContain("LOW_START_BUILDING_CTR");
    expect(markdown).toContain("LOCALE_CTR_GAP_HIGH");
    expect(markdown).toContain("| en | 50 | 15% | 4% | 8% |");
    expect(markdown).toContain("### Alert -> Hypothesis -> Change -> Recovery");
    expect(markdown).toContain("**Alert:**");
    expect(markdown).toContain("**Hypothesis / 假设:**");
    expect(markdown).toContain("**Change / 改动:**");
    expect(markdown).toContain("**Recovery / 回收结果:**");
    expect(markdown).toContain("### Entry Path Funnel");
    expect(markdown).toContain("- Home -> Ask: 20%");
    expect(markdown).toContain("### Entry Path Alerts");
    expect(markdown).toContain("LOW_ASK_TO_RECOVERY");
  });
});
