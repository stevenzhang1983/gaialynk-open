import { describe, expect, it } from "vitest";
import { classifySendMessageError } from "../src/lib/product/product-error-pattern";

describe("classifySendMessageError", () => {
  it("treats fetch-level failure as platform fault", () => {
    const r = classifySendMessageError(0, {}, true);
    expect(r?.pattern).toBe("platform_fault");
    expect(r?.networkLevelFailure).toBe(true);
  });

  it("maps mainline_unreachable to platform fault", () => {
    const r = classifySendMessageError(
      502,
      { error: { code: "mainline_unreachable", message: "x" } },
      false,
    );
    expect(r?.pattern).toBe("platform_fault");
    expect(r?.code).toBe("mainline_unreachable");
  });

  it("maps a2a_invocation_failed to agent unavailable", () => {
    const r = classifySendMessageError(
      502,
      { error: { code: "a2a_invocation_failed", message: "x" } },
      false,
    );
    expect(r?.pattern).toBe("agent_unavailable");
  });

  it("maps invocation_capacity_exceeded to queue saturated", () => {
    const r = classifySendMessageError(
      429,
      { error: { code: "invocation_capacity_exceeded", details: { estimated_wait_ms: 5000 } } },
      false,
    );
    expect(r?.pattern).toBe("queue_saturated");
    expect(r?.estimatedWaitMs).toBe(5000);
  });

  it("maps device_not_found to connector with desktop help article id (W-22)", () => {
    const r = classifySendMessageError(
      404,
      { error: { code: "device_not_found", message: "x" } },
      false,
    );
    expect(r?.pattern).toBe("connector");
    expect(r?.code).toBe("device_not_found");
    expect(r?.helpArticleId).toBe("how-to-install-pair-desktop-connector");
  });
});
