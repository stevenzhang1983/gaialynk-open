import CronExpressionParser from "cron-parser";

/** Returns ISO timestamp strictly after `from` for the given 5-field cron expression. */
export function computeNextCronFireIso(cronExpression: string, from: Date): string {
  const interval = CronExpressionParser.parse(cronExpression.trim(), {
    currentDate: from,
    tz: "UTC",
  });
  return interval.next().toDate().toISOString();
}

export function assertValidCronExpression(cronExpression: string): void {
  CronExpressionParser.parse(cronExpression.trim(), { currentDate: new Date(), tz: "UTC" });
}
