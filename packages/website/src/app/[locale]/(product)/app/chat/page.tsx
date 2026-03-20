"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * T-4.3 / T-4.2 聊天入口页：无 conversationId 时先创建或取最近会话，再重定向到 /app/chat/[id]。
 * 新建对话按钮或直接访问 /app/chat 时由此页处理，重定向后侧边栏可正确高亮当前会话。
 */
export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "en";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const ensureAndRedirect = useCallback(async () => {
    try {
      const listRes = await fetch("/api/mainline/conversations?limit=1&sort=created_at:desc", {
        cache: "no-store",
      });
      const listJson = await listRes.json().catch(() => ({}));
      const list = listJson.data;
      if (Array.isArray(list) && list.length > 0 && list[0].id) {
        router.replace(`/${locale}/app/chat/${list[0].id}`);
        return;
      }
      const createRes = await fetch("/api/mainline/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "New chat" }),
      });
      const createJson = await createRes.json().catch(() => ({}));
      if (createRes.ok && createJson.data?.id) {
        router.replace(`/${locale}/app/chat/${createJson.data.id}`);
      } else {
        setError(createJson?.error?.message ?? "Failed to create conversation");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [locale, router]);

  useEffect(() => {
    ensureAndRedirect();
  }, [ensureAndRedirect]);

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Loading chat…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-8">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-8">
      <p className="text-sm text-muted-foreground">Redirecting…</p>
    </div>
  );
}
