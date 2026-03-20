import type { Locale } from "../i18n/locales";
import { SUPPORTED_LOCALES } from "../i18n/locales";
import type { AnalyticsEventName, AnalyticsPayload } from "./events";

type RawEvent = {
  name: AnalyticsEventName;
  payload: AnalyticsPayload;
  receivedAt: string;
};

type FunnelCounts = {
  homeViews: number;
  startBuildingClicks: number;
  docsClicks: number;
  activationEvents: number;
  demoSubmits: number;
  waitlistSubmits: number;
};

type ConsumerFunnelCounts = {
  openAppClicks: number;
  browseAgentsViews: number;
  loginTriggers: number;
  firstConversations: number;
  firstResults: number;
};

type ConsumerFunnelRates = {
  openAppToBrowseAgents: number;
  browseAgentsToLoginTriggers: number;
  loginTriggersToFirstConversations: number;
  firstConversationsToFirstResults: number;
};

type ConsumerFunnel = {
  counts: ConsumerFunnelCounts;
  rates: ConsumerFunnelRates;
};

type ProviderFunnelCounts = {
  startBuildingClicks: number;
  readDocsClicks: number;
  loginTriggers: number;
  agentInfoFilled: number;
  firstTestCalls: number;
};

type ProviderFunnelRates = {
  startBuildingToReadDocs: number;
  readDocsToLoginTriggers: number;
  loginTriggersToAgentInfoFilled: number;
  agentInfoFilledToFirstTestCalls: number;
};

type ProviderFunnel = {
  counts: ProviderFunnelCounts;
  rates: ProviderFunnelRates;
};

type BreakdownItem = {
  key: string;
  count: number;
};

type HourlySuspiciousItem = {
  hourOffset: number;
  total: number;
  suspected: number;
  suspectedSharePct: number;
};

type FunnelAlertCode = "LOW_START_BUILDING_CTR" | "LOW_SUBMIT_RATE" | "HIGH_SUSPECTED_TRAFFIC_SHARE";
type FunnelAlertLevel = "warn" | "critical";

type FunnelAlert = {
  code: FunnelAlertCode;
  level: FunnelAlertLevel;
  currentPct: number;
  thresholdPct: number;
  message: string;
};

type PathAlertCode = "LOW_ASK_TO_RECOVERY" | "LOW_RECOVERY_TO_SUBSCRIPTIONS" | "LOW_SUBSCRIPTIONS_TO_WAITLIST";
type PathAlert = {
  code: PathAlertCode;
  level: "warn";
  currentPct: number;
  thresholdPct: number;
  message: string;
};

export type FunnelThresholds = {
  minStartBuildingCtrPct: number;
  minSubmitRatePct: number;
  maxSuspectedTrafficSharePct: number;
};

export type LocaleGapThresholds = {
  minCtrGapPct: number;
  minSubmitRateGapPct: number;
  minSuspectedShareGapPct: number;
};

export type PathFunnelThresholds = {
  minAskToRecoveryPct: number;
  minRecoveryToSubscriptionsPct: number;
  minSubscriptionsToWaitlistPct: number;
};

type LocaleDiagnosticItem = {
  locale: Locale;
  homeViews: number;
  startBuildingCtr: number;
  submitRate: number;
  suspectedTrafficSharePct: number;
};

type LocaleGapAlertCode = "LOCALE_CTR_GAP_HIGH" | "LOCALE_SUBMIT_RATE_GAP_HIGH" | "LOCALE_SUSPECTED_TRAFFIC_GAP_HIGH";

type LocaleGapAlert = {
  code: LocaleGapAlertCode;
  gapPct: number;
  thresholdPct: number;
  bestLocale: Locale;
  worstLocale: Locale;
};

export type FunnelSnapshot = {
  locale: Locale | "all";
  counts: FunnelCounts;
  rates: {
    startBuildingCtr: number;
    docsActivationRate: number;
    activationCompletionRate: number;
    demoConversionRate: number;
    waitlistConversionRate: number;
  };
  totalEvents: number;
  suspectedEvents: number;
  suspectedTrafficSharePct: number;
  last24hEvents: number;
  topCtas: BreakdownItem[];
  topPages: BreakdownItem[];
  suspectedByHour24h: HourlySuspiciousItem[];
  thresholds: FunnelThresholds;
  alerts: FunnelAlert[];
  localeDiagnostics: LocaleDiagnosticItem[];
  localeGapThresholds: LocaleGapThresholds;
  localeGapAlerts: LocaleGapAlert[];
  consumerFunnel: {
    openAppClicks: number;
    browseAgentsViews: number;
    loginTriggers: number;
    firstConversations: number;
    firstResults: number;
    rates: ConsumerFunnelRates;
  };
  providerFunnel: {
    startBuildingClicks: number;
    readDocsClicks: number;
    loginTriggers: number;
    agentInfoFilled: number;
    firstTestCalls: number;
    rates: ProviderFunnelRates;
  };
  pathFunnel: {
    homeViews: number;
    askViews: number;
    recoveryViews: number;
    subscriptionsViews: number;
    waitlistSubmits: number;
    rates: {
      homeToAsk: number;
      askToRecovery: number;
      recoveryToSubscriptions: number;
      subscriptionsToWaitlist: number;
    };
    thresholds: {
      minAskToRecoveryPct: number;
      minRecoveryToSubscriptionsPct: number;
      minSubscriptionsToWaitlistPct: number;
    };
    alerts: PathAlert[];
  };
};

function rate(numerator: number, denominator: number): number {
  if (!denominator) {
    return 0;
  }
  return Number(((numerator / denominator) * 100).toFixed(2));
}

function readThreshold(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw || "");
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return Number(parsed.toFixed(2));
}

function resolveThresholds(overrides?: Partial<FunnelThresholds>): FunnelThresholds {
  return {
    minStartBuildingCtrPct:
      overrides?.minStartBuildingCtrPct ??
      readThreshold(process.env.GAIALYNK_ANALYTICS_ALERT_MIN_START_BUILDING_CTR_PCT, 8),
    minSubmitRatePct: overrides?.minSubmitRatePct ?? readThreshold(process.env.GAIALYNK_ANALYTICS_ALERT_MIN_SUBMIT_RATE_PCT, 2),
    maxSuspectedTrafficSharePct:
      overrides?.maxSuspectedTrafficSharePct ??
      readThreshold(process.env.GAIALYNK_ANALYTICS_ALERT_MAX_SUSPECTED_TRAFFIC_SHARE_PCT, 35),
  };
}

function resolveLocaleGapThresholds(overrides?: Partial<LocaleGapThresholds>): LocaleGapThresholds {
  return {
    minCtrGapPct: overrides?.minCtrGapPct ?? readThreshold(process.env.GAIALYNK_ANALYTICS_LOCALE_GAP_MIN_CTR_PCT, 15),
    minSubmitRateGapPct: overrides?.minSubmitRateGapPct ?? readThreshold(process.env.GAIALYNK_ANALYTICS_LOCALE_GAP_MIN_SUBMIT_RATE_PCT, 5),
    minSuspectedShareGapPct:
      overrides?.minSuspectedShareGapPct ?? readThreshold(process.env.GAIALYNK_ANALYTICS_LOCALE_GAP_MIN_SUSPECTED_SHARE_PCT, 10),
  };
}

function buildLocaleDiagnostics(events: RawEvent[]): LocaleDiagnosticItem[] {
  return SUPPORTED_LOCALES.map((locale) => {
    const filtered = events.filter((event) => event.payload.locale === locale);
    const homeViews = filtered.filter(
      (event) => event.name === "page_view" && (event.payload.page === "home" || event.payload.page.endsWith(`/${event.payload.locale}`)),
    ).length;
    const startBuildingClicks = filtered.filter(
      (event) => event.name === "cta_click" && event.payload.cta_id === "start_building",
    ).length;
    const submitRate = rate(
      filtered.filter((event) => event.name === "demo_submit" || event.name === "waitlist_submit").length,
      homeViews,
    );
    const suspectedTrafficSharePct = rate(
      filtered.filter((event) => event.payload.is_suspected_bot).length,
      filtered.length,
    );
    return {
      locale,
      homeViews,
      startBuildingCtr: rate(startBuildingClicks, homeViews),
      submitRate,
      suspectedTrafficSharePct,
    };
  });
}

function getGapAlert(input: {
  code: LocaleGapAlertCode;
  thresholdPct: number;
  rows: LocaleDiagnosticItem[];
  metric: (row: LocaleDiagnosticItem) => number;
}): LocaleGapAlert | null {
  const sorted = [...input.rows].sort((a, b) => input.metric(b) - input.metric(a));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  if (!best || !worst) {
    return null;
  }
  const gapPct = Number((input.metric(best) - input.metric(worst)).toFixed(2));
  if (gapPct < input.thresholdPct) {
    return null;
  }
  return {
    code: input.code,
    gapPct,
    thresholdPct: input.thresholdPct,
    bestLocale: best.locale,
    worstLocale: worst.locale,
  };
}

export function buildFunnelSnapshot(
  events: RawEvent[],
  locale: Locale | "all",
  nowMs = Date.now(),
  thresholdOverrides?: Partial<FunnelThresholds>,
  localeGapThresholdOverrides?: Partial<LocaleGapThresholds>,
  pathThresholdOverrides?: Partial<PathFunnelThresholds>,
): FunnelSnapshot {
  const filtered = locale === "all" ? events : events.filter((event) => event.payload.locale === locale);
  const last24hThreshold = nowMs - 24 * 60 * 60 * 1000;
  const thresholds = resolveThresholds(thresholdOverrides);
  const localeGapThresholds = resolveLocaleGapThresholds(localeGapThresholdOverrides);

  const consumerCounts: ConsumerFunnelCounts = {
    openAppClicks: filtered.filter((event) => event.name === "cta_click" && event.payload.cta_id === "open_app").length,
    browseAgentsViews: filtered.filter((event) => event.name === "consumer_browse_agents").length,
    loginTriggers: filtered.filter((event) => event.name === "consumer_login_trigger").length,
    firstConversations: filtered.filter((event) => event.name === "consumer_first_conversation").length,
    firstResults: filtered.filter((event) => event.name === "consumer_first_result").length,
  };
  const consumerRates: ConsumerFunnelRates = {
    openAppToBrowseAgents: rate(consumerCounts.browseAgentsViews, consumerCounts.openAppClicks),
    browseAgentsToLoginTriggers: rate(consumerCounts.loginTriggers, consumerCounts.browseAgentsViews),
    loginTriggersToFirstConversations: rate(consumerCounts.firstConversations, consumerCounts.loginTriggers),
    firstConversationsToFirstResults: rate(consumerCounts.firstResults, consumerCounts.firstConversations),
  };
  const providerCounts: ProviderFunnelCounts = {
    startBuildingClicks: filtered.filter((event) => event.name === "cta_click" && event.payload.cta_id === "start_building").length,
    readDocsClicks: filtered.filter(
      (event) => event.name === "docs_click" && event.payload.cta_id === "read_quickstart",
    ).length,
    loginTriggers: filtered.filter((event) => event.name === "provider_login_trigger").length,
    agentInfoFilled: filtered.filter((event) => event.name === "provider_agent_info_filled").length,
    firstTestCalls: filtered.filter((event) => event.name === "provider_first_test_call_success").length,
  };
  const providerRates: ProviderFunnelRates = {
    startBuildingToReadDocs: rate(providerCounts.readDocsClicks, providerCounts.startBuildingClicks),
    readDocsToLoginTriggers: rate(providerCounts.loginTriggers, providerCounts.readDocsClicks),
    loginTriggersToAgentInfoFilled: rate(providerCounts.agentInfoFilled, providerCounts.loginTriggers),
    agentInfoFilledToFirstTestCalls: rate(providerCounts.firstTestCalls, providerCounts.agentInfoFilled),
  };

  const counts: FunnelCounts = {
    homeViews: filtered.filter((event) => event.name === "page_view" && (event.payload.page === "home" || event.payload.page.endsWith(`/${event.payload.locale}`))).length,
    startBuildingClicks: filtered.filter(
      (event) => event.name === "cta_click" && event.payload.cta_id === "start_building",
    ).length,
    docsClicks: filtered.filter((event) => event.name === "docs_click").length,
    activationEvents: filtered.filter((event) => event.name === "activation_event").length,
    demoSubmits: filtered.filter((event) => event.name === "demo_submit").length,
    waitlistSubmits: filtered.filter((event) => event.name === "waitlist_submit").length,
  };
  const pathFunnelCounts = {
    homeViews: filtered.filter(
      (event) => event.name === "page_view" && (event.payload.page === "home" || event.payload.page.endsWith(`/${event.payload.locale}`)),
    ).length,
    askViews: filtered.filter((event) => event.name === "page_view" && event.payload.page.endsWith("/ask")).length,
    recoveryViews: filtered.filter((event) => event.name === "page_view" && event.payload.page.endsWith("/recovery-hitl")).length,
    subscriptionsViews: filtered.filter((event) => event.name === "page_view" && event.payload.page.endsWith("/subscriptions")).length,
    waitlistSubmits: filtered.filter((event) => event.name === "waitlist_submit").length,
  };
  const pathFunnelRates = {
    homeToAsk: rate(pathFunnelCounts.askViews, pathFunnelCounts.homeViews),
    askToRecovery: rate(pathFunnelCounts.recoveryViews, pathFunnelCounts.askViews),
    recoveryToSubscriptions: rate(pathFunnelCounts.subscriptionsViews, pathFunnelCounts.recoveryViews),
    subscriptionsToWaitlist: rate(pathFunnelCounts.waitlistSubmits, pathFunnelCounts.subscriptionsViews),
  };
  const pathThresholds: PathFunnelThresholds = {
    minAskToRecoveryPct:
      pathThresholdOverrides?.minAskToRecoveryPct ??
      readThreshold(process.env.GAIALYNK_ANALYTICS_PATH_MIN_ASK_TO_RECOVERY_PCT, 45),
    minRecoveryToSubscriptionsPct:
      pathThresholdOverrides?.minRecoveryToSubscriptionsPct ??
      readThreshold(process.env.GAIALYNK_ANALYTICS_PATH_MIN_RECOVERY_TO_SUBSCRIPTIONS_PCT, 35),
    minSubscriptionsToWaitlistPct:
      pathThresholdOverrides?.minSubscriptionsToWaitlistPct ??
      readThreshold(process.env.GAIALYNK_ANALYTICS_PATH_MIN_SUBSCRIPTIONS_TO_WAITLIST_PCT, 20),
  };
  const pathAlerts: PathAlert[] = [];
  if (pathFunnelRates.askToRecovery < pathThresholds.minAskToRecoveryPct) {
    pathAlerts.push({
      code: "LOW_ASK_TO_RECOVERY",
      level: "warn",
      currentPct: pathFunnelRates.askToRecovery,
      thresholdPct: pathThresholds.minAskToRecoveryPct,
      message: "Ask to Recovery conversion is below threshold.",
    });
  }
  if (pathFunnelRates.recoveryToSubscriptions < pathThresholds.minRecoveryToSubscriptionsPct) {
    pathAlerts.push({
      code: "LOW_RECOVERY_TO_SUBSCRIPTIONS",
      level: "warn",
      currentPct: pathFunnelRates.recoveryToSubscriptions,
      thresholdPct: pathThresholds.minRecoveryToSubscriptionsPct,
      message: "Recovery to Subscriptions conversion is below threshold.",
    });
  }
  if (pathFunnelRates.subscriptionsToWaitlist < pathThresholds.minSubscriptionsToWaitlistPct) {
    pathAlerts.push({
      code: "LOW_SUBSCRIPTIONS_TO_WAITLIST",
      level: "warn",
      currentPct: pathFunnelRates.subscriptionsToWaitlist,
      thresholdPct: pathThresholds.minSubscriptionsToWaitlistPct,
      message: "Subscriptions to Waitlist conversion is below threshold.",
    });
  }

  const ctaCounter = new Map<string, number>();
  const pageCounter = new Map<string, number>();
  for (const event of filtered) {
    if (event.payload.cta_id) {
      ctaCounter.set(event.payload.cta_id, (ctaCounter.get(event.payload.cta_id) ?? 0) + 1);
    }
    pageCounter.set(event.payload.page, (pageCounter.get(event.payload.page) ?? 0) + 1);
  }

  const topCtas = [...ctaCounter.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topPages = [...pageCounter.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const suspectedEvents = filtered.filter((event) => event.payload.is_suspected_bot).length;
  const byHour = Array.from({ length: 24 }, (_, index) => ({
    hourOffset: 23 - index,
    total: 0,
    suspected: 0,
    suspectedSharePct: 0,
  }));

  for (const event of filtered) {
    const eventMs = new Date(event.receivedAt).getTime();
    if (eventMs < last24hThreshold || eventMs > nowMs) {
      continue;
    }
    const ageHours = Math.floor((nowMs - eventMs) / (60 * 60 * 1000));
    const bucketIndex = 23 - ageHours;
    const bucket = byHour[bucketIndex];
    if (!bucket) {
      continue;
    }
    bucket.total += 1;
    if (event.payload.is_suspected_bot) {
      bucket.suspected += 1;
    }
  }

  for (const bucket of byHour) {
    bucket.suspectedSharePct = rate(bucket.suspected, bucket.total);
  }

  const startBuildingCtr = rate(counts.startBuildingClicks, counts.homeViews);
  const submitRate = rate(counts.demoSubmits + counts.waitlistSubmits, counts.homeViews);
  const suspectedTrafficSharePct = rate(suspectedEvents, filtered.length);
  const alerts: FunnelAlert[] = [];

  if (startBuildingCtr < thresholds.minStartBuildingCtrPct) {
    alerts.push({
      code: "LOW_START_BUILDING_CTR",
      level: "warn",
      currentPct: startBuildingCtr,
      thresholdPct: thresholds.minStartBuildingCtrPct,
      message: "Start Building CTR is below the minimum threshold.",
    });
  }
  if (submitRate < thresholds.minSubmitRatePct) {
    alerts.push({
      code: "LOW_SUBMIT_RATE",
      level: "warn",
      currentPct: submitRate,
      thresholdPct: thresholds.minSubmitRatePct,
      message: "Combined submit rate (demo + waitlist) is below threshold.",
    });
  }
  if (suspectedTrafficSharePct > thresholds.maxSuspectedTrafficSharePct) {
    alerts.push({
      code: "HIGH_SUSPECTED_TRAFFIC_SHARE",
      level: "critical",
      currentPct: suspectedTrafficSharePct,
      thresholdPct: thresholds.maxSuspectedTrafficSharePct,
      message: "Suspected traffic share exceeds maximum threshold.",
    });
  }

  const localeDiagnostics = buildLocaleDiagnostics(events);
  const localeGapAlerts: LocaleGapAlert[] = [];
  const ctrGapAlert = getGapAlert({
    code: "LOCALE_CTR_GAP_HIGH",
    thresholdPct: localeGapThresholds.minCtrGapPct,
    rows: localeDiagnostics,
    metric: (row) => row.startBuildingCtr,
  });
  if (ctrGapAlert) {
    localeGapAlerts.push(ctrGapAlert);
  }
  const submitGapAlert = getGapAlert({
    code: "LOCALE_SUBMIT_RATE_GAP_HIGH",
    thresholdPct: localeGapThresholds.minSubmitRateGapPct,
    rows: localeDiagnostics,
    metric: (row) => row.submitRate,
  });
  if (submitGapAlert) {
    localeGapAlerts.push(submitGapAlert);
  }
  const suspectedGapAlert = getGapAlert({
    code: "LOCALE_SUSPECTED_TRAFFIC_GAP_HIGH",
    thresholdPct: localeGapThresholds.minSuspectedShareGapPct,
    rows: localeDiagnostics,
    metric: (row) => row.suspectedTrafficSharePct,
  });
  if (suspectedGapAlert) {
    localeGapAlerts.push(suspectedGapAlert);
  }

  return {
    locale,
    counts,
    rates: {
      startBuildingCtr,
      docsActivationRate: rate(counts.docsClicks, counts.startBuildingClicks),
      activationCompletionRate: rate(counts.activationEvents, counts.docsClicks),
      demoConversionRate: rate(counts.demoSubmits, counts.homeViews),
      waitlistConversionRate: rate(counts.waitlistSubmits, counts.homeViews),
    },
    totalEvents: filtered.length,
    suspectedEvents,
    suspectedTrafficSharePct,
    last24hEvents: filtered.filter((event) => new Date(event.receivedAt).getTime() >= last24hThreshold).length,
    topCtas,
    topPages,
    suspectedByHour24h: byHour,
    thresholds,
    alerts,
    localeDiagnostics,
    localeGapThresholds,
    localeGapAlerts,
    consumerFunnel: {
      openAppClicks: consumerCounts.openAppClicks,
      browseAgentsViews: consumerCounts.browseAgentsViews,
      loginTriggers: consumerCounts.loginTriggers,
      firstConversations: consumerCounts.firstConversations,
      firstResults: consumerCounts.firstResults,
      rates: consumerRates,
    },
    providerFunnel: {
      startBuildingClicks: providerCounts.startBuildingClicks,
      readDocsClicks: providerCounts.readDocsClicks,
      loginTriggers: providerCounts.loginTriggers,
      agentInfoFilled: providerCounts.agentInfoFilled,
      firstTestCalls: providerCounts.firstTestCalls,
      rates: providerRates,
    },
    pathFunnel: {
      ...pathFunnelCounts,
      rates: pathFunnelRates,
      thresholds: pathThresholds,
      alerts: pathAlerts,
    },
  };
}
