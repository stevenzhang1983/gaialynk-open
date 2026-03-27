"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";

type FounderSnapshot = {
  days: number;
  generated_at: string;
  event_totals: Record<string, number>;
  distinct_users: Record<string, number>;
  funnel: {
    registered_users: number;
    registered_and_first_conversation: number;
    registered_and_first_valuable_reply: number;
    registered_and_connector: number;
    registered_and_multi_agent: number;
  };
  website_funnel: { note: string; dashboard_path: string };
};

type SnapshotResponse = { data?: FounderSnapshot; error?: { code: string; message: string } };

type FounderMetricsDashboardProps = {
  initialLocale: Locale;
};

export function FounderMetricsDashboard({ initialLocale }: FounderMetricsDashboardProps) {
  const [days, setDays] = useState(7);
  const [snapshot, setSnapshot] = useState<FounderSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const response = await fetch(`/api/mainline/founder-metrics/snapshot?days=${days}`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = (await response.json()) as SnapshotResponse;
      if (cancelled) return;
      if (response.status === 403) {
        setForbidden(true);
        setSnapshot(null);
        setError(null);
        return;
      }
      if (response.status === 401) {
        setError("请先登录产品账号（需要 Bearer Cookie）。");
        setSnapshot(null);
        setForbidden(false);
        return;
      }
      if (!response.ok || !data.data) {
        setError(data.error?.message ?? "无法加载 Founder 指标。");
        setSnapshot(null);
        setForbidden(false);
        return;
      }
      setError(null);
      setForbidden(false);
      setSnapshot(data.data);
    }
    void load();
    const t = window.setInterval(() => void load(), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [days]);

  const eventRows = useMemo(() => {
    if (!snapshot) return [];
    return Object.entries(snapshot.event_totals).sort((a, b) => b[1] - a[1]);
  }, [snapshot]);

  const exportHref = `/api/mainline/founder-metrics/export?days=${days}`;

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Founder 看板（产品主线路）</h1>
          <p className="text-sm text-muted-foreground">
            主线路埋点快照（E-10）。官网 CTA 漏斗请用{" "}
            <a className="underline" href={`/${initialLocale}/app/analytics`}>
              Analytics Dashboard
            </a>
            。
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-2 text-sm">
            <span className="text-muted-foreground">统计窗口（天）</span>
            <select
              className="rounded-md border border-border bg-card px-3 py-2"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              {[7, 14, 30, 90].map((d) => (
                <option key={d} value={d}>
                  {d} 天
                </option>
              ))}
            </select>
          </label>
          <a
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
            href={exportHref}
          >
            导出 CSV
          </a>
        </div>
      </div>

      {forbidden ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          当前账号无权查看 Founder 指标。请在部署环境设置{" "}
          <code className="rounded bg-muted px-1">FOUNDER_DASHBOARD_USER_IDS</code>（逗号分隔的用户 UUID）。
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">{error}</div>
      ) : null}

      {snapshot ? (
        <>
          <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
            <p>
              生成时间：<span className="font-mono text-foreground">{snapshot.generated_at}</span> · 窗口{" "}
              {snapshot.days} 天
            </p>
            <p className="mt-2">{snapshot.website_funnel.note}</p>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold">漏斗（注册用户在窗口内同时完成后续步骤的去重人数）</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "注册（去重用户）", value: snapshot.funnel.registered_users },
                { label: "注册 → 首次会话", value: snapshot.funnel.registered_and_first_conversation },
                { label: "注册 → 首条有价值回复", value: snapshot.funnel.registered_and_first_valuable_reply },
                { label: "注册 → 首次连接器授权", value: snapshot.funnel.registered_and_connector },
                { label: "注册 → 多 Agent（编排或多路 @）", value: snapshot.funnel.registered_and_multi_agent },
              ].map((row) => (
                <div key={row.label} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{row.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{row.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold">事件计数（窗口内总次数）</h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    <th className="px-4 py-2 font-medium">event_name</th>
                    <th className="px-4 py-2 font-medium">count</th>
                  </tr>
                </thead>
                <tbody>
                  {eventRows.map(([name, count]) => (
                    <tr key={name} className="border-b border-border/60">
                      <td className="px-4 py-2 font-mono text-xs">{name}</td>
                      <td className="px-4 py-2">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold">关键事件去重用户</h2>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {Object.entries(snapshot.distinct_users).map(([k, v]) => (
                <li key={k}>
                  <span className="font-mono text-foreground">{k}</span>：{v}
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </section>
  );
}
