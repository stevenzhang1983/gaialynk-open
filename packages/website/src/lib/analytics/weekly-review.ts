import type { Locale } from "../i18n/locales";
import type { FunnelSnapshot } from "./funnel";

type BuildWeeklyReviewInput = {
  locale: Locale | "all";
  generatedAt: string;
  snapshot: FunnelSnapshot;
};

function renderAlertLines(snapshot: FunnelSnapshot): string {
  if (!snapshot.alerts.length) {
    return "- None";
  }
  return snapshot.alerts.map((item) => `- ${item.code} (${item.currentPct}% / threshold ${item.thresholdPct}%)`).join("\n");
}

function renderLocaleGapAlertLines(snapshot: FunnelSnapshot): string {
  if (!snapshot.localeGapAlerts.length) {
    return "- None";
  }
  return snapshot.localeGapAlerts
    .map((item) => `- ${item.code} (${item.bestLocale} -> ${item.worstLocale}, gap ${item.gapPct}%, threshold ${item.thresholdPct}%)`)
    .join("\n");
}

function renderPathAlertLines(snapshot: FunnelSnapshot): string {
  if (!snapshot.pathFunnel.alerts.length) {
    return "- None";
  }
  return snapshot.pathFunnel.alerts
    .map((item) => `- ${item.code} (${item.currentPct}% / threshold ${item.thresholdPct}%)`)
    .join("\n");
}

function renderLocaleDiagnosticsTable(snapshot: FunnelSnapshot): string {
  const rows = snapshot.localeDiagnostics
    .map((item) => `| ${item.locale} | ${item.homeViews} | ${item.startBuildingCtr}% | ${item.submitRate}% | ${item.suspectedTrafficSharePct}% |`)
    .join("\n");
  return [
    "| Locale | Home Views | Start Building CTR | Submit Rate | Suspected Share |",
    "| --- | ---: | ---: | ---: | ---: |",
    rows,
  ].join("\n");
}

export function buildWeeklyReviewMarkdown(input: BuildWeeklyReviewInput): string {
  const submitRate = Number((input.snapshot.rates.demoConversionRate + input.snapshot.rates.waitlistConversionRate).toFixed(2));
  return [
    "## Website Entry Weekly Review Snapshot",
    "",
    `- Generated at: ${input.generatedAt || "N/A"}`,
    `- Locale scope: ${input.locale}`,
    `- Last 24h events: ${input.snapshot.last24hEvents}`,
    "",
    "### Core Funnel",
    `- Home views: ${input.snapshot.counts.homeViews}`,
    `- Start Building CTR: ${input.snapshot.rates.startBuildingCtr}%`,
    `- Activation completion rate (docs -> activation): ${input.snapshot.rates.activationCompletionRate}%`,
    `- Submit rate (demo + waitlist): ${submitRate}%`,
    `- Suspected traffic share: ${input.snapshot.suspectedTrafficSharePct}%`,
    "",
    "### Funnel Alerts",
    renderAlertLines(input.snapshot),
    "",
    "### Locale Diagnostics",
    renderLocaleDiagnosticsTable(input.snapshot),
    "",
    "### Locale Gap Alerts",
    renderLocaleGapAlertLines(input.snapshot),
    "",
    "### Entry Path Funnel",
    `- Home -> Ask: ${input.snapshot.pathFunnel.rates.homeToAsk}%`,
    `- Ask -> Recovery: ${input.snapshot.pathFunnel.rates.askToRecovery}%`,
    `- Recovery -> Subscriptions: ${input.snapshot.pathFunnel.rates.recoveryToSubscriptions}%`,
    `- Subscriptions -> Waitlist: ${input.snapshot.pathFunnel.rates.subscriptionsToWaitlist}%`,
    "",
    "### Entry Path Alerts",
    renderPathAlertLines(input.snapshot),
    "",
    "### Alert -> Hypothesis -> Change -> Recovery",
    "*(At least one experiment per week; fill and track so conclusions are traceable.)*",
    "- **Alert:** (triggered alert from above, or describe)",
    "- **Hypothesis / 假设:** (what we think is the cause)",
    "- **Change / 改动:** (what we changed)",
    "- **Recovery / 回收结果:** (outcome or signal we will check)",
    "",
    "### Next Actions",
    "- Keep: ",
    "- Change: ",
    "- Experiment: ",
  ].join("\n");
}
