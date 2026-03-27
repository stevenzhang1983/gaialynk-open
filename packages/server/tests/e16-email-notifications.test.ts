/**
 * E-16 V1.3.1: Resend 邮件模板、users.notification_preferences JSONB、偏好关闭后跳过邮件。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";
import type { EmailNotificationTemplateId } from "../src/modules/auth/user.store";
import { patchUserNotificationPreferencesJsonAsync } from "../src/modules/auth/user.store";
import { buildEmailCopyForTemplate } from "../src/modules/notifications/email-notification-copy";
import { recordNotificationEventAsync, resetNotificationStore } from "../src/modules/notifications/notification.store";

const flushMicrotasks = (): Promise<void> =>
  new Promise<void>((resolve) => {
    queueMicrotask(() => resolve());
  });

describe("E-16 email notifications", () => {
  const prevKey = process.env.RESEND_API_KEY;
  const prevBase = process.env.GAIALYNK_APP_BASE_URL;
  const prevFetch = globalThis.fetch;

  beforeEach(() => {
    resetNotificationStore();
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.GAIALYNK_APP_BASE_URL = "https://app.test";
  });

  afterEach(() => {
    process.env.RESEND_API_KEY = prevKey;
    process.env.GAIALYNK_APP_BASE_URL = prevBase;
    globalThis.fetch = prevFetch;
    vi.restoreAllMocks();
  });

  const templates: EmailNotificationTemplateId[] = [
    "task_completed",
    "human_review_required",
    "quota_warning",
    "agent_status_changed",
    "connector_expired",
    "space_invitation",
  ];

  it("buildEmailCopyForTemplate has distinct zh / en / ja subjects for each template", () => {
    for (const templateId of templates) {
      const payload =
        templateId === "space_invitation"
          ? { space_name: "Acme", inviter_label: "Alice" }
          : templateId === "connector_expired"
            ? { provider: "notion" }
            : {};
      const zh = buildEmailCopyForTemplate({ templateId, locale: "zh", payload });
      const en = buildEmailCopyForTemplate({ templateId, locale: "en", payload });
      const ja = buildEmailCopyForTemplate({ templateId, locale: "ja", payload });
      expect(zh.subject.length).toBeGreaterThan(0);
      expect(en.subject.length).toBeGreaterThan(0);
      expect(ja.subject.length).toBeGreaterThan(0);
      expect(new Set([zh.subject, en.subject, ja.subject]).size).toBe(3);
    }
  });

  it("after in-app notification, sends Resend when type is allowed", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => "" });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const app = createApp();
    const reg = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "e16-send@example.com", password: "password123" }),
    });
    expect(reg.status).toBe(201);
    const userId = (await reg.json()).data.user.id as string;

    await recordNotificationEventAsync({
      user_id: userId,
      event_type: "e16.quota",
      notification_type: "quota_warning",
      deep_link: "/app/settings/usage",
      payload: { summary_en: "Quota threshold" },
    });
    await flushMicrotasks();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const first = fetchMock.mock.calls[0];
    expect(first).toBeDefined();
    const url = first![0];
    expect(String(url)).toContain("resend.com");
    const init = first![1] as RequestInit;
    const authHeader =
      typeof init.headers === "object" && init.headers !== null && !Array.isArray(init.headers)
        ? (init.headers as Record<string, string>)["Authorization"]
        : "";
    expect(String(authHeader)).toContain("re_test_key");
    const body = JSON.parse(init.body as string) as { to: string[]; html: string; subject: string };
    expect(body.to).toEqual(["e16-send@example.com"]);
    expect(body.subject.length).toBeGreaterThan(0);
    expect(body.html.toLowerCase()).toContain("quota");
  });

  it("skips email when user removed quota_warning from email_types", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => "" });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const app = createApp();
    const reg = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "e16-skip@example.com", password: "password123" }),
    });
    expect(reg.status).toBe(201);
    const userId = (await reg.json()).data.user.id as string;

    await patchUserNotificationPreferencesJsonAsync(userId, {
      email_types: [
        "task_completed",
        "human_review_required",
        "agent_status_changed",
        "connector_expired",
        "space_invitation",
      ],
    });

    await recordNotificationEventAsync({
      user_id: userId,
      event_type: "e16.quota2",
      notification_type: "quota_warning",
      payload: {},
    });
    await flushMicrotasks();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Resend HTTP error does not reject recordNotificationEventAsync", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => "bad",
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const app = createApp();
    const reg = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "e16-err@example.com", password: "password123" }),
    });
    expect(reg.status).toBe(201);
    const userId = (await reg.json()).data.user.id as string;

    const row = await recordNotificationEventAsync({
      user_id: userId,
      event_type: "e16.fail",
      notification_type: "task_completed",
      payload: { summary_en: "done" },
    });
    expect(row).not.toBeNull();
    await flushMicrotasks();
    expect(fetchMock).toHaveBeenCalled();
  });
});
