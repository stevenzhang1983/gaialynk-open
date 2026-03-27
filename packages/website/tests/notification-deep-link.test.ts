import { describe, expect, test } from "vitest";
import { mapMainlineDeepLinkToProductHref } from "@/lib/product/notification-deep-link";

describe("mapMainlineDeepLinkToProductHref", () => {
  const c = "550e8400-e29b-41d4-a716-446655440000";
  const i = "660e8400-e29b-41d4-a716-446655440001";

  test("maps review path with focus_invocation query", () => {
    expect(mapMainlineDeepLinkToProductHref("en", `/conversations/${c}/invocations/${i}/review`)).toBe(
      `/en/app/chat/${c}?focus_invocation=${encodeURIComponent(i)}`,
    );
  });

  test("maps orchestration path", () => {
    expect(
      mapMainlineDeepLinkToProductHref("zh-Hans", `/conversations/${c}/orchestrations/run-abc`),
    ).toBe(`/zh-Hans/app/chat/${c}?focus_orchestration=${encodeURIComponent("run-abc")}`);
  });

  test("maps settings connectors with query", () => {
    expect(
      mapMainlineDeepLinkToProductHref("zh-Hans", "/settings/connectors?authorization_id=x%26y"),
    ).toBe(`/zh-Hans/app/connectors-governance?authorization_id=x%26y`);
  });

  test("maps account usage to settings usage with query", () => {
    expect(
      mapMainlineDeepLinkToProductHref("en", "/account/usage?feature=agent_deployments"),
    ).toBe(`/en/app/settings/usage?feature=agent_deployments`);
  });

  test("returns null for unknown", () => {
    expect(mapMainlineDeepLinkToProductHref("en", "/unknown")).toBeNull();
    expect(mapMainlineDeepLinkToProductHref("en", null)).toBeNull();
  });
});
