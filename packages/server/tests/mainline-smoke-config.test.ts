import { describe, expect, it } from "vitest";
import { resolveSmokeBaseUrl } from "../../../scripts/mainline-post-release-smoke";

describe("mainline smoke base URL resolution", () => {
  it("prefers MAINLINE_BASE_URL when provided", () => {
    const url = resolveSmokeBaseUrl({
      MAINLINE_BASE_URL: "https://mainline.example.com",
      MAINLINE_SMOKE_PORT: "3999",
    } as NodeJS.ProcessEnv);
    expect(url).toBe("https://mainline.example.com");
  });

  it("uses dedicated smoke default port instead of 3000", () => {
    const url = resolveSmokeBaseUrl({} as NodeJS.ProcessEnv);
    expect(url).toBe("http://localhost:3011");
  });
});
