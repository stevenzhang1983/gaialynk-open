import { describe, expect, test } from "vitest";
import { PRODUCT_API_CAPABILITIES } from "../src/content/vision-coverage";
import { NOW_CAPABILITY_HEALTH_CHECKS } from "../src/content/now-capability-endpoints";
import { getMainlineApiUrl } from "../src/lib/config/mainline";

/**
 * P0-E: API health snapshot for "Now" capabilities.
 * Each track marked Now must bind to a reachable mainline endpoint.
 * Rule: capability endpoint = health check path (single source: now-capability-endpoints.ts).
 * Set RELEASE_GATE_SKIP_API_HEALTH=1 to skip when mainline is not running (e.g. CI without server).
 */

function isSkipApiHealth(): boolean {
  return process.env.RELEASE_GATE_SKIP_API_HEALTH === "1";
}

describe("website API health gate (Now capabilities)", () => {
  test("capability endpoint equals health check path (single source)", () => {
    for (const { capabilityKey, path } of NOW_CAPABILITY_HEALTH_CHECKS) {
      const cap = PRODUCT_API_CAPABILITIES[capabilityKey];
      expect(cap, `Capability "${capabilityKey}" must exist`).toBeDefined();
      expect(
        cap!.endpoint,
        `Capability "${capabilityKey}" endpoint must equal health check path (same source)`,
      ).toBe(path);
    }
  });

  test("all Now capability endpoints are defined in health snapshot", () => {
    const nowCapabilities = Object.entries(PRODUCT_API_CAPABILITIES).filter(
      ([_, cap]) => cap.status === "Now",
    );
    const snapshotKeys = new Set(NOW_CAPABILITY_HEALTH_CHECKS.map((c) => c.capabilityKey));
    for (const [key] of nowCapabilities) {
      expect(snapshotKeys.has(key), `Now capability "${key}" must be in API health snapshot`).toBe(true);
    }
  });

  test("when mainline is reachable, each Now endpoint responds with expected status", async () => {
    if (isSkipApiHealth()) {
      return;
    }
    const base = getMainlineApiUrl();
    for (const check of NOW_CAPABILITY_HEALTH_CHECKS) {
      const cap = PRODUCT_API_CAPABILITIES[check.capabilityKey];
      expect(cap?.status).toBe("Now");
      const url = `${base}${check.path}`;
      let res: Response;
      try {
        res = await fetch(url, { method: check.method });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(
          `Now capability "${check.capabilityKey}" (${url}): request failed - ${msg}. ` +
            "Ensure mainline is running or set RELEASE_GATE_SKIP_API_HEALTH=1 to skip.",
        );
      }
      expect(
        check.acceptStatuses.includes(res.status),
        `Now capability "${check.capabilityKey}" (${url}): expected one of [${check.acceptStatuses.join(", ")}], got ${res.status}`,
      ).toBe(true);
    }
  }, 15000);
});
