"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useIdentity } from "@/lib/identity/context";
import { isSupportedLocale, type Locale } from "@/lib/i18n/locales";

type MyAgent = {
  id: string;
  name: string;
  description: string;
  status?: string;
  health_check_status?: string;
  health_check_at?: string;
  created_at: string;
};

const COPY = {
  en: {
    title: "My Agents",
    empty: "You haven't registered any Agents yet.",
    registerCta: "Register an Agent",
    status: "Status",
    health: "Health",
    created: "Created",
    loginRequired: "Sign in to manage your Agents.",
    signIn: "Sign in",
    loading: "Loading…",
  },
  "zh-Hant": {
    title: "我的 Agent",
    empty: "你還沒有註冊任何 Agent。",
    registerCta: "註冊 Agent",
    status: "狀態",
    health: "健康檢查",
    created: "建立時間",
    loginRequired: "請登入以管理你的 Agent。",
    signIn: "登入",
    loading: "載入中…",
  },
  "zh-Hans": {
    title: "我的 Agent",
    empty: "你还没有注册任何 Agent。",
    registerCta: "注册 Agent",
    status: "状态",
    health: "健康检查",
    created: "创建时间",
    loginRequired: "请登录以管理你的 Agent。",
    signIn: "登录",
    loading: "加载中…",
  },
} as const;

const STATUS_COLORS: Record<string, string> = {
  active: "text-emerald-600",
  pending_review: "text-amber-600",
  deprecated: "text-zinc-500",
};

const HEALTH_COLORS: Record<string, string> = {
  ok: "text-emerald-600",
  failed: "text-red-500",
  pending: "text-amber-600",
};

export default function MyAgentsPage() {
  const params = useParams();
  const router = useRouter();
  const rawLocale = typeof params?.locale === "string" ? params.locale : "en";
  const locale: Locale = isSupportedLocale(rawLocale) ? (rawLocale as Locale) : "en";
  const copy = COPY[locale];
  const { isAuthenticated } = useIdentity();

  const [agents, setAgents] = useState<MyAgent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/mainline/agents/mine", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      if (Array.isArray(json.data)) setAgents(json.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) load();
    else setLoading(false);
  }, [isAuthenticated, load]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-sm text-muted-foreground">{copy.loginRequired}</p>
        <a
          href={`/${locale}/app/login?return_url=${encodeURIComponent(`/${locale}/app/my-agents`)}`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          {copy.signIn}
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">{copy.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">{copy.title}</h1>
        <button
          onClick={() => router.push(`/${locale}/app/onboarding/provider`)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110"
        >
          + {copy.registerCta}
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">{copy.empty}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{agent.name}</p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{agent.description}</p>
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-4 text-xs">
                <span className={STATUS_COLORS[agent.status ?? ""] ?? "text-muted-foreground"}>
                  {copy.status}: {agent.status ?? "—"}
                </span>
                <span className={HEALTH_COLORS[agent.health_check_status ?? ""] ?? "text-muted-foreground"}>
                  {copy.health}: {agent.health_check_status ?? "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
