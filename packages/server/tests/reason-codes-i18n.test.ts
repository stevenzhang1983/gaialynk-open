import { describe, expect, it } from "vitest";
import { REASON_CODE_USER_FACING } from "@gaialynk/shared";

describe("reason-codes-i18n", () => {
  it("includes E-15 gateway lifecycle codes", () => {
    expect(REASON_CODE_USER_FACING.agent_maintenance).toBeDefined();
    expect(REASON_CODE_USER_FACING.agent_delisted).toBeDefined();
  });

  it("has zh/en/ja for every mapped reason code", () => {
    for (const [code, bundle] of Object.entries(REASON_CODE_USER_FACING)) {
      expect(bundle.zh.length, `${code} zh`).toBeGreaterThan(3);
      expect(bundle.en.length, `${code} en`).toBeGreaterThan(3);
      expect(bundle.ja.length, `${code} ja`).toBeGreaterThan(3);
    }
  });
});
