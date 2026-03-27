/**
 * W-18：共享 reason_codes 包可解析；与 E-15 对齐。
 */
import { describe, expect, it } from "vitest";
import { buildUserFacingMessageFromReasonCodes, REASON_CODE_USER_FACING } from "@gaialynk/shared";

describe("W-18 reason_codes shared package", () => {
  it("exposes agent_maintenance copy", () => {
    expect(REASON_CODE_USER_FACING.agent_maintenance?.en).toContain("maintenance");
  });

  it("buildUserFacingMessageFromReasonCodes resolves agent_delisted", () => {
    const b = buildUserFacingMessageFromReasonCodes(["agent_delisted"]);
    expect(b.zh.length).toBeGreaterThan(4);
  });
});
