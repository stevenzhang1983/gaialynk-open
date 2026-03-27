import { describe, expect, test } from "vitest";
import { getHelpCenter, helpArticleSearchHaystack } from "@/content/help-center";
import {
  isModerationHiddenMessageText,
  MODERATION_HIDDEN_PLACEHOLDER,
} from "@/lib/product/moderation-constants";

describe("W-21 help center + moderation helpers", () => {
  test("zh-Hans retention article is searchable as 数据保存", () => {
    const h = getHelpCenter("zh-Hans");
    const art = h.sections.flatMap((s) => s.articles).find((a) => a.id === "data-retention-how-long");
    expect(art).toBeDefined();
    const hay = helpArticleSearchHaystack(art!, "zh-Hans");
    expect(hay).toContain("数据保存");
  });

  test("English retention article includes retention keyword for search", () => {
    const h = getHelpCenter("en");
    const art = h.sections.flatMap((s) => s.articles).find((a) => a.id === "data-retention-how-long");
    expect(art).toBeDefined();
    const hay = helpArticleSearchHaystack(art!, "en");
    expect(hay).toContain("retention");
  });

  test("moderation placeholder matches mainline API output", () => {
    expect(MODERATION_HIDDEN_PLACEHOLDER).toBe("[该消息已被管理员隐藏]");
    expect(isModerationHiddenMessageText("  [该消息已被管理员隐藏]  ")).toBe(true);
    expect(isModerationHiddenMessageText("hello")).toBe(false);
  });
});
