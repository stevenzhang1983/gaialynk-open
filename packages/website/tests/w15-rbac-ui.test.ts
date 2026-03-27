import { describe, expect, it } from "vitest";
import { roleMayExportAudit, roleMayTriggerConnector } from "@/hooks/use-space-permissions";

describe("W-15 space permission helpers", () => {
  it("roleMayTriggerConnector matches owner/admin/member", () => {
    expect(roleMayTriggerConnector("owner")).toBe(true);
    expect(roleMayTriggerConnector("admin")).toBe(true);
    expect(roleMayTriggerConnector("member")).toBe(true);
    expect(roleMayTriggerConnector("guest")).toBe(false);
    expect(roleMayTriggerConnector(null)).toBe(false);
  });

  it("roleMayExportAudit matches owner/admin only", () => {
    expect(roleMayExportAudit("owner")).toBe(true);
    expect(roleMayExportAudit("admin")).toBe(true);
    expect(roleMayExportAudit("member")).toBe(false);
    expect(roleMayExportAudit("guest")).toBe(false);
    expect(roleMayExportAudit(null)).toBe(false);
  });
});
