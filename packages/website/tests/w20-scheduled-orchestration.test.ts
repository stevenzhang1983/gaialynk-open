import { describe, expect, test } from "vitest";
import { cronExpressionFromPicker, summarizeOrchestrationOutput } from "@/lib/product/orchestration-ui-helpers";

describe("W-20 scheduled orchestration helpers", () => {
  test("cronExpressionFromPicker presets", () => {
    expect(cronExpressionFromPicker({ preset: "daily9", customCron: "" })).toBe("0 9 * * *");
    expect(cronExpressionFromPicker({ preset: "weeklyMon9", customCron: "" })).toBe("0 9 * * 1");
    expect(cronExpressionFromPicker({ preset: "custom", customCron: " 15 14 * * * " })).toBe("15 14 * * *");
  });

  test("summarizeOrchestrationOutput prefers text field", () => {
    expect(summarizeOrchestrationOutput({ text: "  hello world  " })).toBe("hello world");
    expect(summarizeOrchestrationOutput({ a: "x", b: 2 })).toContain("a:");
  });
});
