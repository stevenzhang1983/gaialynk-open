import { describe, expect, test } from "vitest";
import {
  GL_NOTION_RECEIPT_V1,
  parseNotionSystemMessage,
} from "@/lib/product/parse-notion-system-message";

describe("W-17 Notion system message parse", () => {
  test("returns null for non-Notion system text", () => {
    expect(parseNotionSystemMessage("joined the room")).toBeNull();
    expect(parseNotionSystemMessage("Google Calendar\nfoo")).toBeNull();
  });

  test("returns null when Notion title without JSON receipt line", () => {
    expect(parseNotionSystemMessage("Notion\nOnly human line")).toBeNull();
  });

  test("parses human line + gl receipt JSON", () => {
    const json = JSON.stringify({
      v: 1,
      t: GL_NOTION_RECEIPT_V1,
      receipt_id: "11111111-1111-1111-1111-111111111111",
      action: "notion.database.query",
      status: "ok",
      target_label: "Tasks",
    });
    const raw = `Notion\nNotion: queried database (3 row(s))\n${json}`;
    const p = parseNotionSystemMessage(raw);
    expect(p).not.toBeNull();
    expect(p!.humanText).toContain("queried database");
    expect(p!.receipt.action).toBe("notion.database.query");
    expect(p!.receipt.target_label).toBe("Tasks");
    expect(p!.receipt.status).toBe("ok");
  });

  test("accepts connector_expired status", () => {
    const json = JSON.stringify({
      v: 1,
      t: GL_NOTION_RECEIPT_V1,
      receipt_id: "22222222-2222-2222-2222-222222222222",
      action: "notion.list_databases",
      status: "connector_expired",
      target_label: "—",
    });
    const p = parseNotionSystemMessage(`Notion\nPlease reconnect\n${json}`);
    expect(p?.receipt.status).toBe("connector_expired");
  });
});
