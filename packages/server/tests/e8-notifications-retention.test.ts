/**
 * E-8 V1.3: 通知中心 API（Bearer）、已读/全部已读、待审批触发与 deep link 字段。
 */
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

async function registerAndToken(
  app: ReturnType<typeof createApp>,
  email: string,
  password: string,
): Promise<{ userId: string; token: string }> {
  const reg = await app.request("/api/v1/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  expect(reg.status).toBe(201);
  const body = (await reg.json()) as { data: { access_token: string; user: { id: string } } };
  return { userId: body.data.user.id, token: body.data.access_token };
}

describe("E-8 notifications center + retention doc alignment", () => {
  it("GET /api/v1/notifications supports pagination meta.unread_count and mark read", async () => {
    const app = createApp();
    const { userId, token } = await registerAndToken(app, "e8-notif-1@example.com", "password123");

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "E8 Notif" }),
    });
    expect(convRes.status).toBe(201);
    const conversationId = ((await convRes.json()) as { data: { id: string } }).data.id;

    const agentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "E8 High",
        description: "high",
        agent_type: "execution",
        source_url: "mock://e8-high",
        capabilities: [{ name: "danger", risk_level: "high" }],
      }),
    });
    expect(agentRes.status).toBe(201);
    const agentId = ((await agentRes.json()) as { data: { id: string } }).data.id;

    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: agentId }),
    });

    const msgRes = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sender_id: userId, text: "need confirm e8" }),
    });
    expect(msgRes.status).toBe(202);

    const listRes = await app.request("/api/v1/notifications?limit=10", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(listRes.status).toBe(200);
    const listBody = (await listRes.json()) as {
      data: {
        items: Array<{ id: string; type: string; deep_link: string | null; read_at: string | null }>;
        next_cursor: string | null;
      };
      meta: { unread_count: number };
    };
    expect(listBody.meta.unread_count).toBeGreaterThanOrEqual(1);
    const review = listBody.data.items.find((x) => x.type === "review_required");
    expect(review).toBeDefined();
    expect(review?.deep_link).toContain("/invocations/");
    expect(review?.deep_link).toContain("/review");

    const unreadRes = await app.request("/api/v1/notifications?unread_only=true&limit=5", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(unreadRes.status).toBe(200);
    const unreadBody = (await unreadRes.json()) as { data: { items: unknown[] } };
    expect(unreadBody.data.items.length).toBeGreaterThanOrEqual(1);

    const reviewItem = review!;
    const readRes = await app.request(`/api/v1/notifications/${reviewItem.id}/read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(readRes.status).toBe(200);
    const readRow = (await readRes.json()) as { data: { read_at: string | null } };
    expect(readRow.data.read_at).not.toBeNull();

    const allRead = await app.request("/api/v1/notifications/read-all", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(allRead.status).toBe(200);
    const allBody = (await allRead.json()) as { data: { updated: number } };
    expect(allBody.data.updated).toBeGreaterThanOrEqual(0);

    const after = await app.request("/api/v1/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const afterBody = (await after.json()) as { meta: { unread_count: number } };
    expect(afterBody.meta.unread_count).toBe(0);
  });

  it("PATCH notification-preferences accepts quiet_hours fields", async () => {
    const app = createApp();
    const { token, userId } = await registerAndToken(app, "e8-quiet@example.com", "password123");
    const patchRes = await app.request(`/api/v1/users/${userId}/notification-preferences`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        channels: ["in_app"],
        strategy: "only_exceptions",
        quiet_hours_start: "22:00",
        quiet_hours_end: "07:00",
        quiet_hours_timezone: "Asia/Shanghai",
      }),
    });
    expect(patchRes.status).toBe(200);
    const body = (await patchRes.json()) as {
      data: { quiet_hours_start: string | null; quiet_hours_end: string | null };
    };
    expect(body.data.quiet_hours_start).toBe("22:00");
    expect(body.data.quiet_hours_end).toBe("07:00");
  });
});
