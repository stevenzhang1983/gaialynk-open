import { describe, expect, it } from "vitest";
import {
  buildConversationRealtimeWsUrl,
  mergeReadReceipt,
  parseRealtimeWsPayload,
} from "../src/lib/product/ws-client";
import type { ChatMessage } from "../src/lib/product/chat-types";

describe("W-16 ws-client", () => {
  it("buildConversationRealtimeWsUrl encodes query params", () => {
    const url = buildConversationRealtimeWsUrl({
      wsOrigin: "ws://localhost:3000",
      accessToken: "tok&=x",
      conversationId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      lastEventId: "msg-1",
    });
    expect(url.startsWith("ws://localhost:3000/api/v1/realtime/ws?")).toBe(true);
    expect(url).toContain("conversation_id=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    expect(url).toContain("last_event_id=msg-1");
    expect(url).toContain(encodeURIComponent("tok&=x"));
  });

  it("parseRealtimeWsPayload accepts message_read frames", () => {
    const raw = JSON.stringify({
      type: "message_read",
      message_id: "m1",
      user_id: "u1",
      read_at: "2026-01-01T00:00:00.000Z",
    });
    const f = parseRealtimeWsPayload(raw);
    expect(f?.type).toBe("message_read");
  });

  it("mergeReadReceipt dedupes readers", () => {
    const messages: ChatMessage[] = [
      {
        id: "a",
        conversation_id: "c",
        sender_type: "user",
        sender_id: "me",
        content: { type: "text", text: "hi" },
        created_at: "2026-01-01T00:00:00.000Z",
        readByUserIds: ["u2"],
      },
    ];
    const once = mergeReadReceipt(messages, "a", "u2");
    expect(once[0]?.readByUserIds).toEqual(["u2"]);
    const twice = mergeReadReceipt(once, "a", "u3");
    expect(twice[0]?.readByUserIds).toEqual(["u2", "u3"]);
  });
});
