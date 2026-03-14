import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("a2a json-rpc gateway", () => {
  const servers: ReturnType<typeof createServer>[] = [];

  afterEach(async () => {
    await Promise.all(
      servers.map(
        (server) =>
          new Promise<void>((resolve) => {
            server.close(() => resolve());
          }),
      ),
    );
    servers.length = 0;
  });

  it("calls external json-rpc endpoint and writes returned text", async () => {
    const server = createServer((req, res) => {
      if (req.method !== "POST") {
        res.statusCode = 405;
        res.end();
        return;
      }

      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        const parsed = JSON.parse(body) as {
          id: string;
          params?: { user_content?: Array<{ text?: string }> };
        };
        const userText = parsed.params?.user_content?.[0]?.text ?? "";

        res.setHeader("content-type", "application/json");
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            id: parsed.id,
            result: {
              output_text: `external:${userText}`,
            },
          }),
        );
      });
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });
    servers.push(server);
    const port = (server.address() as AddressInfo).port;

    const app = createApp();
    const conversationRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "A2A external call" }),
    });
    const conversationBody = await conversationRes.json();
    const conversationId = conversationBody.data.id as string;

    const agentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "External Agent",
        description: "json-rpc endpoint",
        agent_type: "execution",
        source_url: `http://127.0.0.1:${port}/a2a`,
        capabilities: [{ name: "echo", risk_level: "low" }],
      }),
    });
    const agentBody = await agentRes.json();

    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: agentBody.data.id }),
    });

    const sendMessageRes = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sender_id: "user-a2a", text: "ping" }),
    });

    expect(sendMessageRes.status).toBe(201);

    const detailRes = await app.request(`/api/v1/conversations/${conversationId}`);
    const detailBody = await detailRes.json();
    expect(detailBody.data.messages[1].content.text).toBe("external:ping");
  });
});
