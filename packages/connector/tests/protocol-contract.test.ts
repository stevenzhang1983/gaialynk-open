import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const protoPath = join(__dirname, "..", "PROTOCOL.md");

describe("E-19 desktop connector protocol doc", () => {
  it("documents pair-status, local /fs routes, and receipts", () => {
    const md = readFileSync(protoPath, "utf8");
    expect(md).toContain("pair-status");
    expect(md).toContain("GET /fs/list");
    expect(md).toContain("POST /fs/write");
    expect(md).toContain("GET /fs/watch");
    expect(md).toContain("/api/v1/connectors/desktop/receipts");
    expect(md).toContain("X-Gaialynk-Confirmed");
    expect(md).toContain("env_signature");
  });
});
